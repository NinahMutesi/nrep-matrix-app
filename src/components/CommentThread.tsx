'use client';

import { useEffect, useState } from 'react';
import { authedFetch } from '@/lib/authed-fetch';
import type { CommentDoc } from '@/types';

export function CommentThread({
  targetId,
  canPost,
  isAdmin,
  leadOrg,
}: {
  targetId: string;
  canPost: boolean;
  isAdmin?: boolean;
  leadOrg?: string;
}) {
  const [comments, setComments] = useState<CommentDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [posting, setPosting] = useState(false);
  const [postingAdmin, setPostingAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'progress' | 'admin'>('progress');

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

  useEffect(() => { load(); }, [targetId]);

  async function post(body: string, isAdminReview: boolean, setSaving: (v: boolean) => void, clearDraft: () => void) {
    if (!body.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await authedFetch(`/api/targets/${targetId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: isAdminReview ? `[ADMIN REVIEW] ${body}` : body }),
      });
      clearDraft();
      await load();
    } catch (err: any) {
      setError(err.message ?? 'Could not post comment.');
    } finally {
      setSaving(false);
    }
  }

  const progressComments = comments.filter((c) => !c.body.startsWith('[ADMIN REVIEW]'));
  const adminComments = comments.filter((c) => c.body.startsWith('[ADMIN REVIEW]'));

  return (
    <div className="rounded-lg bg-white" style={{ border: '1px solid #D0D8DA' }}>
      {/* Header with tabs */}
      <div className="flex items-center justify-between px-5 pt-4 pb-0">
        <p className="font-mono text-[11px] uppercase tracking-wider text-charcoal/50">Comments</p>
        {isAdmin && (
          <div className="flex gap-0 text-[10px] font-mono uppercase tracking-wider border border-line overflow-hidden rounded">
            <button
              onClick={() => setTab('progress')}
              className="px-2 py-1 transition"
              style={{ backgroundColor: tab === 'progress' ? '#054653' : 'transparent', color: tab === 'progress' ? 'white' : '#666' }}
            >
              Progress ({progressComments.length})
            </button>
            <button
              onClick={() => setTab('admin')}
              className="px-2 py-1 transition border-l border-line"
              style={{ backgroundColor: tab === 'admin' ? '#054653' : 'transparent', color: tab === 'admin' ? 'white' : '#666' }}
            >
              Admin review ({adminComments.length})
            </button>
          </div>
        )}
      </div>

      <div className="px-5 pb-5 pt-3">
        {/* Post area */}
        {canPost && tab === 'progress' && (
          <div className="mb-4">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Note progress made, blockers, or next steps…"
              rows={2}
              className="auth-input resize-none"
            />
            <button
              onClick={() => post(draft, false, setPosting, () => setDraft(''))}
              disabled={posting || !draft.trim()}
              className="mt-2 bg-ink px-4 py-2 font-mono text-xs uppercase tracking-wider text-parchment hover:bg-inkdeep disabled:opacity-50"
            >
              {posting ? 'Posting…' : 'Post comment'}
            </button>
          </div>
        )}

        {isAdmin && tab === 'admin' && (
          <div className="mb-4 rounded border border-[#054653]/30 bg-[#054653]/5 p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#054653] mb-2">
              Section admin review — only admins can see this
            </p>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder={`Review the work done by the team on this target. Note quality, completeness, follow-up needed…`}
              rows={3}
              className="auth-input resize-none"
            />
            <button
              onClick={() => post(adminNote, true, setPostingAdmin, () => setAdminNote(''))}
              disabled={postingAdmin || !adminNote.trim()}
              className="mt-2 px-4 py-2 font-mono text-xs uppercase tracking-wider text-white disabled:opacity-50"
              style={{ backgroundColor: '#054653' }}
            >
              {postingAdmin ? 'Posting…' : 'Post admin review'}
            </button>
          </div>
        )}

        {error && <p className="mb-2 text-sm text-clay">{error}</p>}

        {/* Comment list */}
        <div className="space-y-3">
          {loading && <p className="font-mono text-xs text-charcoal/40">Loading…</p>}
          {!loading && (tab === 'progress' ? progressComments : adminComments).length === 0 && (
            <p className="font-mono text-xs text-charcoal/40">
              {tab === 'admin' ? 'No admin reviews yet.' : 'No comments yet.'}
            </p>
          )}
          {(tab === 'progress' ? progressComments : adminComments).map((c) => {
            const isAdminReview = c.body.startsWith('[ADMIN REVIEW]');
            const body = isAdminReview ? c.body.replace('[ADMIN REVIEW] ', '') : c.body;
            return (
              <div key={c.$id} className="border-t border-line pt-3 first:border-0 first:pt-0">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">{c.userName}</span>
                    {isAdminReview && (
                      <span className="rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase" style={{ backgroundColor: '#054653', color: 'white' }}>
                        Admin
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-charcoal/40">
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-charcoal/80 whitespace-pre-wrap">{body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
