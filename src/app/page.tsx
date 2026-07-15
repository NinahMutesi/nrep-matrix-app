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
    <div className="flex h-screen flex-col items-center justify-center" style={{ backgroundColor: '#054653' }}>
      {/* Spinning NREP logo */}
      <div className="relative">
        <div
          className="h-28 w-28 rounded-full border-4 animate-spin"
          style={{ borderColor: 'rgba(217,142,43,0.2)', borderTopColor: '#D98E2B' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <img src="/nrep-logo.png" alt="NREP" className="h-16 w-16 object-contain" />
        </div>
      </div>
      <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.4)' }}>
        Loading…
      </p>
    </div>
  );
}
