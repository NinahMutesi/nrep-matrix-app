'use client';

import { Suspense, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { GroupedMatrix } from '@/components/GroupedMatrix';
import { TargetTable } from '@/components/TargetTable';
import { useMatrixData } from '@/lib/use-matrix-data';
import { exportMatrixCsv } from '@/lib/export-csv';
import { averageProgress } from '@/lib/progress';
import { useAuth } from '@/lib/auth-context';
import { ProgressBadge } from '@/components/ProgressBadge';

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
  const [view, setView] = useState<'grouped' | 'table'>('grouped');

  const overallPct = useMemo(() => {
    if (!data) return 0;
    return averageProgress(data.targets.map((t) => t.progressPercent ?? 0));
  }, [data]);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-8 py-10">

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-clay">Implementation matrix</p>
            <h1 className="mt-1 font-display text-3xl text-ink">Targets &amp; activities</h1>
            <p className="mt-1 text-sm text-charcoal/50">
              Grouped by strategic result and output — click any output to collapse it.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {data && (
              <span className="font-mono text-xs text-charcoal/50">
                Overall: <strong style={{ color: '#054653' }}>{overallPct}%</strong>
              </span>
            )}
            {data && (
              <button
                onClick={() => exportMatrixCsv(data, 'full')}
                className="border px-4 py-2 font-mono text-xs uppercase tracking-wider text-ink hover:text-parchment"
                style={{ borderColor: '#054653' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#054653')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Download (CSV)
              </button>
            )}
            {/* View toggle */}
            <div className="flex border border-line">
              <button
                onClick={() => setView('grouped')}
                className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider transition"
                style={{ backgroundColor: view === 'grouped' ? '#054653' : 'transparent', color: view === 'grouped' ? 'white' : '#555' }}
              >
                Grouped
              </button>
              <button
                onClick={() => setView('table')}
                className="border-l border-line px-3 py-2 font-mono text-[10px] uppercase tracking-wider transition"
                style={{ backgroundColor: view === 'table' ? '#054653' : 'transparent', color: view === 'table' ? 'white' : '#555' }}
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {loading && <p className="mt-10 font-mono text-sm text-charcoal/50">Loading matrix…</p>}
        {error && <p className="mt-10 text-sm text-clay">{error}</p>}

        {data && (
          <div className="mt-6">
            {view === 'grouped' ? (
              <GroupedMatrix
                data={data}
                profile={profile}
                resultFilter="all"
                sectionFilter="all"
                statusFilter="all"
              />
            ) : (
              <>
                <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-charcoal/40">
                  {data.targets.length} targets · overall {overallPct}%
                </p>
                <TargetTable targets={data.targets} data={data} profile={profile} />
              </>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
