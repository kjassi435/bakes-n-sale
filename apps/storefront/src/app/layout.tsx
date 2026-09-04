import type { Metadata } from 'next';
import { Fraunces, Manrope } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/lib/store';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.bakesnsale.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Bakes n Sale — Artisan Bakery & Patisserie | Howrah 711103',
    template: '%s · Bakes n Sale',
  },
  description:
    'Bakes n Sale by Mrs. Tanuja — premium biscuits, cookies, rusks, cakes & more in Howrah 711103. 40+ treasured recipes, 100% veg, FSSAI certified. Bake with honesty, serve with love. Call 7890027798.',
  keywords: ['Bakes n Sale', 'Mrs Tanuja', 'Howrah bakery', 'biscuits', 'cookies', 'rusk', 'nankhatai', 'bakesnsale@gmail.com', 'Howrah 711103'],
  authors: [{ name: 'Mrs. Tanuja', url: `${SITE_URL}/about` }],
  creator: 'Bakes n Sale',
  publisher: 'Bakes n Sale',
  icons: { icon: '/logo.jpeg', shortcut: '/logo.jpeg', apple: '/logo.jpeg' },
  openGraph: {
    title: 'Bakes n Sale — Artisan Bakery & Patisserie',
    description: 'Premium biscuits, cookies, rusks, cakes & more — 40+ recipes by Mrs. Tanuja. Howrah 711103. 82/7 Shaikh Para Lane. Call 7890027798.',
    url: SITE_URL,
    siteName: 'Bakes n Sale',
    images: [{ url: '/logo.jpeg', width: 800, height: 800, alt: 'Bakes n Sale — Artisan Bakery Logo' }],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bakes n Sale — Artisan Bakery | Howrah',
    description: 'Premium bakery by Mrs. Tanuja — bake with honesty, serve with love. Howrah 711103.',
    images: ['/logo.jpeg'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable}`}>
      <body>
        <StoreProvider>
          <Header />
          <main className="min-h-[60vh]">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
