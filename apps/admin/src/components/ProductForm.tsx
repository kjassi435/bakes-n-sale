'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ALL_TAGS } from '@bakery/shared';
import { api, imgSrc, normalizeImageUrl } from '@/lib/api';

const EMPTY = {
  name: '', slug: '', categoryId: '', shortDescription: '', description: '', sku: '',
  basePrice: 0, compareAtPrice: null as number | null, stock: 0, lowStockThreshold: 5,
  isActive: true, isFeatured: false, isChefSpecial: false, isPreorder: false,
  images: [] as string[], tags: [] as string[], allergens: [] as string[],
  variants: [] as any[],
};

export default function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<any>(EMPTY);
  const [categories, setCategories] = useState<any[]>([]);
  const [imagesText, setImagesText] = useState('');
  const [allergensText, setAllergensText] = useState('');
  const [nutritionText, setNutritionText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
          setImagesText((p.images ?? []).join('\n'));
          setAllergensText((p.allergens ?? []).join(', '));
          setNutritionText(p.nutrition ? JSON.stringify(p.nutrition, null, 2) : '');
        })
        .catch((e) => setError(e.message));
    }
  }, [productId]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const setVariant = (i: number, k: string, v: any) => {
    setForm((f: any) => {
      const variants = [...f.variants];
      variants[i] = { ...variants[i], [k]: v };
      return { ...f, variants };
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    let nutrition: any = null;
    if (nutritionText.trim()) {
      try {
        nutrition = JSON.parse(nutritionText);
      } catch {
        setError('Nutrition JSON is invalid');
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
      sku: form.sku || undefined,
      basePrice: Number(form.basePrice),
      compareAtPrice: form.compareAtPrice != null && form.compareAtPrice !== '' ? Number(form.compareAtPrice) : undefined,
      stock: Number(form.stock),
      lowStockThreshold: Number(form.lowStockThreshold),
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      isChefSpecial: form.isChefSpecial,
      isPreorder: form.isPreorder,
      images: imagesText.split('\n').map((s: string) => normalizeImageUrl(s.trim())).filter(Boolean),
      tags: form.tags,
      allergens: allergensText.split(',').map((s: string) => s.trim()).filter(Boolean),
      nutrition,
      variants: form.variants.map((v: any) => ({
        name: v.name, option1: v.option1 || undefined, option2: v.option2 || undefined,
        price: Number(v.price), stock: Number(v.stock), sku: v.sku || undefined, isActive: v.isActive ?? true,
      })),
    };
    try {
      if (productId) await api(`/admin/products/${productId}`, { method: 'PATCH', body });
      else await api('/admin/products', { method: 'POST', body });
      router.push('/products');
    } catch (err: any) {
      setError(err.message ?? 'Could not save product');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <div className="card-adm space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">Basics</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-mocha uppercase">Name *</label>
              <input required value={form.name} onChange={(e) => set('name', e.target.value)} className="input-adm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-mocha uppercase">Slug (URL)</label>
              <input value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="auto-generated from name" className="input-adm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-mocha uppercase">Category</label>
              <select value={form.categoryId ?? ''} onChange={(e) => set('categoryId', e.target.value)} className="input-adm">
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
              <p className="mt-1 text-[11px] text-mocha">Main categories + 40 subcategories. Pick the most specific.</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-mocha uppercase">SKU</label>
              <input value={form.sku ?? ''} onChange={(e) => set('sku', e.target.value)} className="input-adm" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-mocha uppercase">Short description</label>
            <input value={form.shortDescription ?? ''} onChange={(e) => set('shortDescription', e.target.value)} className="input-adm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-mocha uppercase">Full description</label>
            <textarea rows={5} value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} className="input-adm resize-none" />
          </div>
        </div>

        <div className="card-adm space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">Pricing & Stock</h2>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-mocha uppercase">Base price (₹) *</label>
              <input type="number" min={0} step="0.01" required value={form.basePrice} onChange={(e) => set('basePrice', e.target.value)} className="input-adm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-mocha uppercase">Compare-at (₹)</label>
              <input type="number" min={0} step="0.01" value={form.compareAtPrice ?? ''} onChange={(e) => set('compareAtPrice', e.target.value === '' ? null : e.target.value)} className="input-adm" placeholder="for offers" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-mocha uppercase">Stock *</label>
              <input type="number" min={0} required value={form.stock} onChange={(e) => set('stock', e.target.value)} className="input-adm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-mocha uppercase">Low-stock alert at</label>
              <input type="number" min={0} value={form.lowStockThreshold} onChange={(e) => set('lowStockThreshold', e.target.value)} className="input-adm" />
            </div>
          </div>
        </div>

        <div className="card-adm p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Variants (sizes / weights)</h2>
            <button type="button" onClick={() => set('variants', [...form.variants, { name: '', option1: '', option2: '', price: form.basePrice, stock: 0, isActive: true }])} className="btn-adm-outline !px-3 !py-1.5 text-xs">+ Add Variant</button>
          </div>
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

        <div className="card-adm space-y-3 p-6">
          <h2 className="font-display text-lg font-semibold">Images</h2>
          <textarea
            rows={3}
            value={imagesText}
            onChange={(e) => setImagesText(e.target.value)}
            placeholder={'Paste Google Drive share link, stock-photo URL or /images/… path\n(one per line — live preview below)'}
            className="input-adm resize-none font-mono text-xs"
          />
          {imagesText.trim() && (
            <div>
              <p className="mb-1 text-[11px] font-bold text-mocha uppercase">Live preview</p>
              <div className="grid grid-cols-3 gap-2">
                {imagesText.split('\n').map((s: string) => s.trim()).filter(Boolean).slice(0, 3).map((s: string, i: number) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={imgSrc(normalizeImageUrl(s))} alt={`preview ${i + 1}`} className="aspect-square w-full rounded-lg border border-espresso/10 object-cover" />
                ))}
              </div>
            </div>
          )}
          <p className="text-[11px] text-mocha">Google Drive share links auto-convert to direct images on save. Preview updates as you type.</p>
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
          </div>
        </div>

        <div className="card-adm space-y-3 p-6">
          <h2 className="font-display text-lg font-semibold">Allergens & Nutrition</h2>
          <input value={allergensText} onChange={(e) => setAllergensText(e.target.value)} placeholder="Allergens (comma separated)" className="input-adm text-xs" />
          <textarea rows={4} value={nutritionText} onChange={(e) => setNutritionText(e.target.value)} placeholder={'{ "serving": "30 g", "calories": 130 }'} className="input-adm resize-none font-mono text-xs" />
        </div>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="flex gap-3">
          <button disabled={saving} className="btn-adm flex-1">{saving ? 'Saving…' : productId ? 'Save Changes' : 'Create Product'}</button>
          <button type="button" onClick={() => router.push('/products')} className="btn-adm-outline">Cancel</button>
        </div>
      </div>
    </form>
  );
}
