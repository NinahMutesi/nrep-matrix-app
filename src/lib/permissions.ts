import type { Profile, TargetDoc } from '@/types';

/** True if this profile can edit a given target. */
export function canEditTarget(profile: Profile | null, target: TargetDoc): boolean {
  if (!profile || profile.status !== 'approved') return false;
  if (profile.role === 'admin') return true;
  if (profile.role === 'analyst' || profile.role === 'viewer') {
    // Analysts/viewers can only edit if they are also personally assigned.
    return target.assignedUserIds.includes(profile.userId);
  }
  // 'member' role: can edit if they belong to the section the task is assigned to,
  // or are personally assigned to it.
  return (
    profile.sectionSlugs.includes(target.sectionSlug) ||
    target.assignedUserIds.includes(profile.userId)
  );
}

/** True if this profile can comment / upload reports on a given target. */
export function canContributeToTarget(profile: Profile | null, target: TargetDoc): boolean {
  if (!profile || profile.status !== 'approved') return false;
  if (profile.role === 'admin' || profile.role === 'analyst') return true;
  // Members can contribute to any task in their section(s), or any they're personally assigned to.
  if (profile.role === 'member') {
    return (
      profile.sectionSlugs.includes(target.sectionSlug) ||
      target.assignedUserIds.includes(profile.userId)
    );
  }
  // Viewers can contribute only to tasks personally assigned to them.
  return target.assignedUserIds.includes(profile.userId);
}

/** True if this profile may view analytics. */
export function canViewAnalysis(profile: Profile | null): boolean {
  if (!profile || profile.status !== 'approved') return false;
  return profile.role === 'admin' || profile.role === 'analyst' || profile.role === 'member' || profile.role === 'viewer';
}

/** True if this profile may access the admin console. */
export function isAdmin(profile: Profile | null): boolean {
  return !!profile && profile.role === 'admin' && profile.status === 'approved';
}
