import { Suspense } from 'react';
import type { Metadata } from 'next';
import ShopClient from '@/components/ShopClient';

export const metadata: Metadata = {
  title: 'Shop — Bakes n Sale | Biscuits, Cookies, Rusks, Cakes & More | Howrah',
  description: 'Shop Bakes n Sale — 8 categories: Biscuits (10), Cookies (5), Rusks & Toasts, Regional Specialties, Dry Cakes, Soft Bakery, Savory Snacks, Gift Hampers. Mrs. Tanuja — Howrah 711103. Call 7890027798.',
  openGraph: {
    title: 'Shop — Bakes n Sale',
    description: 'Biscuits, Cookies, Rusks, Regional Specialties, Dry Cakes, Soft Bakery, Savory Snacks, Gift Hampers — Howrah.',
    images: ['/logo.jpeg'],
  },
};

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container-x py-24 text-center text-mocha">Loading the collection…</div>}>
      <ShopClient />
    </Suspense>
  );
}
