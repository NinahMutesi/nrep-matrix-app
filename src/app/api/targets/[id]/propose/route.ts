import { NextResponse } from 'next/server';
import { ID } from 'node-appwrite';
import { getAdminClient } from '@/lib/appwrite/server';
import { DATABASE_ID, COLLECTIONS, type TargetStatus } from '@/lib/appwrite/config';
import { requireUser, requireApproved, ApiAuthError } from '@/lib/api-auth';
import { canEditTarget } from '@/lib/permissions';
import { notifyPendingUpdate } from '@/lib/email';
import type { TargetDoc } from '@/types';

interface Body {
  proposedProgressPercent: number;
  proposedStatus: TargetStatus;
  justification?: string;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { profile, userId, name } = await requireUser(req);
    requireApproved(profile);

    const { databases } = getAdminClient();
    const target = (await databases.getDocument(
      DATABASE_ID, COLLECTIONS.TARGETS, params.id
    )) as unknown as TargetDoc;

    if (!canEditTarget(profile, target)) {
      throw new ApiAuthError("You don't have rights to update this task.", 403);
    }

    const body: Body = await req.json();
    if (typeof body.proposedProgressPercent !== 'number' || !body.proposedStatus) {
      throw new ApiAuthError('proposedProgressPercent and proposedStatus are required.', 400);
    }

    // Admins bypass the queue — their updates apply directly.
    if (profile.role === 'admin') {
      const updated = await databases.updateDocument(DATABASE_ID, COLLECTIONS.TARGETS, params.id, {
        progressPercent: Math.max(0, Math.min(100, Math.round(body.proposedProgressPercent))),
        status: body.proposedStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
      });
      return NextResponse.json({ applied: true, target: updated });
    }

    // Everyone else creates a pending update for review.
    const pending = await databases.createDocument(
      DATABASE_ID, COLLECTIONS.PENDING_UPDATES, ID.unique(),
      {
        targetId: params.id,
        targetDescription: target.description,
        submittedBy: userId,
        submittedByName: name,
        submittedAt: new Date().toISOString(),
        proposedProgressPercent: Math.max(0, Math.min(100, Math.round(body.proposedProgressPercent))),
        proposedStatus: body.proposedStatus,
        justification: body.justification?.trim() || null,
        reviewStatus: 'pending',
        reviewedBy: null,
        reviewedByName: null,
        reviewedAt: null,
        reviewNote: null,
      }
    );

    // Fire email to reviewers in background (don't await — never block the response).
    notifyPendingUpdate({
      submittedByName: name,
      targetDescription: target.description,
      proposedProgressPercent: Math.max(0, Math.min(100, Math.round(body.proposedProgressPercent))),
      proposedStatus: body.proposedStatus,
      updateId: pending.$id,
    });

    return NextResponse.json({ applied: false, pending });
  } catch (err) {
    if (err instanceof ApiAuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
