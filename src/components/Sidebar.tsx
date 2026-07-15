'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { isSuperAdmin, canAccessReviewQueue } from '@/lib/permissions';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', code: '00' },
  { href: '/matrix',    label: 'Matrix',    code: '01' },
  { href: '/analysis',  label: 'Analysis',  code: '02' },
];

const BRAND = '#054653';
const ACTIVE = '#D98E2B';

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { profile, logout } = useAuth();

  const superAdmin    = isSuperAdmin(profile);
  const showReviews   = canAccessReviewQueue(profile);

  function navStyle(active: boolean) {
    return {
      backgroundColor: active ? ACTIVE : 'transparent',
      color:           active ? '#16322A' : 'rgba(255,255,255,0.8)',
      fontWeight:      active ? 600 : 400,
    };
  }

  return (
    <aside className="flex h-screen w-60 flex-col justify-between text-white"
      style={{ backgroundColor: BRAND }}>

      {/* Logo */}
      <div>
        <div className="flex items-center gap-3 px-5 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <img src="/nrep-logo.png" alt="NREP" className="h-9 w-9 object-contain" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest font-bold"
              style={{ color: ACTIVE }}>NREP</p>
            <p className="text-xs font-semibold text-white leading-tight">
              Implementation Matrix
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="mt-2 space-y-0.5 px-3">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition"
                style={navStyle(active)}>
                <span className="font-mono text-[10px] opacity-50">{item.code}</span>
                {item.label}
              </Link>
            );
          })}

          {/* Review Queue — section admins + super admin */}
          {showReviews && (
            <Link href="/admin/review"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition"
              style={navStyle(pathname.startsWith('/admin/review'))}>
              <span className="font-mono text-[10px] opacity-50">04</span>
              Review queue
            </Link>
          )}

          {/* Admin panel — ONLY super_admin (Dr. Nicholas) */}
          {superAdmin && (
            <Link href="/admin"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition"
              style={navStyle(pathname === '/admin')}>
              <span className="font-mono text-[10px] opacity-50">05</span>
              Admin
            </Link>
          )}
        </nav>
      </div>

      {/* User footer */}
      <div className="px-5 py-5" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{ backgroundColor: ACTIVE, color: '#16322A' }}>
            {profile?.name?.[0] ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{profile?.name}</p>
            <p className="truncate font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {profile?.role === 'super_admin' ? '★ Super Admin'
                : profile?.role === 'admin' ? 'Section Admin'
                : profile?.role}
              {profile?.sectionSlugs?.length ? ` · ${profile.sectionSlugs.length} section(s)` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <a href="/guest" target="_blank"
            className="font-mono text-[10px] uppercase tracking-wider hover:underline"
            style={{ color: 'rgba(255,255,255,0.4)' }}>
            Public view ↗
          </a>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <button
            onClick={() => logout().then(() => router.replace('/login'))}
            className="font-mono text-[10px] uppercase tracking-wider hover:underline"
            style={{ color: ACTIVE }}>
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
