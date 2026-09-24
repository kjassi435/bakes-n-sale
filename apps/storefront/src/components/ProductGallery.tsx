'use client';

import { useRef, useState } from 'react';
import { normalizeImageUrl } from '@/lib/site';

const FALLBACK = '/images/products/detail.svg';

/**
 * WooCommerce-style product gallery:
 * - Full image always visible (never cropped) on a clean white stage.
 * - Hover (cursor-following) zoom like WooCommerce/WordPress.
 * - Clickable thumbnails; hidden entirely when there is only one image.
 */
export default function ProductGallery({
  images,
  name,
  basePrice,
  compareAtPrice,
}: {
  images?: string[];
  name: string;
  basePrice: number;
  compareAtPrice?: number | null;
}) {
  const list = (images?.length ? images : [FALLBACK]).map((u) => normalizeImageUrl(u) || FALLBACK);
  const [active, setActive] = useState(0);
  const [zooming, setZooming] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  const stageRef = useRef<HTMLDivElement>(null);

  const current = list[Math.min(active, list.length - 1)];
  const discount =
    compareAtPrice && compareAtPrice > basePrice
      ? Math.round((1 - basePrice / compareAtPrice) * 100)
      : 0;

  const onMove = (e: React.MouseEvent) => {
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return;
    const x = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100));
    setOrigin(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
  };

  return (
    <div>
      {/* Main stage — full image, hover to magnify */}
      <div
        ref={stageRef}
        onMouseEnter={() => setZooming(true)}
        onMouseLeave={() => setZooming(false)}
        onMouseMove={onMove}
        className="card-lux group relative cursor-zoom-in overflow-hidden bg-white"
      >
        <div className="aspect-square w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={current}
            src={current}
            alt={name}
            className="h-full w-full object-contain transition-transform duration-300 ease-out"
            style={{ transformOrigin: origin, transform: zooming ? 'scale(1.9)' : 'scale(1)' }}
          />
        </div>
        {discount > 0 && (
          <span className="absolute top-4 left-4 rounded-full bg-gold px-3 py-1 text-xs font-bold text-white shadow">
            −{discount}%
          </span>
        )}
        {list.length > 1 && (
          <span className="absolute right-4 bottom-4 rounded-full bg-espresso/70 px-2.5 py-1 text-[11px] font-bold text-ivory">
            {Math.min(active, list.length - 1) + 1} / {list.length}
          </span>
        )}
        <span className="pointer-events-none absolute bottom-4 left-4 hidden rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-mocha opacity-0 shadow transition group-hover:opacity-100">
          🔍 Hover to zoom
        </span>
      </div>

      {/* Thumbnails — only when a gallery exists */}
      {list.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3">
          {list.map((img, i) => (
            <button
              key={`${img}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={`overflow-hidden rounded-xl border-2 bg-white transition ${
                i === active
                  ? 'border-gold shadow-[0_2px_12px_rgba(184,134,11,0.35)]'
                  : 'border-espresso/10 opacity-70 hover:border-gold/50 hover:opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`${name} ${i + 1}`} className="aspect-square w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
