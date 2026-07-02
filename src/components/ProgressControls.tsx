'use client';

import { useState } from 'react';
import { PROGRESS_STEPS, STATUS_LABELS, type TargetStatus } from '@/lib/appwrite/config';
import { authedFetch } from '@/lib/authed-fetch';

interface Props {
  targetId: string;
  initialPercent: number;
  initialStatus: TargetStatus;
  isAdmin: boolean;
  onUpdated: (percent: number, status: TargetStatus) => void;
}

export function ProgressControls({ targetId, initialPercent, initialStatus, isAdmin, onUpdated }: Props) {
  const [percent, setPercent] = useState(initialPercent);
  const [status, setStatus] = useState<TargetStatus>(initialStatus);
  const [justification, setJustification] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      if (isAdmin) {
        // Admin: applies directly via old route.
        await authedFetch(`/api/targets/${targetId}`, {
          method: 'PATCH',
          body: JSON.stringify({ progressPercent: percent, status }),
        });
        onUpdated(percent, status);
      } else {
        // Member/analyst: submits for approval.
        await authedFetch(`/api/targets/${targetId}/propose`, {
          method: 'POST',
          body: JSON.stringify({
            proposedProgressPercent: percent,
            proposedStatus: status,
            justification,
          }),
        });
        setSubmitted(true);
      }
    } catch (err: any) {
      setError(err.message ?? 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <div className="border border-teal/30 bg-teal/5 p-5">
        <p className="font-mono text-[11px] uppercase tracking-wider text-teal">Update submitted</p>
        <p className="mt-1 text-sm text-charcoal/70">
          Your proposed update ({percent}% — {STATUS_LABELS[status]}) has been sent to an
          administrator for review. The target will be updated once approved.
        </p>
        <button
          onClick={() => { setSubmitted(false); setJustification(''); }}
          className="mt-3 font-mono text-[11px] uppercase tracking-wider text-clay underline"
        >
          Submit another update
        </button>
      </div>
    );
  }

  return (
    <div className="border border-line bg-white p-5">
      <p className="font-mono text-[11px] uppercase tracking-wider text-charcoal/50">
        {isAdmin ? 'Update progress (applied immediately)' : 'Propose a progress update'}
      </p>
      {!isAdmin && (
        <p className="mt-1 text-xs text-charcoal/40">
          Your update will be reviewed by an administrator or analyst before it goes live.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <select
          value={percent}
          disabled={saving}
          onChange={(e) => setPercent(Number(e.target.value))}
          className="auth-input w-auto"
        >
          {PROGRESS_STEPS.map((p) => (
            <option key={p} value={p}>{p}%</option>
          ))}
        </select>

        <select
          value={status}
          disabled={saving}
          onChange={(e) => setStatus(e.target.value as TargetStatus)}
          className="auth-input w-auto"
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {!isAdmin && (
        <textarea
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          placeholder="Briefly explain what has been done or what changed (required for review)…"
          rows={2}
          className="auth-input mt-3 resize-none"
        />
      )}

      {error && <p className="mt-2 text-sm text-clay">{error}</p>}

      <button
        onClick={submit}
        disabled={saving || (!isAdmin && !justification.trim())}
        className="mt-3 bg-ink px-4 py-2 font-mono text-xs uppercase tracking-wider text-parchment hover:bg-inkdeep disabled:opacity-50"
      >
        {saving ? 'Submitting…' : isAdmin ? 'Apply update' : 'Submit for approval'}
      </button>
    </div>
  );
}
