'use client';

import { useMemo, useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { ProgressBadge, ProgressBar } from '@/components/ProgressBadge';
import { useMatrixData, targetsForResult } from '@/lib/use-matrix-data';
import { exportMatrixCsv } from '@/lib/export-csv';
import { averageProgress } from '@/lib/progress';
import { getPctColors, getBandColors, BAND_LABELS } from '@/lib/progress-bands';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/lib/auth-context';
import { isAdmin } from '@/lib/permissions';
import type { ResultDoc, TargetDoc } from '@/types';

export default function DashboardPage() {
  return <Suspense fallback={null}><DashboardPageInner /></Suspense>;
}

type DashMode = 'overview' | 'my_section';

function DashboardPageInner() {
  const { data, loading, error } = useMatrixData();
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const modeFromUrl = searchParams.get('mode') as DashMode | null;
  const [mode, setMode] = useState<DashMode>(modeFromUrl === 'my_section' ? 'my_section' : 'overview');

  const adminUser = isAdmin(profile);
  // System admin = admin with no sections (Dr. Mukisa, Derrick)
  const isSystemAdmin = adminUser && (!profile?.sectionSlugs || profile.sectionSlugs.length === 0);

  const myTargets = useMemo(() => {
    if (!data || !profile) return [];
    // System admin sees ALL targets
    if (isSystemAdmin) return data.targets;
    // Everyone else: ONLY targets where they are personally assigned
    // Fixed: use assignedUserIds not sectionSlugs
    return data.targets.filter((t) => t.assignedUserIds.includes(profile.userId));
  }, [data, profile, isSystemAdmin]);

  const strategicResults = useMemo(() => data?.results.filter(r => r.code !== 'R6') ?? [], [data]);
  const r6 = useMemo(() => data?.results.find(r => r.code === 'R6'), [data]);
  const overallPct = useMemo(() => {
    if (!data) return 0;
    return averageProgress(data.targets.map((t) => t.progressPercent ?? 0));
  }, [data]);
  const overallColors = getPctColors(overallPct);

  const resultUpdateSummary = useMemo(() => {
    if (!data) return {};
    const map: Record<string, { updated: number; stale: number; noUpdate: number }> = {};
    for (const result of data.results) {
      const rTargets = data.targets.filter((t) => t.resultId === result.$id);
      let updated = 0, stale = 0, noUpdate = 0;
      for (const t of rTargets) {
        if (!t.updatedAt) { noUpdate++; continue; }
        const days = Math.floor((Date.now() - new Date(t.updatedAt).getTime()) / 86400000);
        if (days <= 30) updated++; else if (days <= 90) stale++; else noUpdate++;
      }
      map[result.$id] = { updated, stale, noUpdate };
    }
    return map;
  }, [data]);

  const myTabLabel = isSystemAdmin ? 'Admin Overview' : 'My Section';

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-clay">NREP Strategic Plan 2023–2028</p>
            <h1 className="mt-0.5 font-display text-3xl text-ink">Welcome, {profile?.name?.split(' ')[0]}</h1>
          </div>
          {data && (
            <button onClick={() => exportMatrixCsv(data)}
              className="border px-4 py-2 font-mono text-xs uppercase tracking-wider transition"
              style={{ borderColor: '#054653', color: '#054653' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#054653'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#054653'; }}>
              Download full matrix
            </button>
          )}
        </div>

        {/* Mode toggle */}
        <div className="mt-6 flex border border-line w-fit">
          {(['overview', 'my_section'] as DashMode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className="px-4 py-2 font-mono text-xs uppercase tracking-wider transition"
              style={mode === m ? { backgroundColor: '#054653', color: 'white' } : { color: '#666' }}>
              {m === 'overview' ? 'All Results' : myTabLabel}
            </button>
          ))}
        </div>

        {loading && <p className="mt-10 font-mono text-sm text-charcoal/50">Loading…</p>}
        {error && <p className="mt-10 text-sm text-clay">{error}</p>}

        {data && mode === 'overview' && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryTile label="Overall progress" value={`${overallPct}%`} color={overallColors.badge} bg={overallColors.bg} />
              <SummaryTile label="Results" value={String(strategicResults.length)} />
              <SummaryTile label="At risk" value={String(data.targets.filter(t => t.status === 'at_risk' || t.status === 'delayed').length)} color="#DC2626" bg="#FEE2E2" />
              <SummaryTile label="Completed" value={String(data.targets.filter(t => t.status === 'completed').length)} color="#054653" bg="#ECFDF5" />
            </div>

            {/* Band legend */}
            <div className="mt-4 flex flex-wrap items-center gap-3 bg-white px-4 py-2.5" style={{ borderRadius: '8px', border: '1px solid #D0D8DA' }}>
              <p className="font-mono text-[10px] uppercase tracking-wider text-charcoal/40">Performance bands:</p>
              {([
                { range: '0–20', label: 'Very Poor', color: '#DC2626' },
                { range: '21–40', label: 'Poor', color: '#EA580C' },
                { range: '41–60', label: 'Fair', color: '#D97706' },
                { range: '61–80', label: 'Good', color: '#059669' },
                { range: '81–100', label: 'Very Good', color: '#054653' },
                { range: '101+', label: 'Exceptional ⭐', color: '#D98E2B' },
              ]).map(({ range, label, color }) => (
                <span key={range} className="flex items-center gap-1.5 font-mono text-[10px]">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span style={{ color }}>{range} {label}</span>
                </span>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {strategicResults.map((result) => {
                const targets = targetsForResult(data, result.$id);
                const summary = resultUpdateSummary[result.$id] ?? { updated: 0, stale: 0, noUpdate: 0 };
                return <ResultCard key={result.$id} result={result} targets={targets} summary={summary} />;
              })}
            </div>

            {r6 && (
              <Link href={`/matrix?result=${r6.$id}`}
                className="mt-3 flex items-center justify-between rounded-lg border px-5 py-3 transition hover:shadow-sm"
                style={{ borderColor: '#D98E2B', borderLeft: '4px solid #D98E2B', backgroundColor: '#FFFBEB' }}>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: '#D97706' }}>R6 — Recommendations & Lessons Learned</p>
                  <p className="text-sm text-charcoal/70">View all recommendation targets →</p>
                </div>
                <span className="font-mono text-xs" style={{ color: '#D97706' }}>{targetsForResult(data, r6.$id).length} targets</span>
              </Link>
            )}
          </>
        )}

        {data && mode === 'my_section' && (
          isSystemAdmin
            ? <AdminOverview data={data} />
            : <MySectionView targets={myTargets} data={data} profile={profile} />
        )}
      </div>
    </AppShell>
  );
}

/** Admin overview for Dr. Mukisa — aggregated team progress */
function AdminOverview({ data }: { data: any }) {
  const overallPct = averageProgress(data.targets.map((t: any) => t.progressPercent ?? 0));
  const completed  = data.targets.filter((t: any) => t.status === 'completed').length;
  const atRisk     = data.targets.filter((t: any) => t.status === 'at_risk' || t.status === 'delayed').length;
  const inProgress = data.targets.filter((t: any) => t.status === 'in_progress' || t.status === 'on_track').length;
  const notStarted = data.targets.filter((t: any) => t.status === 'not_started').length;

  const resultBreakdown = data.results.filter((r: any) => r.code !== 'R6').map((result: any) => {
    const targets = data.targets.filter((t: any) => t.resultId === result.$id);
    const pct     = averageProgress(targets.map((t: any) => t.progressPercent ?? 0));
    const done    = targets.filter((t: any) => t.status === 'completed').length;
    const risk    = targets.filter((t: any) => t.status === 'at_risk' || t.status === 'delayed').length;
    return { result, targets, pct, done, risk };
  });

  // Recent activity — last updated targets
  const recentTargets = [...data.targets]
    .filter((t: any) => t.updatedAt)
    .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 15);

  return (
    <div className="mt-6">
      {/* System-wide summary */}
      <div className="mb-6 rounded-lg bg-white p-5" style={{ border: '2px solid #054653' }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#054653' }}>
          Full system — {data.targets.length} targets across {data.results.filter((r:any) => r.code !== 'R6').length} results
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
          {[
            { label: 'Overall', value: `${overallPct}%`, color: '#054653' },
            { label: 'Completed', value: String(completed), color: '#059669' },
            { label: 'In progress', value: String(inProgress), color: '#D97706' },
            { label: 'At risk', value: String(atRisk), color: '#DC2626' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg border p-3 text-center" style={{ borderColor: '#E5E7EB' }}>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-gray-400">{label}</p>
            </div>
          ))}
        </div>
        <ProgressBar percent={overallPct} height={10} />
      </div>

      {/* Per-result breakdown */}
      <p className="mb-3 font-mono text-xs font-bold uppercase tracking-wider" style={{ color: '#054653' }}>
        Progress by result
      </p>
      <div className="mb-6 space-y-2">
        {resultBreakdown.map(({ result, targets, pct, done, risk }: any) => {
          const colors = getPctColors(pct);
          return (
            <Link key={result.$id} href={`/matrix?result=${result.$id}`}
              className="flex items-center gap-4 rounded-lg bg-white px-4 py-3 transition hover:shadow-sm"
              style={{ border: `1.5px solid ${colors.border}`, borderLeft: '4px solid #054653' }}>
              <p className="w-8 font-mono text-xs font-bold shrink-0" style={{ color: '#054653' }}>{result.code}</p>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{result.title}</p>
                <ProgressBar percent={pct} height={4} />
              </div>
              <div className="shrink-0 text-right">
                <ProgressBadge percent={pct} showLabel={false} size="sm" />
                <p className="font-mono text-[10px] text-gray-400 mt-0.5">
                  {done}/{targets.length} done
                  {risk > 0 && <span className="text-red-500"> · {risk} at risk</span>}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent activity */}
      <p className="mb-3 font-mono text-xs font-bold uppercase tracking-wider" style={{ color: '#054653' }}>
        Recent team activity
      </p>
      <div className="space-y-2">
        {recentTargets.length === 0 && (
          <p className="text-sm text-gray-400 italic">No activity yet — team members have not started updating targets.</p>
        )}
        {recentTargets.map((t: any) => {
          const result = data.results.find((r: any) => r.$id === t.resultId);
          const tc = getPctColors(t.progressPercent ?? 0);
          const days = t.updatedAt ? Math.floor((Date.now() - new Date(t.updatedAt).getTime()) / 86400000) : null;
          return (
            <Link key={t.$id} href={`/matrix/${t.$id}`}
              className="flex items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 transition hover:shadow-sm"
              style={{ border: '1px solid #E5E7EB', borderLeft: '3px solid #054653' }}>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[9px] uppercase tracking-wider text-gray-400">{result?.code} · Target {t.code}</p>
                <p className="text-sm font-medium text-gray-800 line-clamp-1">{t.description}</p>
                <p className="font-mono text-[10px] text-gray-400">
                  {t.leadOrg} {days !== null && `· ${days === 0 ? 'updated today' : days === 1 ? 'updated yesterday' : `updated ${days}d ago`}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ProgressBadge percent={t.progressPercent ?? 0} showLabel={false} size="xs" />
                <StatusBadge status={t.status} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function SummaryTile({ label, value, color, bg }: { label: string; value: string; color?: string; bg?: string }) {
  return (
    <div className="bg-white px-4 py-3" style={{ borderRadius: '8px', border: '1px solid #D0D8DA', backgroundColor: bg ?? '#FFFFFF' }}>
      <p className="font-mono text-[10px] uppercase tracking-wider text-charcoal/50">{label}</p>
      <p className="mt-0.5 font-display text-2xl" style={color ? { color } : { color: '#16322A' }}>{value}</p>
    </div>
  );
}

function ResultCard({ result, targets, summary }: { result: ResultDoc; targets: TargetDoc[]; summary: any }) {
  const pct     = averageProgress(targets.map((t) => t.progressPercent ?? 0));
  const colors  = getPctColors(pct);
  const completed = targets.filter(t => t.status === 'completed').length;
  const atRisk    = targets.filter(t => t.status === 'at_risk' || t.status === 'delayed').length;
  return (
    <Link href={`/matrix?result=${result.$id}`}
      className="block bg-white p-5 transition hover:shadow-md"
      style={{ borderRadius: '10px', border: `1.5px solid ${colors.border}`, borderLeft: `4px solid #054653` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: '#054653' }}>{result.code}</p>
          <h3 className="mt-0.5 font-display text-[15px] leading-snug text-ink line-clamp-2">{result.title}</h3>
        </div>
        <ProgressBadge percent={pct} showLabel={false} size="sm" />
      </div>
      <div className="mt-3"><ProgressBar percent={pct} height={6} /></div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-3 font-mono text-[10px] text-charcoal/50">
          <span>{targets.length} targets</span>
          <span className="font-medium" style={{ color: '#054653' }}>{completed} done</span>
          {atRisk > 0 && <span className="text-clay">{atRisk} at risk</span>}
        </div>
        <ProgressBadge percent={pct} showLabel size="xs" />
      </div>
      <div className="mt-2 border-t border-line pt-2 flex gap-3 font-mono text-[10px]">
        <span style={{ color: '#054653' }}>▲ {summary.updated} recent</span>
        {summary.stale > 0 && <span className="text-amber">{summary.stale} stale</span>}
        {summary.noUpdate > 0 && <span className="text-charcoal/40">{summary.noUpdate} no update</span>}
      </div>
    </Link>
  );
}

function MySectionView({ targets, data, profile }: { targets: TargetDoc[]; data: any; profile: any }) {
  if (!targets.length) {
    return (
      <div className="mt-8 bg-white px-6 py-10 text-center" style={{ borderRadius: '10px', border: '1px solid #D0D8DA' }}>
        <p className="text-4xl mb-3">📋</p>
        <p className="font-display text-xl text-ink">No targets assigned to you yet.</p>
        <p className="mt-2 text-sm text-charcoal/60">
          Contact Dr. Mukisa or Ninah Mutesi to get your targets assigned.
        </p>
      </div>
    );
  }

  const pct    = averageProgress(targets.map(t => t.progressPercent ?? 0));
  const colors = getPctColors(pct);

  return (
    <div className="mt-6">
      {/* My section summary */}
      <div className="mb-5 bg-white p-5" style={{ borderRadius: '10px', border: `1.5px solid ${colors.border}`, borderLeft: '4px solid #054653' }}>
        <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: '#054653' }}>
          Your assigned targets — {targets.length} total
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-6">
          <div>
            <p className="font-display text-3xl text-ink">{pct}%</p>
            <ProgressBadge percent={pct} showLabel size="sm" />
          </div>
          <div className="grid grid-cols-3 gap-4 font-mono text-xs">
            <div>
              <p className="font-bold" style={{ color: '#054653' }}>{targets.filter(t => t.status === 'completed').length}</p>
              <p className="text-charcoal/50">Done</p>
            </div>
            <div>
              <p className="font-bold text-clay">{targets.filter(t => t.status === 'at_risk' || t.status === 'delayed').length}</p>
              <p className="text-charcoal/50">At risk</p>
            </div>
            <div>
              <p className="font-bold text-charcoal/70">{targets.filter(t => t.status === 'not_started').length}</p>
              <p className="text-charcoal/50">Not started</p>
            </div>
          </div>
        </div>
        <div className="mt-3"><ProgressBar percent={pct} height={8} /></div>
      </div>

      {/* Target list */}
      <div className="space-y-2">
        {targets.map((t) => {
          const output = data.outputs.find((o: any) => o.$id === t.outputId);
          const result = data.results.find((r: any) => r.$id === t.resultId);
          const tc     = getPctColors(t.progressPercent ?? 0);
          return (
            <Link key={t.$id} href={`/matrix/${t.$id}?from=my_section`}
              className="flex items-center justify-between gap-4 bg-white px-4 py-3 transition hover:shadow-sm"
              style={{ borderRadius: '8px', border: `1px solid ${tc.border}`, borderLeft: '3px solid #054653' }}>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[9px] uppercase tracking-wider text-charcoal/40">
                  {result?.code} · Output {output?.code} · Target {t.code}
                </p>
                <p className="mt-0.5 text-sm font-medium text-ink line-clamp-1">{t.description}</p>
                <p className="font-mono text-[10px] text-charcoal/50">{t.leadOrg} · {t.timeline ?? '—'}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ProgressBadge percent={t.progressPercent ?? 0} showLabel={false} size="xs" />
                <StatusBadge status={t.status} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
