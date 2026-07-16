'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/lib/auth-context';
import { authedFetch } from '@/lib/authed-fetch';
import { databases } from '@/lib/appwrite/client';
import { DATABASE_ID, COLLECTIONS } from '@/lib/appwrite/config';
import { Query } from 'appwrite';
import type { TargetDoc } from '@/types';

interface ReviewItem {
  reviewId: string;
  reviewText: string;
  reviewerName: string;
  reviewedAt: string;
  targetId: string;
  targetCode: string;
  targetDescription: string;
  resultCode: string;
}

export default function MyReviewsPage() {
  const { profile } = useAuth();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadReviews();
  }, [profile]);

  async function loadReviews() {
    setLoading(true);
    try {
      // 1. Get all targets assigned to this user
      const targetsRes = await databases.listDocuments(
        DATABASE_ID, COLLECTIONS.TARGETS,
        [Query.contains('assignedUserIds', profile!.userId), Query.limit(200)]
      );
      const myTargets = targetsRes.documents as unknown as TargetDoc[];

      if (!myTargets.length) { setLoading(false); return; }

      // 2. For each target, fetch admin reviews
      const allReviews: ReviewItem[] = [];

      // Load results for display
      const resultsRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.RESULTS, [Query.limit(20)]);
      const resultsMap: Record<string, string> = {};
      for (const r of resultsRes.documents) resultsMap[r.$id] = (r as any).code;

      // Fetch comments for each target
      await Promise.all(myTargets.map(async (target) => {
        try {
          const res = await authedFetch(`/api/targets/${target.$id}/comments`);
          const adminReviews = (res.comments ?? []).filter(
            (c: any) => c.body?.startsWith('[ADMIN REVIEW]')
          );
          for (const review of adminReviews) {
            allReviews.push({
              reviewId:          review.$id,
              reviewText:        review.body.replace('[ADMIN REVIEW] ', ''),
              reviewerName:      review.userName,
              reviewedAt:        review.createdAt,
              targetId:          target.$id,
              targetCode:        target.code,
              targetDescription: target.description,
              resultCode:        resultsMap[target.resultId] ?? '',
            });
          }
        } catch { /* skip failed fetches */ }
      }));

      // Sort newest first
      allReviews.sort((a, b) =>
        new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()
      );
      setReviews(allReviews);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-8 py-10">
        <p className="font-mono text-xs uppercase tracking-wider text-clay">
          My section
        </p>
        <h1 className="mt-1 font-display text-3xl text-ink">My Reviews</h1>
        <p className="mt-1 text-sm text-gray-500">
          Formal assessments from section admins and the super admin on your assigned targets.
        </p>

        {loading && (
          <p className="mt-10 font-mono text-sm text-gray-400">Loading reviews…</p>
        )}

        {!loading && reviews.length === 0 && (
          <div
            className="mt-8 rounded-lg border-2 p-10 text-center"
            style={{ borderColor: '#E5E7EB' }}
          >
            <p className="text-4xl mb-3">📋</p>
            <p className="font-display text-xl text-gray-700">No reviews yet</p>
            <p className="mt-2 text-sm text-gray-400">
              When a section admin reviews one of your targets, it will appear here.
            </p>
          </div>
        )}

        {!loading && reviews.length > 0 && (
          <div className="mt-6 space-y-4">
            <p className="font-mono text-xs text-gray-400">
              {reviews.length} review{reviews.length !== 1 ? 's' : ''} on your targets
            </p>
            {reviews.map((review) => (
              <div
                key={review.reviewId}
                className="overflow-hidden rounded-lg border-2 bg-white"
                style={{ borderColor: '#D0D8DA', borderLeft: '4px solid #054653' }}
              >
                {/* Target breadcrumb */}
                <div
                  className="flex items-center justify-between px-5 py-3 border-b"
                  style={{ borderColor: '#E5E7EB', backgroundColor: '#F8FAFB' }}
                >
                  <div>
                    <p
                      className="font-mono text-xs font-bold uppercase tracking-wider"
                      style={{ color: '#054653' }}
                    >
                      {review.resultCode} · Target {review.targetCode}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-gray-700 line-clamp-1">
                      {review.targetDescription}
                    </p>
                  </div>
                  <Link
                    href={`/matrix/${review.targetId}?from=my_section`}
                    className="shrink-0 ml-4 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                    style={{ backgroundColor: '#054653' }}
                  >
                    View target →
                  </Link>
                </div>

                {/* Review content */}
                <div className="px-5 py-4">
                  <div className="flex items-baseline justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">
                        {review.reviewerName}
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                        style={{ backgroundColor: '#054653' }}
                      >
                        Admin
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.reviewedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {review.reviewText}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
