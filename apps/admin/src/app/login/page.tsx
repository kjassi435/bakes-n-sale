'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, setToken } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await api('/auth/login', { method: 'POST', body: { email, password } });
      if (r.user.role === 'CUSTOMER') {
        setError('This account does not have admin access.');
        setBusy(false);
        return;
      }
      setToken(r.accessToken);
      localStorage.setItem('go_admin_user', JSON.stringify(r.user));
      router.replace('/');
    } catch (err: any) {
      setError(err.message ?? 'Login failed');
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-espresso p-6">
      <div className="w-full max-w-md rounded-2xl bg-ivory p-10 shadow-2xl">
        <div className="flex items-center gap-3">
          <img src="/logo.jpeg" alt="Bakes n Sale" className="h-11 w-11 rounded-full border border-gold/50 object-cover" />
          <div>
            <p className="font-display text-xl font-semibold">Bakes n Sale</p>
            <p className="text-[10px] font-bold tracking-[0.3em] text-mocha uppercase">Back Office</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-adm" />
          <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-adm" />
          {error && <p className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700">{error}</p>}
          <button disabled={busy} className="btn-adm w-full">{busy ? 'Signing in…' : 'Sign In'}</button>
        </form>

        <div className="mt-6 rounded-xl bg-cream/70 p-4 text-xs text-mocha">
          <p className="font-bold text-espresso">Demo accounts</p>
          <p className="mt-1">admin@bakesnsale.com · Admin@123</p>
          <p>manager@bakesnsale.com · Manager@123</p>
        </div>
      </div>
    </div>
  );
}
