import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteSettings } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About Us — Bakes n Sale | Our Story & CEO Mrs. Tanuja',
  description: 'Meet Mrs. Tanuja, the visionary behind Bakes n Sale — heartfelt passion for baking, traditional Indian flavors, long-life bakery products that preserve home baking authenticity. Howrah 711103.',
  openGraph: {
    title: 'About Us — Bakes n Sale',
    description: 'Mrs. Tanuja’s journey from homemade biscuits to Bakes n Sale — bake with honesty, serve with love.',
    images: ['/logo.jpeg'],
    type: 'website',
  },
};

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const a = settings.about ?? {};
  const eyebrow = a.eyebrow || 'Our Story';
  const titleA = a.title || 'About Bakes n Sale';
  const subtitle = a.subtitle || 'Commercial-grade, long-life bakery products that preserve the authenticity of home baking.';
  const ceoHeading = a.ceoHeading || 'About the CEO — Mrs. Tanuja';
  const ceoBody1 = a.ceoBody1 || 'Mrs. Tanuja, the visionary behind Bakes n Sale, brings a heartfelt passion for baking and a deep understanding of traditional Indian flavors.';
  const ceoBody2 = a.ceoBody2 || 'Under her leadership, Bakes n Sale has become a symbol of quality, hygiene, and innovation.';
  const quote = a.quote || 'Bake with honesty, serve with love.';
  const phone = a.phone || '7890027798';
  const email = a.email || 'bakesnsale@gmail.com';
  const address = a.address || '82/7 Shaikh Para Lane, Howrah - 711103';
  return (
    <div className="bg-cream">
      {/* Hero — clean, no background image */}
      <section className="relative overflow-hidden bg-espresso">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-espresso via-cocoa to-espresso" />
          <div className="absolute -top-24 left-1/3 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-64 w-96 rounded-full bg-goldlight/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(212,165,116,0.12),transparent_55%)]" />
        </div>
        <div className="container-x relative py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="eyebrow !text-goldlight">{eyebrow} — Since 1998, Howrah</p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-ivory sm:text-5xl">{titleA}</h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-cream/80 sm:text-base">
              {subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-gold !bg-goldlight !text-espresso hover:!bg-gold">Explore Collection</Link>
              <Link href="/contact" className="rounded-md border border-cream/20 bg-white/10 px-7 py-3 text-sm font-bold text-ivory backdrop-blur hover:bg-white/20">Meet the Founder</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CEO Spotlight — Premium Glass */}
      <section className="container-x -mt-10 relative z-10 pb-16">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="card-lux p-8 sm:p-10">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-full bg-gradient-to-br from-gold to-goldlight p-[1.5px]">
                <span className="flex h-full w-full items-center justify-center rounded-full bg-white text-sm">👑</span>
              </span>
              <div>
                <p className="text-xs font-bold tracking-[0.2em] text-gold uppercase">The Visionary</p>
                <h2 className="font-display text-2xl font-semibold">{ceoHeading}</h2>
              </div>
            </div>
            <div className="gold-divider !mx-0 mt-6" />
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-mocha">
              <p>{ceoBody1}</p>
              <p>{ceoBody2}</p>
            </div>
            <div className="mt-8 rounded-2xl border border-gold/20 bg-gradient-to-br from-goldsoft/40 via-cream to-white p-6 text-center shadow-[0_8px_32px_rgba(212,165,116,0.15)] backdrop-blur">
              <p className="font-display text-xl italic leading-relaxed text-cocoa">“{quote}”</p>
              <p className="mt-3 text-xs font-bold tracking-[0.18em] text-gold uppercase">— Mrs. Tanuja, Founder & CEO</p>
              <div className="mx-auto mt-4 h-px w-12 bg-gold/40" />
              <p className="mt-3 text-xs text-mocha">Her dedication continues to inspire the team to deliver excellence in every pack that reaches your table.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card-lux overflow-hidden p-0">
              <div className="relative h-72 overflow-hidden">
                <img src="/logo.jpeg" alt="Bakes n Sale — Mrs. Tanuja" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-espresso/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
                  <p className="font-display text-lg font-bold text-white">Mrs. Tanuja</p>
                  <p className="text-xs font-bold tracking-widest text-goldlight uppercase">Founder & CEO, Bakes n Sale</p>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-3">
                  <a href={`tel:+91${phone.replace(/\D/g, '').slice(-10)}`} className="group flex flex-col items-center gap-2 rounded-xl border border-espresso/8 bg-cream/60 p-3 transition hover:border-gold/30 hover:bg-goldsoft/30">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-gold/20 text-gold group-hover:scale-110 transition">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 5 12.91 19.79 19.79 0 0 1 1.07 4.3 2 2 0 0 1 3.06 2h3a2 2 0 0 1 2 1.72c.12 1.33.4 2.64.83 3.9a2 2 0 0 1-.57 2.02L7.4 11a16 16 0 0 0 5.6 5.6l1.36-1.32a2 2 0 0 1 2.02-.57c1.26.43 2.57.71 3.9.83A2 2 0 0 1 22 16.92z"/></svg>
                    </span>
                    <span className="text-xs font-bold">Call</span>
                    <span className="text-[11px] text-mocha">{phone}</span>
                  </a>
                  <a href={`mailto:${email}`} className="group flex flex-col items-center gap-2 rounded-xl border border-espresso/8 bg-cream/60 p-3 transition hover:border-gold/30 hover:bg-goldsoft/30">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-gold/20 text-gold group-hover:scale-110 transition">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    </span>
                    <span className="text-xs font-bold">Email</span>
                    <span className="text-[11px] text-mocha">{email.split('@')[0]}</span>
                  </a>
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(address)}`} target="_blank" className="group flex flex-col items-center gap-2 rounded-xl border border-espresso/8 bg-cream/60 p-3 transition hover:border-gold/30 hover:bg-goldsoft/30">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-gold/20 text-gold group-hover:scale-110 transition">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    </span>
                    <span className="text-xs font-bold">Visit</span>
                    <span className="text-[11px] text-mocha">Howrah</span>
                  </a>
                </div>
                <div className="mt-4 rounded-lg bg-espresso px-4 py-3 text-center">
                  <p className="text-xs font-bold tracking-widest text-goldlight uppercase">{address}</p>
                </div>
              </div>
            </div>

            <div className="card-lux p-6">
              <h3 className="font-display text-lg font-semibold">At a Glance</h3>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { v: '40+', k: 'Recipes', c: 'from-amber-600' },
                  { v: '1998', k: 'Since', c: 'from-espresso' },
                  { v: '100%', k: 'Veg', c: 'from-green-600' },
                ].map((s) => (
                  <div key={s.k} className="rounded-xl border border-gold/15 bg-gradient-to-br from-white to-cream p-4 text-center">
                    <p className="font-display text-2xl font-bold text-gold">{s.v}</p>
                    <p className="text-xs font-bold tracking-widest text-mocha uppercase">{s.k}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values — Glass */}
      <section className="container-x py-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { t: 'Quality', d: 'Premium ingredients, FSSAI certified, no shortcuts.', i: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4' },
            { t: 'Hygiene', d: 'Commercial-grade long-life, home-baking authenticity.', i: 'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5' },
            { t: 'Trust', d: 'Bake with honesty, serve with love — every pack.', i: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' },
          ].map((v) => (
            <div key={v.t} className="group relative overflow-hidden rounded-2xl border border-white/40 bg-white/70 p-6 shadow-[0_8px_32px_rgba(58,15,16,0.08)] backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(212,165,116,0.15)]">
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gold/10 blur-2xl" />
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-goldlight text-white shadow-[0_4px_16px_rgba(212,165,116,0.3)]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d={v.i} /></svg>
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">{v.t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-mocha">{v.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-x pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-espresso p-10 text-center">
          <div className="absolute -top-20 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-gold/15 blur-3xl" />
          <h2 className="relative font-display text-3xl font-semibold text-ivory">Taste the Story</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-sm text-cream/70">From Usmania Biscuit to Thekua — every pack carries Mrs. Tanuja’s promise.</p>
          <Link href="/shop" className="btn-gold relative mt-6 !bg-goldlight !text-espresso">Explore Our Bakes</Link>
        </div>
      </section>
    </div>
  );
}
