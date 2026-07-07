'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/lib/auth-context';
import { isAdmin } from '@/lib/permissions';
import { authedFetch } from '@/lib/authed-fetch';
import { useMatrixData } from '@/lib/use-matrix-data';
import type { Profile, ResultDoc } from '@/types';
import type { Role, ProfileStatus } from '@/lib/appwrite/config';

export default function AdminPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { data: matrix } = useMatrixData();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin(profile)) {
      router.replace('/dashboard');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, profile]);

  async function load() {
    setLoading(true);
    try {
      const res = await authedFetch('/api/admin/users');
      setProfiles(res.profiles);
    } catch (err: any) {
      setError(err.message ?? 'Could not load users.');
    } finally {
      setLoading(false);
    }
  }

  async function patch(id: string, body: { status?: ProfileStatus; role?: Role; sectionSlugs?: string[] }) {
    setError(null);
    try {
      const res = await authedFetch(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
      setProfiles((prev) => prev.map((p) => (p.$id === id ? res.profile : p)));
    } catch (err: any) {
      setError(err.message ?? 'Update failed.');
    }
  }

  const pending = profiles.filter((p) => p.status === 'pending');
  const others = profiles.filter((p) => p.status !== 'pending');

  if (!isAdmin(profile)) return null;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-8 py-10">
        <p className="font-mono text-xs uppercase tracking-wider text-clay">Admin</p>
        <h1 className="mt-1 font-display text-3xl text-ink">People &amp; access</h1>
        <p className="mt-2 max-w-xl text-sm text-charcoal/60">
          Approve new requests, set each person's role, and assign the sections they're
          responsible for. Section access controls who can edit a task's progress.
        </p>

        {error && <p className="mt-4 text-sm text-clay">{error}</p>}
        {loading && <p className="mt-8 font-mono text-sm text-charcoal/50">Loading…</p>}

        {!loading && (
          <>
            <Section title={`Pending requests (${pending.length})`}>
              {pending.length === 0 && <Empty>No pending requests.</Empty>}
              {pending.map((p) => (
                <UserRow key={p.$id} profile={p} sections={matrix?.sections ?? []} onPatch={patch} callerProfile={profile} />
              ))}
            </Section>

            <Section title={`All people (${others.length})`}>
              {others.map((p) => (
                <UserRow key={p.$id} profile={p} sections={matrix?.sections ?? []} onPatch={patch} callerProfile={profile} />
              ))}
            </Section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <p className="font-mono text-[11px] uppercase tracking-wider text-charcoal/50">{title}</p>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="border border-line bg-white px-4 py-6 text-center font-mono text-xs text-charcoal/40">{children}</p>;
}

function UserRow({
  profile,
  sections,
  onPatch,
  callerProfile,
}: {
  profile: Profile;
  sections: { slug: string; name: string }[];
  onPatch: (id: string, body: { status?: ProfileStatus; role?: Role; sectionSlugs?: string[] }) => void;
  callerProfile: Profile | null;
}) {
  const [role, setRole] = useState<Role>(profile.role);
  const [sectionSlugs, setSectionSlugs] = useState<string[]>(profile.sectionSlugs ?? []);

  function toggleSection(slug: string) {
    setSectionSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  return (
    <div className="border border-line bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-ink">{profile.name}</p>
          <p className="font-mono text-xs text-charcoal/50">{profile.email}</p>
        </div>
        <span
          className={`font-mono text-[10px] uppercase tracking-wider ${
            profile.status === 'approved'
              ? 'text-teal'
              : profile.status === 'rejected'
              ? 'text-clay'
              : 'text-amber'
          }`}
        >
          {profile.status}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="auth-input w-auto">
          <option value="viewer">Viewer</option>
          <option value="member">Member (section editor)</option>
          <option value="analyst">Analyst</option>
          <option value="admin">Admin</option>
          {profile?.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
        </select>

        <details className="relative">
          <summary className="cursor-pointer border border-line px-3 py-2 font-mono text-xs uppercase tracking-wider text-charcoal/60">
            Sections ({sectionSlugs.length})
          </summary>
          <div className="absolute z-10 mt-1 max-h-64 w-64 overflow-y-auto border border-line bg-white p-2 shadow-lg">
            {sections.map((s) => (
              <label key={s.slug} className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-parchment">
                <input type="checkbox" checked={sectionSlugs.includes(s.slug)} onChange={() => toggleSection(s.slug)} />
                {s.name}
              </label>
            ))}
          </div>
        </details>

        <button
          onClick={() => onPatch(profile.$id, { role, sectionSlugs })}
          className="border border-ink px-3 py-2 font-mono text-xs uppercase tracking-wider text-ink hover:bg-ink hover:text-parchment"
        >
          Save role &amp; sections
        </button>

        {profile.status !== 'approved' && (
          <button
            onClick={() => onPatch(profile.$id, { status: 'approved', role, sectionSlugs })}
            className="bg-teal px-3 py-2 font-mono text-xs uppercase tracking-wider text-parchment hover:opacity-90"
          >
            Approve
          </button>
        )}
        {profile.status !== 'rejected' && (
          <button
            onClick={() => onPatch(profile.$id, { status: 'rejected' })}
            className="bg-clay px-3 py-2 font-mono text-xs uppercase tracking-wider text-parchment hover:opacity-90"
          >
            Reject
          </button>
        )}
      </div>
    </div>
  );
}
