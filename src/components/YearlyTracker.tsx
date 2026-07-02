'use client';

import { useEffect, useState } from 'react';
import { authedFetch } from '@/lib/authed-fetch';
import { STATUS_LABELS, type TargetStatus } from '@/lib/appwrite/config';
import { fiscalYearLabel } from '@/lib/plan-years';
import { StatusBadge } from '@/components/StatusBadge';
import type { YearlyRecordDoc } from '@/types';

export function YearlyTracker({ targetId, canEdit }: { targetId: string; canEdit: boolean }) {
  const [years, setYears] = useState<YearlyRecordDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingYear, setEditingYear] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await authedFetch(`/api/targets/${targetId}/years`);
      setYears(res.years);
    } catch (err: any) {
      setError(err.message ?? 'Could not load yearly records.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId]);

  const nextYear = (years.length ? Math.max(...years.map((y) => y.year)) : 0) + 1;

  return (
    <div className="border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-wider text-charcoal/50">
          Yearly tracking
        </p>
        {canEdit && editingYear === null && (
          <button
            onClick={() => setEditingYear(nextYear)}
            className="font-mono text-[11px] uppercase tracking-wider text-clay underline"
          >
            + Add {fiscalYearLabel(nextYear)}
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-clay">{error}</p>}
      {loading && <p className="mt-3 font-mono text-xs text-charcoal/40">Loading…</p>}

      {!loading && years.length === 0 && editingYear === null && (
        <p className="mt-3 font-mono text-xs text-charcoal/40">
          No yearly records yet{canEdit ? ' — add the first one below.' : '.'}
        </p>
      )}

      <div className="mt-3 space-y-3">
        {years.map((y) =>
          editingYear === y.year ? (
            <YearForm
              key={y.year}
              targetId={targetId}
              initial={y}
              onDone={() => {
                setEditingYear(null);
                load();
              }}
              onCancel={() => setEditingYear(null)}
            />
          ) : (
            <div key={y.year} className="border-t border-line pt-3 first:border-0 first:pt-0">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{y.label ?? fiscalYearLabel(y.year)}</p>
                <div className="flex items-center gap-2">
                  {y.status && <StatusBadge status={y.status} />}
                  {canEdit && (
                    <button
                      onClick={() => setEditingYear(y.year)}
                      className="font-mono text-[10px] uppercase tracking-wider text-charcoal/40 underline"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {(y.targetScore != null || y.initiativesScore != null || y.kraScore != null) && (
                <div className="mt-2 grid grid-cols-3 gap-3 text-xs">
                  <ScoreCell label="Target score" value={y.targetScore} />
                  <ScoreCell label="Initiatives score" value={y.initiativesScore} />
                  <ScoreCell label="KRA score" value={y.kraScore} />
                </div>
              )}

              {y.progressPercent != null && (
                <p className="mt-2 text-sm text-charcoal/80">
                  Progress recorded: <span className="font-medium text-ink">{y.progressPercent}%</span>
                </p>
              )}
              {y.note && <p className="mt-1 text-sm text-charcoal/70 whitespace-pre-wrap">{y.note}</p>}
              <p className="mt-1 font-mono text-[10px] text-charcoal/40">
                {y.recordedByName} · {new Date(y.recordedAt).toLocaleDateString()}
              </p>
            </div>
          )
        )}

        {editingYear === nextYear && !years.some((y) => y.year === nextYear) && (
          <YearForm
            targetId={targetId}
            initial={{ year: nextYear } as YearlyRecordDoc}
            onDone={() => {
              setEditingYear(null);
              load();
            }}
            onCancel={() => setEditingYear(null)}
          />
        )}
      </div>
    </div>
  );
}

function ScoreCell({ label, value }: { label: string; value: number | null }) {
  if (value == null) return null;
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-wider text-charcoal/40">{label}</p>
      <p className="font-display text-lg text-ink">{value}</p>
    </div>
  );
}

function YearForm({
  targetId,
  initial,
  onDone,
  onCancel,
}: {
  targetId: string;
  initial: YearlyRecordDoc;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(initial.label ?? fiscalYearLabel(initial.year));
  const [progressPercent, setProgressPercent] = useState(initial.progressPercent ?? 0);
  const [status, setStatus] = useState<TargetStatus>(initial.status ?? 'in_progress');
  const [note, setNote] = useState(initial.note ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await authedFetch(`/api/targets/${targetId}/years`, {
        method: 'POST',
        body: JSON.stringify({ year: initial.year, label, progressPercent, status, note }),
      });
      onDone();
    } catch (err: any) {
      setError(err.message ?? 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-amber/50 bg-amber/5 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input value={label} onChange={(e) => setLabel(e.target.value)} className="auth-input w-auto" placeholder="Label" />
        <select
          value={progressPercent}
          onChange={(e) => setProgressPercent(Number(e.target.value))}
          className="auth-input w-auto"
        >
          {[0, 10, 25, 50, 75, 90, 100].map((p) => (
            <option key={p} value={p}>
              {p}%
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as TargetStatus)} className="auth-input w-auto">
          {Object.entries(STATUS_LABELS).map(([value, lbl]) => (
            <option key={value} value={value}>
              {lbl}
            </option>
          ))}
        </select>
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="What happened this year, in a sentence or two…"
        rows={2}
        className="auth-input mt-2 resize-none"
      />
      {error && <p className="mt-1 text-sm text-clay">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="bg-ink px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-parchment hover:bg-inkdeep disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-charcoal/50 hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
