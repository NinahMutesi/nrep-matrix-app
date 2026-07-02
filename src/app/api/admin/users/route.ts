import { NextResponse } from 'next/server';
import { Query } from 'node-appwrite';
import { getAdminClient } from '@/lib/appwrite/server';
import { DATABASE_ID, COLLECTIONS } from '@/lib/appwrite/config';
import { requireUser, requireAdmin, ApiAuthError } from '@/lib/api-auth';

export async function GET(req: Request) {
  try {
    const { profile } = await requireUser(req);
    requireAdmin(profile);

    const { databases } = getAdminClient();
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
      Query.orderDesc('createdAt'),
      Query.limit(200),
    ]);
    return NextResponse.json({ profiles: res.documents });
  } catch (err) {
    if (err instanceof ApiAuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
