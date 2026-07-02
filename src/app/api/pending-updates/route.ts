import { NextResponse } from 'next/server';
import { Query } from 'node-appwrite';
import { getAdminClient } from '@/lib/appwrite/server';
import { DATABASE_ID, COLLECTIONS } from '@/lib/appwrite/config';
import { requireUser, requireApproved, ApiAuthError } from '@/lib/api-auth';

export async function GET(req: Request) {
  try {
    const { profile } = await requireUser(req);
    requireApproved(profile);

    if (profile.role !== 'admin' && profile.role !== 'analyst') {
      throw new ApiAuthError('Only admins and analysts can view the review queue.', 403);
    }

    const url = new URL(req.url);
    const statusFilter = url.searchParams.get('status') ?? 'pending';

    const { databases } = getAdminClient();
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PENDING_UPDATES, [
      Query.equal('reviewStatus', statusFilter),
      Query.orderDesc('submittedAt'),
      Query.limit(200),
    ]);
    return NextResponse.json({ updates: res.documents });
  } catch (err) {
    if (err instanceof ApiAuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
