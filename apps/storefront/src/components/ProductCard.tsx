'use client';

import Link from 'next/link';
import { formatINR } from '@bakery/shared';
import { useStore } from '@/lib/store';
import RatingStars from './RatingStars';

export default function ProductCard({ product }: { product: any }) {
  const { addToCart } = useStore();
  const hasVariants = product.variants?.length > 0;
  const onSale = product.compareAtPrice != null && product.compareAtPrice > product.basePrice;
  const outOfStock = !product.isPreorder && product.stock <= 0 && !hasVariants;

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({
      productId: product.id,
      variantId: null,
      name: product.name,
      variantName: null,
      image: product.images?.[0] ?? null,
      unitPrice: product.basePrice,
      quantity: 1,
      slug: product.slug,
    });
  };

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group card-lux flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-espresso/8"
    >
      <div className="relative aspect-square overflow-hidden bg-cream">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images?.[0] ?? '/images/products/detail.svg'}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {onSale && (
            <span className="rounded-full bg-gold px-3 py-1 text-[10px] font-bold tracking-wider text-white uppercase">
              Offer
            </span>
          )}
          {product.isChefSpecial && (
            <span className="rounded-full bg-espresso px-3 py-1 text-[10px] font-bold tracking-wider text-goldlight uppercase">
              Chef&apos;s Special
            </span>
          )}
          {outOfStock && (
            <span className="rounded-full bg-mocha px-3 py-1 text-[10px] font-bold tracking-wider text-white uppercase">
              Sold Out
            </span>
          )}
        </div>
        {!hasVariants && !outOfStock && (
          <button
            onClick={quickAdd}
            className="absolute right-3 bottom-3 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-espresso text-ivory opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-gold"
            aria-label="Add to cart"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {product.category && (
          <p className="text-[10px] font-bold tracking-[0.22em] text-mocha uppercase">{product.category.name}</p>
        )}
        <h3 className="font-display text-[17px] leading-snug font-semibold text-espresso">{product.name}</h3>
        {product.shortDescription && (
          <p className="line-clamp-1 text-xs text-mocha">{product.shortDescription}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-bold text-espresso">{formatINR(product.minPrice ?? product.basePrice)}</span>
            {onSale && (
              <span className="text-xs text-mocha line-through">{formatINR(product.compareAtPrice)}</span>
            )}
          </div>
          <RatingStars rating={product.ratingAvg ?? 0} />
        </div>
      </div>
    </Link>
  );
}
