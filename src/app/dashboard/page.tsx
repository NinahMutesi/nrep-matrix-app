'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { ProgressBadge, ProgressBar } from '@/components/ProgressBadge';
import { useMatrixData, targetsForResult } from '@/lib/use-matrix-data';
import { exportMatrixCsv } from '@/lib/export-csv';
import { averageProgress } from '@/lib/progress';
import { getPctColors, getProgressBand, BAND_LABELS } from '@/lib/progress-bands';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/lib/auth-context';
import type { ResultDoc, TargetDoc } from '@/types';

type DashMode = 'overview' | 'my_section';

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const searchParams = useSearchParams();
  const modeFromUrl = searchParams.get('mode') as DashMode | null;
  const { data, loading, error } = useMatrixData();
  const { profile } = useAuth();
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

  const overallColors = getPctColors(overallPct);

  // Aggregate recent comments / updates into a per-result summary count
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

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-8">

        {/* Page header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-clay">
              NREP Strategic Plan 2023–2028
            </p>
            <h1 className="mt-0.5 font-display text-3xl text-ink">
              Welcome, {profile?.name?.split(' ')[0]}
            </h1>
          </div>
          {data && (
            <button
              onClick={() => exportMatrixCsv(data)}
              className="border border-ink px-4 py-2 font-mono text-xs uppercase tracking-wider text-ink hover:bg-ink hover:text-parchment"
            >
              Download full matrix (CSV)
            </button>
          )}
        </div>

        {/* Mode toggle */}
        <div className="mt-6 flex gap-0 border border-line w-fit">
          {(['overview', 'my_section'] as DashMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 font-mono text-xs uppercase tracking-wider transition ${
                mode === m ? 'text-parchment' : 'text-charcoal/50 hover:text-ink'
              }`}
              style={mode === m ? { backgroundColor: '#054653' } : {}}
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
              <SummaryTile label="Results" value={String(data.results.length)} />
              <SummaryTile label="Targets at risk" value={String(data.targets.filter((t) => t.status === 'at_risk' || t.status === 'delayed').length)} color="#DC2626" bg="#FEE2E2" />
              <SummaryTile label="Completed" value={String(data.targets.filter((t) => t.status === 'completed').length)} color="#054653" bg="#ECFDF5" />
            </div>

            {/* Band legend */}
            <div className="mt-4 flex flex-wrap items-center gap-3 bg-white px-4 py-2.5" style={{ borderRadius: "8px", border: "1px solid #D0D8DA" }}>
              <p className="font-mono text-[10px] uppercase tracking-wider text-charcoal/40">Performance bands:</p>
              {(['very_poor', 'poor', 'fair', 'good'] as const).map((band) => {
                const range = { very_poor: '0–25%', poor: '26–50%', fair: '51–75%', good: '76–100%' }[band];
                const c = getPctColors(band === 'very_poor' ? 10 : band === 'poor' ? 35 : band === 'fair' ? 60 : 85);
                return (
                  <span key={band} className="flex items-center gap-1.5 font-mono text-[10px]">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.bar }} />
                    <span style={{ color: c.badge }}>{range} {BAND_LABELS[band]}</span>
                  </span>
                );
              })}
            </div>

            {/* Result cards grid */}
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.results.map((result) => {
                const targets = targetsForResult(data, result.$id);
                const summary = resultUpdateSummary[result.$id] ?? { updated: 0, stale: 0, noUpdate: 0 };
                return (
                  <ResultCard key={result.$id} result={result} targets={targets} summary={summary} />
                );
              })}
            </div>
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
    <div className="bg-white px-4 py-3" style={{ borderRadius: "8px", border: "1px solid #D0D8DA", backgroundColor: bg ?? '#FFFFFF' }}>
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
      style={{
        border: `1.5px solid ${colors.border}`,
        borderRadius: "10px", borderLeft: "4px solid #054653",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: '#054653' }}>
            {result.code}
          </p>
          <h3 className="mt-0.5 font-display text-[15px] leading-snug text-ink line-clamp-2">
            {result.title}
          </h3>
        </div>
        <ProgressBadge percent={pct} showLabel={false} size="sm" />
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <ProgressBar percent={pct} height={6} />
      </div>

      {/* Stats row */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-3 font-mono text-[10px] text-charcoal/50">
          <span>{targets.length} targets</span>
          <span className="text-[#054653] font-medium">{completed} done</span>
          {atRisk > 0 && <span className="text-clay">{atRisk} at risk</span>}
        </div>
        <ProgressBadge percent={pct} showLabel size="xs" />
      </div>

      {/* Aggregated feedback summary */}
      <div className="mt-3 border-t border-line pt-2.5 flex gap-3 font-mono text-[10px]">
        <span className="text-[#054653]">▲ {summary.updated} recent</span>
        {summary.stale > 0 && <span className="text-amber">{summary.stale} stale</span>}
        {summary.noUpdate > 0 && <span className="text-charcoal/40">{summary.noUpdate} no update</span>}
      </div>
    </Link>
  );
}

function MySectionView({ targets, data, profile }: {
  targets: TargetDoc[];
  data: { outputs: any[]; results: any[] };
  profile: any;
}) {
  if (!profile?.sectionSlugs?.length && !targets.length) {
    return (
      <div className="mt-8 border border-line bg-white px-6 py-10 text-center">
        <p className="font-display text-xl text-ink">You haven't been assigned to a section yet.</p>
        <p className="mt-2 text-sm text-charcoal/60">
          An administrator will assign you to a section. Once assigned, your tasks will appear here.
        </p>
      </div>
    );
  }

  const pct = averageProgress(targets.map((t) => t.progressPercent ?? 0));
  const colors = getPctColors(pct);
  const completed = targets.filter((t) => t.status === 'completed').length;
  const atRisk = targets.filter((t) => t.status === 'at_risk' || t.status === 'delayed').length;

  return (
    <div className="mt-6">
      {/* My section summary */}
      <div className="mb-6 bg-white p-5" style={{ borderRadius: "10px", borderLeft: "4px solid #054653", borderColor: colors.border }}>
        <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: '#054653' }}>Your section overview</p>
        <div className="mt-2 flex flex-wrap items-center gap-6">
          <div>
            <p className="font-display text-3xl text-ink">{pct}%</p>
            <ProgressBadge percent={pct} showLabel size="sm" />
          </div>
          <div className="grid grid-cols-3 gap-4 font-mono text-xs">
            <div><p className="font-bold text-ink">{targets.length}</p><p className="text-charcoal/50">Targets</p></div>
            <div><p className="font-bold text-[#054653]">{completed}</p><p className="text-charcoal/50">Completed</p></div>
            <div><p className="font-bold text-clay">{atRisk}</p><p className="text-charcoal/50">At risk</p></div>
          </div>
        </div>
        <div className="mt-3"><ProgressBar percent={pct} height={8} /></div>
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {targets.length === 0 && (
          <p className="font-mono text-sm text-charcoal/50">No tasks assigned to your section yet.</p>
        )}
        {targets.map((t) => {
          const output = data.outputs.find((o: any) => o.$id === t.outputId);
          const result = data.results.find((r: any) => r.$id === t.resultId);
          const tc = getPctColors(t.progressPercent ?? 0);
          return (
            <Link
              key={t.$id}
              href={`/matrix/${t.$id}?from=my_section`}
              className="flex items-center justify-between gap-4 bg-white px-4 py-3 transition hover:shadow-sm"
              style={{ borderRadius: "8px", border: `1px solid ${tc.border}`, borderLeft: "3px solid #054653" }}
            >
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[9px] uppercase tracking-wider text-charcoal/40">
                  {result?.code} · {output?.code}
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
