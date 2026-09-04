'use client';

import { useEffect, useState } from 'react';
import { formatINR } from '@bakery/shared';
import { api } from '@/lib/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[] | null>(null);

  useEffect(() => {
    api('/admin/customers').then(setCustomers).catch(() => setCustomers([]));
  }, []);

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold">Customers</h1>
      <div className="card-adm overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-espresso/6 bg-cream/50">
            <tr>
              <th className="th-adm">Customer</th>
              <th className="th-adm">Phone</th>
              <th className="th-adm">Joined</th>
              <th className="th-adm text-right">Orders</th>
              <th className="th-adm text-right">Lifetime Value</th>
              <th className="th-adm text-right">Loyalty</th>
            </tr>
          </thead>
          <tbody>
            {customers?.map((c) => (
              <tr key={c.id} className="border-b border-espresso/5 last:border-0 hover:bg-cream/40">
                <td className="td-adm">
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-xs text-mocha">{c.email}</p>
                </td>
                <td className="td-adm text-xs">{c.phone ?? '—'}</td>
                <td className="td-adm text-xs">{new Date(c.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</td>
                <td className="td-adm text-right">{c.orderCount}</td>
                <td className="td-adm text-right font-semibold">{formatINR(c.lifetimeValue)}</td>
                <td className="td-adm text-right text-gold">✦ {c.loyaltyPoints}</td>
              </tr>
            ))}
            {customers && customers.length === 0 && (
              <tr><td colSpan={6} className="td-adm py-12 text-center text-mocha">No customers yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
