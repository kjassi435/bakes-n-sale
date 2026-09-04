import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, LOYALTY_EARN_RATE, TAX_RATE } from '@bakery/shared';
import { PrismaService } from '../prisma.service';
import { makeOrderNumber, parseArr, round2, serializeOrder } from '../helpers';
import { CreateOrderDto, PreviewOrderDto } from '../users/users.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  /** Revalidates cart lines against the database and computes authoritative totals. */
  private async computeTotals(tx: any, dto: PreviewOrderDto) {
    const items: any[] = [];
    for (const line of dto.items) {
      const product = await tx.product.findUnique({
        where: { id: line.productId },
        include: { variants: true },
      });
      if (!product || !product.isActive) {
        throw new BadRequestException('A product in your cart is no longer available');
      }
      let unitPrice = product.basePrice;
      let variantName: string | null = null;
      let variantId: string | null = null;
      let stock = product.stock;
      if (line.variantId) {
        const variant = product.variants.find((v: any) => v.id === line.variantId && v.isActive);
        if (!variant) throw new BadRequestException(`An option for ${product.name} is no longer available`);
        unitPrice = variant.price;
        variantName = variant.name;
        variantId = variant.id;
        stock = variant.stock;
      }
      if (!product.isPreorder && stock < line.quantity) {
        throw new BadRequestException(`Only ${stock} left in stock for ${product.name}`);
      }
      items.push({
        productId: product.id,
        variantId,
        productName: product.name,
        variantName,
        image: parseArr(product.images)[0] ?? null,
        unitPrice,
        quantity: line.quantity,
        total: round2(unitPrice * line.quantity),
        isPreorder: product.isPreorder,
      });
    }

    const subtotal = round2(items.reduce((s, i) => s + i.total, 0));

    // Coupon validation
    let discount = 0;
    let coupon: any = null;
    if (dto.couponCode) {
      coupon = await tx.coupon.findUnique({ where: { code: dto.couponCode.toUpperCase() } });
      if (!coupon || !coupon.isActive) throw new BadRequestException('Invalid coupon code');
      if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new BadRequestException('This coupon has expired');
      if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
        throw new BadRequestException('This coupon has reached its usage limit');
      }
      if (subtotal < coupon.minOrderValue) {
        throw new BadRequestException(`This coupon needs a minimum order of ₹${coupon.minOrderValue}`);
      }
      if (coupon.type === 'PERCENT') {
        discount = round2((subtotal * coupon.value) / 100);
        if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
      } else if (coupon.type === 'FIXED') {
        discount = Math.min(coupon.value, subtotal);
      }
    }

    const deliveryFee =
      coupon?.type === 'SHIPPING' ? 0 : subtotal - discount >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
    const tax = round2((subtotal - discount) * TAX_RATE);
    const total = round2(subtotal - discount + deliveryFee + tax);

    return {
      items,
      totals: {
        subtotal,
        discount: round2(discount),
        deliveryFee,
        tax,
        total,
        couponCode: coupon?.code ?? null,
      },
    };
  }

  async preview(dto: PreviewOrderDto) {
    const { items, totals } = await this.computeTotals(this.prisma, dto);
    return {
      items: items.map(({ isPreorder, ...rest }) => rest),
      totals,
    };
  }

  async create(userId: string, dto: CreateOrderDto) {
    const address = await this.prisma.address.findFirst({ where: { id: dto.addressId, userId } });
    if (!address) throw new BadRequestException('Please select a valid delivery address');

    return this.prisma.$transaction(async (tx) => {
      const { items, totals } = await this.computeTotals(tx, dto);

      const paid = dto.paymentMethod === 'TEST_GATEWAY';
      const status = paid ? 'PAYMENT_CONFIRMED' : 'PENDING';
      const paymentStatus = paid ? 'PAID' : 'PENDING';
      const loyaltyEarned = Math.floor(totals.total / LOYALTY_EARN_RATE);

      // Decrement stock
      for (const it of items) {
        if (it.isPreorder) continue;
        if (it.variantId) {
          await tx.productVariant.update({
            where: { id: it.variantId },
            data: { stock: { decrement: it.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: it.productId },
            data: { stock: { decrement: it.quantity } },
          });
        }
      }

      if (totals.couponCode) {
        await tx.coupon.update({
          where: { code: totals.couponCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      const order = await tx.order.create({
        data: {
          orderNumber: makeOrderNumber(),
          userId,
          status,
          paymentMethod: dto.paymentMethod,
          paymentStatus,
          ...totals,
          addressSnapshot: JSON.stringify(address),
          deliveryDate: dto.deliveryDate,
          deliverySlot: dto.deliverySlot,
          notes: dto.notes || null,
          loyaltyEarned,
          items: { create: items.map(({ isPreorder, ...rest }) => rest) },
          history: {
            create: {
              status,
              note: paid ? 'Payment received via test gateway' : 'Order placed — Cash on Delivery',
            },
          },
        },
        include: { items: true, history: true },
      });

      await tx.user.update({
        where: { id: userId },
        data: { loyaltyPoints: { increment: loyaltyEarned } },
      });

      return serializeOrder(order);
    });
  }

  async mine(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(serializeOrder);
  }

  async findOne(id: string, user: { sub: string; role: string }) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, history: { orderBy: { createdAt: 'asc' } }, user: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (user.role === 'CUSTOMER' && order.userId !== user.sub) {
      throw new ForbiddenException('You do not have access to this order');
    }
    return serializeOrder(order);
  }
}
