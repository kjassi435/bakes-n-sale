import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import type { Metadata } from 'next';
import { API_URL } from '@/lib/api';
import AddToCartBox from '@/components/AddToCartBox';
import ReviewsBox from '@/components/ReviewsBox';
import ProductCard from '@/components/ProductCard';
import RatingStars from '@/components/RatingStars';

// Cached per-request: metadata + page share ONE API call instead of two.
const getProduct = cache(async (slug: string) => {
  try {
    const res = await fetch(`${API_URL}/products/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProduct(slug);
  const p = data?.product;
  if (!p) return { title: 'Product Not Found — Bakes n Sale' };
  return {
    title: `${p.name} — Bakes n Sale | ${p.category?.name ?? 'Bakery'}`,
    description: p.shortDescription ?? p.description?.slice(0, 155) ?? 'Premium bakery product by Mrs. Tanuja — Howrah 711103. Bake with honesty, serve with love.',
    openGraph: {
      title: p.name,
      description: p.shortDescription ?? 'Bakes n Sale — Howrah',
      images: p.images?.[0] ? [{ url: p.images[0], alt: p.name }] : [{ url: '/logo.jpeg', alt: 'Bakes n Sale' }],
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: p.name, images: p.images?.[0] ? [p.images[0]] : ['/logo.jpeg'] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) notFound();
  const product = data.product;
  const nutrition = product.nutrition as Record<string, string | number> | null;

  return (
    <div className="container-x py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 text-xs text-mocha">
        <Link href="/" className="hover:text-gold">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/shop" className="hover:text-gold">Shop</Link>
        {product.category && (
          <>
            <span className="mx-2">/</span>
            <Link href={`/shop?category=${product.category.slug}`} className="hover:text-gold">{product.category.name}</Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-espresso">{product.name}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="card-lux overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.images?.[0] ?? '/images/products/detail.svg'} alt={product.name} className="aspect-square w-full object-cover" />
          </div>
          {product.images?.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {product.images.map((img: string, i: number) => (
                <div key={i} className="card-lux overflow-hidden opacity-90">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`${product.name} ${i + 1}`} className="aspect-square w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category && (
            <p className="eyebrow">{product.category.name}</p>
          )}
          <h1 className="mt-2 font-display text-4xl leading-tight font-semibold text-espresso">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <RatingStars rating={product.ratingAvg} count={product.ratingCount} size={16} />
            {product.tags?.slice(0, 3).map((t: string) => (
              <span key={t} className="rounded-full bg-cream px-3 py-1 text-[10px] font-bold tracking-wider text-mocha uppercase">{t}</span>
            ))}
          </div>
          <p className="mt-5 text-[15px] leading-relaxed text-cocoa">{product.shortDescription}</p>

          <div className="my-7 gold-divider !mx-0" />

          <AddToCartBox product={product} />
        </div>
      </div>

      {/* Details accordions */}
      <div className="mt-16 grid gap-6 lg:grid-cols-3">
        <div className="card-lux p-7">
          <h3 className="font-display text-lg font-semibold">The Craft</h3>
          <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-mocha">{product.description}</p>
        </div>
        <div className="card-lux p-7">
          <h3 className="font-display text-lg font-semibold">Nutrition & Allergens</h3>
          {nutrition && (
            <table className="mt-3 w-full text-sm">
              <tbody>
                {Object.entries(nutrition).map(([k, v]) => (
                  <tr key={k} className="border-b border-espresso/6 last:border-0">
                    <td className="py-1.5 text-mocha capitalize">{k}</td>
                    <td className="py-1.5 text-right font-semibold">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {product.allergens?.length > 0 && (
            <p className="mt-3 text-xs text-mocha">
              <span className="font-bold">Contains:</span> {product.allergens.join(', ')}
            </p>
          )}
        </div>
        <div className="card-lux p-7">
          <h3 className="font-display text-lg font-semibold">Delivery & Freshness</h3>
          <ul className="mt-3 space-y-2.5 text-sm text-mocha">
            <li>✦ Same-day delivery across Delhi for orders placed before 2 PM.</li>
            <li>✦ Choose your preferred date & 2-hour slot at checkout.</li>
            <li>✦ Cakes travel in chilled, tamper-proof boxes.</li>
            <li>✦ Best enjoyed within 3 days; store cool and dry.</li>
          </ul>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-16">
        <ReviewsBox product={product} />
      </section>

      {/* Related */}
      {data.related?.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-8 text-center font-display text-3xl font-semibold">Pairs Perfectly With</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {data.related.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
