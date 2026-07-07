'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { useAuth } from '@/lib/auth-context';
import { isAdmin } from '@/lib/permissions';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', code: '00' },
  { href: '/matrix', label: 'Matrix', code: '01' },
  { href: '/analysis', label: 'Analysis', code: '02' },
];

const SIDEBAR_BG = '#054653';
const ACTIVE_BG = '#D98E2B';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, logout } = useAuth();
  const admin = isAdmin(profile);

  return (
    <aside
      className="flex h-screen w-60 flex-col justify-between text-white"
      style={{ backgroundColor: SIDEBAR_BG }}
    >
      <div>
        {/* Logo area */}
        <div className="px-6 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: '#D98E2B' }}>
            NREP · SP
          </p>
          <p className="mt-1 font-display text-lg leading-tight text-white">
            Implementation Matrix
          </p>
        </div>

        {/* Nav links */}
        <nav className="mt-3 space-y-0.5 px-3">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition"
                style={{
                  backgroundColor: active ? ACTIVE_BG : 'transparent',
                  color: active ? '#16322A' : 'rgba(255,255,255,0.75)',
                  fontWeight: active ? 600 : 400,
                }}
              >
                <span className="font-mono text-[10px] opacity-60">{item.code}</span>
                {item.label}
              </Link>
            );
          })}

          {(admin || profile?.role === 'analyst') && (
            <Link
              href="/admin/review"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition"
              style={{
                backgroundColor: pathname.startsWith('/admin/review') ? ACTIVE_BG : 'transparent',
                color: pathname.startsWith('/admin/review') ? '#16322A' : 'rgba(255,255,255,0.75)',
                fontWeight: pathname.startsWith('/admin/review') ? 600 : 400,
              }}
            >
              <span className="font-mono text-[10px] opacity-60">04</span>
              Review queue
            </Link>
          )}

          {admin && (
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition"
              style={{
                backgroundColor: pathname === '/admin' ? ACTIVE_BG : 'transparent',
                color: pathname === '/admin' ? '#16322A' : 'rgba(255,255,255,0.75)',
                fontWeight: pathname === '/admin' ? 600 : 400,
              }}
            >
              <span className="font-mono text-[10px] opacity-60">05</span>
              Admin
            </Link>
          )}
        </nav>
      </div>

      {/* Footer */}
      <div
        className="px-6 py-5"
        style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="flex items-center gap-2 mb-1">
          {/* Avatar circle */}
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{ backgroundColor: ACTIVE_BG, color: '#16322A' }}
          >
            {profile?.name?.[0] ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{profile?.name}</p>
            <p className="truncate font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {profile?.role === 'super_admin' ? '★ Super Admin' : profile?.role}
              {profile?.sectionSlugs?.length ? ` · ${profile.sectionSlugs.length} section(s)` : ''}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <a
            href="/guest"
            target="_blank"
            className="font-mono text-[10px] uppercase tracking-wider hover:underline"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            Public view ↗
          </a>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <button
            onClick={() => logout().then(() => router.replace('/login'))}
            className="font-mono text-[10px] uppercase tracking-wider hover:underline"
            style={{ color: ACTIVE_BG }}
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
