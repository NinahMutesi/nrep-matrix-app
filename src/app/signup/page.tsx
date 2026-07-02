'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/components/AuthShell';
import { useAuth } from '@/lib/auth-context';

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signup(name, email, password);
      router.replace('/pending');
    } catch (err: any) {
      setError(err?.message ?? 'Could not create your account. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell eyebrow="Request access" title="Create an account">
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block font-mono text-xs uppercase tracking-wider text-charcoal/50">
            Full name
          </span>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="auth-input" />
        </label>
        <label className="block">
          <span className="mb-1 block font-mono text-xs uppercase tracking-wider text-charcoal/50">
            Email
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
          />
        </label>
        <label className="block">
          <span className="mb-1 block font-mono text-xs uppercase tracking-wider text-charcoal/50">
            Password
          </span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
          />
        </label>
        {error && <p className="text-sm text-clay">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-sm bg-ink py-3 font-mono text-sm uppercase tracking-wider text-parchment transition hover:bg-inkdeep disabled:opacity-50"
        >
          {busy ? 'Submitting…' : 'Request access'}
        </button>
        <p className="text-xs leading-relaxed text-charcoal/50">
          An administrator will review your request, set your role, and assign you to a section.
          You will get access to the matrix as soon as that is done.
        </p>
      </form>
    </AuthShell>
  );
}
