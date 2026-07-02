import { NextResponse } from 'next/server';
import { ID, Query } from 'node-appwrite';
import { getAdminClient } from '@/lib/appwrite/server';
import { DATABASE_ID, COLLECTIONS } from '@/lib/appwrite/config';
import { requireUser, requireApproved, ApiAuthError } from '@/lib/api-auth';
import { canContributeToTarget } from '@/lib/permissions';
import type { TargetDoc } from '@/types';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireUser(req);
    requireApproved(profile);

    const { databases } = getAdminClient();
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.REPORTS, [
      Query.equal('targetId', params.id),
      Query.orderDesc('uploadedAt'),
      Query.limit(100),
    ]);
    return NextResponse.json({ reports: res.documents });
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
      throw new ApiAuthError("You don't have rights to upload reports for this task.", 403);
    }

    const { fileId, fileName, description } = await req.json();
    if (!fileId || !fileName) throw new ApiAuthError('fileId and fileName are required.', 400);

    const report = await databases.createDocument(DATABASE_ID, COLLECTIONS.REPORTS, ID.unique(), {
      targetId: params.id,
      fileId,
      fileName,
      description: description ?? null,
      uploadedBy: userId,
      uploadedByName: name,
      uploadedAt: new Date().toISOString(),
    });
    return NextResponse.json({ report });
  } catch (err) {
    if (err instanceof ApiAuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
