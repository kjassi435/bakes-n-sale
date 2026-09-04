'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ORDER_STATUSES, ORDER_STATUS_LABELS, formatINR } from '@bakery/shared';
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

function OrdersInner() {
  const params = useSearchParams();
  const status = params.get('status') ?? 'ALL';
  const [data, setData] = useState<any>(null);

  const load = (s: string) => {
    api(`/admin/orders?status=${s}`).then(setData).catch(() => {});
  };

  useEffect(() => load(status), [status]);

  const setStatus = (s: string) => {
    const url = s === 'ALL' ? '/orders' : `/orders?status=${s}`;
    window.history.replaceState(null, '', url);
    load(s);
  };

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold">Orders</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {['ALL', ...ORDER_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${status === s ? 'bg-espresso text-ivory' : 'border border-espresso/15 text-cocoa hover:border-gold'}`}
          >
            {s === 'ALL' ? 'All' : ORDER_STATUS_LABELS[s as keyof typeof ORDER_STATUS_LABELS]}
          </button>
        ))}
      </div>

      <div className="card-adm overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-espresso/6 bg-cream/50">
            <tr>
              <th className="th-adm">Order</th>
              <th className="th-adm">Customer</th>
              <th className="th-adm">Items</th>
              <th className="th-adm">Payment</th>
              <th className="th-adm">Status</th>
              <th className="th-adm text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((o: any) => (
              <tr key={o.id} className="border-b border-espresso/5 last:border-0 hover:bg-cream/40">
                <td className="td-adm">
                  <Link href={`/orders/${o.id}`} className="font-semibold hover:text-gold">{o.orderNumber}</Link>
                  <p className="text-xs text-mocha">{new Date(o.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </td>
                <td className="td-adm">
                  {o.user?.name ?? 'Guest'}
                  <p className="text-xs text-mocha">{o.user?.email}</p>
                </td>
                <td className="td-adm">{o.items.length}</td>
                <td className="td-adm text-xs">{o.paymentMethod}<br /><span className="text-mocha">{o.paymentStatus}</span></td>
                <td className="td-adm">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${STATUS_COLORS[o.status] ?? 'bg-gray-100'}`}>
                    {ORDER_STATUS_LABELS[o.status as keyof typeof ORDER_STATUS_LABELS] ?? o.status}
                  </span>
                </td>
                <td className="td-adm text-right font-semibold">{formatINR(o.total)}</td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr><td colSpan={6} className="td-adm py-12 text-center text-mocha">No orders in this view.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<p className="text-mocha">Loading…</p>}>
      <OrdersInner />
    </Suspense>
  );
}
