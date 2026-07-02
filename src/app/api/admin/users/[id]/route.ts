import { NextResponse } from 'next/server';
import { Query } from 'node-appwrite';
import { getAdminClient } from '@/lib/appwrite/server';
import { DATABASE_ID, COLLECTIONS } from '@/lib/appwrite/config';
import { requireUser, requireAdmin, ApiAuthError } from '@/lib/api-auth';

interface Body {
  status?: 'pending' | 'approved' | 'rejected';
  role?: 'admin' | 'analyst' | 'member' | 'viewer';
  sectionSlugs?: string[];
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { profile: caller } = await requireUser(req);
    requireAdmin(caller);

    const body: Body = await req.json();
    const { databases, teams, users } = getAdminClient();

    const target = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, params.id);

    const update: Record<string, unknown> = {};
    if (body.status) update.status = body.status;
    if (body.role) update.role = body.role;
    if (body.sectionSlugs) update.sectionSlugs = body.sectionSlugs;

    const updated = await databases.updateDocument(DATABASE_ID, COLLECTIONS.PROFILES, params.id, update);

    if (body.role) {
      try {
        await users.updateLabels(target.userId as string, [body.role]);
      } catch (e) {
        console.error('Label sync failed:', e);
      }
    }

    // Sync Appwrite Team memberships so document-level permissions (Role.team)
    // actually reflect the assigned sections.
    if (body.sectionSlugs) {
      const sectionsRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SECTIONS, [
        Query.limit(200),
      ]);
      const allSections = sectionsRes.documents as any[];

      for (const section of allSections) {
        const shouldBeMember = body.sectionSlugs.includes(section.slug);
        try {
          const memberships = await teams.listMemberships(section.teamId, [
            Query.equal('userId', target.userId as string),
          ]);
          const existing = memberships.memberships[0];
          if (shouldBeMember && !existing) {
            await teams.createMembership(
              section.teamId,
              ['member'],
              undefined,
              target.userId as string
            );
          } else if (!shouldBeMember && existing) {
            await teams.deleteMembership(section.teamId, existing.$id);
          }
        } catch (e) {
          console.error(`Team sync failed for section ${section.slug}:`, e);
        }
      }
    }

    return NextResponse.json({ profile: updated });
  } catch (err) {
    if (err instanceof ApiAuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
