'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DIETARY_TAGS } from '@bakery/shared';
import { api } from '@/lib/api';
import ProductCard from './ProductCard';

const SORTS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

export default function ShopClient() {
  const params = useSearchParams();
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = params.get('category') ?? '';
  const q = params.get('q') ?? '';
  const sort = params.get('sort') ?? 'newest';
  const page = Number(params.get('page') ?? 1);

  useEffect(() => {
    api('/categories').then(setCategories).catch(() => {});
  }, []);

  const buildQuery = useCallback(() => {
    const sp = new URLSearchParams();
    if (category) sp.set('category', category);
    if (q) sp.set('search', q);
    if (sort !== 'newest') sp.set('sort', sort);
    if (page > 1) sp.set('page', String(page));
    if (minPrice) sp.set('minPrice', minPrice);
    if (maxPrice) sp.set('maxPrice', maxPrice);
    for (const t of tags) sp.append('tag', t);
    return sp.toString();
  }, [category, q, sort, page, minPrice, maxPrice, tags]);

  useEffect(() => {
    setLoading(true);
    api(`/products?${buildQuery()}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [buildQuery]);

  const navigate = (patch: Record<string, string | null>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === '') sp.delete(k);
      else sp.set(k, v);
    }
    if (!('page' in patch)) sp.delete('page');
    router.replace(`/shop${sp.toString() ? `?${sp}` : ''}`);
  };

  const toggleTag = (t: string) => {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const activeCat = (() => {
    let found = categories.find((c: any) => c.slug === category);
    if (found) return found;
    for (const c of categories) {
      const sub = (c.children || []).find((s: any) => s.slug === category);
      if (sub) return sub;
    }
    return null;
  })();
  const parentForSubs = (() => {
    let parent = categories.find((c: any) => c.slug === category);
    if (parent && parent.children?.length) return parent;
    for (const c of categories) {
      if ((c.children || []).some((s: any) => s.slug === category)) return c;
    }
    return null;
  })();

  return (
    <div className="container-x py-10">
      <div className="mb-8">
        <p className="eyebrow">The Collection</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">
          {q ? `Results for “${q}”` : activeCat ? activeCat.name : 'Shop All Bakes'}
        </h1>
        {activeCat?.description && <p className="mt-2 max-w-2xl text-sm text-mocha">{activeCat.description}</p>}
        {parentForSubs && parentForSubs.children?.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-4 text-xs font-bold tracking-[0.2em] text-mocha uppercase">Explore {parentForSubs.name}</h2>
            <div className={`flex flex-nowrap items-start pb-3 pt-1 ${parentForSubs.children.length > 8 ? 'justify-between gap-2 overflow-visible sm:gap-3' : 'gap-5 overflow-x-auto sm:gap-7 lg:gap-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'}`}>
              {parentForSubs.children.map((sub: any, idx: number) => {
                const CIRCLE_COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f97316', '#f59e0b', '#6366f1', '#14b8a6', '#b45309', '#ec4899', '#8b5cf6'];
                const bg = CIRCLE_COLORS[idx % CIRCLE_COLORS.length];
                const isActive = category === sub.slug;
                const many = parentForSubs.children.length > 8;
                // Shorten long names like "Thekua (sweet biscuit style)" -> "Thekua"
                const shortName = sub.name.includes('(') ? sub.name.split('(')[0].trim() : sub.name;
                return (
                  <button
                    key={sub.id}
                    onClick={() => navigate({ category: sub.slug })}
                    title={sub.name}
                    className={`group flex shrink-0 flex-col items-center gap-2 ${many ? 'w-[72px] sm:w-[84px] lg:w-[88px]' : 'w-[84px] sm:w-[96px]'}`}
                  >
                    <span
                      className={`flex items-center justify-center rounded-full text-white shadow-md transition-transform duration-200 group-hover:scale-105 ${many ? 'h-14 w-14 sm:h-16 sm:w-16' : 'h-16 w-16 sm:h-[72px] sm:w-[72px]'} ${isActive ? 'ring-2 ring-espresso ring-offset-2 ring-offset-cream scale-105' : 'ring-1 ring-black/5'}`}
                      style={{ backgroundColor: bg }}
                    >
                      <svg width={many ? 24 : 28} height={many ? 24 : 28} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5z" />
                        <circle cx="9" cy="10" r="0.8" fill="white" stroke="none" />
                        <circle cx="14.5" cy="14" r="0.8" fill="white" stroke="none" />
                        <circle cx="10" cy="15.5" r="0.8" fill="white" stroke="none" />
                      </svg>
                    </span>
                    <span className={`flex min-h-[34px] items-start justify-center text-center font-semibold leading-tight ${many ? 'text-[11px] sm:text-[12px]' : 'text-[12px] sm:text-[13px]'} ${isActive ? 'text-espresso' : 'text-slate-800'}`} style={{ maxWidth: many ? '88px' : '96px' }}>
                      {shortName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className={`w-full shrink-0 lg:w-64 ${filtersOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="card-lux space-y-7 p-6">
            <div>
              <h3 className="mb-3 text-xs font-bold tracking-[0.2em] text-mocha uppercase">Categories</h3>
              <button
                onClick={() => navigate({ category: null })}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${!category ? 'bg-goldsoft/60 font-semibold text-espresso' : 'text-cocoa hover:bg-cream'}`}
              >
                All Categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate({ category: c.slug })}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${category === c.slug ? 'bg-goldsoft/60 font-semibold text-espresso' : 'text-cocoa hover:bg-cream'}`}
                >
                  {c.name} <span className="text-xs text-mocha">({c.productCount})</span>
                </button>
              ))}
            </div>

            {(() => {
              // Find active main or its parent for sub display
              let activeMain: any = categories.find((c: any) => c.slug === category);
              let subs: any[] = [];
              if (activeMain && activeMain.children?.length) {
                subs = activeMain.children;
              } else {
                // check if category is a subcategory
                for (const c of categories) {
                  const found = (c.children || []).find((s: any) => s.slug === category);
                  if (found) { activeMain = c; subs = c.children; break; }
                }
              }
              if (!subs.length) return null;
              return (
                <div>
                  <h3 className="mb-3 text-xs font-bold tracking-[0.2em] text-mocha uppercase">In {activeMain.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    {subs.map((sub: any) => (
                      <button
                        key={sub.id}
                        onClick={() => navigate({ category: sub.slug })}
                        className={`rounded-full border px-3 py-1.5 text-xs transition ${category === sub.slug ? 'border-gold bg-gold text-white' : 'border-espresso/15 bg-white text-cocoa hover:border-gold'}`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div>
              <h3 className="mb-3 text-xs font-bold tracking-[0.2em] text-mocha uppercase">Price (₹)</h3>
              <div className="flex items-center gap-2">
                <input value={minPrice} onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ''))} placeholder="Min" className="input-lux !py-2 text-xs" />
                <span className="text-mocha">–</span>
                <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ''))} placeholder="Max" className="input-lux !py-2 text-xs" />
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-bold tracking-[0.2em] text-mocha uppercase">Dietary & Occasion</h3>
              <div className="flex flex-wrap gap-2">
                {DIETARY_TAGS.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTag(t)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${tags.includes(t) ? 'border-gold bg-gold text-white' : 'border-espresso/15 text-cocoa hover:border-gold'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setTags([]);
                setMinPrice('');
                setMaxPrice('');
                navigate({ category: null, q: null, sort: null });
              }}
              className="w-full rounded-full border border-espresso/15 py-2 text-xs font-semibold text-mocha hover:border-gold hover:text-gold"
            >
              Clear All Filters
            </button>
          </div>
        </aside>

        <div className="flex-1">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <button onClick={() => setFiltersOpen((o) => !o)} className="btn-outline !px-5 !py-2 text-xs lg:hidden">
              {filtersOpen ? 'Hide Filters' : 'Show Filters'}
            </button>
            <p className="text-sm text-mocha">{data ? `${data.total} items` : ''}</p>
            <select value={sort} onChange={(e) => navigate({ sort: e.target.value })} className="input-lux !w-auto !py-2 text-xs">
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card-lux h-96 animate-pulse bg-cream" />
              ))}
            </div>
          ) : data?.items?.length ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {data.items.map((p: any) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {data.pages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  {Array.from({ length: data.pages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => navigate({ page: String(i + 1) })}
                      className={`h-10 w-10 rounded-full text-sm font-semibold transition ${page === i + 1 ? 'bg-espresso text-ivory' : 'border border-espresso/15 text-cocoa hover:border-gold'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="card-lux py-24 text-center">
              <p className="text-5xl">🧁</p>
              <h3 className="mt-4 font-display text-2xl font-semibold">Nothing in the oven for that search</h3>
              <p className="mt-2 text-sm text-mocha">Try a different keyword or clear your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
