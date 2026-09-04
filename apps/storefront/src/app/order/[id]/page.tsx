'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { ORDER_FLOW, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, formatINR } from '@bakery/shared';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';

function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const isNew = params.get('new') === '1';
  const { user, authLoading, addToCart, showToast } = useStore();
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading || !user) return;
    api(`/orders/${id}`)
      .then(setOrder)
      .catch((e) => setError(e.message));
  }, [id, user, authLoading]);

  if (authLoading) return <div className="container-x py-24 text-center text-mocha">Loading…</div>;
  if (!user)
    return (
      <div className="container-x py-24 text-center">
        <h1 className="font-display text-3xl font-semibold">Please sign in to view this order</h1>
        <Link href={`/login?next=/order/${id}`} className="btn-gold mt-6">Sign In</Link>
      </div>
    );
  if (error) return <div className="container-x py-24 text-center text-red-700">{error}</div>;
  if (!order) return <div className="container-x py-24 text-center text-mocha">Fetching your order…</div>;

  const cancelled = order.status === 'CANCELLED' || order.status === 'REFUNDED';
  const flowIndex = ORDER_FLOW.indexOf(order.status);

  const reorder = () => {
    for (const it of order.items) {
      addToCart({
        productId: it.productId,
        variantId: it.variantId,
        name: it.productName,
        variantName: it.variantName,
        image: it.image,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        slug: '',
      });
    }
    showToast('Items added back to your cart');
  };

  return (
    <div className="container-x max-w-4xl py-10">
      {isNew && (
        <div className="mb-8 rounded-3xl bg-espresso p-8 text-center shadow-[0_8px_32px_rgba(57,15,16,0.3)]">
          <p className="text-5xl">🎉</p>
          <h1 className="mt-4 font-display text-3xl font-semibold text-ivory">Your order has been placed successfully!</h1>
          <p className="mt-3 text-sm text-cream/90">
            Order ID: <span className="font-mono font-bold text-goldlight">{order.orderNumber}</span> · Internal ID: <span className="font-mono text-ivory">{order.id}</span>
          </p>
          <p className="mt-2 text-sm text-cream/70">
            Hi <span className="font-bold text-ivory">{order.user?.name ?? order.address?.fullName ?? 'Customer'}</span> — we’ve confirmed <span className="font-bold text-goldlight">{order.items?.length} item(s)</span> for <span className="font-bold text-goldlight">{formatINR(order.total)}</span> via {PAYMENT_METHOD_LABELS[order.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] ?? order.paymentMethod}.
          </p>
          <div className="mx-auto mt-4 max-w-2xl rounded-xl bg-white/10 p-4 text-left backdrop-blur">
            <p className="text-xs font-bold tracking-widest text-goldlight uppercase">Order Summary</p>
            <div className="mt-2 space-y-1 text-sm text-cream">
              {order.items?.slice(0, 3).map((it: any) => (
                <p key={it.id} className="flex justify-between">
                  <span>{it.productName} {it.variantName ? `· ${it.variantName}` : ''} × {it.quantity}</span>
                  <span className="font-mono text-goldlight">{it.productId.slice(0, 8)}…</span>
                </p>
              ))}
              {order.items?.length > 3 && <p className="text-xs text-cream/60">+ {order.items.length - 3} more items</p>}
            </div>
          </div>
          <p className="mt-3 text-xs text-cream/60">You can track this order in My Orders — we’ll also call you if anything needs confirmation.</p>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Order Tracking</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">{order.orderNumber}</h1>
          <p className="text-sm text-mocha">
            Placed {new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
            {' · '}{PAYMENT_METHOD_LABELS[order.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] ?? order.paymentMethod}
          </p>
        </div>
        <span className={`rounded-full px-4 py-2 text-xs font-bold tracking-wider uppercase ${cancelled ? 'bg-red-100 text-red-700' : 'bg-goldsoft text-gold'}`}>
          {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] ?? order.status}
        </span>
      </div>

      {!cancelled && (
        <div className="card-lux mb-8 p-7">
          <div className="flex items-center">
            {ORDER_FLOW.map((s, i) => (
              <div key={s} className="flex flex-1 flex-col items-center">
                <div className="flex w-full items-center">
                  <div className={`h-0.5 flex-1 ${i === 0 ? 'bg-transparent' : i <= flowIndex ? 'bg-gold' : 'bg-espresso/10'}`} />
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${i <= flowIndex ? 'bg-gold text-white' : 'border border-espresso/15 text-mocha'}`}>
                    {i < flowIndex ? '✓' : i === flowIndex ? '●' : i + 1}
                  </span>
                  <div className={`h-0.5 flex-1 ${i === ORDER_FLOW.length - 1 ? 'bg-transparent' : i < flowIndex ? 'bg-gold' : 'bg-espresso/10'}`} />
                </div>
                <p className={`mt-2 text-center text-[10px] font-bold tracking-wide uppercase ${i <= flowIndex ? 'text-espresso' : 'text-mocha/60'}`}>
                  {ORDER_STATUS_LABELS[s]}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-center text-xs text-mocha">
            🚚 Delivering {order.deliveryDate} · {order.deliverySlot}
          </p>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-[1fr_320px]">
        <div className="card-lux p-6">
          <h2 className="mb-4 font-display text-xl font-semibold">Items</h2>
          <div className="space-y-4">
            {order.items.map((it: any) => (
              <div key={it.id} className="flex items-center gap-4">
                <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.image ?? '/images/products/detail.svg'} alt={it.productName} className="h-full w-full object-cover" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-bold">{it.productName}</span>
                  <span className="text-xs text-mocha">{it.variantName ? `${it.variantName} · ` : ''}× {it.quantity}</span>
                </span>
                <span className="text-sm font-semibold">{formatINR(it.total)}</span>
              </div>
            ))}
          </div>
          <div className="my-5 gold-divider !mx-0" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-mocha">Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-gold"><span>Discount {order.couponCode && `(${order.couponCode})`}</span><span>− {formatINR(order.discount)}</span></div>}
            <div className="flex justify-between"><span className="text-mocha">Delivery</span><span>{order.deliveryFee === 0 ? 'FREE' : formatINR(order.deliveryFee)}</span></div>
            <div className="flex justify-between"><span className="text-mocha">GST</span><span>{formatINR(order.tax)}</span></div>
            <div className="flex justify-between border-t border-espresso/10 pt-2 font-display text-lg font-semibold"><span>Total</span><span>{formatINR(order.total)}</span></div>
            {order.loyaltyEarned > 0 && <p className="text-xs text-gold">✦ You earned {order.loyaltyEarned} loyalty points</p>}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-lux p-6">
            <h3 className="font-display text-lg font-semibold">Delivering To</h3>
            {order.address && (
              <p className="mt-2 text-sm leading-relaxed text-mocha">
                <b className="text-espresso">{order.address.fullName}</b><br />
                {order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}<br />
                {order.address.city}, {order.address.state} — {order.address.pincode}<br />
                {order.address.phone}
              </p>
            )}
            {order.notes && <p className="mt-3 rounded-lg bg-cream p-3 text-xs text-mocha">Note: {order.notes}</p>}
          </div>
          <div className="card-lux p-6">
            <h3 className="font-display text-lg font-semibold">History</h3>
            <div className="mt-3 space-y-3">
              {[...(order.history ?? [])].reverse().map((h: any) => (
                <div key={h.id} className="flex gap-3 text-xs">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold" />
                  <span>
                    <b>{ORDER_STATUS_LABELS[h.status as keyof typeof ORDER_STATUS_LABELS] ?? h.status}</b>
                    {h.note && <span className="text-mocha"> — {h.note}</span>}
                    <span className="block text-mocha/70">{new Date(h.createdAt).toLocaleString('en-IN')}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={reorder} className="btn-outline w-full">↻ Reorder These Items</button>
        </div>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="container-x py-24 text-center text-mocha">Loading…</div>}>
      <OrderDetail />
    </Suspense>
  );
}
