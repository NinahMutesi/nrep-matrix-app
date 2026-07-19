import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/appwrite/server';
import { DATABASE_ID, COLLECTIONS } from '@/lib/appwrite/config';
import { requireUser, requireApproved, ApiAuthError } from '@/lib/api-auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { profile, userId, name } = await requireUser(req);
    requireApproved(profile);
    const { databases } = getAdminClient();
    const body = await req.json();
    const { action, stage, note } = body;
    const now = new Date().toISOString();

    const update: Record<string, unknown> = {};

    if (stage === 'section') {
      // Section admin — stage 1
      if (profile.role !== 'admin' || !profile.sectionSlugs?.length) {
        throw new ApiAuthError('Only section admins can action stage 1.', 403);
      }
      update.reviewStatus   = action === 'approve' ? 'approved' : 'rejected';
      update.reviewedBy     = userId;
      update.reviewedByName = name;
      update.reviewedAt     = now;
      update.reviewNote     = note ?? null;

      // If approved at stage 1, apply progress to target
      if (action === 'approve') {
        const pending = await databases.getDocument(DATABASE_ID, COLLECTIONS.PENDING_UPDATES, params.id);
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.TARGETS, pending.targetId, {
          progressPercent: pending.proposedProgressPercent,
          status:          pending.proposedStatus,
          updatedAt:       now,
          updatedBy:       userId,
        });
      }
    } else if (stage === 'mukisa') {
      // Dr. Mukisa — stage 2 (final)
      if (profile.email !== 'mukisanic@nrep.ug') {
        throw new ApiAuthError('Only Dr. Mukisa can action stage 2.', 403);
      }
      update.mukisaStatus = action === 'approve' ? 'approved' : 'rejected';
      update.mukisaNote   = note ?? null;
      update.mukisaAt     = now;
    } else {
      throw new ApiAuthError('Invalid stage.', 400);
    }

    const updated = await databases.updateDocument(
      DATABASE_ID, COLLECTIONS.PENDING_UPDATES, params.id, update
    );
    return NextResponse.json({ update: updated });
  } catch (err) {
    if (err instanceof ApiAuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
