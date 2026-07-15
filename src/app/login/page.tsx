'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/components/AuthShell';
import { useAuth } from '@/lib/auth-context';
import { account } from '@/lib/appwrite/client';

export default function LoginPage() {
  const { login, loading, authUser, profile } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!authUser) return;
    router.replace(profile?.status === 'approved' ? '/dashboard' : '/pending');
  }, [loading, authUser, profile, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      router.replace('/dashboard');
    } catch (err: any) {
      if (err?.message?.includes('session is active')) {
        try {
          await account.deleteSession('current');
          await login(email, password);
          router.replace('/dashboard');
          return;
        } catch (retryErr: any) {
          setError(retryErr?.message ?? 'Could not sign you in. Try again.');
        }
      } else {
        setError(err?.message ?? 'Could not sign you in. Check your details and try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell eyebrow="Sign in" title="Welcome back">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
          />
        </Field>
        {error && <p className="text-sm text-clay">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-sm py-3 font-mono text-sm uppercase tracking-wider text-white transition disabled:opacity-50"
          style={{ backgroundColor: '#054653' }}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-sm text-charcoal/60">
        New here?{' '}
        <Link href="/signup" className="font-medium underline" style={{ color: '#054653' }}>
          Request access
        </Link>
      </p>
    </AuthShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-xs uppercase tracking-wider text-charcoal/50">
        {label}
      </span>
      {children}
    </label>
  );
}
