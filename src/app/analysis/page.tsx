'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { AppShell } from '@/components/AppShell';
import { useMatrixData, targetsForResult } from '@/lib/use-matrix-data';
import { averageProgress } from '@/lib/progress';
import { exportMatrixCsv } from '@/lib/export-csv';
import { fiscalYearLabel } from '@/lib/plan-years';
import { STATUS_LABELS, type TargetStatus } from '@/lib/appwrite/config';
import { StatusBadge } from '@/components/StatusBadge';
import Link from 'next/link';

const STATUS_COLORS: Record<TargetStatus, string> = {
  not_started: '#8C8473',
  in_progress: '#262420',
  on_track: '#D98E2B',
  at_risk: '#A14E3C',
  delayed: '#A14E3C',
  completed: '#3C6E63',
};

export default function AnalysisPage() {
  const { data, loading, error } = useMatrixData();

  const byResult = useMemo(() => {
    if (!data) return [];
    return data.results.map((r) => ({
      name: r.code,
      title: r.title,
      progress: averageProgress(targetsForResult(data, r.$id).map((t) => t.progressPercent ?? 0)),
    }));
  }, [data]);

  const bySection = useMemo(() => {
    if (!data) return [];
    return data.sections
      .map((s) => {
        const targets = data.targets.filter((t) => t.sectionSlug === s.slug);
        return { name: s.name, progress: averageProgress(targets.map((t) => t.progressPercent ?? 0)), count: targets.length };
      })
      .filter((s) => s.count > 0)
      .sort((a, b) => a.progress - b.progress);
  }, [data]);

  const statusBreakdown = useMemo(() => {
    if (!data) return [];
    const counts: Record<string, number> = {};
    for (const t of data.targets) counts[t.status] = (counts[t.status] ?? 0) + 1;
    return Object.entries(counts).map(([status, value]) => ({
      status: status as TargetStatus,
      name: STATUS_LABELS[status as TargetStatus],
      value,
    }));
  }, [data]);

  const byYear = useMemo(() => {
    if (!data) return [];
    const groups = new Map<number, number[]>();
    for (const y of data.yearlyRecords) {
      const score = y.progressPercent ?? y.targetScore;
      if (score == null) continue;
      const arr = groups.get(y.year) ?? [];
      arr.push(score);
      groups.set(y.year, arr);
    }
    return Array.from(groups.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, scores]) => ({
        name: fiscalYearLabel(year),
        progress: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        recorded: scores.length,
      }));
  }, [data]);

  const atRisk = useMemo(() => {
    if (!data) return [];
    return data.targets.filter((t) => t.status === 'at_risk' || t.status === 'delayed');
  }, [data]);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-8 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-clay">Analysis</p>
            <h1 className="mt-1 font-display text-3xl text-ink">Strategy accomplishment review</h1>
            <p className="mt-2 max-w-xl text-sm text-charcoal/60">
              What the data has accumulated so far: progress by strategic result, by responsible
              section, and what still needs attention.
            </p>
          </div>
          {data && (
            <button
              onClick={() => exportMatrixCsv(data, 'analysis')}
              className="border border-ink px-4 py-2 font-mono text-xs uppercase tracking-wider text-ink hover:bg-ink hover:text-parchment"
            >
              Download dataset (CSV)
            </button>
          )}
        </div>

        {loading && <p className="mt-10 font-mono text-sm text-charcoal/50">Crunching numbers…</p>}
        {error && <p className="mt-10 text-sm text-clay">{error}</p>}

        {data && (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard title="Progress by year (deliverable timeline)" span>
              {byYear.length === 0 ? (
                <p className="font-mono text-xs text-charcoal/40">
                  No yearly records yet — they'll show up here as soon as a year is added on a
                  task's detail page (or once the imported Year 1/2 scores are seeded).
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={byYear} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D8CFB8" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(v: number) => `${v}%`}
                      labelFormatter={(label) => {
                        const row = byYear.find((y) => y.name === label);
                        return row ? `${label} · ${row.recorded} records` : label;
                      }}
                    />
                    <Bar dataKey="progress" fill="#D98E2B" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Progress by strategic result">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byResult} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D8CFB8" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={36} />
                  <Tooltip
                    formatter={(v: number) => `${v}%`}
                    labelFormatter={(label) => byResult.find((r) => r.name === label)?.title ?? label}
                  />
                  <Bar dataKey="progress" fill="#D98E2B" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Targets by status">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={statusBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                    {statusBreakdown.map((s) => (
                      <Cell key={s.status} fill={STATUS_COLORS[s.status]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Progress by section (lowest first)" span>
              <ResponsiveContainer width="100%" height={Math.max(260, bySection.length * 28)}>
                <BarChart data={bySection} layout="vertical" margin={{ left: 140 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D8CFB8" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={140} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="progress" fill="#3C6E63" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <div className="border border-line bg-white p-5 lg:col-span-2">
              <p className="font-mono text-[11px] uppercase tracking-wider text-charcoal/50">
                Yet to be accomplished — at risk &amp; delayed ({atRisk.length})
              </p>
              <div className="mt-3 space-y-2">
                {atRisk.length === 0 && (
                  <p className="font-mono text-xs text-charcoal/40">Nothing flagged at risk right now.</p>
                )}
                {atRisk.map((t) => (
                  <Link
                    key={t.$id}
                    href={`/matrix/${t.$id}`}
                    className="flex items-center justify-between border-t border-line py-2 first:border-0 hover:bg-parchment/60"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{t.description}</p>
                      <p className="font-mono text-[11px] text-charcoal/40">{t.leadOrg}</p>
                    </div>
                    <StatusBadge status={t.status} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ChartCard({ title, children, span }: { title: string; children: React.ReactNode; span?: boolean }) {
  return (
    <div className={`border border-line bg-white p-5 ${span ? 'lg:col-span-2' : ''}`}>
      <p className="font-mono text-[11px] uppercase tracking-wider text-charcoal/50">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}
