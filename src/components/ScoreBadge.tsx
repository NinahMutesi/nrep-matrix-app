import { computeScore, scoreBand, scoreBandColors } from '@/lib/appwrite/config';
import { getProgressBand, getBandColors, BAND_LABELS } from '@/lib/progress-bands';

interface Props {
  progressPercent: number;
  weightTarget?: number | null;
  scoreManual?: number | null;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({
  progressPercent,
  weightTarget,
  scoreManual,
  showLabel = false,
  size = 'md',
}: Props) {
  // Show as 0-100 percentage, not 0-25 weighted
  const pct   = Math.max(0, Math.min(100, Math.round(progressPercent)));
  const band  = getProgressBand(pct);
  const colors = getBandColors(band);

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded font-mono font-bold ${sizeClasses[size]}`}
      style={{ backgroundColor: colors.bg, color: colors.badge }}
    >
      <span>{pct}/100</span>
      {showLabel && (
        <span className="font-normal opacity-70">— {BAND_LABELS[band]}</span>
      )}
    </span>
  );
}

export function ScoreBar({
  progressPercent,
  weightTarget,
  scoreManual,
  height = 4,
}: Omit<Props, 'showLabel' | 'size'> & { height?: number }) {
  const pct    = Math.max(0, Math.min(100, progressPercent));
  const band   = getProgressBand(pct);
  const colors = getBandColors(band);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-full bg-gray-100" style={{ height }}>
        <div
          className="rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, height, backgroundColor: colors.bar }}
        />
      </div>
      <span className="w-12 font-mono text-[10px] font-bold" style={{ color: colors.badge }}>
        {pct}/100
      </span>
    </div>
  );
}
