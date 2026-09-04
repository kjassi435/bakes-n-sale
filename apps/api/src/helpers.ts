/** Helpers for JSON-in-string columns (SQLite/Postgres portable). */

export function parseArr(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function parseJson<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Normalizes a Prisma product row into the public API shape. */
export function serializeProduct(p: any) {
  const variants = (p.variants ?? [])
    .filter((v: any) => v.isActive)
    .map((v: any) => ({ ...v }));
  const prices = [p.basePrice, ...variants.map((v: any) => v.price)];
  return {
    ...p,
    images: parseArr(p.images),
    tags: parseArr(p.tags),
    allergens: parseArr(p.allergens),
    nutrition: parseJson(p.nutrition, null),
    variants,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    category: p.category ?? null,
    reviews: p.reviews
      ? p.reviews.map((r: any) => ({
          ...r,
          user: r.user ? { name: r.user.name } : null,
        }))
      : undefined,
  };
}

export function serializeOrder(o: any) {
  return {
    ...o,
    address: parseJson(o.addressSnapshot, null),
    user: o.user ? { id: o.user.id, name: o.user.name, email: o.user.email, phone: o.user.phone } : null,
  };
}

export function makeOrderNumber(): string {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `GO-${d}-${Math.floor(1000 + Math.random() * 9000)}`;
}
