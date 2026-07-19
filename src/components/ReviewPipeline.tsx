'use client';

import { useEffect, useState } from 'react';
import { authedFetch } from '@/lib/authed-fetch';

interface PendingUpdate {
  $id: string;
  proposedProgressPercent: number;
  proposedStatus: string;
  justification: string | null;
  submittedByName: string;
  submittedAt: string;
  // Stage 1 — section admin
  reviewStatus: 'pending' | 'approved' | 'rejected';
  reviewedByName: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  // Stage 2 — Dr. Mukisa
  mukisaStatus?: 'pending' | 'approved' | 'rejected';
  mukisaNote?: string | null;
  mukisaAt?: string | null;
}

const STATUS_STYLES = {
  pending:  { bg: '#FEF3C7', color: '#92400E', label: 'Pending review' },
  approved: { bg: '#ECFDF5', color: '#054653', label: 'Approved ✓' },
  rejected: { bg: '#FEE2E2', color: '#991B1B', label: 'Changes requested ✗' },
};

export function ReviewPipeline({
  targetId,
  profile,
  onUpdateApplied,
}: {
  targetId: string;
  profile: any;
  onUpdateApplied?: () => void;
}) {
  const [updates, setUpdates] = useState<PendingUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionNote, setActionNote] = useState<Record<string, string>>({});
  const [acting, setActing] = useState<string | null>(null);

  const isMukisa   = profile?.email === 'mukisanic@nrep.ug';
  const isSection  = profile?.role === 'admin' && (profile?.sectionSlugs?.length ?? 0) > 0;
  const isMember   = profile?.role === 'member';

  async function load() {
    setLoading(true);
    try {
      const res = await authedFetch(`/api/targets/${targetId}/pending-updates`);
      setUpdates(res.updates ?? []);
    } catch { } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [targetId]);

  async function act(updateId: string, action: 'approve' | 'reject', stage: 'section' | 'mukisa') {
    setActing(updateId);
    try {
      await authedFetch(`/api/pending-updates/${updateId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          action,
          stage,
          note: actionNote[updateId] ?? '',
        }),
      });
      await load();
      onUpdateApplied?.();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActing(null);
    }
  }

  if (loading) return <p className="text-sm text-gray-400 py-2">Loading review status…</p>;
  if (!updates.length) return null;

  return (
    <div className="overflow-hidden rounded-lg border-2 bg-white" style={{ borderColor: '#D0D8DA' }}>
      <div className="px-5 py-3 border-b" style={{ borderColor: '#E5E7EB', backgroundColor: '#F8FAFB' }}>
        <p className="text-sm font-bold text-gray-800">Review Pipeline</p>
        <p className="text-xs text-gray-400">Two-stage approval: Section admin → Dr. Mukisa</p>
      </div>

      <div className="divide-y" style={{ divideColor: '#E5E7EB' }}>
        {updates.map((u) => {
          const s1 = STATUS_STYLES[u.reviewStatus] ?? STATUS_STYLES.pending;
          const s2 = STATUS_STYLES[(u.mukisaStatus as keyof typeof STATUS_STYLES) ?? 'pending'] ?? STATUS_STYLES.pending;

          return (
            <div key={u.$id} className="p-4">
              {/* Submission header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    Submitted by {u.submittedByName}
                  </p>
                  <p className="font-mono text-[10px] text-gray-400">
                    {new Date(u.submittedAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold" style={{ color: '#054653' }}>
                    {u.proposedProgressPercent}%
                  </p>
                  <p className="font-mono text-[10px] uppercase text-gray-400">{u.proposedStatus?.replace('_', ' ')}</p>
                </div>
              </div>

              {u.justification && (
                <p className="mb-3 rounded-lg border-l-4 bg-gray-50 py-2 pl-3 text-sm text-gray-600"
                  style={{ borderLeftColor: '#D98E2B' }}>
                  "{u.justification}"
                </p>
              )}

              {/* Two stage pipeline */}
              <div className="grid grid-cols-2 gap-3">

                {/* Stage 1 — Section Admin */}
                <div className="rounded-lg border p-3" style={{ borderColor: '#E5E7EB' }}>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-gray-400 mb-1">
                    Stage 1 — Section Admin
                  </p>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="rounded-full px-2 py-0.5 text-xs font-bold"
                      style={{ backgroundColor: s1.bg, color: s1.color }}>
                      {s1.label}
                    </span>
                  </div>
                  {u.reviewedByName && (
                    <p className="text-xs text-gray-500">
                      {u.reviewedByName} · {u.reviewedAt ? new Date(u.reviewedAt).toLocaleDateString() : ''}
                    </p>
                  )}
                  {u.reviewNote && (
                    <p className="mt-1 text-xs text-gray-600 italic">"{u.reviewNote}"</p>
                  )}

                  {/* Section admin action buttons */}
                  {isSection && u.reviewStatus === 'pending' && (
                    <div className="mt-2 space-y-1">
                      <input value={actionNote[u.$id] ?? ''} onChange={(e) => setActionNote({ ...actionNote, [u.$id]: e.target.value })}
                        placeholder="Add a note (optional)…"
                        className="w-full rounded border px-2 py-1 text-xs" style={{ borderColor: '#D0D8DA' }} />
                      <div className="flex gap-1">
                        <button onClick={() => act(u.$id, 'approve', 'section')} disabled={acting === u.$id}
                          className="flex-1 rounded py-1 text-xs font-bold text-white" style={{ backgroundColor: '#054653' }}>
                          Approve
                        </button>
                        <button onClick={() => act(u.$id, 'reject', 'section')} disabled={acting === u.$id}
                          className="flex-1 rounded py-1 text-xs font-bold text-white" style={{ backgroundColor: '#DC2626' }}>
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stage 2 — Dr. Mukisa */}
                <div className="rounded-lg border p-3" style={{ borderColor: '#E5E7EB' }}>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-gray-400 mb-1">
                    Stage 2 — Dr. Mukisa
                  </p>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="rounded-full px-2 py-0.5 text-xs font-bold"
                      style={{
                        backgroundColor: u.reviewStatus === 'approved' ? s2.bg : '#F3F4F6',
                        color: u.reviewStatus === 'approved' ? s2.color : '#9CA3AF',
                      }}>
                      {u.reviewStatus !== 'approved' ? 'Awaiting stage 1' : s2.label}
                    </span>
                  </div>
                  {u.mukisaAt && (
                    <p className="text-xs text-gray-500">
                      Dr. Mukisa · {new Date(u.mukisaAt).toLocaleDateString()}
                    </p>
                  )}
                  {u.mukisaNote && (
                    <p className="mt-1 text-xs text-gray-600 italic">"{u.mukisaNote}"</p>
                  )}

                  {/* Dr. Mukisa action buttons */}
                  {isMukisa && u.reviewStatus === 'approved' && (!u.mukisaStatus || u.mukisaStatus === 'pending') && (
                    <div className="mt-2 space-y-1">
                      <input value={actionNote[`m-${u.$id}`] ?? ''} onChange={(e) => setActionNote({ ...actionNote, [`m-${u.$id}`]: e.target.value })}
                        placeholder="Add your note…"
                        className="w-full rounded border px-2 py-1 text-xs" style={{ borderColor: '#D0D8DA' }} />
                      <div className="flex gap-1">
                        <button onClick={() => act(u.$id, 'approve', 'mukisa')} disabled={acting === u.$id}
                          className="flex-1 rounded py-1 text-xs font-bold text-white" style={{ backgroundColor: '#054653' }}>
                          Final approve
                        </button>
                        <button onClick={() => act(u.$id, 'reject', 'mukisa')} disabled={acting === u.$id}
                          className="flex-1 rounded py-1 text-xs font-bold text-white" style={{ backgroundColor: '#DC2626' }}>
                          Request changes
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Member sees result and can resubmit if rejected */}
              {isMember && (u.reviewStatus === 'rejected' || u.mukisaStatus === 'rejected') && (
                <div className="mt-3 rounded-lg border p-3" style={{ borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }}>
                  <p className="text-sm font-bold text-red-700">Changes requested</p>
                  <p className="text-xs text-red-600 mt-1">
                    {u.mukisaStatus === 'rejected'
                      ? `Dr. Mukisa: "${u.mukisaNote}"`
                      : `Section admin: "${u.reviewNote}"`}
                  </p>
                  <p className="text-xs text-red-500 mt-1">
                    Please update your progress entry below and resubmit.
                  </p>
                </div>
              )}

              {isMember && u.reviewStatus === 'approved' && u.mukisaStatus === 'approved' && (
                <div className="mt-3 rounded-lg border p-3" style={{ borderColor: '#6EE7B7', backgroundColor: '#ECFDF5' }}>
                  <p className="text-sm font-bold" style={{ color: '#054653' }}>✓ Fully approved</p>
                  <p className="text-xs text-green-600 mt-0.5">
                    Both the section admin and Dr. Mukisa have approved this update.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
