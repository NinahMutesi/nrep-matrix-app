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
  const firstName = profile?.name?.split(' ')[0] ?? '';

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ backgroundColor: '#054653' }}
    >
      {/* Top bar with logo */}
      <div className="absolute top-0 left-0 right-0 flex items-center gap-3 px-8 py-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <img src="/nrep-logo.png" alt="NREP" className="h-10 w-10 object-contain" />
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest font-bold"
            style={{ color: '#D98E2B' }}>NREP</p>
          <p className="text-xs font-semibold text-white leading-none">
            National Renewable Energy Platform
          </p>
        </div>
      </div>

      {/* Main card */}
      <div
        className="w-full max-w-md rounded-2xl p-8 text-center"
        style={{
          backgroundColor: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.15)',
          marginTop: '80px',
        }}
      >
        {rejected ? (
          <>
            <div className="mb-4 text-5xl">🚫</div>
            <p className="font-mono text-xs uppercase tracking-widest" style={{ color: '#D98E2B' }}>
              Access denied
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold text-white">
              Your request was declined
            </h1>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
              An administrator declined this access request. Contact the NREP Secretariat
              if you believe this is a mistake.
            </p>
          </>
        ) : (
          <>
            {/* Spinning logo */}
            <div className="mb-5 flex justify-center">
              <div className="relative">
                {/* Spinning ring */}
                <div
                  className="h-24 w-24 rounded-full border-4 animate-spin"
                  style={{
                    borderColor: 'rgba(217,142,43,0.2)',
                    borderTopColor: '#D98E2B',
                  }}
                />
                {/* Logo in center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src="/nrep-logo.png"
                    alt="NREP"
                    className="h-14 w-14 object-contain"
                  />
                </div>
              </div>
            </div>

            <p className="font-mono text-xs uppercase tracking-widest" style={{ color: '#D98E2B' }}>
              Awaiting approval
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold text-white">
              {firstName ? `Hold tight, ${firstName}` : 'Hold tight'}
            </h1>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
              An administrator needs to set your role and assign you to a section
              before you can view the implementation matrix.
              This usually only takes a short while.
            </p>

            <div
              className="mt-5 rounded-lg px-4 py-3 text-sm text-left"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
            >
              <span className="text-xs uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Registered as
              </span>
              <p className="mt-0.5 font-medium text-white">{profile?.name}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{profile?.email}</p>
            </div>
          </>
        )}

        {/* Buttons */}
        <div className="mt-6 flex justify-center gap-3">
          {!rejected && (
            <button
              onClick={() => refresh()}
              className="rounded-lg border-2 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
              style={{ borderColor: 'rgba(255,255,255,0.3)' }}
            >
              Check again
            </button>
          )}
          <button
            onClick={() => logout().then(() => router.replace('/login'))}
            className="rounded-lg px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            style={{ backgroundColor: '#D98E2B' }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
