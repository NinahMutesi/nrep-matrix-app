'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { TargetTable } from '@/components/TargetTable';
import { GroupedMatrix } from '@/components/GroupedMatrix';
import { useMatrixData } from '@/lib/use-matrix-data';
import { exportMatrixCsv } from '@/lib/export-csv';
import { averageProgress } from '@/lib/progress';
import { useAuth } from '@/lib/auth-context';
import type { TargetStatus } from '@/lib/appwrite/config';

const STATUS_FILTERS: { value: TargetStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'on_track', label: 'On track' },
  { value: 'at_risk', label: 'At risk' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'completed', label: 'Completed' },
];

export default function MatrixPage() {
  return (
    <Suspense fallback={null}>
      <MatrixPageInner />
    </Suspense>
  );
}

function MatrixPageInner() {
  const { data, loading, error } = useMatrixData();
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const resultFilterFromUrl = searchParams.get('result') ?? 'all';

  const [resultFilter, setResultFilter] = useState(resultFilterFromUrl);
  const [sectionFilter, setSectionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<TargetStatus | 'all'>('all');
  const [view, setView] = useState<'grouped' | 'table'>('grouped');

  const sectionOptions = useMemo(() => {
    if (!data) return [];
    return data.sections.map((s) => {
      const targets = data.targets.filter((t) => t.sectionSlug === s.slug);
      const pct = averageProgress(targets.map((t) => t.progressPercent ?? 0));
      return { ...s, count: targets.length, pct };
    });
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.targets.filter((t) => {
      if (resultFilter !== 'all' && t.resultId !== resultFilter) return false;
      if (sectionFilter !== 'all' && t.sectionSlug !== sectionFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      return true;
    });
  }, [data, resultFilter, sectionFilter, statusFilter]);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-8 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-clay">
              Implementation matrix
            </p>
            <h1 className="mt-1 font-display text-3xl text-ink">Targets &amp; activities</h1>
            <p className="mt-1 text-sm text-charcoal/50">
              Grouped by strategic result and output — click any output to collapse it.
            </p>
          </div>
          {data && (
            <button
              onClick={() =>
                exportMatrixCsv(data, sectionFilter !== 'all' ? sectionFilter : 'filtered')
              }
              className="border border-ink px-4 py-2 font-mono text-xs uppercase tracking-wider text-ink hover:bg-ink hover:text-parchment"
            >
              Download this view (CSV)
            </button>
          )}
        </div>

        {loading && <p className="mt-10 font-mono text-sm text-charcoal/50">Loading matrix…</p>}
        {error && <p className="mt-10 text-sm text-clay">{error}</p>}

        {data && (
          <>
            {/* Filters + view toggle */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <select
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value)}
                className="auth-input w-auto"
              >
                <option value="all">All results</option>
                {data.results.map((r) => (
                  <option key={r.$id} value={r.$id}>
                    {r.code} — {r.title}
                  </option>
                ))}
              </select>

              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="auth-input w-auto"
              >
                <option value="all">All sections</option>
                {sectionOptions.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name} — {s.pct}% ({s.count} target{s.count === 1 ? '' : 's'})
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TargetStatus | 'all')}
                className="auth-input w-auto"
              >
                {STATUS_FILTERS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              {/* View toggle */}
              <div className="ml-auto flex border border-line">
                <button
                  onClick={() => setView('grouped')}
                  className={`px-3 py-2 font-mono text-[10px] uppercase tracking-wider transition ${
                    view === 'grouped' ? 'bg-ink text-parchment' : 'text-charcoal/50 hover:text-ink'
                  }`}
                >
                  Grouped
                </button>
                <button
                  onClick={() => setView('table')}
                  className={`border-l border-line px-3 py-2 font-mono text-[10px] uppercase tracking-wider transition ${
                    view === 'table' ? 'bg-ink text-parchment' : 'text-charcoal/50 hover:text-ink'
                  }`}
                >
                  Table
                </button>
              </div>
            </div>

            <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-charcoal/40">
              {filtered.length} of {data.targets.length} targets
            </p>

            <div className="mt-6">
              {view === 'grouped' ? (
                <GroupedMatrix
                  data={data}
                  profile={profile}
                  resultFilter={resultFilter}
                  sectionFilter={sectionFilter}
                  statusFilter={statusFilter}
                />
              ) : (
                <TargetTable targets={filtered} data={data} profile={profile} />
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
