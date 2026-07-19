import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/appwrite/server';
import { DATABASE_ID, COLLECTIONS } from '@/lib/appwrite/config';
import { requireUser, requireApproved, ApiAuthError } from '@/lib/api-auth';
import { notifyReviewDecision } from '@/lib/email';
import type { PendingUpdateDoc } from '@/types';

interface Body {
  decision: 'approved' | 'rejected';
  reviewNote?: string;
}

export async function PATCH(req: Request, { params }: { params: { updateId: string } }) {
  try {
    const { profile, userId, name } = await requireUser(req);
    requireApproved(profile);

    if (profile.role !== 'admin' && profile.role !== 'analyst') {
      throw new ApiAuthError('Only admins and analysts can review updates.', 403);
    }

    const body: Body = await req.json();
    if (!body.decision || !['approved', 'rejected'].includes(body.decision)) {
      throw new ApiAuthError('decision must be "approved" or "rejected".', 400);
    }

    const { databases } = getAdminClient();
    const update = (await databases.getDocument(
      DATABASE_ID, COLLECTIONS.PENDING_UPDATES, params.updateId
    )) as unknown as PendingUpdateDoc;

    if (update.reviewStatus !== 'pending') {
      throw new ApiAuthError('This update has already been reviewed.', 409);
    }

    const now = new Date().toISOString();

    // Apply to the target if approved.
    if (body.decision === 'approved') {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.TARGETS, update.targetId, {
        progressPercent: update.proposedProgressPercent,
        status: update.proposedStatus,
        updatedAt: now,
        updatedBy: userId,
      });
    }

    // Record the review decision.
    const reviewed = await databases.updateDocument(
      DATABASE_ID, COLLECTIONS.PENDING_UPDATES, params.updateId,
      {
        reviewStatus: body.decision,
        reviewedBy: userId,
        reviewedByName: name,
        reviewedAt: now,
        reviewNote: body.reviewNote?.trim() || null,
      }
    );

    // Notify the submitter of the decision.
    notifyReviewDecision({
      submittedByUserId: update.submittedBy,
      submittedByName: update.submittedByName,
      targetDescription: update.targetDescription,
      decision: body.decision,
      reviewedByName: name,
      reviewNote: body.reviewNote?.trim() || null,
      proposedProgressPercent: update.proposedProgressPercent,
      proposedStatus: update.proposedStatus,
    });

    return NextResponse.json({ update: reviewed });
  } catch (err) {
    if (err instanceof ApiAuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
