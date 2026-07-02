'use client';

import Link from 'next/link';
import type { ResultDoc, TargetDoc } from '@/types';
import { averageProgress } from '@/lib/progress';

const SIZE = 56;
const STROKE = 5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

function MiniDial({ percent, tone }: { percent: number; tone: 'amber' | 'teal' | 'clay' }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = CIRC - (clamped / 100) * CIRC;
  const color = tone === 'teal' ? '#3C6E63' : tone === 'clay' ? '#A14E3C' : '#D98E2B';
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="rotate-[-90deg]">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#D8CFB8" strokeWidth={STROKE} />
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none"
          stroke={color} strokeWidth={STROKE}
          strokeDasharray={CIRC} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 500ms ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-display text-sm leading-none text-ink">{clamped}%</span>
      </div>
    </div>
  );
}

export function StrategyCard({ result, targets }: { result: ResultDoc; targets: TargetDoc[] }) {
  const pct = averageProgress(targets.map((t) => t.progressPercent ?? 0));
  const atRisk = targets.filter((t) => t.status === 'at_risk' || t.status === 'delayed').length;
  const completed = targets.filter((t) => t.status === 'completed').length;
  const tone = pct >= 75 ? 'teal' : atRisk > 0 ? 'clay' : 'amber';

  return (
    <Link
      href={`/matrix?result=${result.$id}`}
      className="group flex items-center gap-3 border border-line bg-white p-4 transition hover:border-ink"
    >
      <MiniDial percent={pct} tone={tone} />
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] uppercase tracking-wider text-clay">{result.code}</p>
        <h3 className="mt-0.5 font-display text-base leading-snug text-ink line-clamp-2">{result.title}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[10px] uppercase tracking-wider text-charcoal/40">
          <span>{targets.length} targets</span>
          <span>{completed} done</span>
          {atRisk > 0 && <span className="text-clay">{atRisk} at risk</span>}
        </div>
      </div>
    </Link>
  );
}
