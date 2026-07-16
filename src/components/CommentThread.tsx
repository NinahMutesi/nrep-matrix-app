'use client';

import { useEffect, useState } from 'react';
import { authedFetch } from '@/lib/authed-fetch';
import type { CommentDoc } from '@/types';

export function CommentThread({
  targetId,
  canPost,
  onCommentPosted,
}: {
  targetId: string;
  canPost: boolean;
  onCommentPosted?: () => void;
}) {
  const [comments, setComments] = useState<CommentDoc[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [draft,    setDraft]    = useState('');
  const [posting,  setPosting]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await authedFetch(`/api/targets/${targetId}/comments`);
      // Only show regular comments (not admin reviews)
      setComments(
        (res.comments ?? []).filter((c: any) => !c.body?.startsWith('[ADMIN REVIEW]'))
      );
    } catch (err: any) {
      setError(err.message ?? 'Could not load comments.');
    } finally {
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
        body: JSON.stringify({ body: draft }),
      });
      setDraft('');
      await load();
      onCommentPosted?.(); // ← triggers count refresh on parent
    } catch (err: any) {
      setError(err.message ?? 'Could not post comment.');
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border-2 bg-white" style={{ borderColor: '#D0D8DA' }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: '#E5E7EB', backgroundColor: '#F8FAFB' }}>
        <p className="text-sm font-bold text-gray-700">Comments</p>
        
      </div>

      <div className="p-4">
        {canPost && (
          <div className="mb-4">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Note progress made, blockers, or next steps…"
              rows={3}
              className="w-full rounded-lg border-2 px-3 py-2 text-sm text-gray-700 resize-none"
              style={{ borderColor: '#D0D8DA' }}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
            <button
              onClick={post}
              disabled={posting || !draft.trim()}
              className="mt-2 w-full rounded-lg py-2 text-sm font-bold text-white disabled:opacity-50"
              style={{ backgroundColor: '#054653' }}
            >
              {posting ? 'Posting…' : 'Post comment'}
            </button>
          </div>
        )}

        {loading && <p className="text-sm text-gray-400">Loading…</p>}
        {!loading && comments.length === 0 && (
          <p className="text-sm italic text-gray-300">No comments yet.</p>
        )}
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.$id} className="border-t border-gray-100 pt-3 first:border-0 first:pt-0">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold text-gray-800">{c.userName}</span>
                <span className="text-xs text-gray-400">
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
