'use client';

import { useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import { canEditTarget } from '@/lib/permissions';
import { averageProgress } from '@/lib/progress';
import type { MatrixTree } from '@/lib/use-matrix-data';
import type { Profile, ResultDoc, OutputDoc, TargetDoc } from '@/types';

export function GroupedMatrix({
  data,
  profile,
  resultFilter,
  sectionFilter,
  statusFilter,
}: {
  data: MatrixTree;
  profile: Profile | null;
  resultFilter: string;
  sectionFilter: string;
  statusFilter: string;
}) {
  const results = data.results.filter(
    (r) => resultFilter === 'all' || r.$id === resultFilter
  );

  return (
    <div className="space-y-10">
      {results.map((result) => {
        const outputs = data.outputs.filter((o) => o.resultId === result.$id);
        const allResultTargets = data.targets.filter((t) => t.resultId === result.$id);
        const resultPct = averageProgress(allResultTargets.map((t) => t.progressPercent ?? 0));

        return (
          <ResultBlock
            key={result.$id}
            result={result}
            outputs={outputs}
            allTargets={data.targets}
            profile={profile}
            sectionFilter={sectionFilter}
            statusFilter={statusFilter}
            resultPct={resultPct}
          />
        );
      })}
    </div>
  );
}

function ResultBlock({
  result,
  outputs,
  allTargets,
  profile,
  sectionFilter,
  statusFilter,
  resultPct,
}: {
  result: ResultDoc;
  outputs: OutputDoc[];
  allTargets: TargetDoc[];
  profile: Profile | null;
  sectionFilter: string;
  statusFilter: string;
  resultPct: number;
}) {
  // Hide entire result block if section/status filter leaves no visible targets
  const hasVisibleTargets = outputs.some((o) => {
    const targets = allTargets.filter((t) => {
      if (t.outputId !== o.$id) return false;
      if (sectionFilter !== 'all' && t.sectionSlug !== sectionFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      return true;
    });
    return targets.length > 0;
  });
  if (!hasVisibleTargets) return null;

  return (
    <div>
      {/* Result header */}
      <div className="flex items-start justify-between gap-4 border-b-2 border-ink pb-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-clay">{result.code}</p>
          <h2 className="mt-0.5 font-display text-2xl text-ink">{result.title}</h2>
          {result.outcome && (
            <p className="mt-1 max-w-2xl text-sm text-charcoal/60">{result.outcome}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-[10px] uppercase tracking-wider text-charcoal/40">
            Overall progress
          </p>
          <p className="font-display text-3xl text-ink">{resultPct}%</p>
        </div>
      </div>

      {/* Outputs */}
      <div className="mt-4 space-y-6">
        {outputs.map((output) => (
          <OutputBlock
            key={output.$id}
            output={output}
            allTargets={allTargets}
            profile={profile}
            sectionFilter={sectionFilter}
            statusFilter={statusFilter}
          />
        ))}
      </div>
    </div>
  );
}

function OutputBlock({
  output,
  allTargets,
  profile,
  sectionFilter,
  statusFilter,
}: {
  output: OutputDoc;
  allTargets: TargetDoc[];
  profile: Profile | null;
  sectionFilter: string;
  statusFilter: string;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const targets = allTargets.filter((t) => {
    if (t.outputId !== output.$id) return false;
    if (sectionFilter !== 'all' && t.sectionSlug !== sectionFilter) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    return true;
  });

  if (targets.length === 0) return null;

  const outputPct = averageProgress(targets.map((t) => t.progressPercent ?? 0));
  const completed = targets.filter((t) => t.status === 'completed').length;
  const atRisk = targets.filter((t) => t.status === 'at_risk' || t.status === 'delayed').length;

  return (
    <div className="border border-line bg-white">
      {/* Output header — clickable to collapse */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-start justify-between gap-4 border-b border-line bg-parchdim/60 px-5 py-4 text-left hover:bg-parchdim"
      >
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-amber">
            Output {output.code}
          </p>
          <p className="mt-0.5 font-display text-lg leading-snug text-ink">{output.title}</p>
          <div className="mt-1.5 flex flex-wrap gap-x-4 font-mono text-[10px] uppercase tracking-wider text-charcoal/40">
            <span>{targets.length} target{targets.length !== 1 ? 's' : ''}</span>
            <span>{completed} completed</span>
            {atRisk > 0 && <span className="text-clay">{atRisk} at risk</span>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {/* Mini progress bar */}
          <div className="hidden sm:block">
            <div className="h-1.5 w-32 bg-line">
              <div
                className="h-1.5 bg-amber transition-all"
                style={{ width: `${outputPct}%` }}
              />
            </div>
            <p className="mt-1 text-right font-mono text-[10px] text-charcoal/50">{outputPct}%</p>
          </div>
          <span className="font-mono text-[10px] text-charcoal/30">
            {collapsed ? '▼ show' : '▲ hide'}
          </span>
        </div>
      </button>

      {/* Targets list */}
      {!collapsed && (
        <div className="divide-y divide-line">
          {targets.map((target, idx) => (
            <TargetRow
              key={target.$id}
              target={target}
              index={idx + 1}
              profile={profile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TargetRow({
  target,
  index,
  profile,
}: {
  target: TargetDoc;
  index: number;
  profile: Profile | null;
}) {
  const editable = canEditTarget(profile, target);

  return (
    <div className="flex items-start gap-4 px-5 py-4 hover:bg-parchment/40">
      {/* Index number */}
      <span className="mt-0.5 shrink-0 font-mono text-xs text-charcoal/30">{index}</span>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-wider text-clay">
              Target {target.code}
            </p>
            <p className="mt-0.5 text-sm font-medium text-ink">{target.description}</p>
            {target.activities && (
              <p className="mt-1 text-xs text-charcoal/50 line-clamp-1">
                <span className="font-mono uppercase tracking-wider">Activities: </span>
                {target.activities}
              </p>
            )}
            <div className="mt-1.5 flex flex-wrap gap-x-3 font-mono text-[10px] text-charcoal/40">
              <span>{target.leadOrg}</span>
              {target.timeline && <span>· {target.timeline}</span>}
            </div>
          </div>

          {/* Right side: progress + status + link */}
          <div className="flex shrink-0 items-center gap-3">
            <div className="text-right">
              <p className="font-display text-lg text-ink">{target.progressPercent ?? 0}%</p>
              <div className="h-1 w-16 bg-line">
                <div
                  className="h-1 bg-amber"
                  style={{ width: `${target.progressPercent ?? 0}%` }}
                />
              </div>
            </div>
            <StatusBadge status={target.status} />
            <Link
              href={`/matrix/${target.$id}`}
              className="shrink-0 border border-ink px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-ink hover:bg-ink hover:text-parchment"
            >
              {editable ? 'Update' : 'View'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
