'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ORDER_STATUS_LABELS, formatINR } from '@bakery/shared';
import { api } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  PAYMENT_CONFIRMED: 'bg-blue-100 text-blue-700',
  PREPARING: 'bg-purple-100 text-purple-700',
  QUALITY_CHECK: 'bg-indigo-100 text-indigo-700',
  DISPATCHED: 'bg-cyan-100 text-cyan-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-gray-200 text-gray-600',
};

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/admin/dashboard').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-700">{error}</p>;
  if (!data) return <p className="text-mocha">Loading dashboard…</p>;

  const maxRevenue = Math.max(...data.trend.map((t: any) => t.revenue), 1);
  const stats = [
    { label: 'Total Revenue', value: formatINR(data.revenue), sub: `${data.totalOrders} orders all-time` },
    { label: 'Orders Today', value: data.ordersToday, sub: 'across all channels' },
    { label: 'Avg Order Value', value: formatINR(data.aov), sub: 'non-cancelled orders' },
    { label: 'Customers', value: data.customers, sub: 'registered accounts' },
  ];

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Dashboard</h1>
          <p className="text-sm text-mocha">Fresh from the back office — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <Link href="/products/new" className="btn-adm">+ New Product</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card-adm p-6">
            <p className="text-[11px] font-bold tracking-wider text-mocha uppercase">{s.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold">{s.value}</p>
            <p className="mt-1 text-xs text-mocha">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="card-adm p-6">
          <h2 className="font-display text-lg font-semibold">Revenue — last 7 days</h2>
          <div className="mt-6 flex h-48 items-end gap-3">
            {data.trend.map((t: any) => (
              <div key={t.day} className="group flex flex-1 flex-col items-center gap-2">
                <span className="text-[10px] font-bold text-mocha opacity-0 transition group-hover:opacity-100">{formatINR(t.revenue)}</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-gold to-goldlight transition group-hover:from-espresso group-hover:to-cocoa"
                  style={{ height: `${Math.max((t.revenue / maxRevenue) * 100, t.revenue > 0 ? 6 : 2)}%` }}
                />
                <span className="text-[10px] font-bold tracking-wider text-mocha uppercase">{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-adm p-6">
          <h2 className="font-display text-lg font-semibold">Top Sellers</h2>
          <div className="mt-4 space-y-3">
            {data.topProducts.map((t: any, i: number) => (
              <div key={t.name} className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-goldsoft text-xs font-bold text-gold">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold leading-tight">{t.name}</p>
                  <p className="text-xs text-mocha">{t.quantity} sold</p>
                </div>
                <span className="text-sm font-bold">{formatINR(t.revenue)}</span>
              </div>
            ))}
            {data.topProducts.length === 0 && <p className="text-sm text-mocha">No sales yet.</p>}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="card-adm overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <h2 className="font-display text-lg font-semibold">Recent Orders</h2>
            <Link href="/orders" className="text-xs font-bold text-gold hover:underline">View all →</Link>
          </div>
          <table className="w-full">
            <thead className="border-y border-espresso/6 bg-cream/50">
              <tr>
                <th className="th-adm">Order</th>
                <th className="th-adm">Customer</th>
                <th className="th-adm">Status</th>
                <th className="th-adm text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map((o: any) => (
                <tr key={o.id} className="border-b border-espresso/5 last:border-0 hover:bg-cream/40">
                  <td className="td-adm">
                    <Link href={`/orders/${o.id}`} className="font-semibold hover:text-gold">{o.orderNumber}</Link>
                    <p className="text-xs text-mocha">{new Date(o.createdAt).toLocaleDateString('en-IN')}</p>
                  </td>
                  <td className="td-adm">{o.user?.name ?? 'Guest'}</td>
                  <td className="td-adm">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${STATUS_COLORS[o.status] ?? 'bg-gray-100'}`}>
                      {ORDER_STATUS_LABELS[o.status as keyof typeof ORDER_STATUS_LABELS] ?? o.status}
                    </span>
                  </td>
                  <td className="td-adm text-right font-semibold">{formatINR(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card-adm p-6">
          <h2 className="font-display text-lg font-semibold">⚠️ Low Stock Alerts</h2>
          <div className="mt-4 space-y-3">
            {data.lowStock.length === 0 && <p className="text-sm text-mocha">All stock levels are healthy ✦</p>}
            {data.lowStock.map((p: any) => (
              <Link key={p.id} href={`/products/${p.id}/edit`} className="block rounded-lg border border-amber-200 bg-amber-50 p-3 transition hover:border-gold">
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-mocha">
                  {p.variantStocks.length > 0
                    ? p.variantStocks.map((v: any) => `${v.name}: ${v.stock}`).join(' · ')
                    : `Stock: ${p.stock} (threshold ${p.threshold})`}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
