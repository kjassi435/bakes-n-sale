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

  private cleanStr(v: unknown): string | null {
    if (typeof v !== 'string') return null;
    const s = v.trim();
    return s ? s : null;
  }

  private cleanVariants(variants: any[] | undefined) {
    return (variants ?? [])
      .filter((v) => v && typeof v.name === 'string' && v.name.trim())
      .map((v) => ({
        name: v.name.trim(),
        option1: this.cleanStr(v.option1),
        option2: this.cleanStr(v.option2),
        price: Number(v.price) || 0,
        stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
        sku: this.cleanStr(v.sku),
        isActive: v.isActive ?? true,
      }));
  }

  private productData(dto: ProductUpsertDto, slug: string): Prisma.ProductUncheckedCreateInput {
    return {
      name: dto.name.trim(),
      slug,
      shortDescription: this.cleanStr(dto.shortDescription),
      description: this.cleanStr(dto.description),
      deliveryInfo: this.cleanStr(dto.deliveryInfo),
      sku: this.cleanStr(dto.sku),
      categoryId: dto.categoryId || null,
      images: JSON.stringify(dto.images ?? []),
      tags: JSON.stringify(dto.tags ?? []),
      allergens: JSON.stringify(dto.allergens ?? []),
      nutrition: dto.nutrition ? JSON.stringify(dto.nutrition) : null,
      basePrice: Number(dto.basePrice) || 0,
      compareAtPrice: dto.compareAtPrice ?? null,
      stock: Math.max(0, Math.floor(Number(dto.stock) || 0)),
      lowStockThreshold: dto.lowStockThreshold ?? 5,
      isActive: dto.isActive ?? true,
      isFeatured: dto.isFeatured ?? false,
      isChefSpecial: dto.isChefSpecial ?? false,
      isPreorder: dto.isPreorder ?? false,
    };
  }

  /** Translates raw Prisma errors into human-readable 400s instead of a 500. */
  private handleWriteError(e: any): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const fields = ((e.meta?.target as string[]) ?? []).join(', ');
      if (fields.includes('slug')) throw new BadRequestException('This URL slug is already used by another product — change the slug.');
      if (fields.includes('sku')) throw new BadRequestException(`This SKU is already used by another product${fields ? ` (${fields})` : ''} — use a unique SKU or leave it blank.`);
      throw new BadRequestException(`A product with these details already exists${fields ? ` (${fields})` : ''}.`);
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
      throw new BadRequestException('The selected category no longer exists — please pick another category.');
    }
    if (e instanceof BadRequestException) throw e;
    // eslint-disable-next-line no-console
    console.error('[admin:product]', e);
    throw new BadRequestException('Could not save the product — please check the fields and try again.');
  }

  private async assertCategory(categoryId: string | undefined) {
    if (!categoryId) return;
    const cat = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!cat) throw new BadRequestException('The selected category no longer exists — please pick another category.');
  }

  async createProduct(dto: ProductUpsertDto) {
    await this.assertCategory(dto.categoryId);
    let slug = slugify(dto.slug || dto.name);
    // ensure uniqueness
    const existing = await this.prisma.product.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;
    try {
      const product = await this.prisma.product.create({ data: this.productData(dto, slug) });
      const variants = this.cleanVariants(dto.variants);
      if (variants.length) {
        await this.prisma.productVariant.createMany({
          data: variants.map((v) => ({ ...v, productId: product.id })),
        });
      }
      return this.product(product.id);
    } catch (e) {
      this.handleWriteError(e);
    }
  }

  async updateProduct(id: string, dto: ProductUpsertDto) {
    const current = await this.prisma.product.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Product not found');
    await this.assertCategory(dto.categoryId);
    let slug: string | undefined;
    if (dto.slug && slugify(dto.slug) !== current.slug) {
      slug = slugify(dto.slug);
      const clash = await this.prisma.product.findUnique({ where: { slug } });
      if (clash) throw new BadRequestException('Slug already in use');
    }
    try {
      await this.prisma.product.update({ where: { id }, data: this.productData(dto, slug ?? current.slug) });
      if (dto.variants) {
        await this.prisma.productVariant.deleteMany({ where: { productId: id } });
        const variants = this.cleanVariants(dto.variants);
        if (variants.length) {
          await this.prisma.productVariant.createMany({
            data: variants.map((v) => ({ ...v, productId: id })),
          });
        }
      }
      return this.product(id);
    } catch (e) {
      this.handleWriteError(e);
    }
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
