'use client';

import { useEffect, useState } from 'react';
import { authedFetch } from '@/lib/authed-fetch';
import { isSectionAdmin } from '@/lib/permissions';
import type { CommentDoc, Profile, TargetDoc } from '@/types';

export function SectionAdminReview({
  targetId,
  target,
  profile,
  onReviewPosted,
}: {
  targetId: string;
  target: TargetDoc;
  profile: Profile | null;
  onReviewPosted?: () => void;
}) {
  const [reviews,   setReviews]  = useState<CommentDoc[]>([]);
  const [loading,   setLoading]  = useState(true);
  const [draft,     setDraft]    = useState('');
  const [posting,   setPosting]  = useState(false);
  const [error,     setError]    = useState<string | null>(null);
  const [showForm,  setShowForm] = useState(false);

  const canReview = isSectionAdmin(profile, target);

  async function load() {
    setLoading(true);
    try {
      const res = await authedFetch(`/api/targets/${targetId}/comments`);
      setReviews(
        (res.comments ?? []).filter((c: any) => c.body?.startsWith('[ADMIN REVIEW]'))
      );
    } catch { } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [targetId]);

  async function post() {
    if (!draft.trim()) return;
    setPosting(true);
    setError(null);
    try {
      await authedFetch(`/api/targets/${targetId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: `[ADMIN REVIEW] ${draft.trim()}` }),
      });
      setDraft('');
      setShowForm(false);
      await load();
      onReviewPosted?.(); // ← triggers count refresh on parent
    } catch (err: any) {
      setError(err.message ?? 'Could not post review.');
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border-2 bg-white" style={{ borderColor: '#054653' }}>
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ backgroundColor: '#054653' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <p className="text-base font-bold text-white">Section Admin Review</p>
            {reviews.length > 0 && (
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                style={{ backgroundColor: '#D98E2B', color: 'white' }}
              >
                {reviews.length}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
            {canReview
              ? 'Write your formal assessment of progress on this target.'
              : reviews.length > 0
                ? `${reviews.length} review${reviews.length > 1 ? 's' : ''} posted by the section admin.`
                : 'No section admin review posted yet.'}
          </p>
        </div>
        {canReview && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg border-2 border-white px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
          >
            {showForm ? 'Cancel' : '+ Write review'}
          </button>
        )}
      </div>

      {showForm && canReview && (
        <div className="border-b-2 p-5" style={{ borderColor: '#E5E7EB', backgroundColor: '#F8FAFB' }}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Formally assess the progress made, quality of work, gaps, and your recommendation…"
            rows={4}
            className="w-full rounded-lg border-2 px-3 py-2 text-sm text-gray-700"
            style={{ borderColor: '#D0D8DA' }}
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button
              onClick={post}
              disabled={posting || !draft.trim()}
              className="rounded-lg px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
              style={{ backgroundColor: '#054653' }}
            >
              {posting ? 'Posting…' : 'Post review'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border-2 px-4 py-2 text-sm font-medium text-gray-600"
              style={{ borderColor: '#D0D8DA' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="p-5">
        {loading && <p className="text-sm text-gray-400">Loading reviews…</p>}
        {!loading && reviews.length === 0 && (
          <p className="text-sm italic text-gray-400">
            {canReview
              ? 'No reviews yet. Click "+ Write review" above.'
              : 'No admin review posted yet.'}
          </p>
        )}
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.$id} className="rounded-lg border-l-4 p-4"
              style={{ borderLeftColor: '#054653', backgroundColor: '#EEF6F7' }}>
              <div className="flex items-baseline justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">{r.userName}</span>
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: '#054653' }}
                  >
                    Section Admin
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(r.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                {r.body.replace('[ADMIN REVIEW] ', '')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
