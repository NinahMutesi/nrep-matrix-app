/**
 * Central place for every Appwrite resource ID this app depends on.
 */

export const DATABASE_ID = 'nrep_matrix_db';

export const COLLECTIONS = {
  PROFILES: 'profiles',
  RESULTS: 'results',
  OUTPUTS: 'outputs',
  TARGETS: 'targets',
  COMMENTS: 'comments',
  REPORTS: 'reports',
  SECTIONS: 'sections',
  YEARLY_RECORDS: 'yearly_records',
  PENDING_UPDATES: 'pending_updates',
  REC_ACTIONS: 'rec_actions',
} as const;

export const BUCKET_REPORTS = 'reports_bucket';

export type UpdateReviewStatus = 'pending' | 'approved' | 'rejected';
export type Role = 'super_admin' | 'admin' | 'analyst' | 'member' | 'viewer';
export type ProfileStatus = 'pending' | 'approved' | 'rejected';

export type TargetStatus =
  | 'not_started'
  | 'in_progress'
  | 'on_track'
  | 'at_risk'
  | 'delayed'
  | 'completed';

export const STATUS_LABELS: Record<TargetStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  on_track: 'On track',
  at_risk: 'At risk',
  delayed: 'Delayed',
  completed: 'Completed',
};

export const PROGRESS_STEPS = [0, 10, 25, 50, 75, 90, 100] as const;

/** Score bands: 0–25 performance scale */
export type ScoreBand = 'critical' | 'at_risk' | 'in_progress' | 'on_track';

export function scoreBand(score: number): ScoreBand {
  if (score <= 6) return 'critical';
  if (score <= 12) return 'at_risk';
  if (score <= 18) return 'in_progress';
  return 'on_track';
}

export function scoreBandColors(band: ScoreBand) {
  switch (band) {
    case 'critical':    return { bg: '#FEE2E2', text: '#991B1B', ring: '#EF4444', bar: '#EF4444' };
    case 'at_risk':     return { bg: '#FEF3C7', text: '#92400E', ring: '#F59E0B', bar: '#F59E0B' };
    case 'in_progress': return { bg: '#FDF3DC', text: '#78350F', ring: '#D98E2B', bar: '#D98E2B' };
    case 'on_track':    return { bg: '#D1FAE5', text: '#065F46', ring: '#10B981', bar: '#10B981' };
  }
}

export function computeScore(opts: {
  progressPercent: number;
  weightTarget?: number | null;
  scoreManual?: number | null;
}): number {
  if (opts.scoreManual != null) return Math.max(0, Math.min(25, Math.round(opts.scoreManual)));
  if (opts.weightTarget != null && opts.weightTarget > 0) {
    return Math.round((opts.progressPercent / 100) * Math.min(opts.weightTarget, 25));
  }
  return Math.round((opts.progressPercent / 100) * 25);
}
