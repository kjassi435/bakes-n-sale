'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatINR, FREE_DELIVERY_THRESHOLD } from '@bakery/shared';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import ProductCard from '@/components/ProductCard';

export default function CartPage() {
  const { cart, cartHydrated, setQuantity, removeFromCart, cartSubtotal, cartCount } = useStore();
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    api('/products?featured=true&limit=3').then((r) => setSuggestions(r.items ?? [])).catch(() => {});
  }, []);

  const deliveryNote = cartSubtotal >= FREE_DELIVERY_THRESHOLD;

  if (!cartHydrated) {
    return <div className="container-x py-24 text-center text-mocha">Loading your basket…</div>;
  }

  if (cart.length === 0) {
    return (
      <div className="container-x py-24 text-center">
        <p className="text-6xl">🧺</p>
        <h1 className="mt-6 font-display text-4xl font-semibold">Your basket is empty</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-mocha">
          Fill it with something warm from the oven — your future self will thank you.
        </p>
        <Link href="/shop" className="btn-gold mt-8">Browse the Collection</Link>
      </div>
    );
  }

  return (
    <div className="container-x py-10">
      <p className="eyebrow">Your Selection</p>
      <h1 className="mt-2 mb-8 font-display text-4xl font-semibold">Shopping Basket</h1>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        {/* Items */}
        <div className="space-y-4">
          {cart.map((item) => (
            <div key={`${item.productId}-${item.variantId ?? 'base'}`} className="card-lux flex gap-4 p-4">
              <Link href={`/product/${item.slug}`} className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-cream">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image ?? '/images/products/detail.svg'} alt={item.name} className="h-full w-full object-cover" />
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/product/${item.slug}`} className="font-display text-lg font-semibold hover:text-gold">
                      {item.name}
                    </Link>
                    {item.variantName && <p className="text-xs text-mocha">Size: {item.variantName}</p>}
                    <p className="mt-1 text-xs text-mocha">{formatINR(item.unitPrice)} each</p>
                  </div>
                  <button onClick={() => removeFromCart(item.productId, item.variantId)} className="text-xs text-mocha underline hover:text-red-700">
                    Remove
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center rounded-full border border-espresso/20">
                    <button onClick={() => setQuantity(item.productId, item.variantId, item.quantity - 1)} className="px-3.5 py-1.5 text-mocha hover:text-gold">−</button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => setQuantity(item.productId, item.variantId, item.quantity + 1)} className="px-3.5 py-1.5 text-mocha hover:text-gold">+</button>
                  </div>
                  <p className="font-display text-lg font-semibold">{formatINR(item.unitPrice * item.quantity)}</p>
                </div>
              </div>
            </div>
          ))}
          <Link href="/shop" className="inline-block text-sm font-semibold text-gold hover:underline">← Continue shopping</Link>
        </div>

        {/* Summary */}
        <div className="card-lux h-fit p-7">
          <h2 className="font-display text-xl font-semibold">Order Summary</h2>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-mocha">Subtotal ({cartCount} items)</span><span className="font-semibold">{formatINR(cartSubtotal)}</span></div>
            <div className="flex justify-between">
              <span className="text-mocha">Delivery</span>
              <span className="font-semibold">{deliveryNote ? 'FREE' : 'calculated at checkout'}</span>
            </div>
            <div className="flex justify-between"><span className="text-mocha">GST (5%)</span><span className="font-semibold">calculated at checkout</span></div>
          </div>
          {!deliveryNote && (
            <p className="mt-4 rounded-xl bg-goldsoft/50 p-3 text-xs text-cocoa">
              Add {formatINR(FREE_DELIVERY_THRESHOLD - cartSubtotal)} more for <b>free delivery</b> 🎉
            </p>
          )}
          <div className="my-5 gold-divider !mx-0" />
          <div className="flex justify-between font-display text-lg font-semibold">
            <span>Estimated Total</span><span>{formatINR(cartSubtotal)}</span>
          </div>
          <Link href="/checkout" className="btn-gold mt-6 w-full">Proceed to Checkout</Link>
          <p className="mt-3 text-center text-[11px] text-mocha">Coupons & final totals applied at checkout · COD & UPI accepted</p>
        </div>
      </div>

      {suggestions.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-8 text-center font-display text-3xl font-semibold">Pairs Perfectly With</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {suggestions.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
