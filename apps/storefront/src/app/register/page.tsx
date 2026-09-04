'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useStore } from '@/lib/store';

function RegisterForm() {
  const { register } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/';
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register(form.name, form.email, form.password, form.phone || undefined);
      router.push(next);
    } catch (err: any) {
      setError(err.message ?? 'Registration failed');
      setBusy(false);
    }
  };

  return (
    <div className="container-x flex justify-center py-16">
      <div className="card-lux w-full max-w-md p-9">
        <p className="eyebrow text-center">Join the Family</p>
        <h1 className="mt-2 text-center font-display text-3xl font-semibold">Create Account</h1>
        <p className="mt-2 text-center text-sm text-mocha">Earn loyalty points, track orders and check out faster.</p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-lux" />
          <input type="email" required placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-lux" />
          <input placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-lux" />
          <input type="password" required minLength={6} placeholder="Password (min 6 characters)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-lux" />
          {error && <p className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700">{error}</p>}
          <button disabled={busy} className="btn-gold w-full">{busy ? 'Creating account…' : 'Create Account'}</button>
        </form>

        <p className="mt-6 text-center text-sm text-mocha">
          Already have an account?{' '}
          <Link href={`/login${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-semibold text-gold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
