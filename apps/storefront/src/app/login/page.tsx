'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useStore } from '@/lib/store';

function LoginForm() {
  const { login } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      router.push(next);
    } catch (err: any) {
      setError(err.message ?? 'Login failed');
      setBusy(false);
    }
  };

  return (
    <div className="container-x flex justify-center py-16">
      <div className="card-lux w-full max-w-md p-9">
        <p className="eyebrow text-center">Welcome Back</p>
        <h1 className="mt-2 text-center font-display text-3xl font-semibold">Sign In</h1>
        <p className="mt-2 text-center text-sm text-mocha">Fresh bakes and faster checkout await.</p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <input type="email" required placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="input-lux" />
          <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-lux" />
          {error && <p className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700">{error}</p>}
          <button disabled={busy} className="btn-gold w-full">{busy ? 'Signing in…' : 'Sign In'}</button>
        </form>

        <p className="mt-6 text-center text-sm text-mocha">
          New to Bakes n Sale?{' '}
          <Link href={`/register${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-semibold text-gold hover:underline">
            Create an account
          </Link>
        </p>

        <div className="mt-6 rounded-xl bg-cream/70 p-4 text-xs text-mocha">
          <p className="font-bold text-espresso">Demo customer</p>
          <p>priya@example.com · Priya@123</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
