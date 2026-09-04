'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ORDER_FLOW, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, formatINR } from '@bakery/shared';
import { api } from '@/lib/api';

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api(`/admin/orders/${id}`).then(setOrder).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [id]); // eslint-disable-line

  const advance = async (status: string) => {
    setBusy(true);
    try {
      const updated = await api(`/admin/orders/${id}/status`, { method: 'PATCH', body: { status } });
      setOrder(updated);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (error && !order) return <p className="text-red-700">{error}</p>;
  if (!order) return <p className="text-mocha">Loading order…</p>;

  const flowIdx = ORDER_FLOW.indexOf(order.status);
  const nextStatus = flowIdx >= 0 && flowIdx < ORDER_FLOW.length - 1 ? ORDER_FLOW[flowIdx + 1] : null;
  const canCancel = !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status);

  return (
    <div>
      <Link href="/orders" className="text-sm font-semibold text-gold hover:underline">← All orders</Link>
      <div className="mt-3 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">{order.orderNumber}</h1>
          <p className="text-sm text-mocha">
            {new Date(order.createdAt).toLocaleString('en-IN')} · {PAYMENT_METHOD_LABELS[order.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] ?? order.paymentMethod} · Payment: {order.paymentStatus}
          </p>
        </div>
        <div className="flex gap-2">
          {nextStatus && (
            <button disabled={busy} onClick={() => advance(nextStatus)} className="btn-adm">
              Move to: {ORDER_STATUS_LABELS[nextStatus]} →
            </button>
          )}
          {canCancel && (
            <button disabled={busy} onClick={() => window.confirm('Cancel this order? Stock will be restored.') && advance('CANCELLED')} className="btn-adm-outline !border-red-300 !text-red-700 hover:!border-red-500">
              Cancel Order
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="card-adm overflow-hidden">
            <h2 className="px-6 pt-5 pb-2 font-display text-lg font-semibold">Items</h2>
            <table className="w-full">
              <thead className="border-y border-espresso/6 bg-cream/50">
                <tr><th className="th-adm">Product</th><th className="th-adm">Variant</th><th className="th-adm">Qty</th><th className="th-adm text-right">Unit</th><th className="th-adm text-right">Total</th></tr>
              </thead>
              <tbody>
                {order.items.map((it: any) => (
                  <tr key={it.id} className="border-b border-espresso/5 last:border-0">
                    <td className="td-adm font-semibold">{it.productName}</td>
                    <td className="td-adm">{it.variantName ?? '—'}</td>
                    <td className="td-adm">{it.quantity}</td>
                    <td className="td-adm text-right">{formatINR(it.unitPrice)}</td>
                    <td className="td-adm text-right font-semibold">{formatINR(it.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="space-y-1.5 border-t border-espresso/6 p-6 text-sm">
              <div className="flex justify-between"><span className="text-mocha">Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-gold"><span>Discount ({order.couponCode})</span><span>− {formatINR(order.discount)}</span></div>}
              <div className="flex justify-between"><span className="text-mocha">Delivery</span><span>{order.deliveryFee === 0 ? 'FREE' : formatINR(order.deliveryFee)}</span></div>
              <div className="flex justify-between"><span className="text-mocha">GST</span><span>{formatINR(order.tax)}</span></div>
              <div className="flex justify-between pt-2 font-display text-lg font-semibold"><span>Total</span><span>{formatINR(order.total)}</span></div>
            </div>
          </div>
          <div className="card-adm p-6">
            <h2 className="font-display text-lg font-semibold">Status History</h2>
            <div className="mt-4 space-y-4">
              {[...(order.history ?? [])].reverse().map((h: any) => (
                <div key={h.id} className="flex gap-3">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-gold" />
                  <div>
                    <p className="text-sm font-bold">{ORDER_STATUS_LABELS[h.status as keyof typeof ORDER_STATUS_LABELS] ?? h.status}</p>
                    {h.note && <p className="text-xs text-mocha">{h.note}</p>}
                    <p className="text-[11px] text-mocha/70">{new Date(h.createdAt).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="card-adm p-6">
            <h2 className="font-display text-lg font-semibold">Customer</h2>
            {order.user ? (
              <p className="mt-2 text-sm leading-relaxed text-mocha">
                <b className="text-espresso">{order.user.name}</b><br />
                {order.user.email}<br />
                {order.user.phone ?? 'No phone on file'}
              </p>
            ) : (
              <p className="mt-2 text-sm text-mocha">Guest checkout</p>
            )}
          </div>
          <div className="card-adm p-6">
            <h2 className="font-display text-lg font-semibold">Delivery</h2>
            {order.address && (
              <p className="mt-2 text-sm leading-relaxed text-mocha">
                <b className="text-espresso">{order.address.fullName}</b> ({order.address.label})<br />
                {order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}<br />
                {order.address.city}, {order.address.state} — {order.address.pincode}<br />
                {order.address.phone}
              </p>
            )}
            <p className="mt-3 rounded-lg bg-cream p-3 text-xs text-mocha">
              📅 {order.deliveryDate} · {order.deliverySlot}
            </p>
            {order.notes && <p className="mt-2 rounded-lg bg-goldsoft/40 p-3 text-xs">📝 Customer note: {order.notes}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
