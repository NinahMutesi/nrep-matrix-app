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

  useEffect(() => {
    if (!profile) return;
    load();
  }, [profile]);

  async function load() {
    setLoading(true);
    try {
      const targetsRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.TARGETS, [Query.limit(500)]);
      const resultsRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.RESULTS, [Query.limit(20)]);
      const resultsMap: Record<string, any> = {};
      for (const r of resultsRes.documents) resultsMap[r.$id] = r;

      // For section admins — only show their result areas
      // For system admin (Dr. Mukisa) — show all
      const systemAdmin = isSystemAdmin(profile);
      const myTargets = targetsRes.documents.filter((t: any) => {
        if (systemAdmin) return true;
        const result = resultsMap[t.resultId];
        if (!result) return false;
        return RESULT_SECTION_ADMINS[result.code] === profile?.email;
      });

      // Fetch comments for each target
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
    } finally {
      setLoading(false);
    }
  }

  const filtered = items.filter(item => {
    if (filter === 'reviews') return item.isAdminReview;
    if (filter === 'comments') return !item.isAdminReview;
    return true;
  });

  const adminReviews = items.filter(i => i.isAdminReview).length;
  const memberComments = items.filter(i => !i.isAdminReview).length;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-8 py-10">
        <p className="font-mono text-xs uppercase tracking-wider text-clay">Admin</p>
        <h1 className="mt-1 font-display text-3xl text-ink">
          {isSystemAdmin(profile) ? 'All Comments & Reviews' : 'Section Comments & Reviews'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isSystemAdmin(profile)
            ? 'All comments and admin reviews across the entire matrix.'
            : 'Comments and reviews on targets in your section.'}
        </p>

        {/* Summary */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <button onClick={() => setFilter('all')}
            className="rounded-lg border-2 p-3 text-center transition"
            style={{ borderColor: filter === 'all' ? '#054653' : '#E5E7EB', backgroundColor: filter === 'all' ? '#EEF6F7' : 'white' }}>
            <p className="text-2xl font-bold" style={{ color: '#054653' }}>{items.length}</p>
            <p className="text-xs text-gray-500">All</p>
          </button>
          <button onClick={() => setFilter('reviews')}
            className="rounded-lg border-2 p-3 text-center transition"
            style={{ borderColor: filter === 'reviews' ? '#054653' : '#E5E7EB', backgroundColor: filter === 'reviews' ? '#EEF6F7' : 'white' }}>
            <p className="text-2xl font-bold" style={{ color: '#054653' }}>{adminReviews}</p>
            <p className="text-xs text-gray-500">Admin reviews</p>
          </button>
          <button onClick={() => setFilter('comments')}
            className="rounded-lg border-2 p-3 text-center transition"
            style={{ borderColor: filter === 'comments' ? '#D98E2B' : '#E5E7EB', backgroundColor: filter === 'comments' ? '#FFFBEB' : 'white' }}>
            <p className="text-2xl font-bold" style={{ color: '#D98E2B' }}>{memberComments}</p>
            <p className="text-xs text-gray-500">Member comments</p>
          </button>
        </div>

        {loading && <p className="mt-8 text-sm text-gray-400">Loading…</p>}

        {!loading && filtered.length === 0 && (
          <div className="mt-8 rounded-lg border-2 p-10 text-center" style={{ borderColor: '#E5E7EB' }}>
            <p className="text-4xl mb-3">💬</p>
            <p className="font-display text-xl text-gray-700">No {filter === 'all' ? '' : filter} yet</p>
            <p className="mt-2 text-sm text-gray-400">Activity will appear here as team members post comments and reviews.</p>
          </div>
        )}

        <div className="mt-5 space-y-3">
          {filtered.map((item) => (
            <div key={item.$id} className="overflow-hidden rounded-lg border-2 bg-white"
              style={{ borderColor: item.isAdminReview ? '#054653' : '#E5E7EB', borderLeft: `4px solid ${item.isAdminReview ? '#054653' : '#D98E2B'}` }}>
              <div className="flex items-center justify-between px-4 py-2 border-b"
                style={{ borderColor: '#F0F0F0', backgroundColor: item.isAdminReview ? '#EEF6F7' : '#FFFBEB' }}>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: '#054653' }}>
                    {item.resultCode} · Target {item.targetCode}
                  </p>
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                    style={{ backgroundColor: item.isAdminReview ? '#054653' : '#D98E2B', color: 'white' }}>
                    {item.isAdminReview ? 'Admin Review' : 'Comment'}
                  </span>
                </div>
                <Link href={`/matrix/${item.targetId}`}
                  className="text-[10px] font-mono underline" style={{ color: '#054653' }}>
                  View target →
                </Link>
              </div>
              <div className="px-4 py-3">
                <p className="text-xs text-gray-500 line-clamp-1 mb-1">{item.targetDescription}</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.displayBody}</p>
                <p className="mt-2 text-[10px] text-gray-400">
                  <strong>{item.userName}</strong> · {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
