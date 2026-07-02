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

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, logout } = useAuth();
  const admin = isAdmin(profile);

  return (
    <aside className="flex h-screen w-60 flex-col justify-between bg-ink text-parchment">
      <div>
        <div className="px-6 py-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber">NREP · SP</p>
          <p className="mt-1 font-display text-lg leading-tight">Implementation Matrix</p>
        </div>
        <nav className="mt-4 space-y-1 px-3">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition',
                  active ? 'bg-amber text-ink' : 'text-parchment/70 hover:bg-parchment/10 hover:text-parchment'
                )}
              >
                <span className="font-mono text-[10px] opacity-60">{item.code}</span>
                {item.label}
              </Link>
            );
          })}
          {(admin || profile?.role === 'analyst') && (
            <Link
              href="/admin/review"
              className={clsx(
                'flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition',
                pathname.startsWith('/admin/review')
                  ? 'bg-amber text-ink'
                  : 'text-parchment/70 hover:bg-parchment/10 hover:text-parchment'
              )}
            >
              <span className="font-mono text-[10px] opacity-60">04</span>
              Review queue
            </Link>
          )}
          {admin && (
            <Link
              href="/admin"
              className={clsx(
                'flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition',
                pathname === '/admin'
                  ? 'bg-amber text-ink'
                  : 'text-parchment/70 hover:bg-parchment/10 hover:text-parchment'
              )}
            >
              <span className="font-mono text-[10px] opacity-60">05</span>
              Admin
            </Link>
          )}
        </nav>
      </div>
      <div className="border-t border-parchment/10 px-6 py-5">
        <p className="truncate text-sm">{profile?.name}</p>
        <p className="truncate font-mono text-[11px] text-parchment/50">
          {profile?.role} {profile?.sectionSlugs?.length ? `· ${profile.sectionSlugs.length} section(s)` : ''}
        </p>
        <button
          onClick={() => logout().then(() => router.replace('/login'))}
          className="mt-3 font-mono text-[11px] uppercase tracking-wider text-amber hover:underline"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
