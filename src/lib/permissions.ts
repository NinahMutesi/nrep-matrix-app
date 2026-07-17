import type { Profile, TargetDoc } from '@/types';

// Maps result codes to section admin emails
const RESULT_ADMIN_MAP: Record<string, string[]> = {
  'R1': ['mkizza@nrep.ug'],
  'R3': ['mkizza@nrep.ug'],
  'R2': ['enabaho@nrep.ug'],
  'R6': ['enabaho@nrep.ug'],
  'R4': ['pnduhuura@nrep.ug'],
  'R5': ['pnduhuura@nrep.ug'],
};

export function isSuperAdmin(profile: Profile | null): boolean {
  return !!profile && profile.role === 'super_admin' && profile.status === 'approved';
}

export function isAdmin(profile: Profile | null): boolean {
  return !!profile && (profile.role === 'admin' || profile.role === 'super_admin') && profile.status === 'approved';
}

// System admin = admin with no sections (Dr. Mukisa, Derrick)
export function isSystemAdmin(profile: Profile | null): boolean {
  return isAdmin(profile) && (!profile?.sectionSlugs || profile.sectionSlugs.length === 0);
}

// Section admin = admin WITH sections (Kizza, Nabaho, Nduhuura)
export function isSectionAdmin(profile: Profile | null, target?: TargetDoc): boolean {
  if (!profile || profile.status !== 'approved') return false;
  if (profile.role !== 'admin') return false;
  if (!profile.sectionSlugs || profile.sectionSlugs.length === 0) return false;
  return true;
}

export function canAccessAdminPanel(profile: Profile | null): boolean {
  return isAdmin(profile);
}

export function canAccessReviewQueue(profile: Profile | null): boolean {
  return isAdmin(profile) || profile?.role === 'analyst';
}

export function canEditTarget(profile: Profile | null, target: TargetDoc): boolean {
  if (!profile || profile.status !== 'approved') return false;
  if (isAdmin(profile)) return true;
  if (profile.role === 'member') {
    return target.assignedUserIds.includes(profile.userId);
  }
  return target.assignedUserIds.includes(profile.userId);
}

export function canContributeToTarget(profile: Profile | null, target: TargetDoc): boolean {
  if (!profile || profile.status !== 'approved') return false;
  if (isAdmin(profile)) return true;
  if (profile.role === 'analyst') return true;
  return target.assignedUserIds.includes(profile.userId);
}

export function canReviewUpdates(profile: Profile | null): boolean {
  if (!profile || profile.status !== 'approved') return false;
  return isAdmin(profile) || profile.role === 'analyst';
}

// Section admin can score targets in their result areas
export function canScoreTarget(profile: Profile | null, target: TargetDoc, resultCode?: string): boolean {
  if (!profile || profile.status !== 'approved') return false;
  if (profile.role !== 'admin') return false;
  if (!profile.sectionSlugs || profile.sectionSlugs.length === 0) return false;
  if (!resultCode) return true; // fallback
  const admins = RESULT_ADMIN_MAP[resultCode] ?? [];
  return admins.includes(profile.email);
}

// Member can score their own targets
export function canGiveMemberScore(profile: Profile | null, target?: TargetDoc): boolean {
  if (!profile || profile.status !== 'approved') return false;
  if (!target) return false;
  return profile.role === 'member' && target.assignedUserIds.includes(profile.userId);
}

// Dr. Mukisa (system admin) gives overall score
export function canGiveOverallScore(profile: Profile | null): boolean {
  return isSystemAdmin(profile);
}
