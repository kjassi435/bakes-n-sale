'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import ProductForm from '@/components/ProductForm';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <Link href="/products" className="text-sm font-semibold text-gold hover:underline">← All products</Link>
      <h1 className="mt-2 mb-6 font-display text-3xl font-semibold">Edit Product</h1>
      <ProductForm productId={id} />
    </div>
  );
}
