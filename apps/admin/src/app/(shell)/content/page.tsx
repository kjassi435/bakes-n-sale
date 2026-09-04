'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, imgSrc, STOREFRONT_URL } from '@/lib/api';

const TABS = [
  { id: 'hero', label: 'Hero Slider' },
  { id: 'home', label: 'Home Sections' },
  { id: 'categories', label: 'Categories' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
  { id: 'headerfooter', label: 'Header & Footer' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function ProductSelect({
  value, products, onChange, placeholder,
}: { value: string; products: any[]; onChange: (slug: string) => void; placeholder: string }) {
  const prod = products.find((p) => p.slug === value);
  return (
    <div className="flex items-center gap-3">
      {prod?.images?.[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imgSrc(prod.images[0])} alt="" className="h-12 w-12 shrink-0 rounded-lg border border-espresso/10 object-cover" />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-cream text-lg">🧁</span>
      )}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-adm">
        <option value="">{placeholder}</option>
        {products.map((p) => (
          <option key={p.slug} value={p.slug}>
            {p.name} — /{p.slug}{p.isActive ? '' : ' (hidden)'}
          </option>
        ))}
      </select>
    </div>
  );
}

function Section({ title, hint, children, onSave, saving }: { title: string; hint?: string; children: React.ReactNode; onSave: () => void; saving: boolean }) {
  return (
    <div className="card-adm p-6">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <button onClick={onSave} disabled={saving} className="btn-adm !px-4 !py-2 text-xs">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      {hint && <p className="mb-4 text-xs text-mocha">{hint}</p>}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-mocha uppercase">{label}</label>
      {children}
    </div>
  );
}

export default function SiteContentPage() {
  const [tab, setTab] = useState<TabId>('hero');
  const [settings, setSettings] = useState<Record<string, any> | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState('');
  const [msg, setMsg] = useState('');
  const [newCat, setNewCat] = useState({ name: '', parentId: '', image: '', description: '' });

  useEffect(() => {
    api('/admin/settings').then(setSettings).catch(() => setSettings({}));
    api('/admin/products').then((list: any[]) => setProducts(Array.isArray(list) ? list : [])).catch(() => {});
    api('/categories').then(setCategories).catch(() => {});
  }, []);

  const published = useMemo(() => products.filter((p) => p.isActive), [products]);

  const set = (key: string, value: any) =>
    setSettings((prev) => ({ ...(prev ?? {}), [key]: value }));

  const save = async (keys: string[]) => {
    setSaving(keys.join(','));
    setMsg('');
    try {
      const items = keys.map((k) => ({ key: k, value: (settings ?? {})[k] ?? null }));
      const updated = await api('/admin/settings', { method: 'PATCH', body: items });
      setSettings(updated);
      setMsg('✓ Saved — live on the storefront after refresh.');
    } catch (e: any) {
      setMsg(`✕ ${e.message ?? 'Save failed'}`);
    } finally {
      setSaving('');
    }
  };

  const setArr = (key: string, idx: number, val: string) => {
    const arr = [...(((settings ?? {})[key] as string[]) ?? [])];
    arr[idx] = val;
    set(key, arr);
  };

  if (!settings) return <div className="py-24 text-center text-mocha">Loading site content…</div>;

  const hero: string[] = settings.hero_slides ?? [];
  const fresh: string[] = settings.home_fresh ?? [];
  const chef: string[] = settings.home_chef ?? [];
  const festive = settings.home_festive ?? { title: '', subtitle: '', slugs: [] };
  const catOv: Record<string, any> = settings.home_categories ?? {};
  const reviews: any[] = settings.home_reviews ?? [];
  const about = settings.about ?? {};
  const contact = settings.contact ?? {};
  const header = settings.header ?? { announcements: [] };
  const footer = settings.footer ?? {};

  const setAbout = (k: string, v: string) => set('about', { ...about, [k]: v });
  const setContact = (k: string, v: string) => set('contact', { ...contact, [k]: v });
  const setFooter = (k: string, v: string) => set('footer', { ...footer, [k]: v });

  const saveCategory = async (id: string, body: any) => {
    setSaving(`cat-${id}`);
    try {
      await api(`/admin/categories/${id}`, { method: 'PATCH', body });
      const cats = await api('/categories');
      setCategories(cats);
      setMsg('✓ Category saved — live on the storefront after refresh.');
    } catch (e: any) {
      setMsg(`✕ ${e.message ?? 'Save failed'}`);
    } finally {
      setSaving('');
    }
  };

  const createCategory = async () => {
    if (!newCat.name.trim()) { setMsg('✕ Give the new category a name.'); return; }
    setSaving('cat-new');
    try {
      await api('/admin/categories', {
        method: 'POST',
        body: { name: newCat.name.trim(), parentId: newCat.parentId || null, image: newCat.image.trim() || undefined, description: newCat.description.trim() || undefined },
      });
      setNewCat({ name: '', parentId: '', image: '', description: '' });
      const cats = await api('/categories');
      setCategories(cats);
      setMsg('✓ Category created.');
    } catch (e: any) {
      setMsg(`✕ ${e.message ?? 'Create failed'}`);
    } finally {
      setSaving('');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Site Content</h1>
          <p className="mt-1 text-sm text-mocha">
            Everything the customer sees — edits go live on the storefront after refresh.{' '}
            <a href={STOREFRONT_URL} target="_blank" rel="noreferrer" className="font-bold text-gold hover:underline">↗ View store</a>
          </p>
        </div>
      </div>

      {msg && <p className={`mb-4 rounded-lg p-3 text-sm font-semibold ${msg.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg}</p>}

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${tab === t.id ? 'bg-espresso text-ivory' : 'border border-espresso/15 bg-white text-cocoa hover:border-gold'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'hero' && (
        <Section title="Hero Slider — 8 products" hint="Pick any published product per slot. New products appear in the dropdowns automatically. Each card links to its product page." onSave={() => save(['hero_slides'])} saving={!!saving}>
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-espresso/8 bg-cream/40 p-3">
                <p className="mb-2 text-[11px] font-bold tracking-widest text-mocha uppercase">Slide {i + 1}</p>
                <ProductSelect value={hero[i] ?? ''} products={products} onChange={(v) => setArr('hero_slides', i, v)} placeholder="— Select product —" />
              </div>
            ))}
          </div>
        </Section>
      )}

      {tab === 'home' && (
        <div className="space-y-6">
          <Section title="Fresh from the Oven — 4 products" hint="Shown right under Shop by Category." onSave={() => save(['home_fresh'])} saving={!!saving}>
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductSelect key={i} value={fresh[i] ?? ''} products={products} onChange={(v) => setArr('home_fresh', i, v)} placeholder="— Select product —" />
              ))}
            </div>
          </Section>

          <Section title="Chef's Specials — 4 products" hint="Curated picks. All 4 boxes show on the homepage." onSave={() => save(['home_chef'])} saving={!!saving}>
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductSelect key={i} value={chef[i] ?? ''} products={products} onChange={(v) => setArr('home_chef', i, v)} placeholder="— Select product —" />
              ))}
            </div>
          </Section>

          <Section title="Festive section — heading + 4 products" hint="Title, description and the 4 boxes." onSave={() => save(['home_festive'])} saving={!!saving}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title">
                <input value={festive.title ?? ''} onChange={(e) => set('home_festive', { ...festive, title: e.target.value })} className="input-adm" />
              </Field>
              <Field label="Description">
                <input value={festive.subtitle ?? ''} onChange={(e) => set('home_festive', { ...festive, subtitle: e.target.value })} className="input-adm" />
              </Field>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductSelect
                  key={i}
                  value={festive.slugs?.[i] ?? ''}
                  products={products}
                  onChange={(v) => { const s = [...(festive.slugs ?? [])]; s[i] = v; set('home_festive', { ...festive, slugs: s }); }}
                  placeholder="— Select product —"
                />
              ))}
            </div>
          </Section>

          <Section title="Shop by Category — titles & photos" hint="Override any main category's display title or circle photo (paste image URL or /images/... path). Leave blank to use defaults." onSave={() => save(['home_categories'])} saving={!!saving}>
            <div className="grid gap-4 md:grid-cols-2">
              {categories.map((c: any) => {
                const ov = catOv[c.slug] ?? {};
                return (
                  <div key={c.id} className="rounded-lg border border-espresso/8 bg-cream/40 p-4">
                    <p className="mb-3 text-xs font-bold tracking-widest text-mocha uppercase">{c.name}</p>
                    <div className="flex items-start gap-3">
                      {(ov.image || c.image) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imgSrc(ov.image || c.image)} alt="" className="h-14 w-14 shrink-0 rounded-full border border-gold/30 object-cover" />
                      ) : null}
                      <div className="flex-1 space-y-2">
                        <input
                          value={ov.title ?? ''}
                          onChange={(e) => set('home_categories', { ...catOv, [c.slug]: { ...ov, title: e.target.value } })}
                          placeholder={`Title (default: ${c.name})`}
                          className="input-adm !py-2 text-xs"
                        />
                        <input
                          value={ov.image ?? ''}
                          onChange={(e) => set('home_categories', { ...catOv, [c.slug]: { ...ov, image: e.target.value } })}
                          placeholder="Photo URL (blank = default)"
                          className="input-adm !py-2 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>
      )}

      {tab === 'categories' && (
        <div className="space-y-6">
          <Section title="Edit categories & subcategories" hint="Rename, change photos/descriptions. Photos accept image URLs or /images/... paths with live preview." onSave={async () => setMsg('✓ All category edits save individually.')} saving={false}>
            <div className="space-y-5">
              {categories.map((c: any) => (
                <CategoryEditor key={c.id} cat={c} saving={saving} onSave={saveCategory} />
              ))}
            </div>
          </Section>

          <Section title="Add new category / subcategory" hint="Choose a parent to create a subcategory, or leave parent blank for a main category." onSave={createCategory} saving={saving === 'cat-new'}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name *">
                <input value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} placeholder="e.g. Sugar-Free" className="input-adm" />
              </Field>
              <Field label="Parent (blank = main category)">
                <select value={newCat.parentId} onChange={(e) => setNewCat({ ...newCat, parentId: e.target.value })} className="input-adm">
                  <option value="">— Main category —</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Photo URL">
                <input value={newCat.image} onChange={(e) => setNewCat({ ...newCat, image: e.target.value })} placeholder="https://… or /images/…" className="input-adm font-mono text-xs" />
              </Field>
              <Field label="Description">
                <input value={newCat.description} onChange={(e) => setNewCat({ ...newCat, description: e.target.value })} className="input-adm" />
              </Field>
            </div>
            {newCat.image.trim() && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imgSrc(newCat.image)} alt="preview" className="h-20 w-20 rounded-full border border-gold/30 object-cover" />
            )}
          </Section>
        </div>
      )}

      {tab === 'reviews' && (
        <Section title="Google Reviews — 3 reviewers" hint="Names + review text shown on the homepage. Avatars auto-generate from names." onSave={() => save(['home_reviews'])} saving={!!saving}>
          {(reviews as any[]).concat([{}, {}, {}]).slice(0, 3).map((r: any, i: number) => (
            <div key={i} className="rounded-lg border border-espresso/8 bg-cream/40 p-4">
              <p className="mb-3 text-[11px] font-bold tracking-widest text-mocha uppercase">Review {i + 1}</p>
              <div className="grid gap-3 sm:grid-cols-[200px_120px_1fr]">
                <Field label="Reviewer name">
                  <input
                    value={r.name ?? ''}
                    onChange={(e) => { const a = [...reviews]; a[i] = { ...(a[i] ?? {}), name: e.target.value }; set('home_reviews', a); }}
                    className="input-adm"
                  />
                </Field>
                <Field label="Time">
                  <input
                    value={r.time ?? ''}
                    onChange={(e) => { const a = [...reviews]; a[i] = { ...(a[i] ?? {}), time: e.target.value }; set('home_reviews', a); }}
                    placeholder="2 weeks ago"
                    className="input-adm"
                  />
                </Field>
                <Field label="Review text">
                  <textarea
                    rows={2}
                    value={r.text ?? ''}
                    onChange={(e) => { const a = [...reviews]; a[i] = { ...(a[i] ?? {}), text: e.target.value }; set('home_reviews', a); }}
                    className="input-adm resize-none"
                  />
                </Field>
              </div>
            </div>
          ))}
        </Section>
      )}

      {tab === 'about' && (
        <Section title="About Us page — all text" hint="Every text block on /about." onSave={() => save(['about'])} saving={!!saving}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Eyebrow"><input value={about.eyebrow ?? ''} onChange={(e) => setAbout('eyebrow', e.target.value)} className="input-adm" /></Field>
            <Field label="Title"><input value={about.title ?? ''} onChange={(e) => setAbout('title', e.target.value)} className="input-adm" /></Field>
          </div>
          <Field label="Subtitle"><textarea rows={2} value={about.subtitle ?? ''} onChange={(e) => setAbout('subtitle', e.target.value)} className="input-adm resize-none" /></Field>
          <Field label="CEO heading"><input value={about.ceoHeading ?? ''} onChange={(e) => setAbout('ceoHeading', e.target.value)} className="input-adm" /></Field>
          <Field label="CEO paragraph 1"><textarea rows={3} value={about.ceoBody1 ?? ''} onChange={(e) => setAbout('ceoBody1', e.target.value)} className="input-adm resize-none" /></Field>
          <Field label="CEO paragraph 2"><textarea rows={3} value={about.ceoBody2 ?? ''} onChange={(e) => setAbout('ceoBody2', e.target.value)} className="input-adm resize-none" /></Field>
          <Field label="Quote"><input value={about.quote ?? ''} onChange={(e) => setAbout('quote', e.target.value)} className="input-adm" /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Phone"><input value={about.phone ?? ''} onChange={(e) => setAbout('phone', e.target.value)} className="input-adm" /></Field>
            <Field label="Email"><input value={about.email ?? ''} onChange={(e) => setAbout('email', e.target.value)} className="input-adm" /></Field>
            <Field label="Address"><input value={about.address ?? ''} onChange={(e) => setAbout('address', e.target.value)} className="input-adm" /></Field>
          </div>
        </Section>
      )}

      {tab === 'contact' && (
        <Section title="Contact page — Reach Us" hint="Phone, email, hours, map location shown on /contact." onSave={() => save(['contact'])} saving={!!saving}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone"><input value={contact.phone ?? ''} onChange={(e) => setContact('phone', e.target.value)} className="input-adm" /></Field>
            <Field label="Email"><input value={contact.email ?? ''} onChange={(e) => setContact('email', e.target.value)} className="input-adm" /></Field>
          </div>
          <Field label="Address"><input value={contact.address ?? ''} onChange={(e) => setContact('address', e.target.value)} className="input-adm" /></Field>
          <Field label="Hours"><textarea rows={2} value={contact.hours ?? ''} onChange={(e) => setContact('hours', e.target.value)} className="input-adm resize-none" /></Field>
          <Field label="Map location URL"><input value={contact.mapUrl ?? ''} onChange={(e) => setContact('mapUrl', e.target.value)} placeholder="https://maps.google.com/?q=…" className="input-adm font-mono text-xs" /></Field>
        </Section>
      )}

      {tab === 'headerfooter' && (
        <div className="space-y-6">
          <Section title="Header — announcement bar" hint="Rotating lines at the very top of the site." onSave={() => save(['header'])} saving={!!saving}>
            {(header.announcements ?? []).concat(['', '', '']).slice(0, 3).map((line: string, i: number) => (
              <Field key={i} label={`Line ${i + 1}`}>
                <input
                  value={line ?? ''}
                  onChange={(e) => { const a = [...(header.announcements ?? [])]; a[i] = e.target.value; set('header', { ...header, announcements: a }); }}
                  className="input-adm"
                />
              </Field>
            ))}
          </Section>

          <Section title="Footer" hint="About blurb, address, contact + social links." onSave={() => save(['footer'])} saving={!!saving}>
            <Field label="About blurb"><textarea rows={2} value={footer.about ?? ''} onChange={(e) => setFooter('about', e.target.value)} className="input-adm resize-none" /></Field>
            <Field label="Address"><input value={footer.address ?? ''} onChange={(e) => setFooter('address', e.target.value)} className="input-adm" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone"><input value={footer.phone ?? ''} onChange={(e) => setFooter('phone', e.target.value)} className="input-adm" /></Field>
              <Field label="Email"><input value={footer.email ?? ''} onChange={(e) => setFooter('email', e.target.value)} className="input-adm" /></Field>
              <Field label="Instagram URL"><input value={footer.instagram ?? ''} onChange={(e) => setFooter('instagram', e.target.value)} className="input-adm font-mono text-xs" /></Field>
              <Field label="Facebook URL"><input value={footer.facebook ?? ''} onChange={(e) => setFooter('facebook', e.target.value)} className="input-adm font-mono text-xs" /></Field>
              <Field label="YouTube URL"><input value={footer.youtube ?? ''} onChange={(e) => setFooter('youtube', e.target.value)} className="input-adm font-mono text-xs" /></Field>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

function CategoryEditor({ cat, saving, onSave }: { cat: any; saving: string; onSave: (id: string, body: any) => void }) {
  const [form, setForm] = useState({ name: cat.name, image: cat.image ?? '', description: cat.description ?? '' });
  return (
    <div className="rounded-lg border border-espresso/8 bg-cream/40 p-4">
      <div className="flex items-start gap-3">
        {imgSrc(form.image || cat.image) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgSrc(form.image || cat.image)} alt="" className="h-14 w-14 shrink-0 rounded-full border border-gold/30 object-cover" />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-cream text-xl">📁</span>
        )}
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-bold tracking-widest text-mocha uppercase">
              {cat.parentId ? '↳ Subcategory' : 'Main category'} · /{cat.slug}
            </p>
            <button onClick={() => onSave(cat.id, { name: form.name, image: form.image, description: form.description })} disabled={saving === `cat-${cat.id}`} className="btn-adm !px-3 !py-1.5 text-xs">
              {saving === `cat-${cat.id}` ? 'Saving…' : 'Save'}
            </button>
          </div>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-adm !py-2 text-sm font-semibold" />
          <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="Photo URL — paste Drive/stock link, live preview on the left" className="input-adm !py-2 font-mono text-xs" />
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="input-adm !py-2 text-xs" />
          {(cat.children || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(cat.children || []).map((s: any) => (
                <span key={s.id} className="rounded-full bg-white px-2.5 py-1 text-[11px] text-cocoa">↳ {s.name}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
