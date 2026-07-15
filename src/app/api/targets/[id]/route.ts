import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/appwrite/server';
import { DATABASE_ID, COLLECTIONS, type TargetStatus } from '@/lib/appwrite/config';
import { requireUser, requireApproved, ApiAuthError } from '@/lib/api-auth';
import { canEditTarget } from '@/lib/permissions';
import type { TargetDoc } from '@/types';

interface Body {
  progressPercent?: number;
  status?: TargetStatus;
  scoreManual?: number;
  scoreUser?: number;
  scoreAdmin?: number;
  scoreSuperAdmin?: number;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { profile, userId } = await requireUser(req);
    requireApproved(profile);

    const { databases } = getAdminClient();
    const target = (await databases.getDocument(
      DATABASE_ID, COLLECTIONS.TARGETS, params.id
    )) as unknown as TargetDoc;

    if (!canEditTarget(profile, target)) {
      throw new ApiAuthError("You don't have edit rights on this section's tasks.", 403);
    }

    const body: Body = await req.json();
    const update: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    };

    if (typeof body.progressPercent === 'number') {
      update.progressPercent = Math.max(0, Math.min(150, Math.round(body.progressPercent)));
    }
    if (body.status) update.status = body.status;
    if (typeof body.scoreManual === 'number') update.scoreManual = Math.max(0, Math.min(25, body.scoreManual));

    // 3-way scoring — each role can only set their own score
    if (typeof body.scoreUser === 'number' && (profile.role === 'member' || profile.role === 'analyst')) {
      update.scoreUser = Math.max(0, Math.min(150, body.scoreUser));
    }
    if (typeof body.scoreAdmin === 'number' && (profile.role === 'admin' || profile.role === 'super_admin')) {
      update.scoreAdmin = Math.max(0, Math.min(150, body.scoreAdmin));
    }
    if (typeof body.scoreSuperAdmin === 'number' && profile.role === 'super_admin') {
      update.scoreSuperAdmin = Math.max(0, Math.min(150, body.scoreSuperAdmin));
    }

    const updated = await databases.updateDocument(DATABASE_ID, COLLECTIONS.TARGETS, params.id, update);
    return NextResponse.json({ target: updated });
  } catch (err) {
    if (err instanceof ApiAuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
