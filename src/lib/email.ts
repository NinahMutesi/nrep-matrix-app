import 'server-only';
import { Messaging, ID } from 'node-appwrite';
import { getAdminClient } from '@/lib/appwrite/server';
import { DATABASE_ID, COLLECTIONS } from '@/lib/appwrite/config';
import { Query } from 'node-appwrite';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

function getMessaging() {
  const { client } = getAdminClient();
  return new Messaging(client);
}

/**
 * Notify admins + analysts that a new pending update needs review.
 * Falls back silently if no email provider is configured in Appwrite.
 */
export async function notifyPendingUpdate({
  submittedByName,
  targetDescription,
  proposedProgressPercent,
  proposedStatus,
  updateId,
}: {
  submittedByName: string;
  targetDescription: string;
  proposedProgressPercent: number;
  proposedStatus: string;
  updateId: string;
}) {
  try {
    const { databases } = getAdminClient();
    const reviewers = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
      Query.equal('status', 'approved'),
      Query.limit(100),
    ]);

    const reviewerIds = reviewers.documents
      .filter((p: any) => p.role === 'admin' || p.role === 'analyst')
      .map((p: any) => p.userId as string);

    if (reviewerIds.length === 0) return;

    const messaging = getMessaging();
    await messaging.createEmail(
      ID.unique(),
      `[NREP Matrix] Update pending review: ${targetDescription.slice(0, 60)}`,
      `
<p>Hi,</p>
<p><strong>${submittedByName}</strong> has submitted a progress update that needs your review:</p>
<ul>
  <li><strong>Target:</strong> ${targetDescription}</li>
  <li><strong>Proposed progress:</strong> ${proposedProgressPercent}%</li>
  <li><strong>Proposed status:</strong> ${proposedStatus}</li>
</ul>
<p><a href="${APP_URL}/admin/review">Open the review queue →</a></p>
      `.trim(),
      [], // topics
      reviewerIds,
      [], // targets
      [], // cc
      [], // bcc
      [], // attachments
      false, // draft
      true, // html
    );
  } catch (err) {
    // Never let email failure break the main API response.
    console.warn('[email] notifyPendingUpdate failed:', err);
  }
}

/**
 * Notify the original submitter of a review decision on their update.
 */
export async function notifyReviewDecision({
  submittedByUserId,
  submittedByName,
  targetDescription,
  decision,
  reviewedByName,
  reviewNote,
  proposedProgressPercent,
  proposedStatus,
}: {
  submittedByUserId: string;
  submittedByName: string;
  targetDescription: string;
  decision: 'approved' | 'rejected';
  reviewedByName: string;
  reviewNote: string | null;
  proposedProgressPercent: number;
  proposedStatus: string;
}) {
  try {
    const messaging = getMessaging();
    const verb = decision === 'approved' ? 'approved' : 'rejected';
    const color = decision === 'approved' ? '#3C6E63' : '#A14E3C';

    await messaging.createEmail(
      ID.unique(),
      `[NREP Matrix] Your update was ${verb}`,
      `
<p>Hi ${submittedByName},</p>
<p>Your progress update for <strong>${targetDescription}</strong> has been
<span style="color:${color};font-weight:bold;">${verb}</span> by ${reviewedByName}.</p>
<ul>
  <li><strong>Proposed progress:</strong> ${proposedProgressPercent}%</li>
  <li><strong>Proposed status:</strong> ${proposedStatus}</li>
</ul>
${reviewNote ? `<p><strong>Reviewer note:</strong> ${reviewNote}</p>` : ''}
<p><a href="${APP_URL}/matrix">Open the implementation matrix →</a></p>
      `.trim(),
      [], // topics
      [submittedByUserId],
      [], // targets
      [], // cc
      [], // bcc
      [], // attachments
      false,
      true,
    );
  } catch (err) {
    console.warn('[email] notifyReviewDecision failed:', err);
  }
}

/**
 * Notify section members that a new comment was posted on one of their tasks.
 */
export async function notifyNewComment({
  targetDescription,
  targetId,
  commenterName,
  commentBody,
  sectionSlug,
  commenterUserId,
}: {
  targetDescription: string;
  targetId: string;
  commenterName: string;
  commentBody: string;
  sectionSlug: string;
  commenterUserId: string;
}) {
  try {
    const { databases } = getAdminClient();
    const members = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
      Query.equal('status', 'approved'),
      Query.contains('sectionSlugs', [sectionSlug]),
      Query.limit(100),
    ]);

    const recipientIds = members.documents
      .map((p: any) => p.userId as string)
      .filter((id) => id !== commenterUserId); // don't email the commenter themselves

    if (recipientIds.length === 0) return;

    const messaging = getMessaging();
    await messaging.createEmail(
      ID.unique(),
      `[NREP Matrix] New comment on: ${targetDescription.slice(0, 60)}`,
      `
<p><strong>${commenterName}</strong> posted a comment on a task in your section:</p>
<blockquote style="border-left:3px solid #D98E2B;padding-left:12px;color:#444;">
  ${commentBody}
</blockquote>
<p><a href="${APP_URL}/matrix/${targetId}">Open the task →</a></p>
      `.trim(),
      [],
      recipientIds,
      [],
      [],
      [],
      [],
      false,
      true,
    );
  } catch (err) {
    console.warn('[email] notifyNewComment failed:', err);
  }
}
