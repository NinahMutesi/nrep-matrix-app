import { NextResponse } from 'next/server';
import { Query } from 'node-appwrite';
import { getAdminClient } from '@/lib/appwrite/server';
import { DATABASE_ID, COLLECTIONS, type TargetStatus } from '@/lib/appwrite/config';
import { requireUser, requireApproved, ApiAuthError } from '@/lib/api-auth';
import { canEditTarget } from '@/lib/permissions';
import { fiscalYearLabel } from '@/lib/plan-years';
import type { TargetDoc } from '@/types';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireUser(req);
    requireApproved(profile);

    const { databases } = getAdminClient();
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.YEARLY_RECORDS, [
      Query.equal('targetId', params.id),
      Query.orderAsc('year'),
      Query.limit(50),
    ]);
    return NextResponse.json({ years: res.documents });
  } catch (err) {
    if (err instanceof ApiAuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}

interface Body {
  year: number;
  label?: string;
  progressPercent?: number;
  status?: TargetStatus;
  note?: string;
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

    if (!canEditTarget(profile, target)) {
      throw new ApiAuthError("You don't have edit rights on this section's tasks.", 403);
    }

    const body: Body = await req.json();
    if (!body.year || body.year < 1 || body.year > 20) {
      throw new ApiAuthError('A valid year number is required.', 400);
    }

    const docId = `${params.id}-Y${body.year}`;
    const data = {
      targetId: params.id,
      year: body.year,
      label: body.label?.trim() || fiscalYearLabel(body.year),
      progressPercent:
        typeof body.progressPercent === 'number'
          ? Math.max(0, Math.min(100, Math.round(body.progressPercent)))
          : null,
      status: body.status ?? null,
      note: body.note?.trim() || null,
      recordedBy: userId,
      recordedByName: name,
      recordedAt: new Date().toISOString(),
    };

    let record;
    try {
      record = await databases.getDocument(DATABASE_ID, COLLECTIONS.YEARLY_RECORDS, docId);
      // Preserve any imported scorecard scores already on this record.
      record = await databases.updateDocument(DATABASE_ID, COLLECTIONS.YEARLY_RECORDS, docId, data);
    } catch {
      record = await databases.createDocument(DATABASE_ID, COLLECTIONS.YEARLY_RECORDS, docId, {
        targetScore: null,
        initiativesScore: null,
        kraScore: null,
        ...data,
      });
    }

    return NextResponse.json({ year: record });
  } catch (err) {
    if (err instanceof ApiAuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
