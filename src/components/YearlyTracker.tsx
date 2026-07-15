'use client';

import { useEffect, useRef, useState } from 'react';
import { ID } from 'appwrite';
import { storage } from '@/lib/appwrite/client';
import { BUCKET_REPORTS } from '@/lib/appwrite/config';
import { authedFetch } from '@/lib/authed-fetch';
import { STATUS_LABELS, type TargetStatus } from '@/lib/appwrite/config';
import { StatusBadge } from '@/components/StatusBadge';
import { fiscalYearLabel, PLAN_START_YEAR } from '@/lib/plan-years';
import type { YearlyRecordDoc } from '@/types';

// All 5 fiscal years of the strategic plan
const PLAN_YEARS = [1, 2, 3, 4, 5].map((n) => ({
  year: n,
  label: fiscalYearLabel(n),
}));

export function YearlyTracker({ targetId, canEdit }: { targetId: string; canEdit: boolean }) {
  const [years, setYears] = useState<YearlyRecordDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingYear, setAddingYear] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => { load(); }, [targetId]);

  const recordedYears = new Set(years.map((y) => y.year));
  const availableYears = PLAN_YEARS.filter((py) => !recordedYears.has(py.year));

  // Aggregation
  const withProgress = years.filter((y) => y.progressPercent != null);
  const avgProgress = withProgress.length
    ? Math.round(withProgress.reduce((s, y) => s + (y.progressPercent ?? 0), 0) / withProgress.length)
    : null;

  return (
    <div className="overflow-hidden rounded-lg border-2 bg-white" style={{ borderColor: '#D0D8DA' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b-2" style={{ borderColor: '#D0D8DA', backgroundColor: '#F0F5F6' }}>
        <div>
          <p className="text-base font-bold text-gray-800">Yearly Tracking</p>
          {avgProgress != null && (
            <p className="mt-0.5 text-sm text-gray-600">
              Average across {withProgress.length} year{withProgress.length !== 1 ? 's' : ''}:
              <strong className="ml-1" style={{ color: '#054653' }}>{avgProgress}%</strong>
            </p>
          )}
        </div>

        {canEdit && availableYears.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              className="rounded-lg border-2 px-3 py-2 text-sm font-medium"
              style={{ borderColor: '#054653', color: '#054653' }}
              value=""
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val) setAddingYear(val);
              }}
            >
              <option value="">+ Add a year…</option>
              {availableYears.map((py) => (
                <option key={py.year} value={py.year}>{py.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <p className="px-5 py-2 text-sm text-red-600">{error}</p>}
      {loading && <p className="px-5 py-4 text-sm text-gray-400">Loading…</p>}

      {/* Add form */}
      {addingYear != null && (
        <div className="border-b-2 p-4" style={{ borderColor: '#D0D8DA', backgroundColor: '#FFFBEB' }}>
          <p className="mb-3 text-sm font-bold text-gray-700">
            Adding record for {fiscalYearLabel(addingYear)}
          </p>
          <YearForm
            targetId={targetId}
            initial={{ year: addingYear, label: fiscalYearLabel(addingYear) } as YearlyRecordDoc}
            onDone={() => { setAddingYear(null); load(); }}
            onCancel={() => setAddingYear(null)}
          />
        </div>
      )}

      {/* Year list */}
      {!loading && years.length === 0 && addingYear == null && (
        <p className="px-5 py-6 text-center text-sm text-gray-400">
          No yearly records yet{canEdit ? '. Select a year above to get started.' : '.'}
        </p>
      )}

      <div>
        {years.map((y) => (
          <YearRow key={y.year} year={y} targetId={targetId} canEdit={canEdit} onUpdated={load} />
        ))}
      </div>
    </div>
  );
}

function YearRow({ year, targetId, canEdit, onUpdated }: {
  year: YearlyRecordDoc;
  targetId: string;
  canEdit: boolean;
  onUpdated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const pct = year.progressPercent ?? null;
  const pctColor = pct == null ? '#9CA3AF'
    : pct <= 25 ? '#DC2626'
    : pct <= 50 ? '#EA580C'
    : pct <= 75 ? '#D97706'
    : pct > 100 ? '#7C4D00'
    : '#054653';

  return (
    <div className="border-b last:border-0" style={{ borderColor: '#E5E7EB' }}>
      {/* Row header — click to expand */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-3 text-left transition hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-gray-800">{year.label ?? fiscalYearLabel(year.year)}</span>
          {pct != null && (
            <span className="rounded-full px-2.5 py-0.5 text-sm font-bold" style={{ backgroundColor: pctColor + '20', color: pctColor }}>
              {pct}%
            </span>
          )}
          {year.status && <StatusBadge status={year.status} />}
        </div>
        <span className="text-sm text-gray-400">{open ? '▲ hide' : '▼ show'}</span>
      </button>

      {open && (
        <div className="border-t px-5 pb-5 pt-4" style={{ borderColor: '#E5E7EB', backgroundColor: '#FAFAFA' }}>
          {editing ? (
            <YearForm
              targetId={targetId}
              initial={year}
              onDone={() => { setEditing(false); onUpdated(); }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              {/* Scores */}
              {(year.targetScore != null || year.initiativesScore != null || year.kraScore != null) && (
                <div className="mb-4 grid grid-cols-3 gap-3">
                  {[['Target score', year.targetScore], ['Initiatives score', year.initiativesScore], ['KRA score', year.kraScore]].map(([label, val]) =>
                    val != null ? (
                      <div key={String(label)} className="rounded-lg border p-3 text-center" style={{ borderColor: '#D0D8DA' }}>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{String(label)}</p>
                        <p className="mt-1 text-2xl font-bold" style={{ color: '#054653' }}>{String(val)}</p>
                      </div>
                    ) : null
                  )}
                </div>
              )}

              {year.progressPercent != null && (
                <p className="mb-2 text-sm text-gray-700">
                  <strong>Progress recorded:</strong>{' '}
                  <span className="font-bold" style={{ color: pctColor }}>{year.progressPercent}%</span>
                </p>
              )}
              {year.note && (
                <p className="mb-3 rounded-lg border-l-4 bg-white py-2 pl-3 pr-2 text-sm text-gray-700 whitespace-pre-wrap" style={{ borderLeftColor: '#054653' }}>
                  {year.note}
                </p>
              )}
              <p className="mb-4 text-xs text-gray-400">
                {year.recordedByName} · {new Date(year.recordedAt).toLocaleDateString()}
              </p>

              {/* File attachment */}
              <YearFileList yearRecordId={year.$id} targetId={targetId} canUpload={canEdit} />

              {/* Action buttons */}
              {canEdit && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setEditing(true)}
                    className="rounded-lg border-2 px-4 py-2 text-sm font-bold transition"
                    style={{ borderColor: '#054653', color: '#054653' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#054653'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#054653'; }}
                  >
                    Edit this year
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function YearFileList({ yearRecordId, targetId, canUpload }: {
  yearRecordId: string;
  targetId: string;
  canUpload: boolean;
}) {
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function loadFiles() {
    try {
      const res = await authedFetch(`/api/targets/${targetId}/reports`);
      const filtered = (res.reports as any[]).filter((r: any) => r.description === `year:${yearRecordId}`);
      setFiles(filtered);
    } catch { /* silent */ }
  }

  useEffect(() => { if (yearRecordId) loadFiles(); }, [yearRecordId]);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const uploaded = await storage.createFile(BUCKET_REPORTS, ID.unique(), file);
      await authedFetch(`/api/targets/${targetId}/reports`, {
        method: 'POST',
        body: JSON.stringify({ fileId: uploaded.$id, fileName: file.name, description: `year:${yearRecordId}` }),
      });
      await loadFiles();
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  const downloadUrl = (fileId: string) => storage.getFileDownload(BUCKET_REPORTS, fileId).toString();

  return (
    <div>
      {files.length > 0 && (
        <div className="mb-3 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Attached documents</p>
          {files.map((f) => (
            <a key={f.fileId} href={downloadUrl(f.fileId)}
              className="flex items-center gap-2 text-sm font-medium underline"
              style={{ color: '#054653' }}>
              📎 {f.fileName}
            </a>
          ))}
        </div>
      )}
      {canUpload && (
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-bold transition"
          style={{ borderColor: '#D98E2B', color: '#D97706' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#D98E2B'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#D97706'; }}
        >
          📎 {uploading ? 'Uploading…' : 'Attach document'}
          <input ref={fileInput} type="file" className="hidden" disabled={uploading}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>
      )}
    </div>
  );
}

function YearForm({ targetId, initial, onDone, onCancel }: {
  targetId: string;
  initial: YearlyRecordDoc;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [label] = useState(initial.label ?? fiscalYearLabel(initial.year));
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
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Progress %</label>
          <input
            type="number" min={0} max={150}
            value={progressPercent}
            onChange={(e) => setProgressPercent(Number(e.target.value))}
            className="w-24 rounded-lg border-2 px-3 py-2 text-center text-lg font-bold"
            style={{ borderColor: '#054653', color: '#054653' }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as TargetStatus)}
            className="rounded-lg border-2 px-3 py-2 text-sm font-medium" style={{ borderColor: '#054653' }}>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-600">Notes — what happened this year?</label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="Describe what was achieved, any blockers, what's planned next…"
          rows={3}
          className="w-full rounded-lg border-2 px-3 py-2 text-sm" style={{ borderColor: '#D0D8DA' }}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={saving}
          className="rounded-lg px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
          style={{ backgroundColor: '#054653' }}>
          {saving ? 'Saving…' : 'Save record'}
        </button>
        <button onClick={onCancel}
          className="rounded-lg border-2 px-4 py-2 text-sm font-medium text-gray-600"
          style={{ borderColor: '#D0D8DA' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
