import Link from 'next/link';
import ProductForm from '@/components/ProductForm';

export default function NewProductPage() {
  return (
    <div>
      <Link href="/products" className="text-sm font-semibold text-gold hover:underline">← All products</Link>
      <h1 className="mt-2 mb-6 font-display text-3xl font-semibold">New Product</h1>
      <ProductForm />
    </div>
  );
}
