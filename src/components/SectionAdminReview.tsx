'use client';

import { useEffect, useState } from 'react';
import { authedFetch } from '@/lib/authed-fetch';
import type { CommentDoc } from '@/types';

export function SectionAdminReview({ targetId, sectionSlug, isAdmin }: {
  targetId: string;
  sectionSlug: string;
  isAdmin: boolean;
}) {
  const [reviews, setReviews] = useState<CommentDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await authedFetch(`/api/targets/${targetId}/comments?type=admin_review`);
      // Filter to admin review comments
      setReviews((res.comments as CommentDoc[]).filter((c: any) => c.body?.startsWith('[ADMIN REVIEW]')));
    } catch { /* silent */ } finally {
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
      await load();
    } catch (err: any) {
      setError(err.message ?? 'Could not post review.');
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="rounded-lg border bg-white overflow-hidden" style={{ borderColor: '#054653' }}>
      <div className="px-5 py-3 border-b" style={{ backgroundColor: '#054653', borderColor: '#054653' }}>
        <p className="font-mono text-[11px] uppercase tracking-wider text-white/80">
          Section admin review
        </p>
        <p className="text-xs text-white/60">
          Formal review notes from the section admin on this member's work
        </p>
      </div>

      <div className="p-4">
        {isAdmin && (
          <div className="mb-4">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a formal review of the progress and work done on this target…"
              rows={3}
              className="auth-input resize-none"
            />
            {error && <p className="mt-1 text-sm text-clay">{error}</p>}
            <button
              onClick={post}
              disabled={posting || !draft.trim()}
              className="mt-2 px-4 py-2 font-mono text-xs uppercase tracking-wider text-white disabled:opacity-50"
              style={{ backgroundColor: '#054653' }}
            >
              {posting ? 'Posting…' : 'Post review'}
            </button>
          </div>
        )}

        {loading && <p className="font-mono text-xs text-charcoal/40">Loading…</p>}
        {!loading && reviews.length === 0 && (
          <p className="font-mono text-xs text-charcoal/40">
            No admin reviews posted yet{isAdmin ? ' — add the first one above.' : '.'}
          </p>
        )}

        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.$id} className="rounded border-l-4 bg-parchment/60 p-3" style={{ borderLeftColor: '#054653' }}>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-ink">{r.userName}</span>
                <span className="font-mono text-[10px] text-charcoal/40">
                  {new Date(r.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-sm text-charcoal/80 whitespace-pre-wrap">
                {r.body.replace('[ADMIN REVIEW] ', '')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
