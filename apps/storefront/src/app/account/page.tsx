'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { ORDER_STATUS_LABELS, formatINR } from '@bakery/shared';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';

const EMPTY_ADDRESS = { label: 'Home', fullName: '', phone: '', line1: '', line2: '', city: 'New Delhi', state: 'Delhi', pincode: '', isDefault: false };

function AccountInner() {
  const { user, authLoading, refreshUser, showToast, addToCart } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') ?? 'orders');
  const [orders, setOrders] = useState<any[] | null>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[] | null>(null);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addr, setAddr] = useState<any>(EMPTY_ADDRESS);
  const [profile, setProfile] = useState({ name: '', phone: '' });

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login?next=/account');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) setProfile({ name: user.name ?? '', phone: user.phone ?? '' });
  }, [user]);

  const loadOrders = useCallback(() => api('/orders/mine').then(setOrders).catch(() => setOrders([])), []);
  const loadAddresses = useCallback(() => api('/users/me/addresses').then(setAddresses).catch(() => {}), []);
  const loadWishlist = useCallback(() => api('/users/me/wishlist').then(setWishlist).catch(() => setWishlist([])), []);

  useEffect(() => {
    if (!user) return;
    if (tab === 'orders') loadOrders();
    if (tab === 'addresses') loadAddresses();
    if (tab === 'wishlist') loadWishlist();
  }, [user, tab, loadOrders, loadAddresses, loadWishlist]);

  if (authLoading || !user) return <div className="container-x py-24 text-center text-mocha">Loading your account…</div>;

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/users/me/addresses', { method: 'POST', body: addr });
      setShowAddrForm(false);
      setAddr(EMPTY_ADDRESS);
      loadAddresses();
      showToast('Address saved');
    } catch (err: any) {
      showToast(err.message ?? 'Could not save address');
    }
  };

  const deleteAddress = async (id: string) => {
    await api(`/users/me/addresses/${id}`, { method: 'DELETE' }).catch(() => {});
    loadAddresses();
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/users/me', { method: 'PATCH', body: profile });
      await refreshUser();
      showToast('Profile updated');
    } catch (err: any) {
      showToast(err.message ?? 'Could not update profile');
    }
  };

  const TABS = [
    { id: 'orders', label: 'My Orders' },
    { id: 'addresses', label: 'Addresses' },
    { id: 'wishlist', label: 'Wishlist' },
    { id: 'profile', label: 'Profile' },
  ];

  return (
    <div className="container-x py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">My Account</p>
          <h1 className="mt-2 font-display text-4xl font-semibold">Hello, {user.name?.split(' ')[0]} 👋</h1>
        </div>
        <div className="card-lux px-6 py-3 text-center">
          <p className="font-display text-2xl font-semibold text-gold">✦ {user.loyaltyPoints}</p>
          <p className="text-[10px] font-bold tracking-widest text-mocha uppercase">Loyalty Points</p>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${tab === t.id ? 'bg-espresso text-ivory' : 'border border-espresso/15 text-cocoa hover:border-gold'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        <div className="space-y-4">
          {orders === null ? (
            <p className="text-sm text-mocha">Loading orders…</p>
          ) : orders.length === 0 ? (
            <div className="card-lux py-16 text-center">
              <p className="text-4xl">📦</p>
              <p className="mt-3 font-display text-xl font-semibold">No orders yet</p>
              <Link href="/shop" className="btn-gold mt-5">Start Shopping</Link>
            </div>
          ) : (
            orders.map((o) => (
              <Link key={o.id} href={`/order/${o.id}`} className="card-lux flex flex-wrap items-center gap-4 p-5 transition hover:border-gold/40 hover:shadow-md">
                <div className="flex -space-x-3">
                  {o.items.slice(0, 3).map((it: any) => (
                    <span key={it.id} className="h-14 w-14 overflow-hidden rounded-full border-2 border-ivory bg-cream">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={it.image ?? '/images/products/detail.svg'} alt="" className="h-full w-full object-cover" />
                    </span>
                  ))}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{o.orderNumber}</p>
                  <p className="text-xs text-mocha">
                    {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {o.items.length} item{o.items.length > 1 ? 's' : ''}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase ${o.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : o.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-goldsoft text-gold'}`}>
                  {ORDER_STATUS_LABELS[o.status as keyof typeof ORDER_STATUS_LABELS] ?? o.status}
                </span>
                <span className="font-display text-lg font-semibold">{formatINR(o.total)}</span>
              </Link>
            ))
          )}
        </div>
      )}

      {tab === 'addresses' && (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((a) => (
            <div key={a.id} className="card-lux p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">{a.label} {a.isDefault && <span className="ml-1 rounded-full bg-goldsoft px-2 py-0.5 text-[10px] font-bold text-gold uppercase">Default</span>}</p>
                <button onClick={() => deleteAddress(a.id)} className="text-xs text-mocha underline hover:text-red-700">Delete</button>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-mocha">
                {a.fullName} · {a.phone}<br />
                {a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />
                {a.city}, {a.state} — {a.pincode}
              </p>
            </div>
          ))}
          {showAddrForm ? (
            <form onSubmit={saveAddress} className="card-lux grid gap-3 p-6 md:col-span-2 sm:grid-cols-2">
              <h3 className="font-display text-lg font-semibold sm:col-span-2">New address</h3>
              <input required placeholder="Label" value={addr.label} onChange={(e) => setAddr({ ...addr, label: e.target.value })} className="input-lux" />
              <input required placeholder="Full name" value={addr.fullName} onChange={(e) => setAddr({ ...addr, fullName: e.target.value })} className="input-lux" />
              <input required placeholder="Phone" value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} className="input-lux" />
              <input required placeholder="Pincode" value={addr.pincode} onChange={(e) => setAddr({ ...addr, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} className="input-lux" />
              <input required placeholder="Address line 1" value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} className="input-lux sm:col-span-2" />
              <input placeholder="Address line 2" value={addr.line2} onChange={(e) => setAddr({ ...addr, line2: e.target.value })} className="input-lux sm:col-span-2" />
              <input required placeholder="City" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} className="input-lux" />
              <input required placeholder="State" value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} className="input-lux" />
              <div className="flex gap-3 sm:col-span-2">
                <button className="btn-gold">Save</button>
                <button type="button" onClick={() => setShowAddrForm(false)} className="btn-outline">Cancel</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowAddrForm(true)} className="card-lux flex min-h-32 items-center justify-center border-dashed text-sm font-semibold text-mocha hover:border-gold hover:text-gold">
              + Add New Address
            </button>
          )}
        </div>
      )}
      {tab === 'wishlist' && (
        <div>
          {wishlist === null ? (
            <p className="text-sm text-mocha">Loading wishlist…</p>
          ) : wishlist.length === 0 ? (
            <div className="card-lux py-16 text-center">
              <p className="text-4xl">💛</p>
              <p className="mt-3 font-display text-xl font-semibold">Your wishlist is empty</p>
              <p className="mt-1 text-sm text-mocha">Tap the heart on any product to save it here. (Wishlist hearts are available on product pages.)</p>
              <Link href="/shop" className="btn-gold mt-5">Discover Bakes</Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {wishlist.map((w) => {
                const p = w.product;
                return (
                  <div key={w.id} className="card-lux overflow-hidden">
                    <Link href={`/product/${p.slug}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.images?.[0] ?? '/images/products/detail.svg'} alt={p.name} className="aspect-[4/3] w-full object-cover" />
                    </Link>
                    <div className="p-4">
                      <p className="font-display font-semibold">{p.name}</p>
                      <p className="text-sm text-mocha">{formatINR(p.minPrice ?? p.basePrice)}</p>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => {
                            addToCart({
                              productId: p.id,
                              variantId: p.variants?.[0]?.id ?? null,
                              name: p.name,
                              variantName: p.variants?.[0]?.name ?? null,
                              image: p.images?.[0] ?? null,
                              unitPrice: p.variants?.[0]?.price ?? p.basePrice,
                              quantity: 1,
                              slug: p.slug,
                            });
                          }}
                          className="btn-gold flex-1 !px-3 !py-2 text-xs"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={async () => {
                            await api(`/users/me/wishlist/${p.id}`, { method: 'DELETE' }).catch(() => {});
                            loadWishlist();
                          }}
                          className="btn-outline !px-3 !py-2 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'profile' && (
        <div className="grid gap-6 md:grid-cols-2">
          <form onSubmit={saveProfile} className="card-lux space-y-4 p-7">
            <h3 className="font-display text-xl font-semibold">Profile Details</h3>
            <div>
              <label className="mb-1.5 block text-xs font-bold tracking-wider text-mocha uppercase">Full name</label>
              <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="input-lux" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold tracking-wider text-mocha uppercase">Email (login)</label>
              <input value={user.email} disabled className="input-lux opacity-60" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold tracking-wider text-mocha uppercase">Phone</label>
              <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="input-lux" />
            </div>
            <button className="btn-gold">Save Changes</button>
          </form>
          <div className="card-lux p-7">
            <h3 className="font-display text-xl font-semibold">Loyalty & Rewards</h3>
            <p className="mt-3 text-sm leading-relaxed text-mocha">
              You have <b className="text-gold">✦ {user.loyaltyPoints} points</b>. Earn 1 point for every ₹10
              spent. Points unlock secret recipes, early access to festive drops and birthday surprises.
            </p>
            <div className="mt-5 rounded-xl bg-cream/70 p-4 text-xs text-mocha">
              <p className="font-bold text-espresso">Member since</p>
              <p>{new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="container-x py-24 text-center text-mocha">Loading…</div>}>
      <AccountInner />
    </Suspense>
  );
}
