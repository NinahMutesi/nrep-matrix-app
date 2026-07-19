import { NextResponse } from 'next/server';
import { Query } from 'node-appwrite';
import { getAdminClient } from '@/lib/appwrite/server';
import { DATABASE_ID, COLLECTIONS } from '@/lib/appwrite/config';
import { requireUser, requireApproved, ApiAuthError } from '@/lib/api-auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireUser(req);
    requireApproved(profile);
    const { databases } = getAdminClient();
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PENDING_UPDATES, [
      Query.equal('targetId', params.id),
      Query.orderDesc('submittedAt'),
      Query.limit(20),
    ]);
    return NextResponse.json({ updates: res.documents });
  } catch (err) {
    if (err instanceof ApiAuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
