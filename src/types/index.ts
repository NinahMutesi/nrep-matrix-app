import type { ProfileStatus, Role, TargetStatus } from '@/lib/appwrite/config';

export interface Profile {
  $id: string;
  userId: string;
  name: string;
  email: string;
  role: Role;
  status: ProfileStatus;
  sectionSlugs: string[]; // sections (teams) this person belongs to
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
  code: string; // R1..R5
  title: string;
  outcome: string | null;
  order: number;
}

export interface OutputDoc {
  $id: string;
  resultId: string;
  code: string; // 1.1, 1.2...
  title: string;
  order: number;
}

export interface TargetDoc {
  $id: string;
  outputId: string;
  resultId: string;
  code: string; // 1.1.1
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

export interface PendingUpdateDoc {
  $id: string;
  targetId: string;
  targetDescription: string;
  submittedBy: string;
  submittedByName: string;
  submittedAt: string;
  proposedProgressPercent: number;
  proposedStatus: TargetStatus;
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
