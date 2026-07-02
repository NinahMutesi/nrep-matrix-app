/**
 * Central place for every Appwrite resource ID this app depends on.
 * Keep this file in sync with scripts/setup-appwrite.mjs — the setup
 * script creates exactly these IDs, and the app reads/writes them.
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
} as const;

export type UpdateReviewStatus = 'pending' | 'approved' | 'rejected';

export const BUCKET_REPORTS = 'reports_bucket';

export type Role = 'admin' | 'analyst' | 'member' | 'viewer';
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
