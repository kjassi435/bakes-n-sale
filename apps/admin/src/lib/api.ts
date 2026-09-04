export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
export const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? 'http://localhost:3002';

/** Resolve a stored image ref to a viewable URL (local path -> storefront, absolute -> as-is). */
export function imgSrc(u?: string | null): string {
  if (!u) return '';
  const s = u.trim();
  if (/^https?:\/\//i.test(s) || s.startsWith('data:')) return s;
  return `${STOREFRONT_URL}${s.startsWith('/') ? s : `/${s}`}`;
}

/** Convert Google Drive share links to direct-view URLs; pass everything else through. */
export function normalizeImageUrl(raw: string): string {
  const s = (raw || '').trim();
  if (!s) return s;
  if (!/drive\.google\.com/i.test(s)) return s;
  const m =
    s.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/) ||
    s.match(/drive\.google\.com\/open\?id=([A-Za-z0-9_-]+)/) ||
    s.match(/drive\.google\.com\/uc\?.*?\bid=([A-Za-z0-9_-]+)/);
  if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1000`;
  return s;
}
export const TOKEN_KEY = 'go_admin_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api<T = any>(path: string, opts: { method?: string; body?: any } = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: 'no-store',
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const err = await res.json();
      message = err.message ?? message;
      if (Array.isArray(message)) message = message[0];
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json();
}
