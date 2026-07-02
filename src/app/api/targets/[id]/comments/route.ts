import { NextResponse } from 'next/server';
import { ID, Query } from 'node-appwrite';
import { getAdminClient } from '@/lib/appwrite/server';
import { DATABASE_ID, COLLECTIONS } from '@/lib/appwrite/config';
import { requireUser, requireApproved, ApiAuthError } from '@/lib/api-auth';
import { canContributeToTarget } from '@/lib/permissions';
import { notifyNewComment } from '@/lib/email';
import type { TargetDoc } from '@/types';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireUser(req);
    requireApproved(profile);

    const { databases } = getAdminClient();
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.COMMENTS, [
      Query.equal('targetId', params.id),
      Query.orderDesc('createdAt'),
      Query.limit(200),
    ]);
    return NextResponse.json({ comments: res.documents });
  } catch (err) {
    if (err instanceof ApiAuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { profile, userId, name } = await requireUser(req);
    requireApproved(profile);

    const { databases } = getAdminClient();
    const target = (await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.TARGETS,
      params.id
    )) as unknown as TargetDoc;

    if (!canContributeToTarget(profile, target)) {
      throw new ApiAuthError("You don't have rights to comment on this task.", 403);
    }

    const { body } = (await req.json()) as { body: string };
    if (!body?.trim()) throw new ApiAuthError('Comment cannot be empty.', 400);

    const comment = await databases.createDocument(DATABASE_ID, COLLECTIONS.COMMENTS, ID.unique(), {
      targetId: params.id,
      userId,
      userName: name,
      body: body.trim(),
      createdAt: new Date().toISOString(),
    });

    // Notify section members in background.
    notifyNewComment({
      targetDescription: target.description,
      targetId: params.id,
      commenterName: name,
      commentBody: body.trim(),
      sectionSlug: target.sectionSlug,
      commenterUserId: userId,
    });

    return NextResponse.json({ comment });
  } catch (err) {
    if (err instanceof ApiAuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
