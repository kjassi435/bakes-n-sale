'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DELIVERY_SLOTS, formatINR } from '@bakery/shared';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';

const EMPTY_ADDRESS = { label: 'Home', fullName: '', phone: '', line1: '', line2: '', city: 'New Delhi', state: 'Delhi', pincode: '', isDefault: false };

export default function CheckoutPage() {
  const { user, authLoading, cart, cartHydrated, cartSubtotal, clearCart, showToast } = useStore();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressId, setAddressId] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addr, setAddr] = useState<any>(EMPTY_ADDRESS);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliverySlot, setDeliverySlot] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [couponInput, setCouponInput] = useState('');
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const lines = useMemo(() => cart.map((i) => ({ productId: i.productId, variantId: i.variantId ?? null, quantity: i.quantity })), [cart]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login?next=/checkout');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!cartHydrated) return;
    if (placing) return; // don't redirect while placing order — will go to /order/[id]
    if (!authLoading && user && cart.length === 0) router.replace('/cart');
  }, [authLoading, user, cart.length, cartHydrated, placing, router]);

  const loadAddresses = useCallback(async () => {
    const list = await api('/users/me/addresses');
    setAddresses(list);
    if (list.length && !addressId) setAddressId(list[0].id);
  }, [addressId]);

  useEffect(() => {
    if (user) loadAddresses().catch(() => {});
  }, [user, loadAddresses]);

  // Server-authoritative totals
  useEffect(() => {
    if (!user || lines.length === 0) return;
    api('/orders/preview', { method: 'POST', body: { items: lines, couponCode: couponCode ?? undefined } })
      .then(setPreview)
      .catch((e) => {
        setPreview(null);
        setError(e.message);
      });
  }, [user, lines, couponCode]);

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api('/users/me/addresses', { method: 'POST', body: addr });
      await loadAddresses();
      setAddressId(created.id);
      setShowAddressForm(false);
      setAddr(EMPTY_ADDRESS);
      showToast('Address saved');
    } catch (err: any) {
      showToast(err.message ?? 'Could not save address');
    }
  };

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setError('');
    try {
      const p = await api('/orders/preview', { method: 'POST', body: { items: lines, couponCode: couponInput.trim() } });
      setCouponCode(p.totals.couponCode);
      setPreview(p);
      showToast(`Coupon ${p.totals.couponCode} applied 🎉`);
    } catch (err: any) {
      showToast(err.message ?? 'Invalid coupon');
    }
  };

  const placeOrder = async () => {
    setError('');
    if (!addressId) { setError('Please select a delivery address.'); setStep(1); return; }
    if (!deliveryDate || !deliverySlot) { setError('Please choose a delivery date and slot.'); setStep(2); return; }
    setPlacing(true);
    try {
      const order = await api('/orders', {
        method: 'POST',
        body: { items: lines, addressId, deliveryDate, deliverySlot, paymentMethod, couponCode: couponCode ?? undefined },
      });
      clearCart();
      router.push(`/order/${order.id}?new=1`);
    } catch (err: any) {
      setError(err.message ?? 'Could not place order');
      setPlacing(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const maxDate = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

  if (authLoading || !user || !cartHydrated) {
    return <div className="container-x py-24 text-center text-mocha">Preparing checkout…</div>;
  }

  const STEPS = ['Delivery', 'Schedule', 'Payment'];

  return (
    <div className="container-x py-10">
      <p className="eyebrow">Almost There</p>
      <h1 className="mt-2 font-display text-4xl font-semibold">Checkout</h1>

      {/* Step indicator */}
      <div className="mt-8 mb-10 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => i + 1 < step && setStep(i + 1)} className="flex items-center gap-2">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${step > i ? 'bg-espresso text-ivory' : step === i + 1 ? 'bg-gold text-white' : 'border border-espresso/20 text-mocha'}`}>
              {step > i + 1 ? '✓' : i + 1}
            </span>
            <span className={`text-sm font-semibold ${step === i + 1 ? 'text-espresso' : 'text-mocha'}`}>{s}</span>
            {i < STEPS.length - 1 && <span className="mx-2 h-px w-10 bg-espresso/15" />}
          </button>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold">Where should we deliver?</h2>
              {addresses.map((a) => (
                <label key={a.id} className={`card-lux flex cursor-pointer items-start gap-3 p-5 transition ${addressId === a.id ? 'border-gold ring-2 ring-gold/25' : 'hover:border-gold/40'}`}>
                  <input type="radio" checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="mt-1 accent-[#b8860b]" />
                  <span>
                    <span className="flex items-center gap-2 text-sm font-bold">
                      {a.label} {a.isDefault && <span className="rounded-full bg-goldsoft px-2 py-0.5 text-[10px] font-bold text-gold uppercase">Default</span>}
                    </span>
                    <span className="mt-1 block text-sm text-mocha">{a.fullName} · {a.phone}</span>
                    <span className="block text-sm text-mocha">{a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city} — {a.pincode}</span>
                  </span>
                </label>
              ))}

              {showAddressForm ? (
                <form onSubmit={saveAddress} className="card-lux grid gap-3 p-6 sm:grid-cols-2">
                  <h3 className="font-display text-lg font-semibold sm:col-span-2">New address</h3>
                  <input required placeholder="Label (Home / Work)" value={addr.label} onChange={(e) => setAddr({ ...addr, label: e.target.value })} className="input-lux" />
                  <input required placeholder="Full name" value={addr.fullName} onChange={(e) => setAddr({ ...addr, fullName: e.target.value })} className="input-lux" />
                  <input required placeholder="Phone" value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} className="input-lux" />
                  <input required placeholder="Pincode" value={addr.pincode} onChange={(e) => setAddr({ ...addr, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} className="input-lux" />
                  <input required placeholder="Address line 1" value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} className="input-lux sm:col-span-2" />
                  <input placeholder="Address line 2 (optional)" value={addr.line2} onChange={(e) => setAddr({ ...addr, line2: e.target.value })} className="input-lux sm:col-span-2" />
                  <input required placeholder="City" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} className="input-lux" />
                  <input required placeholder="State" value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} className="input-lux" />
                  <div className="flex gap-3 sm:col-span-2">
                    <button className="btn-gold">Save Address</button>
                    <button type="button" onClick={() => setShowAddressForm(false)} className="btn-outline">Cancel</button>
                  </div>
                </form>
              ) : (
                <button onClick={() => setShowAddressForm(true)} className="btn-outline">+ Add New Address</button>
              )}

              <div className="pt-2">
                <button disabled={!addressId} onClick={() => setStep(2)} className="btn-gold">Continue to Scheduling</button>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-semibold">When would you like it?</h2>
              <div>
                <p className="mb-2 text-xs font-bold tracking-[0.18em] text-mocha uppercase">Delivery date</p>
                <input type="date" min={today} max={maxDate} value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="input-lux max-w-xs" />
                <p className="mt-2 text-xs text-mocha">Same-day delivery available for orders placed before 2 PM.</p>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold tracking-[0.18em] text-mocha uppercase">Time slot</p>
                <div className="flex flex-wrap gap-2">
                  {DELIVERY_SLOTS.map((s) => (
                    <button key={s} onClick={() => setDeliverySlot(s)} className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition ${deliverySlot === s ? 'border-espresso bg-espresso text-ivory' : 'border-espresso/20 text-cocoa hover:border-gold'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="btn-outline">Back</button>
                <button disabled={!deliveryDate || !deliverySlot} onClick={() => setStep(3)} className="btn-gold">Continue to Payment</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-semibold">How would you like to pay?</h2>
              <label className={`card-lux flex cursor-pointer items-start gap-3 p-5 ${paymentMethod === 'COD' ? 'border-gold ring-2 ring-gold/25' : 'hover:border-gold/40'}`}>
                <input type="radio" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} className="mt-1 accent-[#b8860b]" />
                <span>
                  <span className="text-sm font-bold">💵 Cash on Delivery</span>
                  <span className="mt-1 block text-sm text-mocha">Pay by cash or UPI when your order arrives.</span>
                </span>
              </label>
              <label className={`card-lux flex cursor-pointer items-start gap-3 p-5 ${paymentMethod === 'TEST_GATEWAY' ? 'border-gold ring-2 ring-gold/25' : 'hover:border-gold/40'}`}>
                <input type="radio" checked={paymentMethod === 'TEST_GATEWAY'} onChange={() => setPaymentMethod('TEST_GATEWAY')} className="mt-1 accent-[#b8860b]" />
                <span>
                  <span className="text-sm font-bold">💳 Pay Now — UPI / Card <span className="ml-1 rounded-full bg-goldsoft px-2 py-0.5 text-[10px] font-bold text-gold uppercase">Demo</span></span>
                  <span className="mt-1 block text-sm text-mocha">Simulated gateway for this demo — payment is confirmed instantly. Razorpay connects goes live in Phase 2.</span>
                </span>
              </label>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(2)} className="btn-outline">Back</button>
                <button disabled={placing || !preview} onClick={placeOrder} className="btn-gold">
                  {placing ? 'Placing your order…' : `Place Order${preview ? ` · ${formatINR(preview.totals.total)}` : ''}`}
                </button>
              </div>
            </div>
          )}
          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </div>

        <div className="card-lux h-fit p-7">
          <h2 className="font-display text-xl font-semibold">Your Order</h2>
          <div className="mt-4 space-y-3">
            {cart.map((i) => (
              <div key={`${i.productId}-${i.variantId ?? 'b'}`} className="flex items-center gap-3 text-sm">
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-cream">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={i.image ?? '/images/products/detail.svg'} alt={i.name} className="h-full w-full object-cover" />
                </span>
                <span className="flex-1 leading-tight">
                  <span className="block font-semibold">{i.name}</span>
                  <span className="text-xs text-mocha">{i.variantName ? `${i.variantName} · ` : ''}× {i.quantity}</span>
                </span>
                <span className="font-semibold">{formatINR(i.unitPrice * i.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <div className="mt-5">
            {couponCode ? (
              <div className="flex items-center justify-between rounded-xl bg-goldsoft/50 px-4 py-2.5 text-sm">
                <span className="font-bold text-gold">✦ {couponCode} applied</span>
                <button onClick={() => setCouponCode(null)} className="text-xs text-mocha underline">remove</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder="Coupon code" className="input-lux !py-2.5 text-xs uppercase" />
                <button onClick={applyCoupon} className="btn-outline shrink-0 !px-4 !py-2.5 text-xs">Apply</button>
              </div>
            )}
            <p className="mt-2 text-[11px] text-mocha">Try WELCOME10, FESTIVE25, SWEET50 or FREESHIP</p>
          </div>

          <div className="my-5 gold-divider !mx-0" />

          {preview ? (
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-mocha">Subtotal</span><span className="font-semibold">{formatINR(preview.totals.subtotal)}</span></div>
              {preview.totals.discount > 0 && (
                <div className="flex justify-between text-gold"><span>Discount</span><span className="font-semibold">− {formatINR(preview.totals.discount)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-mocha">Delivery</span><span className="font-semibold">{preview.totals.deliveryFee === 0 ? 'FREE' : formatINR(preview.totals.deliveryFee)}</span></div>
              <div className="flex justify-between"><span className="text-mocha">GST (5%)</span><span className="font-semibold">{formatINR(preview.totals.tax)}</span></div>
              <div className="mt-3 flex justify-between border-t border-espresso/10 pt-3 font-display text-lg font-semibold">
                <span>Total</span><span>{formatINR(preview.totals.total)}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-mocha">Subtotal</span><span className="font-semibold">{formatINR(cartSubtotal)}</span></div>
              <p className="text-xs text-mocha">Final totals are being calculated…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
