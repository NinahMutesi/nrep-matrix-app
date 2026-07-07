import { computeScore, scoreBand, scoreBandColors } from '@/lib/appwrite/config';

interface Props {
  progressPercent: number;
  weightTarget?: number | null;
  scoreManual?: number | null;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({ progressPercent, weightTarget, scoreManual, showLabel = false, size = 'md' }: Props) {
  const score = computeScore({ progressPercent, weightTarget, scoreManual });
  const band = scoreBand(score);
  const colors = scoreBandColors(band);

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const bandLabel = {
    critical: 'Critical',
    at_risk: 'At Risk',
    in_progress: 'In Progress',
    on_track: 'On Track',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded font-mono font-bold ${sizeClasses[size]}`}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      <span>{score}/25</span>
      {showLabel && (
        <span className="font-normal opacity-70">— {bandLabel[band]}</span>
      )}
    </span>
  );
}

/** A horizontal color bar showing the score visually */
export function ScoreBar({ progressPercent, weightTarget, scoreManual, height = 4 }: Omit<Props, 'showLabel' | 'size'> & { height?: number }) {
  const score = computeScore({ progressPercent, weightTarget, scoreManual });
  const band = scoreBand(score);
  const colors = scoreBandColors(band);
  const pct = (score / 25) * 100;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-full bg-gray-100" style={{ height }}>
        <div
          className="rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, height, backgroundColor: colors.bar }}
        />
      </div>
      <span className="w-12 font-mono text-[10px] font-bold" style={{ color: colors.text }}>
        {score}/25
      </span>
    </div>
  );
}
