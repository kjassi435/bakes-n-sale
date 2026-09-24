import { API_URL } from './api';

/** Convert Google Drive share links (/file/d/.../view etc.) to direct image URLs. */
export function normalizeImageUrl(raw?: string | null): string {
  const s = (raw || '').trim();
  if (!s) return '';
  if (/drive\.google\.com\/thumbnail\?/i.test(s)) return s;
  if (/^https:\/\/lh3\.googleusercontent\.com\/d\//i.test(s)) return s;
  if (!/drive\.google\.com|docs\.google\.com/i.test(s)) return s;
  const m =
    s.match(/drive\.google\.com\/(?:drive\/u\/\d+\/)?file\/d\/([A-Za-z0-9_-]+)/) ||
    s.match(/drive\.google\.com\/open\?.*?\bid=([A-Za-z0-9_-]+)/) ||
    s.match(/drive\.google\.com\/uc\?.*?\bid=([A-Za-z0-9_-]+)/) ||
    s.match(/docs\.google\.com\/uc\?.*?\bid=([A-Za-z0-9_-]+)/) ||
    s.match(/[?&]id=([A-Za-z0-9_-]{10,})/);
  if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1000`;
  return s;
}

/** Resolve any stored image ref (Drive link, absolute URL, /images/... path) to a viewable URL. */
export function resolveImg(u?: string | null, fallback = ''): string {
  if (!u) return fallback;
  return normalizeImageUrl(u) || fallback;
}

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
      url: resolveImg(p.images?.[0], '/images/bakes/bakes-01.jpeg'),
      text: p.name,
      pos: 'center',
      by: 'Bakes n Sale',
    },
  };
}
