'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { isAdmin, isSystemAdmin, canAccessReviewQueue } from '@/lib/permissions';

const BRAND = '#054653';
const ACTIVE = '#D98E2B';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, logout } = useAuth();
  const adminUser = isAdmin(profile);
  const systemAdmin = isSystemAdmin(profile);
  const sectionAdmin = adminUser && !systemAdmin;
  const showReviews = canAccessReviewQueue(profile);
  const isMember = profile?.role === 'member';

  const navStyle = (active: boolean) => ({
    backgroundColor: active ? ACTIVE : 'transparent',
    color: active ? '#16322A' : 'rgba(255,255,255,0.82)',
    fontWeight: active ? 600 : 400,
  });

  return (
    <aside className="flex h-screen w-60 flex-col justify-between text-white" style={{ backgroundColor: BRAND }}>
      <div>
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <img src="/nrep-logo.png" alt="NREP" className="h-9 w-9 object-contain" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest font-bold" style={{ color: ACTIVE }}>NREP</p>
            <p className="text-xs font-semibold text-white leading-tight">Implementation Matrix</p>
          </div>
        </div>

        <nav className="mt-2 space-y-0.5 px-3">
          <Link href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition"
            style={navStyle(pathname === '/dashboard' && !pathname.includes('mode'))}>
            <span className="font-mono text-[10px] opacity-50">00</span>Dashboard
          </Link>

          <Link href="/matrix"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition"
            style={navStyle(pathname.startsWith('/matrix'))}>
            <span className="font-mono text-[10px] opacity-50">01</span>Matrix
          </Link>

          <Link href="/analysis"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition"
            style={navStyle(pathname.startsWith('/analysis'))}>
            <span className="font-mono text-[10px] opacity-50">02</span>Analysis
          </Link>

          {/* My Section — for members and section admins */}
          {(isMember || sectionAdmin) && (
            <Link href="/dashboard?mode=my_section"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition"
              style={navStyle(pathname.includes('mode=my_section'))}>
              <span className="font-mono text-[10px] opacity-50">03</span>My Section
            </Link>
          )}

          {/* My Reviews — members only */}
          {isMember && (
            <Link href="/my-reviews"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition"
              style={navStyle(pathname.startsWith('/my-reviews'))}>
              <span className="font-mono text-[10px] opacity-50">04</span>My Reviews
            </Link>
          )}

          {/* Admin Overview — system admin (Dr. Mukisa) */}
          {systemAdmin && (
            <Link href="/dashboard?mode=my_section"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition"
              style={navStyle(pathname.includes('mode=my_section'))}>
              <span className="font-mono text-[10px] opacity-50">03</span>Admin Overview
            </Link>
          )}

          {/* Comments & Reviews — admins only */}
          {adminUser && (
            <Link href="/admin-comments"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition"
              style={navStyle(pathname.startsWith('/admin-comments'))}>
              <span className="font-mono text-[10px] opacity-50">{systemAdmin ? '04' : '04'}</span>
              {systemAdmin ? 'All Comments' : 'Section Comments'}
            </Link>
          )}

          {/* Review queue */}
          {showReviews && (
            <Link href="/admin/review"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition"
              style={navStyle(pathname.startsWith('/admin/review'))}>
              <span className="font-mono text-[10px] opacity-50">05</span>Review queue
            </Link>
          )}

          {/* Admin panel */}
          {adminUser && (
            <Link href="/admin"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition"
              style={navStyle(pathname === '/admin')}>
              <span className="font-mono text-[10px] opacity-50">06</span>Admin
            </Link>
          )}
        </nav>
      </div>

      <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Link href="/account" className="flex items-center gap-2 mb-3 rounded-lg p-1 hover:bg-white/10 transition">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{ backgroundColor: ACTIVE, color: '#16322A' }}>
            {profile?.name?.[0] ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{profile?.name}</p>
            <p className="font-mono text-[10px]" style={{ color: ACTIVE }}>Change password →</p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <a href="/guest" target="_blank" className="font-mono text-[10px] uppercase tracking-wider hover:underline"
            style={{ color: 'rgba(255,255,255,0.4)' }}>Public view ↗</a>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <button onClick={() => logout().then(() => router.replace('/login'))}
            className="font-mono text-[10px] uppercase tracking-wider hover:underline"
            style={{ color: ACTIVE }}>Sign out</button>
        </div>
      </div>
    </aside>
  );
}
