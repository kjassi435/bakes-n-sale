import type { Metadata } from 'next';
import Link from 'next/link';
import ContactForm from '@/components/ContactForm';
import { getSiteSettings } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact Us — Bakes n Sale | Mrs. Tanuja | Howrah 711103',
  description: 'Contact Bakes n Sale — 82/7 Shaikh Para Lane, Howrah 711103. Call 7890027798, email bakesnsale@gmail.com. Mrs. Tanuja — bake with honesty, serve with love. Bulk orders, franchise, feedback.',
  openGraph: {
    title: 'Contact Bakes n Sale',
    description: 'Howrah 711103 — 82/7 Shaikh Para Lane. Call 7890027798. Mrs. Tanuja.',
    images: ['/logo.jpeg'],
  },
};

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const c = settings.contact ?? {};
  const phone = c.phone || '7890027798';
  const email = c.email || 'bakesnsale@gmail.com';
  const address = c.address || '82/7 Shaikh Para Lane, Howrah - 711103, West Bengal, India';
  const hours = c.hours || 'Baking: 5am – 11am daily; Dispatch & Support: 8am – 9pm; Store: 8am – 9pm, Howrah';
  const mapUrl = c.mapUrl || 'https://maps.google.com/?q=82/7 Shaikh Para Lane Howrah 711103';
  const telHref = `tel:+91${phone.replace(/\D/g, '').slice(-10)}`;
  return (
    <div className="container-x py-12">
      <nav className="mb-6 text-xs text-mocha">
        <Link href="/" className="hover:text-gold">Home</Link> <span className="mx-2">/</span> <span className="text-espresso">Contact</span>
      </nav>

      <div className="mx-auto max-w-5xl">
        <p className="eyebrow text-center">Get In Touch</p>
        <h1 className="mt-3 text-center font-display text-4xl font-semibold sm:text-5xl">Contact Bakes n Sale</h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-mocha">
          Have a question about our bakes, bulk orders, or store locations? We’d love to hear from you — bake with honesty, serve with love.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="card-lux p-8">
            <h2 className="font-display text-2xl font-semibold">Send us a message</h2>
            <p className="mt-2 text-sm text-mocha">We typically reply within 2 hours, 9am – 8pm IST.</p>
            <ContactForm />
            <div className="mt-8 rounded-xl bg-cream p-5">
              <h3 className="font-display text-lg font-semibold">Why contact us?</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-mocha">
                <li>• Bulk & corporate orders (20+ boxes) — custom ribbon & monogram</li>
                <li>• Store locator & franchise inquiry</li>
                <li>• Feedback on taste, packaging, delivery</li>
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card-lux p-7">
              <h2 className="font-display text-xl font-semibold">Reach Mrs. Tanuja</h2>
              <div className="mt-4 space-y-3 text-sm">
                <p className="flex items-start gap-3">
                  <span className="mt-1 text-gold">📞</span>
                  <span>
                    <span className="block font-bold text-espresso">Phone</span>
                    <a href={telHref} className="text-cocoa hover:text-gold">{phone}</a>
                    <span className="block text-xs text-mocha">Mon–Sun, 8am – 9pm IST</span>
                  </span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="mt-1 text-gold">✉️</span>
                  <span>
                    <span className="block font-bold text-espresso">Email</span>
                    <a href={`mailto:${email}`} className="text-cocoa hover:text-gold">{email}</a>
                  </span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="mt-1 text-gold">📍</span>
                  <span>
                    <span className="block font-bold text-espresso">Address</span>
                    <span className="text-mocha">{address}</span>
                  </span>
                </p>
              </div>
              <div className="mt-6">
                <h3 className="text-xs font-bold tracking-[0.18em] text-mocha uppercase">Hours</h3>
                <p className="mt-2 text-sm text-mocha">{hours}</p>
              </div>
            </div>

            <div className="card-lux overflow-hidden">
              <div className="h-56 bg-gradient-to-br from-sand to-cream p-6 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-4xl">🗺️</p>
                  <p className="mt-2 font-display text-lg font-semibold">Find us in Howrah</p>
                  <p className="text-xs text-mocha">{address}</p>
                  <a href={mapUrl} target="_blank" rel="noreferrer" className="btn-outline mt-4 !px-5 !py-2 text-xs">Open in Maps</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
