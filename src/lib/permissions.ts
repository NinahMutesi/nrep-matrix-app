import type { Profile, TargetDoc } from '@/types';

/** Super admin only — Dr. Nicholas. Sees everything, manages all users */
export function isSuperAdmin(profile: Profile | null): boolean {
  return !!profile && profile.role === 'super_admin' && profile.status === 'approved';
}

/** Section admins — Kizza (R1&R3), Nabaho (R2&R6), Nduhuura (R4&R5)
 *  They have role=admin AND have sections assigned */
export function isSectionAdmin(profile: Profile | null, target?: TargetDoc): boolean {
  if (!profile || profile.status !== 'approved') return false;
  if (profile.role !== 'admin') return false;
  if (!profile.sectionSlugs || profile.sectionSlugs.length === 0) return false;
  if (target) return profile.sectionSlugs.includes(target.sectionSlug);
  return true;
}

/** Any admin (super_admin or section admin) */
export function isAdmin(profile: Profile | null): boolean {
  return !!profile &&
    (profile.role === 'admin' || profile.role === 'super_admin') &&
    profile.status === 'approved';
}

/** Only super_admin can access the full Admin panel (user management) */
export function canAccessAdminPanel(profile: Profile | null): boolean {
  return isSuperAdmin(profile);
}

/** Section admins + super_admin can access review queue */
export function canAccessReviewQueue(profile: Profile | null): boolean {
  return isAdmin(profile) || profile?.role === 'analyst';
}

/** Can edit a target's progress */
export function canEditTarget(profile: Profile | null, target: TargetDoc): boolean {
  if (!profile || profile.status !== 'approved') return false;
  if (isSuperAdmin(profile)) return true;
  if (isSectionAdmin(profile, target)) return true;
  if (profile.role === 'member') {
    return (
      profile.sectionSlugs.includes(target.sectionSlug) ||
      target.assignedUserIds.includes(profile.userId)
    );
  }
  return target.assignedUserIds.includes(profile.userId);
}

/** Can comment and upload on a target */
export function canContributeToTarget(profile: Profile | null, target: TargetDoc): boolean {
  if (!profile || profile.status !== 'approved') return false;
  if (isAdmin(profile)) return true;
  if (profile.role === 'analyst') return true;
  if (profile.role === 'member') {
    return (
      profile.sectionSlugs.includes(target.sectionSlug) ||
      target.assignedUserIds.includes(profile.userId)
    );
  }
  return target.assignedUserIds.includes(profile.userId);
}

/** Can review and approve/reject pending updates */
export function canReviewUpdates(profile: Profile | null): boolean {
  if (!profile || profile.status !== 'approved') return false;
  return isAdmin(profile) || profile.role === 'analyst';
}

/** Can give the section admin score on a target (0–20) */
export function canScoreTarget(profile: Profile | null, target?: TargetDoc): boolean {
  if (!target) return false;
  return isSectionAdmin(profile, target);
}

/** Can give the member score on a target (0–20) */
export function canGiveMemberScore(profile: Profile | null, target?: TargetDoc): boolean {
  if (!target) return false;
  if (!profile || profile.status !== 'approved') return false;
  return (
    profile.role === 'member' &&
    (profile.sectionSlugs.includes(target.sectionSlug) ||
      target.assignedUserIds.includes(profile.userId))
  );
}
