import type { ProfileStatus, Role, TargetStatus } from '@/lib/appwrite/config';

export interface Profile {
  $id: string;
  userId: string;
  name: string;
  email: string;
  role: Role;
  status: ProfileStatus;
  sectionSlugs: string[];
  createdAt: string;
}

export interface Section {
  $id: string;
  slug: string;
  name: string;
  teamId: string;
}

export interface ResultDoc {
  $id: string;
  code: string;
  title: string;
  outcome: string | null;
  order: number;
}

export interface OutputDoc {
  $id: string;
  resultId: string;
  code: string;
  title: string;
  order: number;
}

export interface TargetDoc {
  $id: string;
  outputId: string;
  resultId: string;
  code: string;
  description: string;
  timeline: string | null;
  leadOrg: string;
  sectionSlug: string;
  activities: string | null;
  weightTarget: number | null;
  weightOutput: number | null;
  weightOutcome: number | null;
  y1Target: number | null;
  y1Initiatives: number | null;
  y1Kra: number | null;
  y2Target: number | null;
  y2Initiatives: number | null;
  y2Kra: number | null;
  progressPercent: number;
  scoreManual: number | null;
  status: TargetStatus;
  assignedUserIds: string[];
  updatedAt: string;
  updatedBy: string | null;
}

export interface CommentDoc {
  $id: string;
  targetId: string;
  userId: string;
  userName: string;
  body: string;
  createdAt: string;
}

export interface ReportDoc {
  $id: string;
  targetId: string;
  fileId: string;
  fileName: string;
  description: string | null;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
}

export interface PendingUpdateDoc {
  $id: string;
  targetId: string;
  targetDescription: string;
  submittedBy: string;
  submittedByName: string;
  submittedAt: string;
  proposedProgressPercent: number;
  proposedStatus: TargetStatus;
  proposedScoreManual: number | null;
  justification: string | null;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
}

export interface YearlyRecordDoc {
  $id: string;
  targetId: string;
  year: number;
  label: string | null;
  targetScore: number | null;
  initiativesScore: number | null;
  kraScore: number | null;
  progressPercent: number | null;
  status: TargetStatus | null;
  note: string | null;
  recordedBy: string | null;
  recordedByName: string | null;
  recordedAt: string;
}

/** Recommendation action — logged against an R6 target */
export interface RecActionDoc {
  $id: string;
  targetId: string;
  actionDescription: string;
  actionedBy: string;
  actionedByName: string;
  organisation: string | null;
  score: number | null;
  actionedAt: string;
  status: 'pending' | 'in_progress' | 'completed';
}
