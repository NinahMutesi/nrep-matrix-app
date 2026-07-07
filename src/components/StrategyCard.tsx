'use client';

import Link from 'next/link';
import type { ResultDoc, TargetDoc } from '@/types';
import { averageProgress } from '@/lib/progress';
import { getPctColors } from '@/lib/progress-bands';
import { ProgressBar, ProgressBadge } from '@/components/ProgressBadge';

const SIZE = 52;
const STROKE = 5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

function MiniDial({ percent, barColor }: { percent: number; barColor: string }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = CIRC - (clamped / 100) * CIRC;
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="rotate-[-90deg]">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#E5E7EB" strokeWidth={STROKE} />
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke={barColor} strokeWidth={STROKE}
          strokeDasharray={CIRC} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 500ms ease' }} />
      </svg>
      <div className="absolute flex items-center justify-center">
        <span className="font-display text-xs font-bold leading-none text-ink">{clamped}%</span>
      </div>
    </div>
  );
}

export function StrategyCard({ result, targets }: { result: ResultDoc; targets: TargetDoc[] }) {
  const pct = averageProgress(targets.map((t) => t.progressPercent ?? 0));
  const colors = getPctColors(pct);
  const atRisk = targets.filter((t) => t.status === 'at_risk' || t.status === 'delayed').length;
  const completed = targets.filter((t) => t.status === 'completed').length;

  return (
    <Link
      href={`/matrix?result=${result.$id}`}
      className="block bg-white p-4 transition hover:shadow-md"
      style={{ borderRadius: '10px', border: `1.5px solid ${colors.border}`, borderLeft: `4px solid #054653` }}
    >
      <div className="flex items-start gap-3">
        <MiniDial percent={pct} barColor={colors.bar} />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[9px] uppercase tracking-wider" style={{ color: '#054653' }}>{result.code}</p>
          <p className="mt-0.5 font-display text-sm leading-snug text-ink line-clamp-2">{result.title}</p>
          <div className="mt-1.5">
            <ProgressBar percent={pct} height={4} />
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <div className="flex gap-2 font-mono text-[9px] text-charcoal/40">
              <span>{targets.length} targets</span>
              <span className="text-[#054653]">{completed} done</span>
              {atRisk > 0 && <span className="text-clay">{atRisk} risk</span>}
            </div>
            <ProgressBadge percent={pct} showLabel={false} size="xs" />
          </div>
        </div>
      </div>
    </Link>
  );
}
