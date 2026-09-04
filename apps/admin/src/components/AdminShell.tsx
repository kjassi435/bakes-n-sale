'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, getToken, setToken } from '@/lib/api';

const NAV = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/orders', label: 'Orders', icon: '📦' },
  { href: '/products', label: 'Products', icon: '🧁' },
  { href: '/content', label: 'Site Content', icon: '🎨' },
  { href: '/coupons', label: 'Coupons', icon: '🎟️' },
  { href: '/customers', label: 'Customers', icon: '👥' },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      if (!getToken()) {
        router.replace('/login');
        return;
      }
      try {
        const me = await api('/auth/me');
        if (me.role === 'CUSTOMER') {
          setToken(null);
          router.replace('/login');
          return;
        }
        setUser(me);
      } catch {
        // try refresh
        try {
          const r = await api('/auth/refresh', { method: 'POST' });
          setToken(r.accessToken);
          setUser(r.user);
        } catch {
          setToken(null);
          router.replace('/login');
        }
      } finally {
        setReady(true);
      }
    })();
  }, [router]);

  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    setToken(null);
    localStorage.removeItem('go_admin_user');
    router.replace('/login');
  };

  if (!ready) return <div className="flex min-h-screen items-center justify-center text-mocha">Loading back office…</div>;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-espresso text-cream">
        <div className="flex items-center gap-3 px-6 py-6">
          <img src="/logo.jpeg" alt="Bakes n Sale" className="h-10 w-10 rounded-full border border-gold/60 object-cover" />
          <div>
            <p className="font-display text-lg font-semibold leading-tight">Bakes n Sale</p>
            <p className="text-[9px] font-bold tracking-[0.3em] text-cream/50 uppercase">Back Office</p>
          </div>
        </div>
        <nav className="mt-2 flex-1 space-y-1 px-3">
          {NAV.map((n) => {
            const active = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${active ? 'bg-gold/20 text-goldlight' : 'text-cream/70 hover:bg-cream/5 hover:text-cream'}`}
              >
                <span>{n.icon}</span> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-cream/10 p-4">
          <a href={process.env.NEXT_PUBLIC_STOREFRONT_URL ?? 'http://localhost:3002'} target="_blank" rel="noreferrer" className="block rounded-lg px-4 py-2 text-xs font-semibold text-cream/60 hover:text-goldlight">
            ↗ View Storefront
          </a>
          {user && (
            <div className="mt-2 flex items-center justify-between rounded-lg bg-cream/5 px-4 py-3">
              <div>
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-[10px] tracking-wider text-goldlight uppercase">{user.role}</p>
              </div>
              <button onClick={logout} className="text-xs text-cream/60 underline hover:text-goldlight">Exit</button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 p-8">{children}</main>
    </div>
  );
}
