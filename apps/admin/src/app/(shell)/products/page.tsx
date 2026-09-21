'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatINR } from '@bakery/shared';
import { api, imgSrc } from '@/lib/api';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[] | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | 'LIVE' | 'DRAFT'>('ALL');

  const load = (q = '') => {
    api(`/admin/products${q ? `?search=${encodeURIComponent(q)}` : ''}`).then(setProducts).catch(() => setProducts([]));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const remove = async (p: any) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    await api(`/admin/products/${p.id}`, { method: 'DELETE' }).catch(() => {});
    load(search);
  };

  const visible = (products ?? []).filter((p) =>
    status === 'ALL' ? true : status === 'LIVE' ? p.isActive : !p.isActive,
  );
  const draftCount = (products ?? []).filter((p) => !p.isActive).length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold">Products</h1>
        <div className="flex gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(search)}
            placeholder="Search products…"
            className="input-adm !w-56"
          />
          <Link href="/products/new" className="btn-adm">+ New Product</Link>
        </div>
      </div>

      <div className="card-adm overflow-hidden">
        <div className="flex flex-wrap gap-2 border-b border-espresso/6 bg-cream/50 px-4 py-3">
          {(['ALL', 'LIVE', 'DRAFT'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${status === s ? 'bg-espresso text-ivory' : 'border border-espresso/15 bg-white text-cocoa hover:border-gold'}`}
            >
              {s === 'ALL' ? 'All' : s === 'LIVE' ? 'Live' : `Drafts${draftCount ? ` (${draftCount})` : ''}`}
            </button>
          ))}
        </div>
        <table className="w-full">
          <thead className="border-b border-espresso/6 bg-cream/50">
            <tr>
              <th className="th-adm">Product</th>
              <th className="th-adm">Category</th>
              <th className="th-adm text-right">Price</th>
              <th className="th-adm text-right">Stock</th>
              <th className="th-adm">Flags</th>
              <th className="th-adm">Status</th>
              <th className="th-adm text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible?.map((p) => (
              <tr key={p.id} className="border-b border-espresso/5 last:border-0 hover:bg-cream/40">
                <td className="td-adm">
                  <div className="flex items-center gap-3">
                    <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-cream">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgSrc(p.images?.[0])} alt="" className="h-full w-full object-cover" />
                    </span>
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs text-mocha">/{p.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="td-adm text-xs">{p.category?.name ?? '—'}</td>
                <td className="td-adm text-right font-semibold">{formatINR(p.minPrice ?? p.basePrice)}</td>
                <td className="td-adm text-right">{p.stock}</td>
                <td className="td-adm">
                  <div className="flex flex-wrap gap-1">
                    {p.isFeatured && <span className="rounded bg-goldsoft px-1.5 py-0.5 text-[9px] font-bold text-gold uppercase">Featured</span>}
                    {p.isChefSpecial && <span className="rounded bg-espresso px-1.5 py-0.5 text-[9px] font-bold text-goldlight uppercase">Chef</span>}
                    {p.isPreorder && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 uppercase">Pre-order</span>}
                  </div>
                </td>
                <td className="td-adm">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                    {p.isActive ? 'Live' : 'Draft'}
                  </span>
                </td>
                <td className="td-adm text-right">
                  <Link href={`/products/${p.id}/edit`} className="mr-3 text-xs font-bold text-gold hover:underline">Edit</Link>
                  <button onClick={() => remove(p)} className="text-xs font-bold text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {products && visible.length === 0 && (
              <tr><td colSpan={7} className="td-adm py-12 text-center text-mocha">
                {status === 'DRAFT' ? 'No drafts — half-filled forms auto-save here after "Save as Draft".' : 'No products found.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
