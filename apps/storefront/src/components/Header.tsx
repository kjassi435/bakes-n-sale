'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';

const NAV = [
  { label: 'Biscuits', href: '/shop?category=biscuits' },
  { label: 'Cookies', href: '/shop?category=cookies' },
  { label: 'Rusks & Toasts', href: '/shop?category=rusks-toasts' },
  { label: 'Regional', href: '/shop?category=regional-specialties' },
  { label: 'Dry Cakes', href: '/shop?category=dry-cakes-muffins' },
  { label: 'Soft Bakery', href: '/shop?category=soft-bakery' },
  { label: 'Savory', href: '/shop?category=savory-snacks' },
  { label: 'Gifts', href: '/shop?category=gift-hampers' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

const DEFAULT_ANNOUNCEMENTS = [
  'Free delivery across Delhi on orders above ₹999',
  'Baked fresh every morning — orders before 2 PM ship same day',
  'Use code WELCOME10 for 10% off your first order',
];

export default function Header() {
  const { user, cartCount, logout } = useStore();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [announce, setAnnounce] = useState(0);
  const [announcements, setAnnouncements] = useState<string[]>(DEFAULT_ANNOUNCEMENTS);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'}/settings`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (s?.header?.announcements && Array.isArray(s.header.announcements) && s.header.announcements.length) {
          setAnnouncements(s.header.announcements);
          setAnnounce(0);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setInterval(() => setAnnounce((a) => (a + 1) % announcements.length), 4000);
    return () => clearInterval(t);
  }, [announcements.length]);

  const submitSearch = () => {
    if (search.trim()) {
      router.push(`/shop?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
      setMobileOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-espresso px-4 py-2 text-center text-[11px] font-medium tracking-[0.18em] text-goldsoft uppercase">
        {announcements[announce % announcements.length]}
      </div>

      <div className="border-b border-espresso/8 bg-ivory/90 backdrop-blur-md">
        <div className="flex h-[72px] w-full items-center justify-between gap-2 px-3 xl:px-6">
          <button
            className="rounded-lg p-2 hover:bg-cream lg:hidden shrink-0"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              {mobileOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>

          <Link href="/" className="group flex shrink-0 items-center gap-3">
            <img
              src="/logo.jpeg"
              alt="Bakes n Sale"
              className="h-11 w-11 rounded-full border border-gold/50 object-cover shadow-sm"
            />
            <span className="hidden leading-tight sm:block">
              <span className="block whitespace-nowrap font-display text-[18px] font-semibold tracking-tight text-espresso xl:text-[20px]">
                Bakes n Sale
              </span>
              <span className="block whitespace-nowrap text-[8px] font-bold tracking-[0.28em] text-mocha uppercase xl:text-[9px] xl:tracking-[0.34em]">
                Artisan Bakery · Est. 1998
              </span>
            </span>
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-2 xl:gap-3 2xl:gap-4 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.label}
                href={n.href}
                className="shrink-0 whitespace-nowrap text-[11px] font-semibold tracking-wide text-cocoa transition hover:text-gold xl:text-[12px] 2xl:text-[13px]"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 xl:gap-2">
            <div className="relative hidden md:block">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
                placeholder="Search bakes…"
                className="w-28 rounded-full border border-espresso/12 bg-white/70 py-2 pr-3 pl-8 text-xs outline-none transition focus:w-36 focus:border-gold xl:w-36 xl:pr-4 xl:pl-9 xl:focus:w-44 2xl:w-44 2xl:focus:w-52"
              />
              <svg
                className="absolute top-1/2 left-3 -translate-y-1/2 text-mocha"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </div>

            <div className="relative">
              <button
                onClick={() => (user ? setAccountOpen((o) => !o) : router.push('/login'))}
                className="rounded-full p-2.5 transition hover:bg-cream"
                aria-label="Account"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
                </svg>
              </button>
              {accountOpen && user && (
                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-espresso/10 bg-white shadow-xl">
                  <div className="border-b border-espresso/8 px-4 py-3">
                    <p className="text-sm font-semibold">{user.name}</p>
                    <p className="text-xs text-mocha">✦ {user.loyaltyPoints} loyalty points</p>
                  </div>
                  <Link href="/account" onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-cream">
                    My Account
                  </Link>
                  <Link href="/account?tab=orders" onClick={() => setAccountOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-cream">
                    My Orders
                  </Link>
                  <button
                    onClick={async () => {
                      setAccountOpen(false);
                      await logout();
                      router.push('/');
                    }}
                    className="block w-full px-4 py-2.5 text-left text-sm text-mocha hover:bg-cream"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>

            <Link href="/cart" className="relative rounded-full p-2.5 transition hover:bg-cream" aria-label="Cart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M6 7h12l1.5 13.5a1 1 0 0 1-1 1.1H5.5a1 1 0 0 1-1-1.1L6 7Z" />
                <path d="M9 10V6a3 3 0 0 1 6 0v4" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-espresso/8 bg-ivory px-6 py-4 lg:hidden">
            <div className="mb-3 flex gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
                placeholder="Search bakes…"
                className="input-lux"
              />
            </div>
            {NAV.map((n) => (
              <Link
                key={n.label}
                href={n.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2.5 text-sm font-semibold text-cocoa"
              >
                {n.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
