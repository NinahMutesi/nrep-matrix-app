'use client';

import { AppShell } from '@/components/AppShell';
import { StrategyCard } from '@/components/StrategyCard';
import { useMatrixData, targetsForResult } from '@/lib/use-matrix-data';
import { exportMatrixCsv } from '@/lib/export-csv';
import { averageProgress } from '@/lib/progress';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const { data, loading, error } = useMatrixData();
  const { profile } = useAuth();

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-8 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-clay">Overview</p>
            <h1 className="mt-1 font-display text-3xl text-ink">
              Welcome, {profile?.name?.split(' ')[0]}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-charcoal/60">
              Five strategic results from the NREP Strategic Plan, tracked output by output and
              target by target.
            </p>
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

        {loading && <p className="mt-10 font-mono text-sm text-charcoal/50">Loading matrix…</p>}
        {error && <p className="mt-10 text-sm text-clay">{error}</p>}

        {data && (
          <>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <SummaryStat
                label="Overall progress"
                value={`${averageProgress(data.targets.map((t) => t.progressPercent ?? 0))}%`}
              />
              <SummaryStat
                label="Targets at risk / delayed"
                value={String(data.targets.filter((t) => t.status === 'at_risk' || t.status === 'delayed').length)}
                tone="clay"
              />
              <SummaryStat
                label="Targets completed"
                value={String(data.targets.filter((t) => t.status === 'completed').length)}
                tone="teal"
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.results.map((result) => (
                <StrategyCard key={result.$id} result={result} targets={targetsForResult(data, result.$id)} />
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function SummaryStat({
  label,
  value,
  tone = 'ink',
}: {
  label: string;
  value: string;
  tone?: 'ink' | 'clay' | 'teal';
}) {
  const toneClass = tone === 'clay' ? 'text-clay' : tone === 'teal' ? 'text-teal' : 'text-ink';
  return (
    <div className="border border-line bg-white px-5 py-4">
      <p className="font-mono text-[11px] uppercase tracking-wider text-charcoal/50">{label}</p>
      <p className={`mt-1 font-display text-3xl ${toneClass}`}>{value}</p>
    </div>
  );
}
