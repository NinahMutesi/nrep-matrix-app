'use client';

import { useEffect, useRef, useState } from 'react';
import { ID } from 'appwrite';
import { storage } from '@/lib/appwrite/client';
import { BUCKET_REPORTS } from '@/lib/appwrite/config';
import { authedFetch } from '@/lib/authed-fetch';
import { STATUS_LABELS, type TargetStatus } from '@/lib/appwrite/config';
import { StatusBadge } from '@/components/StatusBadge';
import { fiscalYearLabel } from '@/lib/plan-years';
import type { YearlyRecordDoc } from '@/types';

export function YearlyTracker({ targetId, canEdit }: { targetId: string; canEdit: boolean }) {
  const [years, setYears] = useState<YearlyRecordDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
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

  const nextYear = (years.length ? Math.max(...years.map((y) => y.year)) : 0) + 1;

  // Aggregation
  const recorded = years.filter((y) => y.progressPercent != null);
  const avgProgress = recorded.length
    ? Math.round(recorded.reduce((s, y) => s + (y.progressPercent ?? 0), 0) / recorded.length)
    : null;
  const latestPct = recorded.length
    ? recorded[recorded.length - 1].progressPercent
    : null;

  return (
    <div className="rounded-lg border border-line bg-white overflow-hidden">
      {/* Header + aggregation */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-line" style={{ backgroundColor: '#F8FAFB' }}>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-charcoal/50">Yearly tracking</p>
          {avgProgress != null && (
            <p className="mt-0.5 font-mono text-xs text-charcoal/70">
              Avg: <strong style={{ color: '#054653' }}>{avgProgress}%</strong>
              {latestPct != null && <span> · Latest: <strong style={{ color: '#054653' }}>{latestPct}%</strong></span>}
              <span className="text-charcoal/40"> across {recorded.length} year{recorded.length !== 1 ? 's' : ''}</span>
            </p>
          )}
        </div>
        {canEdit && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="font-mono text-[11px] uppercase tracking-wider underline"
            style={{ color: '#A14E3C' }}
          >
            + Add {fiscalYearLabel(nextYear)}
          </button>
        )}
      </div>

      {error && <p className="px-5 py-2 text-sm text-clay">{error}</p>}
      {loading && <p className="px-5 py-4 font-mono text-xs text-charcoal/40">Loading…</p>}

      {/* Add form */}
      {showAddForm && (
        <div className="border-b border-line p-4">
          <YearForm
            targetId={targetId}
            initial={{ year: nextYear } as YearlyRecordDoc}
            onDone={() => { setShowAddForm(false); load(); }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Year entries as accordion */}
      {!loading && (
        <div>
          {years.length === 0 && !showAddForm && (
            <p className="px-5 py-4 font-mono text-xs text-charcoal/40">
              No yearly records yet{canEdit ? ' — add the first one above.' : '.'}
            </p>
          )}
          {years.map((y) => (
            <YearAccordion
              key={y.year}
              year={y}
              targetId={targetId}
              canEdit={canEdit}
              onUpdated={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function YearAccordion({ year, targetId, canEdit, onUpdated }: {
  year: YearlyRecordDoc;
  targetId: string;
  canEdit: boolean;
  onUpdated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const pct = year.progressPercent ?? null;
  const bandColor = pct == null ? '#999'
    : pct <= 25 ? '#DC2626'
    : pct <= 50 ? '#EA580C'
    : pct <= 75 ? '#D97706'
    : pct > 100 ? '#7C4D00'
    : '#054653';

  return (
    <div className="border-b border-line last:border-0">
      {/* Accordion header */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-parchment/40"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-ink">{year.label ?? fiscalYearLabel(year.year)}</span>
          {pct != null && (
            <span className="font-mono text-xs font-bold" style={{ color: bandColor }}>
              {pct}%
            </span>
          )}
          {year.status && <StatusBadge status={year.status} />}
        </div>
        <span className="font-mono text-[10px] text-charcoal/40">{open ? '▲ hide' : '▼ show'}</span>
      </button>

      {/* Accordion body */}
      {open && (
        <div className="border-t border-line/50 px-5 pb-4 pt-3">
          {editing ? (
            <YearForm
              targetId={targetId}
              initial={year}
              onDone={() => { setEditing(false); onUpdated(); }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              {/* Scores row */}
              {(year.targetScore != null || year.initiativesScore != null || year.kraScore != null) && (
                <div className="mb-3 grid grid-cols-3 gap-3 text-xs">
                  <ScoreCell label="Target score" value={year.targetScore} />
                  <ScoreCell label="Initiatives score" value={year.initiativesScore} />
                  <ScoreCell label="KRA score" value={year.kraScore} />
                </div>
              )}
              {year.progressPercent != null && (
                <p className="text-sm text-charcoal/80">Progress: <strong className="text-ink">{year.progressPercent}%</strong></p>
              )}
              {year.note && (
                <p className="mt-1 text-sm text-charcoal/70 whitespace-pre-wrap">{year.note}</p>
              )}
              <p className="mt-1 font-mono text-[10px] text-charcoal/40">
                {year.recordedByName} · {new Date(year.recordedAt).toLocaleDateString()}
              </p>

              {/* Attached files */}
              <YearFileList yearRecordId={year.$id} targetId={targetId} canUpload={canEdit} />

              {canEdit && (
                <button
                  onClick={() => setEditing(true)}
                  className="mt-3 font-mono text-[10px] uppercase tracking-wider underline text-charcoal/40 hover:text-ink"
                >
                  Edit this year
                </button>
              )}
            </>
          )}
        </div>
      )}
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

// ── Year file upload/list ────────────────────────────────────────────────────
function YearFileList({ yearRecordId, targetId, canUpload }: {
  yearRecordId: string;
  targetId: string;
  canUpload: boolean;
}) {
  const [files, setFiles] = useState<{ fileId: string; fileName: string; uploadedAt: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Store year-level files using the reports collection with targetId=yearRecordId
  async function loadFiles() {
    try {
      const res = await authedFetch(`/api/targets/${targetId}/reports`);
      // Filter to only files tagged for this year record
      const filtered = (res.reports as any[]).filter((r: any) => r.description === `year:${yearRecordId}`);
      setFiles(filtered.map((r: any) => ({ fileId: r.fileId, fileName: r.fileName, uploadedAt: r.uploadedAt })));
    } catch { /* silent */ }
  }

  useEffect(() => { if (yearRecordId) loadFiles(); }, [yearRecordId]);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const uploaded = await storage.createFile(BUCKET_REPORTS, ID.unique(), file);
      await authedFetch(`/api/targets/${targetId}/reports`, {
        method: 'POST',
        body: JSON.stringify({
          fileId: uploaded.$id,
          fileName: file.name,
          description: `year:${yearRecordId}`,
        }),
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
    <div className="mt-3">
      {files.length > 0 && (
        <div className="space-y-1 mb-2">
          {files.map((f) => (
            <a key={f.fileId} href={downloadUrl(f.fileId)}
              className="flex items-center gap-1.5 font-mono text-[11px] text-[#054653] underline">
              📎 {f.fileName}
            </a>
          ))}
        </div>
      )}
      {canUpload && (
        <label className="cursor-pointer">
          <span className="font-mono text-[10px] uppercase tracking-wider text-charcoal/40 hover:text-ink underline">
            {uploading ? 'Uploading…' : '+ Attach document'}
          </span>
          <input
            ref={fileInput}
            type="file"
            className="hidden"
            disabled={uploading}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </label>
      )}
    </div>
  );
}

// ── Year entry form ──────────────────────────────────────────────────────────
function YearForm({ targetId, initial, onDone, onCancel }: {
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
    <div className="rounded border border-amber/40 bg-amber/5 p-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        <input value={label} onChange={(e) => setLabel(e.target.value)} className="auth-input w-32" placeholder="Label" />
        <input
          type="number" min={0} max={150}
          value={progressPercent}
          onChange={(e) => setProgressPercent(Number(e.target.value))}
          className="auth-input w-24"
          placeholder="%"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value as TargetStatus)} className="auth-input w-auto">
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <textarea value={note} onChange={(e) => setNote(e.target.value)}
        placeholder="What happened this year…" rows={2} className="auth-input resize-none" />
      {error && <p className="text-sm text-clay">{error}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={saving}
          className="bg-ink px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-parchment hover:bg-inkdeep disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onCancel} className="font-mono text-xs text-charcoal/40 hover:text-ink">Cancel</button>
      </div>
    </div>
  );
}
