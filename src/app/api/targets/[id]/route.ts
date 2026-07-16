import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/appwrite/server';
import { DATABASE_ID, COLLECTIONS, type TargetStatus } from '@/lib/appwrite/config';
import { requireUser, requireApproved, ApiAuthError } from '@/lib/api-auth';
import { canEditTarget, isAdmin } from '@/lib/permissions';
import type { TargetDoc } from '@/types';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { profile, userId } = await requireUser(req);
    requireApproved(profile);
    const { databases } = getAdminClient();
    const target = (await databases.getDocument(DATABASE_ID, COLLECTIONS.TARGETS, params.id)) as unknown as TargetDoc;
    if (!canEditTarget(profile, target)) throw new ApiAuthError("You don't have edit rights on this target.", 403);

    const body = await req.json();
    const update: Record<string, unknown> = { updatedAt: new Date().toISOString(), updatedBy: userId };

    if (typeof body.progressPercent === 'number') update.progressPercent = Math.max(0, Math.min(150, Math.round(body.progressPercent)));
    if (body.status) update.status = body.status;
    if (typeof body.scoreManual === 'number') update.scoreManual = Math.max(0, Math.min(25, body.scoreManual));

    // Member score
    if (typeof body.scoreUser === 'number' && (profile.role === 'member' || profile.role === 'analyst'))
      update.scoreUser = Math.max(0, Math.round(body.scoreUser));

    // Section admin score
    if (typeof body.scoreAdmin === 'number' && profile.role === 'admin' && (profile.sectionSlugs?.length ?? 0) > 0)
      update.scoreAdmin = Math.max(0, Math.round(body.scoreAdmin));

    // Dr. Mukisa overall admin score — system admin (no sections)
    if (typeof body.scoreSuperAdmin === 'number' && isAdmin(profile) && (!profile.sectionSlugs || profile.sectionSlugs.length === 0))
      update.scoreSuperAdmin = Math.max(0, Math.round(body.scoreSuperAdmin));

    const updated = await databases.updateDocument(DATABASE_ID, COLLECTIONS.TARGETS, params.id, update);
    return NextResponse.json({ target: updated });
  } catch (err) {
    if (err instanceof ApiAuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
