/**
 * @bakery/shared — enums, constants, and types shared across API, storefront, and admin.
 */

export const ROLES = ['CUSTOMER', 'ADMIN', 'MANAGER', 'SUPPORT'] as const;
export type Role = (typeof ROLES)[number];

export const ORDER_STATUSES = [
  'PENDING',
  'PAYMENT_CONFIRMED',
  'PREPARING',
  'QUALITY_CHECK',
  'DISPATCHED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** The happy-path lifecycle of an order. */
export const ORDER_FLOW: OrderStatus[] = [
  'PENDING',
  'PAYMENT_CONFIRMED',
  'PREPARING',
  'QUALITY_CHECK',
  'DISPATCHED',
  'DELIVERED',
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Order Placed',
  PAYMENT_CONFIRMED: 'Payment Confirmed',
  PREPARING: 'Baking',
  QUALITY_CHECK: 'Quality Check',
  DISPATCHED: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

export const PAYMENT_METHODS = ['COD', 'TEST_GATEWAY', 'RAZORPAY', 'STRIPE'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  COD: 'Cash on Delivery',
  TEST_GATEWAY: 'Test Gateway (UPI/Card)',
  RAZORPAY: 'Razorpay',
  STRIPE: 'Stripe',
};

export const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const COUPON_TYPES = ['PERCENT', 'FIXED', 'SHIPPING'] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

export const DIETARY_TAGS = [
  'Vegetarian',
  'Eggless',
  'Vegan',
  'Gluten-Free',
  'Sugar-Free',
  'Nut-Free',
  'Jain',
] as const;

export const OCCASION_TAGS = [
  'Birthday',
  'Wedding',
  'Anniversary',
  'Diwali',
  'Christmas',
  'Valentines',
  'Holi',
  'Everyday',
] as const;

export const ALL_TAGS = [...DIETARY_TAGS, ...OCCASION_TAGS] as const;

export const DELIVERY_SLOTS = [
  '10:00 AM - 12:00 PM',
  '12:00 PM - 2:00 PM',
  '2:00 PM - 4:00 PM',
  '4:00 PM - 6:00 PM',
  '6:00 PM - 8:00 PM',
] as const;

/** Commerce constants (INR). */
export const FREE_DELIVERY_THRESHOLD = 999;
export const DELIVERY_FEE = 49;
export const TAX_RATE = 0.05; // 5% GST on bakery items
export const CURRENCY = 'INR';
export const LOYALTY_EARN_RATE = 10; // every ₹10 spent earns 1 point

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Payload shape of a cart line sent to the API for preview/checkout. */
export interface CartLine {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface OrderTotals {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;
  couponCode?: string | null;
}
