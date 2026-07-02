'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/Sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { loading, authUser, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!authUser) return router.replace('/login');
    if (profile?.status !== 'approved') return router.replace('/pending');
  }, [loading, authUser, profile, router]);

  if (loading || !authUser || profile?.status !== 'approved') {
    return (
      <div className="flex h-screen items-center justify-center bg-parchment">
        <p className="font-mono text-sm uppercase tracking-wider text-charcoal/50">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="h-screen flex-1 overflow-y-auto bg-parchment">{children}</main>
    </div>
  );
}
