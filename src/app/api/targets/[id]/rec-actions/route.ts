import { NextResponse } from 'next/server';
import { ID, Query } from 'node-appwrite';
import { getAdminClient } from '@/lib/appwrite/server';
import { DATABASE_ID, COLLECTIONS } from '@/lib/appwrite/config';
import { requireUser, requireApproved, ApiAuthError } from '@/lib/api-auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireUser(req);
    requireApproved(profile);
    const { databases } = getAdminClient();
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.REC_ACTIONS, [
      Query.equal('targetId', params.id),
      Query.orderDesc('actionedAt'),
      Query.limit(200),
    ]);
    return NextResponse.json({ actions: res.documents });
  } catch (err) {
    if (err instanceof ApiAuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { profile, userId, name } = await requireUser(req);
    requireApproved(profile);
    const { databases } = getAdminClient();
    const body = await req.json();
    if (!body.actionDescription?.trim()) throw new ApiAuthError('Action description is required.', 400);

    const action = await databases.createDocument(DATABASE_ID, COLLECTIONS.REC_ACTIONS, ID.unique(), {
      targetId: params.id,
      actionDescription: body.actionDescription.trim(),
      actionedBy: userId,
      actionedByName: name,
      organisation: body.organisation?.trim() || null,
      score: typeof body.score === 'number' ? Math.max(0, Math.min(25, body.score)) : null,
      actionedAt: new Date().toISOString(),
      status: body.status ?? 'pending',
    });
    return NextResponse.json({ action });
  } catch (err) {
    if (err instanceof ApiAuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
