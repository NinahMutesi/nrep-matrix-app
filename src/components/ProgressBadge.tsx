import { getProgressBand, getBandColors, BAND_LABELS } from '@/lib/progress-bands';

interface Props {
  percent: number;
  showLabel?: boolean;
  size?: 'xs' | 'sm' | 'md';
}

export function ProgressBadge({ percent, showLabel = true, size = 'sm' }: Props) {
  const band = getProgressBand(percent);
  const colors = getBandColors(band);
  const sizeClass = size === 'xs' ? 'text-[9px] px-1.5 py-0.5'
    : size === 'sm' ? 'text-[11px] px-2 py-0.5'
    : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-mono font-bold ${sizeClass}`}
      style={{ backgroundColor: colors.bg, color: colors.badge }}
    >
      <span>{Math.round(percent)}%</span>
      {showLabel && <span className="opacity-70">— {BAND_LABELS[band]}</span>}
    </span>
  );
}

export function ProgressBar({ percent, height = 6 }: { percent: number; height?: number }) {
  const band = getProgressBand(percent);
  const colors = getBandColors(band);
  const displayPct = Math.min(100, percent); // cap visual bar at 100

  return (
    <div className="w-full rounded-full" style={{ height, backgroundColor: '#E5E7EB' }}>
      <div
        className="rounded-full transition-all duration-500"
        style={{ width: `${displayPct}%`, height, backgroundColor: colors.bar }}
      />
    </div>
  );
}
