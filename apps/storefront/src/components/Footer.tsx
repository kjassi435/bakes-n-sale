import Link from 'next/link';
import { API_URL } from '@/lib/api';

async function getFooterSettings() {
  try {
    const res = await fetch(`${API_URL}/settings`, { cache: 'no-store' });
    if (!res.ok) return {};
    const s = await res.json();
    return s.footer ?? {};
  } catch {
    return {};
  }
}

export default async function Footer() {
  const f = await getFooterSettings();
  const about = f.about || 'Baking treasured recipes since 1998 — signature cakes, artisan rusk, small-batch cookies and traditional namkeen, made fresh every morning in Delhi.';
  const address = f.address || '82/7 Shaikh Para Lane, Howrah - 711103. Open daily 8 AM – 9 PM';
  const phone = f.phone || '+91 11 4000 1234';
  const phoneHref = `tel:+91${phone.replace(/\D/g, '').slice(-10)}`;
  const email = f.email || 'hello@bakesnsale.com';
  const instagram = f.instagram || '#';
  const facebook = f.facebook || '#';
  const youtube = f.youtube || '#';
  return (
    <footer className="mt-20 bg-espresso text-cream">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="Bakes n Sale" className="h-10 w-10 rounded-full border border-gold/60 object-cover" />
            <span className="font-display text-xl font-semibold">Bakes n Sale</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-cream/70">
            {about}
          </p>
          <div className="mt-5 flex gap-3">
            <a
              href={instagram}
              aria-label="Instagram"
              title="Instagram"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/20 bg-white/5 transition hover:scale-105 hover:border-goldlight"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <defs>
                  <linearGradient id="ig-grad" x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0" stopColor="#FEDA75" />
                    <stop offset="0.5" stopColor="#FA7E1E" />
                    <stop offset="0.8" stopColor="#D62976" />
                    <stop offset="1" stopColor="#962FBF" />
                  </linearGradient>
                </defs>
                <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="none" stroke="url(#ig-grad)" strokeWidth="2" />
                <circle cx="12" cy="12" r="4.2" fill="none" stroke="url(#ig-grad)" strokeWidth="2" />
                <circle cx="17.4" cy="6.6" r="1.4" fill="url(#ig-grad)" />
              </svg>
            </a>
            <a
              href={facebook}
              aria-label="Facebook"
              title="Facebook"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/20 bg-white/5 transition hover:scale-105 hover:border-goldlight"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="12" fill="#1877F2" />
                <path fill="#fff" d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5V11H8.5v3H11v7h2.5z" />
              </svg>
            </a>
            <a
              href={youtube}
              aria-label="YouTube"
              title="YouTube"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/20 bg-white/5 transition hover:scale-105 hover:border-goldlight"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <rect x="1.5" y="5" width="21" height="14" rx="4" fill="#FF0000" />
                <path fill="#fff" d="M10 9.5v5l4.5-2.5L10 9.5z" />
              </svg>
            </a>
          </div>
        </div>

        <div>
          <h4 className="eyebrow mb-4 !text-goldlight">Shop</h4>
          <ul className="space-y-2.5 text-sm text-cream/75">
            <li><Link href="/shop?category=signature-cakes" className="hover:text-goldlight">Signature Cakes</Link></li>
            <li><Link href="/shop?category=artisan-rusk-breads" className="hover:text-goldlight">Artisan Rusk & Breads</Link></li>
            <li><Link href="/shop?category=cookies-biscuits" className="hover:text-goldlight">Cookies & Biscuits</Link></li>
            <li><Link href="/shop?category=namkeen-savouries" className="hover:text-goldlight">Namkeen & Savouries</Link></li>
            <li><Link href="/shop?category=festive-gift-boxes" className="hover:text-goldlight">Festive Gift Boxes</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="eyebrow mb-4 !text-goldlight">Help</h4>
          <ul className="space-y-2.5 text-sm text-cream/75">
            <li><Link href="/account?tab=orders" className="hover:text-goldlight">Track Your Order</Link></li>
            <li><Link href="/shop" className="hover:text-goldlight">Delivery Information</Link></li>
            <li><Link href="/account" className="hover:text-goldlight">My Account</Link></li>
            <li><a href="#" className="hover:text-goldlight">Returns & Refunds</a></li>
            <li><a href="#" className="hover:text-goldlight">Bulk & Corporate Orders</a></li>
          </ul>
        </div>

        <div>
          <h4 className="eyebrow mb-4 !text-goldlight">Visit Us</h4>
          <p className="text-sm leading-relaxed text-cream/75">
            {address}
          </p>
          <p className="mt-3 text-sm text-cream/75">
            <a href={phoneHref} className="hover:text-goldlight">{phone}</a><br />
            <a href={`mailto:${email}`} className="hover:text-goldlight">{email}</a>
          </p>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-xs text-cream/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Bakes n Sale. All rights reserved.</p>
          <p>COD · UPI · Cards &nbsp;·&nbsp; FSSAI Lic. 10012345678901</p>
        </div>
      </div>
    </footer>
  );
}
