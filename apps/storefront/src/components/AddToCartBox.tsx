'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatINR } from '@bakery/shared';
import { useStore } from '@/lib/store';
import { api, getToken } from '@/lib/api';

export default function AddToCartBox({ product }: { product: any }) {
  const { addToCart } = useStore();
  const router = useRouter();
  const variants: any[] = product.variants ?? [];
  const [wish, setWish] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);

  useEffect(() => {
    if (!getToken()) return;
    api(`/users/me/wishlist`).then((items: any[]) => {
      setWish(!!items.find((w: any) => w.productId === product.id || w.product?.id === product.id));
    }).catch(() => {});
  }, [product.id]);

  const option1s = useMemo(() => [...new Set(variants.map((v) => v.option1).filter(Boolean))] as string[], [variants]);
  const option2s = useMemo(() => [...new Set(variants.map((v) => v.option2).filter(Boolean))] as string[], [variants]);

  const [sel1, setSel1] = useState<string | null>(option1s[0] ?? null);
  const [sel2, setSel2] = useState<string | null>(option2s[0] ?? null);
  const [qty, setQty] = useState(1);

  const selected = useMemo(() => {
    if (!variants.length) return null;
    return (
      variants.find((v) => (!option1s.length || v.option1 === sel1) && (!option2s.length || v.option2 === sel2)) ??
      variants[0]
    );
  }, [variants, option1s, option2s, sel1, sel2]);

  const price = selected ? selected.price : product.basePrice;
  const stock = selected ? selected.stock : product.stock;
  const outOfStock = !product.isPreorder && stock <= 0;

  const buildItem = () => ({
    productId: product.id,
    variantId: selected?.id ?? null,
    name: product.name,
    variantName: selected?.name ?? null,
    image: product.images?.[0] ?? null,
    unitPrice: price,
    quantity: qty,
    slug: product.slug,
  });

  const toggleWish = async () => {
    if (!getToken()) { router.push(`/login?next=/product/${product.slug}`); return; }
    setWishBusy(true);
    try {
      if (wish) {
        await api(`/users/me/wishlist/${product.id}`, { method: 'DELETE' });
        setWish(false);
      } else {
        await api(`/users/me/wishlist/${product.id}`, { method: 'POST' });
        setWish(true);
      }
    } catch {}
    setWishBusy(false);
  };

  return (
    <div className="space-y-6">
      {/* SKU / Category / Tags */}
      <div className="flex flex-wrap gap-2 text-[11px] text-mocha">
        {product.sku && <span className="rounded-full border border-espresso/10 bg-white px-3 py-1">SKU: {product.sku}</span>}
        {product.category && <span className="rounded-full border border-espresso/10 bg-white px-3 py-1">{product.category.name}</span>}
        {product.tags?.slice(0,2).map((t:string)=> <span key={t} className="rounded-full bg-cream px-3 py-1">{t}</span>)}
      </div>
      {/* Price - WooCommerce style */}
      <div className="flex items-baseline gap-3">
        <span className="font-display text-3xl font-semibold text-espresso">{formatINR(price)}</span>
        {product.compareAtPrice != null && product.compareAtPrice > price && (
          <span className="text-lg text-mocha line-through">{formatINR(product.compareAtPrice)}</span>
        )}
        {product.compareAtPrice != null && product.compareAtPrice > price && (
          <span className="rounded-full bg-gold px-3 py-1 text-xs font-bold text-white">Save {formatINR(product.compareAtPrice - price)}</span>
        )}
        <span className="text-xs text-mocha">incl. GST</span>
      </div>

      {/* Option 1 (size / weight) */}
      {option1s.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold tracking-[0.18em] text-mocha uppercase">Choose Size</p>
          <div className="flex flex-wrap gap-2">
            {option1s.map((o) => (
              <button
                key={o}
                onClick={() => setSel1(o)}
                className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition ${sel1 === o ? 'border-espresso bg-espresso text-ivory' : 'border-espresso/20 text-cocoa hover:border-gold'}`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Option 2 (flavor) */}
      {option2s.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold tracking-[0.18em] text-mocha uppercase">Choose Flavour</p>
          <div className="flex flex-wrap gap-2">
            {option2s.map((o) => (
              <button
                key={o}
                onClick={() => setSel2(o)}
                className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition ${sel2 === o ? 'border-espresso bg-espresso text-ivory' : 'border-espresso/20 text-cocoa hover:border-gold'}`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Qty + stock */}
      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-full border border-espresso/20">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 py-2.5 text-lg text-mocha hover:text-gold">−</button>
          <span className="w-10 text-center text-sm font-bold">{qty}</span>
          <button onClick={() => setQty((q) => Math.min(50, q + 1))} className="px-4 py-2.5 text-lg text-mocha hover:text-gold">+</button>
        </div>
        {product.isPreorder ? (
          <span className="text-xs font-semibold text-gold">✦ Pre-order — baked fresh for your date</span>
        ) : outOfStock ? (
          <span className="text-xs font-semibold text-red-700">Currently sold out</span>
        ) : stock <= 8 ? (
          <span className="text-xs font-semibold text-gold">Only {stock} left — baked in small batches</span>
        ) : (
          <span className="text-xs text-mocha">In stock, baked fresh daily</span>
        )}
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          disabled={outOfStock}
          onClick={() => addToCart(buildItem())}
          className="btn-gold flex-1"
        >
          Add to Cart · {formatINR(price * qty)}
        </button>
        <button
          disabled={outOfStock}
          onClick={() => {
            addToCart(buildItem());
            router.push('/checkout');
          }}
          className="btn-outline flex-1"
        >
          Buy Now
        </button>
        <button
          disabled={wishBusy}
          onClick={toggleWish}
          className={`flex h-12 w-12 items-center justify-center rounded-full border text-lg transition ${wish ? 'border-gold bg-gold text-white' : 'border-espresso/15 text-espresso hover:border-gold hover:text-gold'}`}
          aria-label="Wishlist"
          title={wish ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {wish ? '♥' : '♡'}
        </button>
      </div>

      {/* Trust strip */}
      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-cream/70 p-4 text-center text-[11px] font-semibold text-mocha">
        <span>🚚 Same-day Delhi delivery</span>
        <span>❄️ Freshness-sealed packing</span>
        <span>↩️ Quality-guaranteed</span>
      </div>
    </div>
  );
}
