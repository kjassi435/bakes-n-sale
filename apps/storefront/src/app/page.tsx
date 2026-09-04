import Link from 'next/link';
import { API_URL } from '@/lib/api';
import { getSiteSettings, getProductsBySlugs, productToGalleryItem } from '@/lib/site';
import Hero from '@/components/Hero';
import NewsletterForm from '@/components/NewsletterForm';
import ProductCard from '@/components/ProductCard';
import SectionHeading from '@/components/SectionHeading';

async function getHome() {
  try {
    const res = await fetch(`${API_URL}/products/home`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const AVATAR_COLORS = ['#e8710a', '#d93025', '#188038', '#8b5cf6', '#0b8043'];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const FEATURES = [
  { icon: '🌾', title: 'Finest Ingredients', text: 'Single-origin cocoa, Kashmiri saffron, pure ghee — never any shortcuts or premixes.' },
  { icon: '👩‍🍳', title: 'Master Bakers', text: 'Three generations of bakers refining heirloom recipes since 1998.' },
  { icon: '🛵', title: 'Same-Day Delivery', text: 'Order before 2 PM and receive your bakes fresh the very same evening across Delhi.' },
  { icon: '🎀', title: 'Gift-Ready Packaging', text: 'Every order arrives in elegant, keepsake-worthy packaging with a hand-written note.' },
];

const GOOGLE_G = (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-label="Google">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const GOOGLE_REVIEWS = [
  { quote: 'The truffle cake was the centrepiece of our anniversary. Rich, elegant, and not overly sweet — exactly as a premium cake should be.', name: 'Ritika & Aman', initials: 'RA', time: '2 weeks ago', color: '#e8710a' },
  { quote: 'I send Bakes n Sale hampers to all our clients every Diwali. The packaging alone earns compliments; the taste keeps them calling back.', name: 'Sunita Malhotra', initials: 'SM', time: 'a month ago', color: '#d93025' },
  { quote: 'Their kesar rusk with evening chai has become a ritual in our home. You can taste the real saffron — nothing artificial.', name: 'Rajesh Khanna', initials: 'RK', time: '3 months ago', color: '#188038' },
];

export default async function HomePage() {
  const [data, settings] = await Promise.all([getHome(), getSiteSettings()]);

  // --- CMS-driven sections (admin editable, with safe fallbacks) ---
  const heroSlugs: string[] = Array.isArray(settings.hero_slides) ? settings.hero_slides : [];
  const heroProducts = heroSlugs.length ? await getProductsBySlugs(heroSlugs) : [];
  const heroItems = heroProducts.length ? heroProducts.map(productToGalleryItem) : undefined;

  const freshSlugs: string[] = Array.isArray(settings.home_fresh) ? settings.home_fresh : [];
  const freshProducts = freshSlugs.length ? await getProductsBySlugs(freshSlugs) : [];
  const fresh = freshProducts.length ? freshProducts : (data?.fresh ?? []);

  const chefSlugs: string[] = Array.isArray(settings.home_chef) ? settings.home_chef : [];
  const chefProducts = chefSlugs.length ? await getProductsBySlugs(chefSlugs) : [];
  const chefSpecials = chefProducts.length ? chefProducts : (data?.chefSpecials ?? []);

  const festiveCfg = settings.home_festive ?? {};
  const festiveSlugs: string[] = Array.isArray(festiveCfg.slugs) ? festiveCfg.slugs : [];
  const festiveProducts = festiveSlugs.length ? await getProductsBySlugs(festiveSlugs) : [];
  const festive = festiveProducts.length ? festiveProducts : (data?.festive ?? []);
  const festiveTitle: string = festiveCfg.title || 'Festive Gift Boxes';
  const festiveSubtitle: string =
    festiveCfg.subtitle || 'Keepsake boxes for Diwali, Christmas and weddings — curated, wrapped and delivered with love.';

  const catOverrides: Record<string, any> = settings.home_categories ?? {};
  const categories = (data?.categories ?? []).map((c: any) => ({
    ...c,
    name: catOverrides[c.slug]?.title || c.name,
    image: catOverrides[c.slug]?.image || c.image,
  }));

  const reviews = (Array.isArray(settings.home_reviews) && settings.home_reviews.length
    ? settings.home_reviews
    : GOOGLE_REVIEWS
  ).map((t: any, i: number) => ({
    quote: t.text ?? t.quote,
    name: t.name,
    time: t.time ?? '',
    initials: initialsOf(t.name ?? '?'),
    color: AVATAR_COLORS[i % AVATAR_COLORS.length],
  }));

  return (
    <div>
      <Hero items={heroItems} />

      {categories?.length > 0 && (
        <section className="container-x py-16">
          <p className="eyebrow text-center">The Collection</p>
          <h2 className="mt-3 text-center font-display text-3xl font-semibold sm:text-4xl">Shop by Category</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-mocha">Eight signature collections — from Usmania Biscuit to festive hampers, baked fresh daily.</p>
          <div className="mt-8 flex flex-nowrap items-start justify-start gap-5 overflow-x-auto pb-3 pt-1 sm:gap-7 lg:justify-between lg:gap-4 lg:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.slice(0, 8).map((c: any) => (
              <Link
                key={c.id}
                href={`/shop?category=${c.slug}`}
                className="group flex w-[88px] shrink-0 flex-col items-center gap-2.5 sm:w-[104px] lg:w-[112px]"
              >
                <span className="h-[72px] w-[72px] overflow-hidden rounded-full border-2 border-gold/40 shadow-[0_4px_16px_rgba(57,15,16,0.12)] transition-transform duration-300 group-hover:scale-105 group-hover:border-gold sm:h-20 sm:w-20 lg:h-[88px] lg:w-[88px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image} alt={c.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                </span>
                <span className="flex min-h-[36px] items-start justify-center text-center">
                  <h3 className="text-[12px] font-bold leading-tight text-espresso sm:text-[13px]">{c.name}</h3>
                </span>
                <span className="-mt-1 text-[11px] font-semibold text-gold">{c.productCount > 0 ? `${c.productCount} items` : 'Coming soon'}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {fresh?.length > 0 && (
        <section className="container-x py-14">
          <SectionHeading eyebrow="Just Baked" title="Fresh from the Oven" subtitle="This morning's batch — small quantities, baked to order, gone by evening." />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {fresh.slice(0, 4).map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section className="container-x py-14">
        <div className="relative overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-br from-goldsoft via-cream to-blush px-8 py-14 text-center shadow-[0_8px_40px_rgba(212,165,116,0.18)] sm:px-16">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[38rem] -translate-x-1/2 rounded-full bg-gradient-to-b from-white/70 to-transparent blur-2xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/4 h-56 w-96 rounded-full bg-goldlight/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 right-1/4 h-56 w-96 rounded-full bg-gold/15 blur-3xl" />
          <p className="eyebrow relative">Bespoke Creations</p>
          <h2 className="relative mx-auto mt-4 max-w-2xl font-display text-3xl font-semibold text-espresso sm:text-4xl">
            Dreaming of a cake that&apos;s entirely yours?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-sm leading-relaxed text-mocha">
            Tell us your occasion, theme and flavour — our master bakers will sketch, bake and deliver a
            one-of-a-kind centrepiece for your celebration.
          </p>
          <a href="tel:+911140001234" className="btn-gold relative mt-8">
            Call to Customise · +91 11 4000 1234
          </a>
        </div>
      </section>

      {chefSpecials?.length > 0 && (
        <section className="container-x py-14">
          <SectionHeading eyebrow="Curated by Chef Meera" title="Chef's Specials" subtitle="The bakes our kitchen is most proud of — limited batches, unlimited pride." />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {chefSpecials.slice(0, 4).map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {festive?.length > 0 && (
        <section className="bg-cream py-16">
          <div className="container-x">
            <SectionHeading eyebrow="Season of Giving" title={festiveTitle} subtitle={festiveSubtitle} />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {festive.slice(0, 4).map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="container-x py-16">
        <SectionHeading eyebrow="The Bakes n Sale Promise" title="Why Delhi Trusts Our Oven" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card-lux p-7 text-center">
              <span className="text-4xl">{f.icon}</span>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mocha">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-espresso py-16">
        <div className="container-x">
          <div className="mb-10 text-center">
            <div className="flex items-center justify-center gap-2">
              {GOOGLE_G}
              <p className="text-sm font-semibold text-cream/80">Google Reviews</p>
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold text-ivory sm:text-4xl">From Our Patrons</h2>
            <div className="mt-2 flex items-center justify-center gap-1.5">
              <span className="text-lg font-bold text-ivory">4.9</span>
              <span className="flex gap-0.5 text-[#FBBC05]">★★★★★</span>
              <span className="text-xs text-cream/60">Based on Google reviews</span>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {reviews.map((t: any) => (
              <figure key={t.name} className="flex flex-col rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: t.color }}
                    >
                      {t.initials}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{t.name}</span>
                      <span className="block text-xs text-slate-500">{t.time}</span>
                    </span>
                  </div>
                  {GOOGLE_G}
                </div>
                <div className="mt-3 flex gap-0.5 text-[#FBBC05] text-base">★★★★★</div>
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">“{t.quote}”</blockquote>
                <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">
                  <span className="flex h-5 w-5 items-center justify-center">{GOOGLE_G}</span>
                  <span className="text-xs text-slate-500">Google Review</span>
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="story" className="container-x grid items-center gap-12 py-20 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Our Story</p>
          <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Three generations, one oven</h2>
          <p className="mt-5 text-sm leading-relaxed text-mocha">
            It began in 1998 with a single deck oven and a recipe for kesar rusk that our founder carried
            from her grandmother&apos;s kitchen in Old Delhi. Today, Bakes n Sale bakes over forty treasured
            recipes every morning — still by hand, still in small batches, still with the same belief:
            that a great bake is an act of love.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-mocha">
            Every egg is free-range, every spice ground in-house, and every box packed as if it were for
            our own family. Because to us, it is.
          </p>
          <Link href="/shop" className="btn-outline mt-8">Explore the Collection</Link>
        </div>
        <div className="card-lux p-10 text-center">
          <span className="text-5xl">💌</span>
          <h3 className="mt-4 font-display text-2xl font-semibold">Join the Inner Crust</h3>
          <p className="mt-2 text-sm text-mocha">
            Early access to seasonal bakes, secret recipes and members-only offers. One letter a month,
            always warm.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </div>
  );
}
