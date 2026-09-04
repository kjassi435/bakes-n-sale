import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { parseArr, round2, serializeOrder, serializeProduct } from '../helpers';
import {
  AdminOrdersQueryDto,
  CouponUpsertDto,
  ProductUpsertDto,
  UpdateOrderStatusDto,
} from './admin.dto';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ---------- Dashboard ----------

  async dashboard() {
    const now = new Date();
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);
    const weekStart = new Date(startToday.getTime() - 6 * 86400000);
    const activeStatuses = { notIn: ['CANCELLED', 'REFUNDED'] };

    const [revenueAgg, ordersToday, totalOrders, recentOrders, products, trendOrders, topItems, customers] =
      await Promise.all([
        this.prisma.order.aggregate({ _sum: { total: true }, where: { status: activeStatuses } }),
        this.prisma.order.count({ where: { createdAt: { gte: startToday } } }),
        this.prisma.order.count({ where: { status: activeStatuses } }),
        this.prisma.order.findMany({
          include: { user: { select: { name: true, email: true } }, items: true },
          orderBy: { createdAt: 'desc' },
          take: 8,
        }),
        this.prisma.product.findMany({ include: { variants: true } }),
        this.prisma.order.findMany({
          where: { createdAt: { gte: weekStart }, status: activeStatuses },
          select: { createdAt: true, total: true },
        }),
        this.prisma.orderItem.groupBy({
          by: ['productName'],
          _sum: { quantity: true, total: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 5,
        }),
        this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      ]);

    const lowStock = products
      .filter(
        (p) =>
          p.isActive &&
          (p.stock <= p.lowStockThreshold ||
            p.variants.some((v) => v.isActive && v.stock <= p.lowStockThreshold)),
      )
      .map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        stock: p.stock,
        threshold: p.lowStockThreshold,
        variantStocks: p.variants.filter((v) => v.isActive).map((v) => ({ name: v.name, stock: v.stock })),
      }));

    const trend: { day: string; label: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(startToday.getTime() - i * 86400000);
      trend.push({
        day: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        revenue: 0,
        orders: 0,
      });
    }
    for (const o of trendOrders) {
      const key = o.createdAt.toISOString().slice(0, 10);
      const bucket = trend.find((t) => t.day === key);
      if (bucket) {
        bucket.revenue = round2(bucket.revenue + o.total);
        bucket.orders += 1;
      }
    }

    return {
      revenue: round2(revenueAgg._sum.total ?? 0),
      ordersToday,
      totalOrders,
      aov: totalOrders > 0 ? round2((revenueAgg._sum.total ?? 0) / totalOrders) : 0,
      customers,
      lowStock,
      recentOrders: recentOrders.map(serializeOrder),
      trend,
      topProducts: topItems.map((t) => ({
        name: t.productName,
        quantity: t._sum.quantity ?? 0,
        revenue: round2(t._sum.total ?? 0),
      })),
    };
  }

  // ---------- Orders ----------

  async orders(q: AdminOrdersQueryDto) {
    const where: any = {};
    if (q.status && q.status !== 'ALL') where.status = q.status;
    if (q.search) where.orderNumber = { contains: q.search };
    const page = Math.max(1, q.page ?? 1);
    const limit = 20;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: { user: { select: { name: true, email: true } }, items: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items: items.map(serializeOrder), total, page, pages: Math.max(1, Math.ceil(total / limit)) };
  }

  async orderDetail(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        history: { orderBy: { createdAt: 'asc' } },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return serializeOrder(order);
  }

  async updateOrderStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === dto.status) return serializeOrder(order);

    // Restock items when an order is cancelled
    if (dto.status === 'CANCELLED' && order.status !== 'CANCELLED') {
      for (const it of order.items) {
        if (it.variantId) {
          await this.prisma.productVariant.updateMany({
            where: { id: it.variantId },
            data: { stock: { increment: it.quantity } },
          });
        } else {
          await this.prisma.product.updateMany({
            where: { id: it.productId },
            data: { stock: { increment: it.quantity } },
          });
        }
      }
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.status === 'REFUNDED' ? { paymentStatus: 'REFUNDED' } : {}),
        history: { create: { status: dto.status, note: dto.note || null } },
      },
      include: {
        items: true,
        history: { orderBy: { createdAt: 'asc' } },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    return serializeOrder(updated);
  }

  // ---------- Products ----------

  async products(search?: string) {
    const where: any = search
      ? { OR: [{ name: { contains: search } }, { slug: { contains: search } }] }
      : {};
    const items = await this.prisma.product.findMany({
      where,
      include: { category: true, variants: true },
      orderBy: { createdAt: 'desc' },
    });
    return items.map(serializeProduct);
  }

  async product(id: string) {
    const p = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, variants: true },
    });
    if (!p) throw new NotFoundException('Product not found');
    return serializeProduct(p);
  }

  private productData(dto: ProductUpsertDto, slug: string): Prisma.ProductUncheckedCreateInput {
    return {
      name: dto.name,
      slug,
      shortDescription: dto.shortDescription || null,
      description: dto.description || null,
      sku: dto.sku || null,
      categoryId: dto.categoryId || null,
      images: JSON.stringify(dto.images ?? []),
      tags: JSON.stringify(dto.tags ?? []),
      allergens: JSON.stringify(dto.allergens ?? []),
      nutrition: dto.nutrition ? JSON.stringify(dto.nutrition) : null,
      basePrice: dto.basePrice,
      compareAtPrice: dto.compareAtPrice ?? null,
      stock: dto.stock,
      lowStockThreshold: dto.lowStockThreshold ?? 5,
      isActive: dto.isActive ?? true,
      isFeatured: dto.isFeatured ?? false,
      isChefSpecial: dto.isChefSpecial ?? false,
      isPreorder: dto.isPreorder ?? false,
    };
  }

  async createProduct(dto: ProductUpsertDto) {
    let slug = slugify(dto.slug || dto.name);
    // ensure uniqueness
    const existing = await this.prisma.product.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;
    const product = await this.prisma.product.create({ data: this.productData(dto, slug) });
    if (dto.variants?.length) {
      await this.prisma.productVariant.createMany({
        data: dto.variants.map((v) => ({
          productId: product.id,
          name: v.name,
          option1: v.option1 || null,
          option2: v.option2 || null,
          price: v.price,
          stock: v.stock,
          sku: v.sku || null,
          isActive: v.isActive ?? true,
        })),
      });
    }
    return this.product(product.id);
  }

  async updateProduct(id: string, dto: ProductUpsertDto) {
    const current = await this.prisma.product.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Product not found');
    let slug: string | undefined;
    if (dto.slug && slugify(dto.slug) !== current.slug) {
      slug = slugify(dto.slug);
      const clash = await this.prisma.product.findUnique({ where: { slug } });
      if (clash) throw new BadRequestException('Slug already in use');
    }
    await this.prisma.product.update({ where: { id }, data: this.productData(dto, slug ?? current.slug) });
    if (dto.variants) {
      await this.prisma.productVariant.deleteMany({ where: { productId: id } });
      if (dto.variants.length) {
        await this.prisma.productVariant.createMany({
          data: dto.variants.map((v) => ({
            productId: id,
            name: v.name,
            option1: v.option1 || null,
            option2: v.option2 || null,
            price: v.price,
            stock: v.stock,
            sku: v.sku || null,
            isActive: v.isActive ?? true,
          })),
        });
      }
    }
    return this.product(id);
  }

  async deleteProduct(id: string) {
    const p = await this.prisma.product.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Product not found');
    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }

  // ---------- Coupons ----------

  coupons() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  createCoupon(dto: CouponUpsertDto) {
    return this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase(),
        type: dto.type,
        value: dto.value,
        minOrderValue: dto.minOrderValue ?? 0,
        maxDiscount: dto.maxDiscount ?? null,
        usageLimit: dto.usageLimit ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        isActive: dto.isActive ?? true,
        description: dto.description || null,
      },
    });
  }

  async updateCoupon(id: string, dto: CouponUpsertDto) {
    const c = await this.prisma.coupon.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Coupon not found');
    return this.prisma.coupon.update({
      where: { id },
      data: {
        type: dto.type,
        value: dto.value,
        minOrderValue: dto.minOrderValue ?? 0,
        maxDiscount: dto.maxDiscount ?? null,
        usageLimit: dto.usageLimit ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        isActive: dto.isActive ?? true,
        description: dto.description || null,
      },
    });
  }

  async deleteCoupon(id: string) {
    await this.prisma.coupon.deleteMany({ where: { id } });
    return { ok: true };
  }

  // ---------- Site content (CMS) ----------

  async getSettings() {
    const rows = await this.prisma.siteSetting.findMany({ orderBy: { key: 'asc' } });
    const out: Record<string, any> = {};
    for (const r of rows) {
      try {
        out[r.key] = JSON.parse(r.value);
      } catch {
        out[r.key] = null;
      }
    }
    return out;
  }

  async saveSettings(items: { key: string; value: any }[]) {
    if (!Array.isArray(items)) throw new BadRequestException('Body must be an array of {key, value}');
    const allowed = new Set([
      'hero_slides', 'home_fresh', 'home_chef', 'home_festive',
      'home_categories', 'home_reviews', 'about', 'contact',
      'header', 'footer',
    ]);
    const ops = [];
    for (const it of items) {
      if (!it || typeof it.key !== 'string' || !allowed.has(it.key)) {
        throw new BadRequestException(`Unknown setting key: ${it?.key}`);
      }
      let str: string;
      try {
        str = JSON.stringify(it.value ?? null);
      } catch {
        throw new BadRequestException(`Invalid value for ${it.key}`);
      }
      if (str.length > 60000) throw new BadRequestException(`Value too large for ${it.key}`);
      ops.push(
        this.prisma.siteSetting.upsert({
          where: { key: it.key },
          update: { value: str },
          create: { key: it.key, value: str },
        }),
      );
    }
    await this.prisma.$transaction(ops);
    return this.getSettings();
  }

  // ---------- Categories ----------

  async updateCategory(id: string, dto: { name?: string; image?: string; description?: string; sortOrder?: number }) {
    const c = await this.prisma.category.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Category not found');
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.image !== undefined) data.image = dto.image || null;
    if (dto.description !== undefined) data.description = dto.description || null;
    if (dto.sortOrder !== undefined) data.sortOrder = Number(dto.sortOrder) || 0;
    return this.prisma.category.update({ where: { id }, data });
  }

  async createCategory(dto: { name: string; slug?: string; parentId?: string | null; image?: string; description?: string; sortOrder?: number }) {
    if (!dto.name?.trim()) throw new BadRequestException('Name is required');
    const slug = (dto.slug?.trim() || slugify(dto.name)) as string;
    const exists = await this.prisma.category.findUnique({ where: { slug } });
    if (exists) throw new BadRequestException('A category with this slug already exists');
    let parentId: string | null = null;
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: dto.parentId } });
      if (!parent) throw new BadRequestException('Parent category not found');
      if (parent.parentId) throw new BadRequestException('Cannot nest deeper than subcategory level');
      parentId = parent.id;
    }
    return this.prisma.category.create({
      data: {
        name: dto.name.trim(),
        slug,
        parentId,
        image: dto.image || null,
        description: dto.description || null,
        sortOrder: Number(dto.sortOrder) || 0,
      },
    });
  }

  // ---------- Customers ----------

  async customers() {
    const users = await this.prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      include: { orders: { select: { id: true, total: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => {
      const active = u.orders.filter((o) => !['CANCELLED', 'REFUNDED'].includes(o.status));
      const { passwordHash, orders, ...rest } = u;
      return {
        ...rest,
        orderCount: active.length,
        lifetimeValue: round2(active.reduce((s, o) => s + o.total, 0)),
      };
    });
  }
}
