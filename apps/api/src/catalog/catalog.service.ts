import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { serializeProduct } from '../helpers';
import { ProductQueryDto } from './catalog.dto';
import { ReviewDto } from '../users/users.dto';

const PRODUCT_INCLUDE = {
  category: true,
  variants: { where: { isActive: true } },
};

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  async categories() {
    const cats = await this.prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: { _count: { select: { products: { where: { isActive: true } } } } },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { products: { where: { isActive: true } } } },
      },
      orderBy: { sortOrder: 'asc' },
    });
    return cats.map((c) => {
      const children = (c.children as any[]).map((ch: any) => ({ ...ch, productCount: ch._count.products, _count: undefined }));
      const childTotal = children.reduce((s: number, ch: any) => s + (ch.productCount ?? 0), 0);
      return {
        ...c,
        productCount: c._count.products + childTotal,
        _count: undefined,
        children,
      };
    });
  }

  /** Public site-content settings (key -> parsed JSON value). */
  async settings() {
    const rows = await this.prisma.siteSetting.findMany();
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

  async products(q: ProductQueryDto) {
    const where: any = { isActive: true };
    const slugOrder = q.slugs
      ? q.slugs.split(',').map((s) => s.trim()).filter(Boolean)
      : null;
    if (slugOrder && slugOrder.length) where.slug = { in: slugOrder };
    if (q.category) {
      const cat = await this.prisma.category.findUnique({ where: { slug: q.category }, include: { children: true } });
      if (cat && cat.parentId === null && (cat.children as any[]).length > 0) {
        const ids = [cat.id, ...(cat.children as any[]).map((ch: any) => ch.id)];
        where.categoryId = { in: ids };
      } else {
        where.category = { slug: q.category };
      }
    }
    if (q.tag) where.tags = { contains: `"${q.tag}"` };
    if (q.search) {
      where.OR = [
        { name: { contains: q.search } },
        { shortDescription: { contains: q.search } },
        { description: { contains: q.search } },
      ];
    }
    if (q.minPrice != null || q.maxPrice != null) {
      where.basePrice = {};
      if (q.minPrice != null) where.basePrice.gte = q.minPrice;
      if (q.maxPrice != null) where.basePrice.lte = q.maxPrice;
    }
    if (q.featured === 'true') where.isFeatured = true;
    if (q.chefSpecial === 'true') where.isChefSpecial = true;
    if (q.deals === 'true') where.compareAtPrice = { not: null };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      q.sort === 'price_asc'
        ? { basePrice: 'asc' }
        : q.sort === 'price_desc'
          ? { basePrice: 'desc' }
          : q.sort === 'rating'
            ? { ratingAvg: 'desc' }
            : { createdAt: 'desc' };

    const page = Math.max(1, q.page ?? 1);
    const limit = Math.min(48, Math.max(1, q.limit ?? 12));
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);
    let mapped = items.map(serializeProduct);
    if (slugOrder && slugOrder.length) {
      const pos = new Map(slugOrder.map((s, i) => [s, i]));
      mapped = mapped.sort((a: any, b: any) => (pos.get(a.slug) ?? 999) - (pos.get(b.slug) ?? 999));
    }
    return {
      items: mapped,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async home() {
    const active = { isActive: true };
    const [fresh, chefSpecials, featured, festive, deals, categories] = await Promise.all([
      this.prisma.product.findMany({
        where: { ...active, stock: { gt: 0 } },
        include: PRODUCT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      this.prisma.product.findMany({
        where: { ...active, isChefSpecial: true },
        include: PRODUCT_INCLUDE,
        orderBy: { ratingAvg: 'desc' },
        take: 4,
      }),
      this.prisma.product.findMany({
        where: { ...active, isFeatured: true },
        include: PRODUCT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      this.prisma.product.findMany({
        where: { ...active, tags: { contains: '"Festive"' } },
        include: PRODUCT_INCLUDE,
        take: 4,
      }),
      this.prisma.product.findMany({
        where: { ...active, compareAtPrice: { not: null } },
        include: PRODUCT_INCLUDE,
        take: 4,
      }),
      this.categories(),
    ]);
    return {
      fresh: fresh.map(serializeProduct),
      chefSpecials: chefSpecials.map(serializeProduct),
      featured: featured.map(serializeProduct),
      festive: festive.map(serializeProduct),
      deals: deals.map(serializeProduct),
      categories,
    };
  }

  async productBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        variants: { where: { isActive: true } },
        reviews: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!product || !product.isActive) throw new NotFoundException('Product not found');
    const related = await this.prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: product.id },
        ...(product.categoryId ? { categoryId: product.categoryId } : {}),
      },
      include: PRODUCT_INCLUDE,
      take: 4,
    });
    return { product: serializeProduct(product), related: related.map(serializeProduct) };
  }

  async addReview(productId: string, userId: string, dto: ReviewDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) throw new NotFoundException('Product not found');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    await this.prisma.review.create({
      data: {
        productId,
        userId,
        userName: user.name,
        rating: dto.rating,
        title: dto.title || null,
        body: dto.body || null,
      },
    });
    const agg = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { _all: true },
    });
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        ratingAvg: Math.round((agg._avg.rating ?? 0) * 10) / 10,
        ratingCount: agg._count._all,
      },
    });
    return { ok: true, ratingAvg: agg._avg.rating, ratingCount: agg._count._all };
  }
}
