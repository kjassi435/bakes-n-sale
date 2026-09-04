import { API_URL } from './api';

/** All CMS settings as key -> value (never throws; returns {} offline). */
export async function getSiteSettings(): Promise<Record<string, any>> {
  try {
    const res = await fetch(`${API_URL}/settings`, { cache: 'no-store' });
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

/** Fetch published products by slug list, preserving the requested order. */
export async function getProductsBySlugs(slugs: string[]): Promise<any[]> {
  const clean = [...new Set((slugs || []).filter(Boolean))];
  if (!clean.length) return [];
  try {
    const res = await fetch(
      `${API_URL}/products?slugs=${encodeURIComponent(clean.join(','))}&limit=48`,
      { cache: 'no-store' },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

/** Shape a product into a hero CircularGallery item. */
export function productToGalleryItem(p: any) {
  return {
    common: p.name,
    binomial: p.shortDescription ?? p.category?.name ?? 'Bakes n Sale',
    productSlug: p.slug,
    photo: {
      url: p.images?.[0] ?? '/images/bakes/bakes-01.jpeg',
      text: p.name,
      pos: 'center',
      by: 'Bakes n Sale',
    },
  };
}
