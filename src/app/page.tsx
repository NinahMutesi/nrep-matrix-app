'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { loading, authUser, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!authUser) return router.replace('/login');
    if (profile?.status !== 'approved') return router.replace('/pending');
    router.replace('/dashboard');
  }, [loading, authUser, profile, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-parchment">
      <p className="font-mono text-sm uppercase tracking-wider text-charcoal/50">Loading…</p>
    </div>
  );
}
