'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { ProgressBadge, ProgressBar } from '@/components/ProgressBadge';
import { useMatrixData, targetsForResult } from '@/lib/use-matrix-data';
import { exportMatrixCsv } from '@/lib/export-csv';
import { averageProgress } from '@/lib/progress';
import { getPctColors, getProgressBand, getBandColors, BAND_LABELS } from '@/lib/progress-bands';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/lib/auth-context';
import { Suspense } from 'react';
import type { ResultDoc, TargetDoc } from '@/types';

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardPageInner />
    </Suspense>
  );
}

type DashMode = 'overview' | 'my_section';

function DashboardPageInner() {
  const { data, loading, error } = useMatrixData();
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const modeFromUrl = searchParams.get('mode') as DashMode | null;
  const [mode, setMode] = useState<DashMode>(modeFromUrl === 'my_section' ? 'my_section' : 'overview');

  const myTargets = useMemo(() => {
    if (!data || !profile) return [];
    return data.targets.filter((t) =>
      profile.sectionSlugs.includes(t.sectionSlug) ||
      t.assignedUserIds.includes(profile.userId)
    );
  }, [data, profile]);

  const overallPct = useMemo(() => {
    if (!data) return 0;
    return averageProgress(data.targets.map((t) => t.progressPercent ?? 0));
  }, [data]);

  // Separate R1-R5 (strategic results) from R6 (recommendations)
  const strategicResults = useMemo(() => data?.results.filter(r => r.code !== 'R6') ?? [], [data]);
  const r6 = useMemo(() => data?.results.find(r => r.code === 'R6'), [data]);

  const resultUpdateSummary = useMemo(() => {
    if (!data) return {};
    const map: Record<string, { updated: number; stale: number; noUpdate: number }> = {};
    for (const result of data.results) {
      const rTargets = data.targets.filter((t) => t.resultId === result.$id);
      let updated = 0, stale = 0, noUpdate = 0;
      for (const t of rTargets) {
        if (!t.updatedAt) { noUpdate++; continue; }
        const days = Math.floor((Date.now() - new Date(t.updatedAt).getTime()) / 86400000);
        if (days <= 30) updated++;
        else if (days <= 90) stale++;
        else noUpdate++;
      }
      map[result.$id] = { updated, stale, noUpdate };
    }
    return map;
  }, [data]);

  const overallColors = getPctColors(overallPct);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-clay">NREP Strategic Plan 2023–2028</p>
            <h1 className="mt-0.5 font-display text-3xl text-ink">Welcome, {profile?.name?.split(' ')[0]}</h1>
          </div>
          <div className="flex items-center gap-3">
            {data && (
              <button
                onClick={() => exportMatrixCsv(data)}
                className="border px-4 py-2 font-mono text-xs uppercase tracking-wider text-ink hover:text-parchment transition"
                style={{ borderColor: '#054653' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#054653'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#1A1A1A'; }}
              >
                Download full matrix
              </button>
            )}
          </div>
        </div>

        {/* Mode toggle */}
        <div className="mt-6 flex gap-0 border border-line w-fit">
          {(['overview', 'my_section'] as DashMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-4 py-2 font-mono text-xs uppercase tracking-wider transition"
              style={mode === m ? { backgroundColor: '#054653', color: 'white' } : { color: '#666' }}
            >
              {m === 'overview' ? 'All Results' : 'My Section'}
            </button>
          ))}
        </div>

        {loading && <p className="mt-10 font-mono text-sm text-charcoal/50">Loading…</p>}
        {error && <p className="mt-10 text-sm text-clay">{error}</p>}

        {data && mode === 'overview' && (
          <>
            {/* Summary stats */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryTile label="Overall progress" value={`${overallPct}%`} color={overallColors.badge} bg={overallColors.bg} />
              <SummaryTile label="Results" value={String(strategicResults.length)} />
              <SummaryTile label="Targets at risk" value={String(data.targets.filter((t) => t.status === 'at_risk' || t.status === 'delayed').length)} color="#DC2626" bg="#FEE2E2" />
              <SummaryTile label="Completed" value={String(data.targets.filter((t) => t.status === 'completed').length)} color="#054653" bg="#ECFDF5" />
            </div>

            {/* Band legend with Exceptional */}
            <div className="mt-4 flex flex-wrap items-center gap-3 bg-white px-4 py-2.5" style={{ borderRadius: '8px', border: '1px solid #D0D8DA' }}>
              <p className="font-mono text-[10px] uppercase tracking-wider text-charcoal/40">Performance bands:</p>
              {([
                { band: 'very_poor', range: '0–25%', pct: 10 },
                { band: 'poor', range: '26–50%', pct: 35 },
                { band: 'fair', range: '51–75%', pct: 60 },
                { band: 'good', range: '76–100%', pct: 85 },
                { band: 'exceptional', range: '> 100%', pct: 110 },
              ] as const).map(({ band, range, pct }) => {
                const c = getBandColors(band);
                return (
                  <span key={band} className="flex items-center gap-1.5 font-mono text-[10px]">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.bar }} />
                    <span style={{ color: c.badge }}>{range} {BAND_LABELS[band]}</span>
                  </span>
                );
              })}
            </div>

            {/* 5 strategic result cards */}
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {strategicResults.map((result) => {
                const targets = targetsForResult(data, result.$id);
                const summary = resultUpdateSummary[result.$id] ?? { updated: 0, stale: 0, noUpdate: 0 };
                return <ResultCard key={result.$id} result={result} targets={targets} summary={summary} />;
              })}
            </div>

            {/* R6 as a link, not a card */}
            {r6 && (
              <Link
                href={`/matrix?result=${r6.$id}`}
                className="mt-3 flex items-center justify-between rounded-lg border px-5 py-3 transition hover:shadow-sm"
                style={{ borderColor: '#D98E2B', borderLeft: '4px solid #D98E2B', backgroundColor: '#FFFBEB' }}
              >
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: '#D97706' }}>R6 — Recommendations & Lessons Learned</p>
                  <p className="text-sm text-charcoal/70">View all recommendation targets and tracked actions →</p>
                </div>
                <span className="font-mono text-xs" style={{ color: '#D97706' }}>
                  {targetsForResult(data, r6.$id).length} targets
                </span>
              </Link>
            )}
          </>
        )}

        {data && mode === 'my_section' && (
          <MySectionView targets={myTargets} data={data} profile={profile} />
        )}
      </div>
    </AppShell>
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

function ResultCard({ result, targets, summary }: {
  result: ResultDoc;
  targets: TargetDoc[];
  summary: { updated: number; stale: number; noUpdate: number };
}) {
  const pct = averageProgress(targets.map((t) => t.progressPercent ?? 0));
  const colors = getPctColors(pct);
  const completed = targets.filter((t) => t.status === 'completed').length;
  const atRisk = targets.filter((t) => t.status === 'at_risk' || t.status === 'delayed').length;

  return (
    <Link
      href={`/matrix?result=${result.$id}`}
      className="block bg-white p-5 transition hover:shadow-md"
      style={{ borderRadius: '10px', border: `1.5px solid ${colors.border}`, borderLeft: `4px solid #054653` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: '#054653' }}>{result.code}</p>
          <h3 className="mt-0.5 font-display text-[15px] leading-snug text-ink line-clamp-2">{result.title}</h3>
        </div>
        <ProgressBadge percent={pct} showLabel={false} size="sm" />
      </div>
      <div className="mt-3">
        <ProgressBar percent={pct} height={6} />
      </div>
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
        <p className="font-display text-xl text-ink">No tasks assigned to your section yet.</p>
        <p className="mt-2 text-sm text-charcoal/60">An administrator will assign you to a section.</p>
      </div>
    );
  }

  const pct = averageProgress(targets.map((t) => t.progressPercent ?? 0));
  const colors = getPctColors(pct);

  return (
    <div className="mt-6">
      <div className="mb-5 bg-white p-5" style={{ borderRadius: '10px', border: `1.5px solid ${colors.border}`, borderLeft: '4px solid #054653' }}>
        <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: '#054653' }}>Your section — {targets.length} targets</p>
        <div className="mt-2 flex flex-wrap items-center gap-6">
          <div>
            <p className="font-display text-3xl text-ink">{pct}%</p>
            <ProgressBadge percent={pct} showLabel size="sm" />
          </div>
          <div className="grid grid-cols-3 gap-4 font-mono text-xs">
            <div><p className="font-bold" style={{ color: '#054653' }}>{targets.filter(t => t.status === 'completed').length}</p><p className="text-charcoal/50">Completed</p></div>
            <div><p className="font-bold text-clay">{targets.filter(t => t.status === 'at_risk' || t.status === 'delayed').length}</p><p className="text-charcoal/50">At risk</p></div>
            <div><p className="font-bold text-charcoal/70">{targets.filter(t => t.status === 'not_started').length}</p><p className="text-charcoal/50">Not started</p></div>
          </div>
        </div>
        <div className="mt-3"><ProgressBar percent={pct} height={8} /></div>
      </div>

      <div className="space-y-2">
        {targets.map((t) => {
          const output = data.outputs.find((o: any) => o.$id === t.outputId);
          const result = data.results.find((r: any) => r.$id === t.resultId);
          const tc = getPctColors(t.progressPercent ?? 0);
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
