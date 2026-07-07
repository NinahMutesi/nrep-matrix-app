import type { Profile, TargetDoc } from '@/types';

export function isSuperAdmin(profile: Profile | null): boolean {
  return !!profile && profile.role === 'super_admin' && profile.status === 'approved';
}

export function isAdmin(profile: Profile | null): boolean {
  return !!profile && (profile.role === 'admin' || profile.role === 'super_admin') && profile.status === 'approved';
}

export function canManageAdmins(profile: Profile | null): boolean {
  return isSuperAdmin(profile);
}

export function canDeleteData(profile: Profile | null): boolean {
  return isSuperAdmin(profile);
}

export function canEditTarget(profile: Profile | null, target: TargetDoc): boolean {
  if (!profile || profile.status !== 'approved') return false;
  if (profile.role === 'super_admin' || profile.role === 'admin') return true;
  if (profile.role === 'analyst' || profile.role === 'viewer') {
    return target.assignedUserIds.includes(profile.userId);
  }
  return (
    profile.sectionSlugs.includes(target.sectionSlug) ||
    target.assignedUserIds.includes(profile.userId)
  );
}

export function canContributeToTarget(profile: Profile | null, target: TargetDoc): boolean {
  if (!profile || profile.status !== 'approved') return false;
  if (profile.role === 'super_admin' || profile.role === 'admin' || profile.role === 'analyst') return true;
  if (profile.role === 'member') {
    return (
      profile.sectionSlugs.includes(target.sectionSlug) ||
      target.assignedUserIds.includes(profile.userId)
    );
  }
  return target.assignedUserIds.includes(profile.userId);
}

export function canViewAnalysis(profile: Profile | null): boolean {
  if (!profile || profile.status !== 'approved') return false;
  return true; // all approved roles can view analysis
}

export function canReviewUpdates(profile: Profile | null): boolean {
  if (!profile || profile.status !== 'approved') return false;
  return profile.role === 'super_admin' || profile.role === 'admin' || profile.role === 'analyst';
}
