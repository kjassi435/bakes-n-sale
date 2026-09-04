'use client';

import { useEffect, useState } from 'react';
import { formatINR } from '@bakery/shared';
import { api } from '@/lib/api';

const EMPTY = { code: '', type: 'PERCENT', value: 10, minOrderValue: 0, maxDiscount: null as number | null, usageLimit: null as number | null, expiresAt: '', isActive: true, description: '' };

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[] | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [error, setError] = useState('');

  const load = () => api('/admin/coupons').then(setCoupons).catch(() => setCoupons([]));
  useEffect(() => { load(); }, []); // eslint-disable-line

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api('/admin/coupons', {
        method: 'POST',
        body: {
          ...form,
          value: Number(form.value),
          minOrderValue: Number(form.minOrderValue || 0),
          maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
          expiresAt: form.expiresAt || undefined,
        },
      });
      setForm(EMPTY);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggle = async (c: any) => {
    await api(`/admin/coupons/${c.id}`, {
      method: 'PATCH',
      body: { code: c.code, type: c.type, value: c.value, minOrderValue: c.minOrderValue, maxDiscount: c.maxDiscount, usageLimit: c.usageLimit, expiresAt: c.expiresAt?.slice(0, 10), isActive: !c.isActive, description: c.description },
    }).catch(() => {});
    load();
  };

  const remove = async (c: any) => {
    if (!window.confirm(`Delete coupon ${c.code}?`)) return;
    await api(`/admin/coupons/${c.id}`, { method: 'DELETE' }).catch(() => {});
    load();
  };

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold">Coupons</h1>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="card-adm overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-espresso/6 bg-cream/50">
              <tr>
                <th className="th-adm">Code</th>
                <th className="th-adm">Type</th>
                <th className="th-adm">Value</th>
                <th className="th-adm">Usage</th>
                <th className="th-adm">Status</th>
                <th className="th-adm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons?.map((c) => (
                <tr key={c.id} className="border-b border-espresso/5 last:border-0 hover:bg-cream/40">
                  <td className="td-adm">
                    <p className="font-bold">{c.code}</p>
                    {c.description && <p className="text-xs text-mocha">{c.description}</p>}
                  </td>
                  <td className="td-adm text-xs">{c.type}</td>
                  <td className="td-adm text-xs">
                    {c.type === 'PERCENT' ? `${c.value}%${c.maxDiscount ? ` (max ${formatINR(c.maxDiscount)})` : ''}` : c.type === 'FIXED' ? formatINR(c.value) : 'Free shipping'}
                    {c.minOrderValue > 0 && <p className="text-mocha">min {formatINR(c.minOrderValue)}</p>}
                  </td>
                  <td className="td-adm text-xs">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                  <td className="td-adm">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {c.isActive ? 'Active' : 'Off'}
                    </span>
                  </td>
                  <td className="td-adm text-right">
                    <button onClick={() => toggle(c)} className="mr-3 text-xs font-bold text-gold hover:underline">{c.isActive ? 'Disable' : 'Enable'}</button>
                    <button onClick={() => remove(c)} className="text-xs font-bold text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form onSubmit={create} className="card-adm h-fit space-y-3 p-6">
          <h2 className="font-display text-lg font-semibold">New Coupon</h2>
          <input required placeholder="CODE (e.g. DIWALI15)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input-adm uppercase" />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-adm">
            <option value="PERCENT">Percent off</option>
            <option value="FIXED">Fixed amount off</option>
            <option value="SHIPPING">Free shipping</option>
          </select>
          {form.type !== 'SHIPPING' && (
            <input type="number" min={0} required placeholder={form.type === 'PERCENT' ? 'Percent (e.g. 10)' : 'Amount ₹'} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="input-adm" />
          )}
          <input type="number" min={0} placeholder="Min order value ₹" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} className="input-adm" />
          {form.type === 'PERCENT' && (
            <input type="number" min={0} placeholder="Max discount ₹ (optional)" value={form.maxDiscount ?? ''} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value || null })} className="input-adm" />
          )}
          <input type="number" min={0} placeholder="Usage limit (optional)" value={form.usageLimit ?? ''} onChange={(e) => setForm({ ...form, usageLimit: e.target.value || null })} className="input-adm" />
          <div>
            <label className="mb-1 block text-xs font-bold text-mocha uppercase">Expires (optional)</label>
            <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="input-adm" />
          </div>
          <input placeholder="Description (shown to staff)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-adm" />
          {error && <p className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700">{error}</p>}
          <button className="btn-adm w-full">Create Coupon</button>
        </form>
      </div>
    </div>
  );
}
