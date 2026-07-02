'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/lib/auth-context';
import { authedFetch } from '@/lib/authed-fetch';
import { STATUS_LABELS } from '@/lib/appwrite/config';
import type { PendingUpdateDoc } from '@/types';

export default function ReviewPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [updates, setUpdates] = useState<PendingUpdateDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canReview = profile?.role === 'admin' || profile?.role === 'analyst';

  useEffect(() => {
    if (authLoading) return;
    if (!canReview) { router.replace('/dashboard'); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, profile, tab]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await authedFetch(`/api/pending-updates?status=${tab}`);
      setUpdates(res.updates);
    } catch (err: any) {
      setError(err.message ?? 'Could not load updates.');
    } finally {
      setLoading(false);
    }
  }

  async function decide(updateId: string, decision: 'approved' | 'rejected', reviewNote?: string) {
    setError(null);
    try {
      await authedFetch(`/api/pending-updates/${updateId}`, {
        method: 'PATCH',
        body: JSON.stringify({ decision, reviewNote }),
      });
      setUpdates((prev) => prev.filter((u) => u.$id !== updateId));
    } catch (err: any) {
      setError(err.message ?? 'Action failed.');
    }
  }

  if (!canReview) return null;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-8 py-10">
        <p className="font-mono text-xs uppercase tracking-wider text-clay">Review queue</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Staff update approvals</h1>
        <p className="mt-2 max-w-xl text-sm text-charcoal/60">
          Review progress updates submitted by section members before they go live on the matrix.
        </p>

        <div className="mt-6 flex gap-2 border-b border-line">
          {(['pending', 'approved', 'rejected'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 font-mono text-xs uppercase tracking-wider transition ${
                tab === t
                  ? 'border-b-2 border-ink text-ink'
                  : 'text-charcoal/40 hover:text-ink'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-clay">{error}</p>}
        {loading && <p className="mt-8 font-mono text-sm text-charcoal/50">Loading…</p>}

        {!loading && updates.length === 0 && (
          <p className="mt-8 border border-line bg-white px-5 py-8 text-center font-mono text-xs text-charcoal/40">
            No {tab} updates.
          </p>
        )}

        <div className="mt-4 space-y-4">
          {updates.map((u) => (
            <UpdateCard key={u.$id} update={u} tab={tab} onDecide={decide} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function UpdateCard({
  update,
  tab,
  onDecide,
}: {
  update: PendingUpdateDoc;
  tab: string;
  onDecide: (id: string, decision: 'approved' | 'rejected', note?: string) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');

  return (
    <div className="border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={`/matrix/${update.targetId}`}
            className="text-sm font-medium text-ink underline"
          >
            {update.targetDescription}
          </Link>
          <p className="mt-0.5 font-mono text-[10px] text-charcoal/40">
            Submitted by {update.submittedByName} · {new Date(update.submittedAt).toLocaleString()}
          </p>
        </div>
        <StatusBadge status={update.proposedStatus} />
      </div>

      <div className="mt-3 flex items-center gap-4">
        <div className="border border-line px-3 py-1.5 text-center">
          <p className="font-mono text-[9px] uppercase tracking-wider text-charcoal/40">Proposed %</p>
          <p className="font-display text-xl text-ink">{update.proposedProgressPercent}%</p>
        </div>
        <div className="border border-line px-3 py-1.5 text-center">
          <p className="font-mono text-[9px] uppercase tracking-wider text-charcoal/40">Status</p>
          <p className="text-sm text-charcoal/80">{STATUS_LABELS[update.proposedStatus]}</p>
        </div>
      </div>

      {update.justification && (
        <div className="mt-3 border-l-2 border-amber pl-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-charcoal/40">Justification</p>
          <p className="mt-0.5 text-sm text-charcoal/80">{update.justification}</p>
        </div>
      )}

      {tab === 'pending' && (
        <div className="mt-4">
          {!rejecting ? (
            <div className="flex gap-2">
              <button
                onClick={() => onDecide(update.$id, 'approved')}
                className="bg-teal px-4 py-2 font-mono text-xs uppercase tracking-wider text-parchment hover:opacity-90"
              >
                Approve
              </button>
              <button
                onClick={() => setRejecting(true)}
                className="border border-clay px-4 py-2 font-mono text-xs uppercase tracking-wider text-clay hover:bg-clay hover:text-parchment"
              >
                Reject
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Reason for rejection (shown to the submitter)…"
                rows={2}
                className="auth-input resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onDecide(update.$id, 'rejected', note)}
                  className="bg-clay px-4 py-2 font-mono text-xs uppercase tracking-wider text-parchment hover:opacity-90"
                >
                  Confirm rejection
                </button>
                <button
                  onClick={() => setRejecting(false)}
                  className="font-mono text-xs text-charcoal/40 hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab !== 'pending' && update.reviewedByName && (
        <div className="mt-3 font-mono text-[10px] text-charcoal/40">
          {tab === 'approved' ? 'Approved' : 'Rejected'} by {update.reviewedByName} ·{' '}
          {new Date(update.reviewedAt!).toLocaleString()}
          {update.reviewNote && <p className="mt-1 text-charcoal/60">{update.reviewNote}</p>}
        </div>
      )}
    </div>
  );
}
