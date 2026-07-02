const SIZE = 88;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

export function ProgressDial({
  percent,
  label,
  tone = 'amber',
}: {
  percent: number;
  label?: string;
  tone?: 'amber' | 'teal' | 'clay';
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = CIRC - (clamped / 100) * CIRC;
  const colorVar = tone === 'teal' ? '#3C6E63' : tone === 'clay' ? '#A14E3C' : '#D98E2B';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="rotate-[-90deg]">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#D8CFB8"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={colorVar}
          strokeWidth={STROKE}
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-display text-xl text-ink">{clamped}%</span>
        {label && <span className="font-mono text-[9px] uppercase tracking-wider text-charcoal/50">{label}</span>}
      </div>
    </div>
  );
}
