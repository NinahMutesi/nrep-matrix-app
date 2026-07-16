import { NextResponse } from 'next/server';
import { ID, Query } from 'node-appwrite';
import { getAdminClient } from '@/lib/appwrite/server';
import { DATABASE_ID, COLLECTIONS } from '@/lib/appwrite/config';
import { requireUser, requireApproved, ApiAuthError } from '@/lib/api-auth';
import { canContributeToTarget } from '@/lib/permissions';
import type { TargetDoc } from '@/types';

/** Links are stored as comments with body: [LINK] url | title */
function encodeLink(url: string, title: string) {
  return `[LINK] ${url.trim()} | ${title.trim()}`;
}

function decodeLink(body: string) {
  const raw = body.replace('[LINK] ', '');
  const idx = raw.indexOf(' | ');
  if (idx === -1) return { url: raw, title: raw };
  return { url: raw.slice(0, idx), title: raw.slice(idx + 3) };
}

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
    const links = res.documents.filter((c: any) => c.body?.startsWith('[LINK] '));
    return NextResponse.json({ links });
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
    const target = (await databases.getDocument(DATABASE_ID, COLLECTIONS.TARGETS, params.id)) as unknown as TargetDoc;

    if (!canContributeToTarget(profile, target)) {
      throw new ApiAuthError("You don't have rights to add links to this target.", 403);
    }

    const { url, title } = await req.json();
    if (!url?.trim()) throw new ApiAuthError('URL is required.', 400);

    const link = await databases.createDocument(DATABASE_ID, COLLECTIONS.COMMENTS, ID.unique(), {
      targetId: params.id,
      userId,
      userName: name,
      body: encodeLink(url, title || url),
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ link });
  } catch (err) {
    if (err instanceof ApiAuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
