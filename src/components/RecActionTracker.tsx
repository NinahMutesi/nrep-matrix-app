'use client';

import { useEffect, useState } from 'react';
import { authedFetch } from '@/lib/authed-fetch';
import { ScoreBadge } from '@/components/ScoreBadge';
import type { RecActionDoc } from '@/types';

const STATUS_COLORS = {
  pending: { bg: '#FEF3C7', text: '#92400E' },
  in_progress: { bg: '#FDF3DC', text: '#78350F' },
  completed: { bg: '#D1FAE5', text: '#065F46' },
};

export function RecActionTracker({ targetId, canAdd }: { targetId: string; canAdd: boolean }) {
  const [actions, setActions] = useState<RecActionDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ actionDescription: '', organisation: '', score: '', status: 'pending' as RecActionDoc['status'] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await authedFetch(`/api/targets/${targetId}/rec-actions`);
      setActions(res.actions);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [targetId]);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      await authedFetch(`/api/targets/${targetId}/rec-actions`, {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          score: form.score ? Number(form.score) : null,
        }),
      });
      setForm({ actionDescription: '', organisation: '', score: '', status: 'pending' });
      setShowForm(false);
      await load();
    } catch (err: any) {
      setError(err.message ?? 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-wider text-charcoal/50">
          Actions taken on this recommendation
        </p>
        {canAdd && !showForm && (
          <button onClick={() => setShowForm(true)} className="font-mono text-[11px] uppercase tracking-wider text-clay underline">
            + Log action
          </button>
        )}
      </div>

      {showForm && (
        <div className="mt-3 space-y-2 border border-amber/40 bg-amber/5 p-3">
          <textarea
            value={form.actionDescription}
            onChange={(e) => setForm({ ...form, actionDescription: e.target.value })}
            placeholder="Describe the action taken…"
            rows={2}
            className="auth-input resize-none"
          />
          <div className="flex flex-wrap gap-2">
            <input
              value={form.organisation}
              onChange={(e) => setForm({ ...form, organisation: e.target.value })}
              placeholder="Organisation (optional)"
              className="auth-input w-auto flex-1"
            />
            <input
              type="number"
              min={0} max={25}
              value={form.score}
              onChange={(e) => setForm({ ...form, score: e.target.value })}
              placeholder="Score /25"
              className="auth-input w-24"
            />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as RecActionDoc['status'] })} className="auth-input w-auto">
              <option value="pending">Pending</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          {error && <p className="text-sm text-clay">{error}</p>}
          <div className="flex gap-2">
            <button onClick={submit} disabled={saving || !form.actionDescription.trim()} className="bg-ink px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-parchment hover:bg-inkdeep disabled:opacity-50">
              {saving ? 'Saving…' : 'Log action'}
            </button>
            <button onClick={() => setShowForm(false)} className="font-mono text-xs text-charcoal/40 hover:text-ink">Cancel</button>
          </div>
        </div>
      )}

      <div className="mt-3 space-y-3">
        {loading && <p className="font-mono text-xs text-charcoal/40">Loading…</p>}
        {!loading && actions.length === 0 && <p className="font-mono text-xs text-charcoal/40">No actions logged yet.</p>}
        {actions.map((a) => {
          const sc = STATUS_COLORS[a.status];
          return (
            <div key={a.$id} className="border-t border-line pt-3 first:border-0 first:pt-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{a.actionDescription}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-charcoal/50">
                    {a.actionedByName}{a.organisation ? ` · ${a.organisation}` : ''} · {new Date(a.actionedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {a.score != null && (
                    <ScoreBadge progressPercent={(a.score / 25) * 100} scoreManual={a.score} size="sm" />
                  )}
                  <span className="rounded px-2 py-0.5 font-mono text-[10px] font-bold" style={{ backgroundColor: sc.bg, color: sc.text }}>
                    {a.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
