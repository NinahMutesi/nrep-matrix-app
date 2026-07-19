'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/lib/auth-context';
import { databases } from '@/lib/appwrite/client';
import { DATABASE_ID, COLLECTIONS } from '@/lib/appwrite/config';
import { authedFetch } from '@/lib/authed-fetch';
import { Query } from 'appwrite';
import { isAdmin, isSystemAdmin } from '@/lib/permissions';

const RESULT_SECTION_ADMINS: Record<string, string> = {
  R1: 'mkizza@nrep.ug', R3: 'mkizza@nrep.ug',
  R2: 'enabaho@nrep.ug', R6: 'enabaho@nrep.ug',
  R4: 'pnduhuura@nrep.ug', R5: 'pnduhuura@nrep.ug',
};

export default function AdminCommentsPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'reviews' | 'comments'>('all');
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [posting, setPosting] = useState<string | null>(null);

  useEffect(() => { if (profile) load(); }, [profile]);

  async function load() {
    setLoading(true);
    try {
      const targetsRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.TARGETS, [Query.limit(500)]);
      const resultsRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.RESULTS, [Query.limit(20)]);
      const resultsMap: Record<string, any> = {};
      for (const r of resultsRes.documents) resultsMap[r.$id] = r;

      const systemAdmin = isSystemAdmin(profile);
      const myTargets = targetsRes.documents.filter((t: any) => {
        if (systemAdmin) return true;
        const result = resultsMap[t.resultId];
        if (!result) return false;
        return RESULT_SECTION_ADMINS[result.code] === profile?.email;
      });

      const allItems: any[] = [];
      await Promise.all(myTargets.map(async (target: any) => {
        try {
          const res = await authedFetch(`/api/targets/${target.$id}/comments`);
          const result = resultsMap[target.resultId];
          for (const c of (res.comments ?? [])) {
            if (c.body?.startsWith('[LINK] ')) continue;
            allItems.push({
              ...c,
              targetCode: target.code,
              targetId: target.$id,
              targetDescription: target.description,
              resultCode: result?.code ?? '',
              isAdminReview: c.body?.startsWith('[ADMIN REVIEW]'),
              displayBody: c.body?.startsWith('[ADMIN REVIEW]')
                ? c.body.replace('[ADMIN REVIEW] ', '')
                : c.body,
            });
          }
        } catch { }
      }));

      allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setItems(allItems);
    } finally { setLoading(false); }
  }

  async function postReview(targetId: string, key: string) {
    const text = replyDraft[key]?.trim();
    if (!text) return;
    setPosting(key);
    try {
      await authedFetch(`/api/targets/${targetId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: `[ADMIN REVIEW] ${text}` }),
      });
      setReplyDraft({ ...replyDraft, [key]: '' });
      await load();
    } catch (e: any) { alert(e.message); }
    finally { setPosting(null); }
  }

  const filtered = items.filter(item => {
    if (filter === 'reviews') return item.isAdminReview;
    if (filter === 'comments') return !item.isAdminReview;
    return true;
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-8 py-10">
        <p className="font-mono text-xs uppercase tracking-wider text-clay">Admin</p>
        <h1 className="mt-1 font-display text-3xl text-ink">
          {isSystemAdmin(profile) ? 'All Comments & Reviews' : 'Section Comments & Reviews'}
        </h1>
        <p className="mt-1 text-sm text-gray-500 mb-5">
          {isSystemAdmin(profile)
            ? 'All activity across the entire matrix. Write admin reviews directly from here.'
            : 'Activity in your section. Write reviews directly from here.'}
        </p>

        {/* Filter tabs */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { key: 'all', label: 'All', count: items.length, color: '#054653', bg: '#EEF6F7' },
            { key: 'reviews', label: 'Admin reviews', count: items.filter(i => i.isAdminReview).length, color: '#054653', bg: '#EEF6F7' },
            { key: 'comments', label: 'Member comments', count: items.filter(i => !i.isAdminReview).length, color: '#D97706', bg: '#FFFBEB' },
          ].map(({ key, label, count, color, bg }) => (
            <button key={key} onClick={() => setFilter(key as any)}
              className="rounded-lg border-2 p-3 text-center transition"
              style={{ borderColor: filter === key ? color : '#E5E7EB', backgroundColor: filter === key ? bg : 'white' }}>
              <p className="text-2xl font-bold" style={{ color }}>{count}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </button>
          ))}
        </div>

        {loading && <p className="text-sm text-gray-400">Loading…</p>}

        {!loading && filtered.length === 0 && (
          <div className="rounded-lg border-2 p-10 text-center" style={{ borderColor: '#E5E7EB' }}>
            <p className="text-4xl mb-3">💬</p>
            <p className="font-display text-xl text-gray-700">No activity yet</p>
          </div>
        )}

        <div className="space-y-4">
          {filtered.map((item) => (
            <div key={item.$id} className="overflow-hidden rounded-lg border-2 bg-white"
              style={{ borderColor: item.isAdminReview ? '#054653' : '#E5E7EB', borderLeft: `4px solid ${item.isAdminReview ? '#054653' : '#D98E2B'}` }}>

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2 border-b"
                style={{ borderColor: '#F0F0F0', backgroundColor: item.isAdminReview ? '#EEF6F7' : '#FFFBEB' }}>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: '#054653' }}>
                    {item.resultCode} · Target {item.targetCode}
                  </p>
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: item.isAdminReview ? '#054653' : '#D98E2B' }}>
                    {item.isAdminReview ? 'Admin Review' : 'Comment'}
                  </span>
                </div>
                <Link href={`/matrix/${item.targetId}`}
                  className="text-[10px] font-mono underline" style={{ color: '#054653' }}>
                  View target →
                </Link>
              </div>

              {/* Body */}
              <div className="px-4 py-3">
                <p className="text-xs text-gray-400 mb-1">{item.targetDescription}</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.displayBody}</p>
                <p className="mt-2 text-[10px] text-gray-400">
                  <strong>{item.userName}</strong> · {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Inline admin review reply */}
              {isAdmin(profile) && !item.isAdminReview && (
                <div className="border-t px-4 py-3" style={{ borderColor: '#E5E7EB', backgroundColor: '#F8FAFB' }}>
                  <p className="text-xs font-semibold text-gray-500 mb-2">Write admin review on this target:</p>
                  <div className="flex gap-2">
                    <input
                      value={replyDraft[item.targetId] ?? ''}
                      onChange={(e) => setReplyDraft({ ...replyDraft, [item.targetId]: e.target.value })}
                      placeholder="Your formal review of this target…"
                      className="flex-1 rounded-lg border px-3 py-1.5 text-sm"
                      style={{ borderColor: '#D0D8DA' }}
                      onKeyDown={(e) => e.key === 'Enter' && postReview(item.targetId, item.targetId)}
                    />
                    <button
                      onClick={() => postReview(item.targetId, item.targetId)}
                      disabled={posting === item.targetId || !replyDraft[item.targetId]?.trim()}
                      className="rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                      style={{ backgroundColor: '#054653' }}>
                      {posting === item.targetId ? '…' : 'Post review'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
