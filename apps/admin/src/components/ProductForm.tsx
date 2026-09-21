'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ALL_TAGS } from '@bakery/shared';
import { api, imgSrc, normalizeImageUrl } from '@/lib/api';

const EMPTY = {
  name: '', slug: '', categoryId: '', shortDescription: '', description: '', deliveryInfo: '', sku: '',
  basePrice: 0, compareAtPrice: null as number | null, stock: 0, lowStockThreshold: 5,
  isActive: true, isFeatured: false, isChefSpecial: false, isPreorder: false,
  images: [] as string[], tags: [] as string[], allergens: [] as string[],
  variants: [] as any[],
};

/** Nutrition stored as JSON in DB, edited as plain "Label: value" lines. */
function nutritionToLines(n: any): string {
  if (!n || typeof n !== 'object') return '';
  return Object.entries(n).map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`).join('\n');
}

function parseNutritionText(text: string): any {
  const t = text.trim();
  if (!t) return null;
  // Backward compat: accept pasted JSON too
  if (t.startsWith('{')) return JSON.parse(t);
  const out: Record<string, string | number> = {};
  for (const line of t.split('\n')) {
    const i = line.indexOf(':');
    if (i <= 0) continue;
    const key = line.slice(0, i).trim().toLowerCase();
    const raw = line.slice(i + 1).trim();
    if (!key || !raw) continue;
    out[key] = /^-?\d+(\.\d+)?$/.test(raw) ? Number(raw) : raw;
  }
  return Object.keys(out).length ? out : null;
}

/** Browser auto-draft for the New Product form (survives refresh). Server drafts = isActive:false. */
const DRAFT_KEY = 'bns-product-draft-new';

export default function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const modeRef = useRef<'draft' | 'publish'>('publish');
  const [form, setForm] = useState<any>(EMPTY);
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredImage, setFeaturedImage] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [allergensText, setAllergensText] = useState('');
  const [nutritionText, setNutritionText] = useState('');
  const [customTag, setCustomTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [errorField, setErrorField] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  // Load browser draft once (new form only)
  useEffect(() => {
    if (productId) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && typeof d === 'object') {
          if (d.form && typeof d.form === 'object') setForm({ ...EMPTY, ...d.form });
          if (typeof d.featuredImage === 'string') setFeaturedImage(d.featuredImage);
          if (Array.isArray(d.galleryImages)) setGalleryImages(d.galleryImages.filter((s: any) => typeof s === 'string').slice(0, 4));
          else if (typeof d.imagesText === 'string') {
            // backward compat: old one-per-line draft
            const lines = d.imagesText.split('\n').map((s: string) => s.trim()).filter(Boolean);
            setFeaturedImage(lines[0] ?? '');
            setGalleryImages(lines.slice(1, 5));
          }
          if (typeof d.allergensText === 'string') setAllergensText(d.allergensText);
          if (typeof d.nutritionText === 'string') setNutritionText(d.nutritionText);
          const hasContent = Boolean(
            d.form?.name || d.featuredImage || d.imagesText || d.allergensText || d.nutritionText ||
            (d.galleryImages?.length ?? 0) > 0 || (d.form?.variants?.length ?? 0) > 0,
          );
          if (hasContent) setDraftRestored(true);
        }
      }
    } catch {
      /* ignore corrupt draft */
    }
    setDraftReady(true);
  }, [productId]);

  // Autosave browser draft on every change (new form only)
  useEffect(() => {
    if (productId || !draftReady) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, featuredImage, galleryImages, allergensText, nutritionText, savedAt: Date.now() }));
    } catch {
      /* storage full/blocked — ignore */
    }
  }, [productId, draftReady, form, featuredImage, galleryImages, allergensText, nutritionText]);

  const discardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    setForm(EMPTY);
    setFeaturedImage('');
    setGalleryImages([]);
    setAllergensText('');
    setNutritionText('');
    setDraftRestored(false);
  };

  const setGallerySlot = (i: number, v: string) =>
    setGalleryImages((g) => g.map((s, j) => (j === i ? v : s)));
  const removeGallerySlot = (i: number) =>
    setGalleryImages((g) => g.filter((_, j) => j !== i));

/** Map validator messages ("basePrice must not be...") to field keys. */
const KNOWN_FIELDS = ['name', 'slug', 'categoryId', 'sku', 'shortDescription', 'description', 'deliveryInfo', 'basePrice', 'compareAtPrice', 'stock', 'lowStockThreshold', 'images', 'tags', 'allergens', 'nutrition', 'variants'];
function fieldFromMessage(msg: string): string | null {
  for (const k of KNOWN_FIELDS) {
    if (msg === k || msg.startsWith(`${k} `) || msg.startsWith(`${k} must`) || msg.startsWith(`property ${k}`)) return k;
  }
  return null;
}

  useEffect(() => {
    api('/categories').then(setCategories).catch(() => {});
    if (productId) {
      api(`/admin/products/${productId}`)
        .then((p) => {
          setForm({
            ...p,
            compareAtPrice: p.compareAtPrice ?? null,
            variants: (p.variants ?? []).map((v: any) => ({ ...v })),
          });
          const imgs = p.images ?? [];
          setFeaturedImage(imgs[0] ?? '');
          setGalleryImages(imgs.slice(1, 5));
          setAllergensText((p.allergens ?? []).join(', '));
          setNutritionText(nutritionToLines(p.nutrition));
        })
        .catch((e) => setError(e.message));
    }
  }, [productId]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const addCustomTag = () => {
    const t = customTag.trim();
    if (!t) return;
    setForm((f: any) => ({ ...f, tags: f.tags.includes(t) ? f.tags : [...f.tags, t] }));
    setCustomTag('');
  };

  const setVariant = (i: number, k: string, v: any) => {
    setForm((f: any) => {
      const variants = [...f.variants];
      variants[i] = { ...variants[i], [k]: v };
      return { ...f, variants };
    });
  };

  const fieldCls = (k: string, extra = '') => `${extra}input-adm${errorField === k ? ' !border-red-500 !ring-2 !ring-red-200' : ''}`;
  const FieldErr = ({ k }: { k: string }) =>
    errorField === k && error ? <p className="mt-1 text-xs font-semibold text-red-600">⚠ {error}</p> : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setErrorField(null);
    const asDraft = !productId && modeRef.current === 'draft';
    let nutrition: any = null;
    if (nutritionText.trim()) {
      try {
        nutrition = parseNutritionText(nutritionText);
      } catch {
        setError('Nutrition is invalid — use one "Label: value" per line (e.g. Calories: 130).');
        setErrorField('nutrition');
        setSaving(false);
        return;
      }
    }
    const body = {
      name: form.name,
      slug: form.slug || undefined,
      categoryId: form.categoryId || undefined,
      shortDescription: form.shortDescription,
      description: form.description,
      deliveryInfo: form.deliveryInfo || undefined,
      sku: form.sku || undefined,
      basePrice: Number(form.basePrice),
      compareAtPrice: form.compareAtPrice != null && form.compareAtPrice !== '' ? Number(form.compareAtPrice) : undefined,
      stock: Number(form.stock),
      lowStockThreshold: Number(form.lowStockThreshold),
      isActive: asDraft ? false : form.isActive,
      isFeatured: form.isFeatured,
      isChefSpecial: form.isChefSpecial,
      isPreorder: form.isPreorder,
      images: [featuredImage, ...galleryImages].map((s: string) => normalizeImageUrl((s ?? '').trim())).filter(Boolean),
      tags: form.tags,
      allergens: allergensText.replace(/^contains:\s*/i, '').split(',').map((s: string) => s.trim()).filter(Boolean),
      nutrition,
      variants: form.variants.map((v: any) => ({
        name: v.name, option1: v.option1 || undefined, option2: v.option2 || undefined,
        price: Number(v.price), stock: Number(v.stock), sku: v.sku || undefined, isActive: v.isActive ?? true,
      })),
    };
    try {
      if (productId) await api(`/admin/products/${productId}`, { method: 'PATCH', body });
      else await api('/admin/products', { method: 'POST', body });
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      router.push('/products');
    } catch (err: any) {
      setError(err.message ?? 'Could not save product');
      setErrorField(err.field ?? fieldFromMessage(err.message ?? ''));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_360px]">
      {!productId && draftRestored && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-goldsoft/60 p-4 text-sm xl:col-span-2">
          <p className="font-semibold text-cocoa">📝 Unsaved draft restored — your half-filled form survived the refresh.</p>
          <button type="button" onClick={discardDraft} className="text-xs font-bold text-red-600 hover:underline">Discard draft & start fresh</button>
        </div>
      )}
      {!productId && !draftRestored && (
        <p className="text-xs text-mocha xl:col-span-2">✎ Everything you type here auto-saves in this browser — safe to refresh halfway.</p>
      )}
      <div className="space-y-6">
        <div className="card-adm space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">Basics</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-mocha uppercase">Name *</label>
              <input required value={form.name} onChange={(e) => set('name', e.target.value)} className={fieldCls('name')} />
              <FieldErr k="name" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-mocha uppercase">Slug (URL)</label>
              <input value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="auto-generated from name" className={fieldCls('slug')} />
              <FieldErr k="slug" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-mocha uppercase">Category</label>
              <select value={form.categoryId ?? ''} onChange={(e) => set('categoryId', e.target.value)} className={fieldCls('categoryId')}>
                <option value="">— None —</option>
                {categories.map((c) => (
                  <optgroup key={c.id} label={`${c.name} (${c.productCount ?? 0})`}>
                    <option value={c.id}>{c.name} — Main</option>
                    {(c.children || []).map((sub: any) => (
                      <option key={sub.id} value={sub.id}>↳ {sub.name} ({sub.productCount ?? 0})</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <FieldErr k="categoryId" />
              <p className="mt-1 text-[11px] text-mocha">Main categories + 40 subcategories. Pick the most specific.</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-mocha uppercase">SKU</label>
              <input value={form.sku ?? ''} onChange={(e) => set('sku', e.target.value)} placeholder="Leave blank for auto" className={fieldCls('sku')} />
              <FieldErr k="sku" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-mocha uppercase">Short description (under product name)</label>
            <input value={form.shortDescription ?? ''} onChange={(e) => set('shortDescription', e.target.value)} placeholder="One line under the product name" className={fieldCls('shortDescription')} />
            <FieldErr k="shortDescription" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-mocha uppercase">The Craft — full description</label>
            <textarea rows={5} value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} placeholder="Shows in the 'The Craft' box on the product page" className={fieldCls('description', 'resize-none ')} />
            <FieldErr k="description" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-mocha uppercase">Delivery & Freshness (one point per line)</label>
            <textarea rows={4} value={form.deliveryInfo ?? ''} onChange={(e) => set('deliveryInfo', e.target.value)} placeholder={'Same-day delivery across West Bengal for orders placed before 2 PM.\nChoose your preferred date & 2-hour slot at checkout.\nBest enjoyed within 3 days; store cool and dry.'} className={fieldCls('deliveryInfo', 'resize-none ')} />
            <FieldErr k="deliveryInfo" />
            <p className="mt-1 text-[11px] text-mocha">Shows in the &apos;Delivery & Freshness&apos; box. Leave blank to use the default points.</p>
          </div>
        </div>

        <div className="card-adm space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">Pricing & Stock</h2>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-mocha uppercase">Base price (₹) *</label>
              <input type="number" min={0} step="0.01" required value={form.basePrice} onChange={(e) => set('basePrice', e.target.value)} className={fieldCls('basePrice')} />
              <FieldErr k="basePrice" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-mocha uppercase">Compare-at (₹)</label>
              <input type="number" min={0} step="0.01" value={form.compareAtPrice ?? ''} onChange={(e) => set('compareAtPrice', e.target.value === '' ? null : e.target.value)} className={fieldCls('compareAtPrice')} placeholder="for offers" />
              <FieldErr k="compareAtPrice" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-mocha uppercase">Stock *</label>
              <input type="number" min={0} required value={form.stock} onChange={(e) => set('stock', e.target.value)} className={fieldCls('stock')} />
              <FieldErr k="stock" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-mocha uppercase">Low-stock alert at</label>
              <input type="number" min={0} value={form.lowStockThreshold} onChange={(e) => set('lowStockThreshold', e.target.value)} className={fieldCls('lowStockThreshold')} />
              <FieldErr k="lowStockThreshold" />
            </div>
          </div>
        </div>

        <div className={`card-adm p-6${errorField === 'variants' ? ' !border-red-500 !ring-2 !ring-red-200' : ''}`}>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Variants (sizes / weights)</h2>
            <button type="button" onClick={() => set('variants', [...form.variants, { name: '', option1: '', option2: '', price: form.basePrice, stock: 0, isActive: true }])} className="btn-adm-outline !px-3 !py-1.5 text-xs">+ Add Variant</button>
          </div>
          <FieldErr k="variants" />
          {form.variants.length === 0 ? (
            <p className="mt-3 text-sm text-mocha">No variants — the base price & stock apply.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {form.variants.map((v: any, i: number) => (
                <div key={i} className="grid items-center gap-2 rounded-lg border border-espresso/8 bg-cream/40 p-3 sm:grid-cols-[1fr_1fr_1fr_110px_90px_70px_32px]">
                  <input placeholder="Name (e.g. 500 g)" value={v.name} onChange={(e) => setVariant(i, 'name', e.target.value)} className="input-adm !py-2 text-xs" />
                  <input placeholder="Option 1 (size)" value={v.option1 ?? ''} onChange={(e) => setVariant(i, 'option1', e.target.value)} className="input-adm !py-2 text-xs" />
                  <input placeholder="Option 2 (flavour)" value={v.option2 ?? ''} onChange={(e) => setVariant(i, 'option2', e.target.value)} className="input-adm !py-2 text-xs" />
                  <input type="number" min={0} placeholder="Price" value={v.price} onChange={(e) => setVariant(i, 'price', e.target.value)} className="input-adm !py-2 text-xs" />
                  <input type="number" min={0} placeholder="Stock" value={v.stock} onChange={(e) => setVariant(i, 'stock', e.target.value)} className="input-adm !py-2 text-xs" />
                  <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={v.isActive ?? true} onChange={(e) => setVariant(i, 'isActive', e.target.checked)} className="accent-[#b8860b]" />On</label>
                  <button type="button" onClick={() => set('variants', form.variants.filter((_: any, j: number) => j !== i))} className="text-red-600 hover:underline">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="space-y-6">
        <div className="card-adm space-y-3 p-6">
          <h2 className="font-display text-lg font-semibold">Visibility</h2>
          {[
            ['isActive', 'Live on storefront'],
            ['isFeatured', 'Featured on homepage'],
            ['isChefSpecial', "Chef's Special"],
            ['isPreorder', 'Pre-order (no stock check)'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={!!form[key]} onChange={(e) => set(key, e.target.checked)} className="h-4 w-4 accent-[#b8860b]" />
              {label}
            </label>
          ))}
        </div>

        <div className="card-adm space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">Featured Image</h2>
          <input
            value={featuredImage}
            onChange={(e) => setFeaturedImage(e.target.value)}
            placeholder="Paste Google Drive share link, stock-photo URL or /images/… path"
            className={fieldCls('images', 'font-mono text-xs ')}
          />
          <FieldErr k="images" />
          {featuredImage.trim() ? (
            <div>
              <p className="mb-1 text-[11px] font-bold text-mocha uppercase">Main photo — shows first on the product page</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgSrc(normalizeImageUrl(featuredImage))} alt="featured preview" className="aspect-square w-full max-w-[220px] rounded-xl border border-espresso/10 bg-white object-contain" />
            </div>
          ) : (
            <p className="text-[11px] text-mocha">No featured image yet — the storefront will show a placeholder.</p>
          )}
          <p className="text-[11px] text-mocha">Google Drive share links auto-convert to direct images on save.</p>
        </div>

        <div className="card-adm space-y-3 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Photo Gallery — up to 4</h2>
            {galleryImages.length < 4 ? (
              <button type="button" onClick={() => setGalleryImages((g) => [...g, ''])} className="btn-adm-outline !px-3 !py-1.5 text-xs">+ Add Photo</button>
            ) : (
              <span className="text-xs font-bold text-green-700">✓ You have done all four.</span>
            )}
          </div>
          {galleryImages.length === 0 ? (
            <p className="text-xs text-mocha">No gallery photos — press + to add. Thumbnails appear on the product page only when a gallery exists.</p>
          ) : (
            <div className="space-y-3">
              {galleryImages.map((s, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-espresso/8 bg-cream/40 p-3">
                  {s.trim() ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgSrc(normalizeImageUrl(s))} alt={`gallery ${i + 1}`} className="h-16 w-16 shrink-0 rounded-lg border border-espresso/10 bg-white object-contain" />
                  ) : (
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-cream text-xl">🖼️</span>
                  )}
                  <input
                    value={s}
                    onChange={(e) => setGallerySlot(i, e.target.value)}
                    placeholder={`Photo ${i + 1} link — Drive share link, URL or /images/… path`}
                    className="input-adm font-mono !py-2 text-xs"
                  />
                  <button type="button" onClick={() => removeGallerySlot(i)} className="shrink-0 p-1 text-red-600 hover:underline" title="Remove photo">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-adm space-y-3 p-6">
          <h2 className="font-display text-lg font-semibold">Tags</h2>
          <div className="flex flex-wrap gap-1.5">
            {ALL_TAGS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set('tags', form.tags.includes(t) ? form.tags.filter((x: string) => x !== t) : [...form.tags, t])}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${form.tags.includes(t) ? 'border-gold bg-gold text-white' : 'border-espresso/15 text-cocoa hover:border-gold'}`}
              >
                {t}
              </button>
            ))}
            {form.tags.filter((t: string) => !(ALL_TAGS as readonly string[]).includes(t)).map((t: string) => (
              <span key={t} className="flex items-center gap-1 rounded-full border border-gold bg-goldsoft px-2.5 py-1 text-[11px] font-semibold text-cocoa">
                {t}
                <button type="button" onClick={() => set('tags', form.tags.filter((x: string) => x !== t))} className="text-red-600 hover:underline" title="Remove tag">✕</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={customTag} onChange={(e) => setCustomTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } }} placeholder="New tag (e.g. Bestseller)" className="input-adm !py-2 text-xs" />
            <button type="button" onClick={addCustomTag} className="btn-adm-outline shrink-0 !px-3 !py-2 text-xs">+ Add</button>
          </div>
        </div>

        <div className="card-adm space-y-3 p-6">
          <h2 className="font-display text-lg font-semibold">Allergens & Nutrition</h2>
          <input value={allergensText} onChange={(e) => setAllergensText(e.target.value)} placeholder="Allergens — comma separated (e.g. Gluten, Dairy, Nuts)" className={fieldCls('allergens', 'text-xs ')} />
          <FieldErr k="allergens" />
          <textarea rows={5} value={nutritionText} onChange={(e) => setNutritionText(e.target.value)} placeholder={'One per line — Label: value\nServing: 30 g\nCalories: 130\nFat: 6 g\nCarbs: 17 g\nProtein: 2 g'} className={fieldCls('nutrition', 'resize-none font-mono text-xs ')} />
          <FieldErr k="nutrition" />
          <p className="text-[11px] text-mocha">Plain text — no JSON needed. Saved automatically in the right format.</p>
        </div>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="flex gap-3">
          {productId ? (
            <button disabled={saving} className="btn-adm flex-1">{saving ? 'Saving…' : 'Save Changes'}</button>
          ) : (
            <>
              <button
                type="submit"
                disabled={saving}
                onClick={() => { modeRef.current = 'draft'; }}
                className="btn-adm-outline flex-1"
                title="Save hidden — not visible on storefront until published"
              >
                {saving ? 'Saving…' : 'Save as Draft'}
              </button>
              <button
                type="submit"
                disabled={saving}
                onClick={() => { modeRef.current = 'publish'; }}
                className="btn-adm flex-1"
              >
                {saving ? 'Saving…' : 'Publish'}
              </button>
            </>
          )}
          <button type="button" onClick={() => router.push('/products')} className="btn-adm-outline">Cancel</button>
        </div>
        {!productId && (
          <p className="text-[11px] text-mocha">Draft = hidden from storefront. Find it under Products → Draft filter, then Edit or Delete anytime.</p>
        )}
      </div>
    </form>
  );
}
