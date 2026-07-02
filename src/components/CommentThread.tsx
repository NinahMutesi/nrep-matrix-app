'use client';

import { useEffect, useState } from 'react';
import { authedFetch } from '@/lib/authed-fetch';
import type { CommentDoc } from '@/types';

export function CommentThread({ targetId, canPost }: { targetId: string; canPost: boolean }) {
  const [comments, setComments] = useState<CommentDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await authedFetch(`/api/targets/${targetId}/comments`);
      setComments(res.comments);
    } catch (err: any) {
      setError(err.message ?? 'Could not load comments.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId]);

  async function post() {
    if (!draft.trim()) return;
    setPosting(true);
    setError(null);
    try {
      await authedFetch(`/api/targets/${targetId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: draft }),
      });
      setDraft('');
      await load();
    } catch (err: any) {
      setError(err.message ?? 'Could not post comment.');
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="border border-line bg-white p-5">
      <p className="font-mono text-[11px] uppercase tracking-wider text-charcoal/50">
        Progress comments
      </p>

      {canPost && (
        <div className="mt-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Note progress made, blockers, or next steps…"
            rows={3}
            className="auth-input resize-none"
          />
          <button
            onClick={post}
            disabled={posting || !draft.trim()}
            className="mt-2 bg-ink px-4 py-2 font-mono text-xs uppercase tracking-wider text-parchment hover:bg-inkdeep disabled:opacity-50"
          >
            {posting ? 'Posting…' : 'Post comment'}
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-clay">{error}</p>}

      <div className="mt-4 space-y-3">
        {loading && <p className="font-mono text-xs text-charcoal/40">Loading…</p>}
        {!loading && comments.length === 0 && (
          <p className="font-mono text-xs text-charcoal/40">No comments yet.</p>
        )}
        {comments.map((c) => (
          <div key={c.$id} className="border-t border-line pt-3 first:border-0 first:pt-0">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-ink">{c.userName}</span>
              <span className="font-mono text-[10px] text-charcoal/40">
                {new Date(c.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="mt-1 text-sm text-charcoal/80 whitespace-pre-wrap">{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
