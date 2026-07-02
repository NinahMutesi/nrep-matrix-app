'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function PendingPage() {
  const { loading, authUser, profile, logout, refresh } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!authUser) return router.replace('/login');
    if (profile?.status === 'approved') return router.replace('/dashboard');
  }, [loading, authUser, profile, router]);

  const rejected = profile?.status === 'rejected';

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6">
      <div className="max-w-md text-center text-parchment">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber">
          {rejected ? 'Access denied' : 'Awaiting approval'}
        </p>
        <h1 className="mt-3 font-display text-3xl">
          {rejected ? 'Your request was declined' : `Hold tight, ${profile?.name?.split(' ')[0] ?? ''}`}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-parchment/70">
          {rejected
            ? 'An administrator declined this access request. Contact the NREP Secretariat if you believe this is a mistake.'
            : 'An administrator needs to set your role and section before you can view the implementation matrix. This usually only takes a short while.'}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={() => refresh()}
            className="rounded-sm border border-parchment/30 px-4 py-2 font-mono text-xs uppercase tracking-wider text-parchment hover:bg-parchment/10"
          >
            Check again
          </button>
          <button
            onClick={() => logout().then(() => router.replace('/login'))}
            className="rounded-sm bg-amber px-4 py-2 font-mono text-xs uppercase tracking-wider text-ink hover:bg-amberdim"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
