'use client';

import { useEffect, useRef, useState } from 'react';
import { ID } from 'appwrite';
import { storage } from '@/lib/appwrite/client';
import { BUCKET_REPORTS } from '@/lib/appwrite/config';
import { authedFetch } from '@/lib/authed-fetch';
import type { ReportDoc } from '@/types';

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

function isImage(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
}

function fileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return '🖼️';
  if (['pdf'].includes(ext)) return '📄';
  if (['doc','docx'].includes(ext)) return '📝';
  if (['xls','xlsx','csv'].includes(ext)) return '📊';
  if (['ppt','pptx'].includes(ext)) return '📊';
  return '📎';
}

export function ReportUploader({
  targetId,
  canUpload,
  onReportUploaded,
}: {
  targetId: string;
  canUpload: boolean;
  onReportUploaded?: () => void;
}) {
  const [reports,   setReports]   = useState<ReportDoc[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [dragging,  setDragging]  = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await authedFetch(`/api/targets/${targetId}/reports`);
      setReports(
        (res.reports ?? []).filter((r: any) => !r.description?.startsWith('year:'))
      );
    } catch (err: any) {
      setError(err.message ?? 'Could not load reports.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [targetId]);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const uploaded = await storage.createFile(BUCKET_REPORTS, ID.unique(), file);
      await authedFetch(`/api/targets/${targetId}/reports`, {
        method: 'POST',
        body: JSON.stringify({ fileId: uploaded.$id, fileName: file.name }),
      });
      await load();
      onReportUploaded?.();
    } catch (err: any) {
      setError('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const downloadUrl  = (fileId: string) =>
    storage.getFileDownload(BUCKET_REPORTS, fileId).toString();
  const previewUrl   = (fileId: string) =>
    storage.getFilePreview(BUCKET_REPORTS, fileId, 300, 200).toString();

  return (
    <div className="overflow-hidden rounded-lg border-2 bg-white" style={{ borderColor: '#D0D8DA' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b" style={{ borderColor: '#E5E7EB', backgroundColor: '#F8FAFB' }}>
        <p className="text-sm font-bold text-gray-700">Reports & Screenshots</p>
        <p className="text-xs text-gray-400">
          Upload documents, PDFs, or screenshots as evidence
        </p>
      </div>

      <div className="p-4">
        {/* Drop zone */}
        {canUpload && (
          <label
            className="mb-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 text-center transition"
            style={{
              borderColor: dragging ? '#054653' : '#D98E2B',
              backgroundColor: dragging ? '#EEF6F7' : '#FFFBEB',
            }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <span className="text-2xl">{dragging ? '📂' : '📎'}</span>
            <span className="text-sm font-bold" style={{ color: dragging ? '#054653' : '#D97706' }}>
              {uploading
                ? 'Uploading…'
                : dragging
                  ? 'Drop to upload'
                  : 'Click to upload or drag & drop'}
            </span>
            <span className="text-xs text-gray-400">
              Documents, PDFs, screenshots, images accepted
            </span>
            <input
              ref={fileInput}
              type="file"
              className="hidden"
              accept="*/*"
              disabled={uploading}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>
        )}

        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
        {loading && <p className="text-sm text-gray-400">Loading…</p>}

        {!loading && reports.length === 0 && (
          <p className="text-sm italic text-gray-300">
            No reports or screenshots uploaded yet.
          </p>
        )}

        {/* Screenshot grid — images shown as thumbnails */}
        {reports.some(r => isImage(r.fileName)) && (
          <div className="mb-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Screenshots
            </p>
            <div className="grid grid-cols-2 gap-2">
              {reports.filter(r => isImage(r.fileName)).map((r) => (
                <a
                  key={r.$id}
                  href={downloadUrl(r.fileId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-lg border-2 transition hover:border-[#054653]"
                  style={{ borderColor: '#E5E7EB' }}
                >
                  <img
                    src={previewUrl(r.fileId)}
                    alt={r.fileName}
                    className="h-32 w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="truncate text-[10px] font-medium text-white">
                      {r.fileName}
                    </p>
                    <p className="text-[9px] text-white/60">
                      {r.uploadedByName}
                    </p>
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100"
                    style={{ backgroundColor: 'rgba(5,70,83,0.6)' }}>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold" style={{ color: '#054653' }}>
                      View full size ↗
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Document list */}
        {reports.some(r => !isImage(r.fileName)) && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Documents
            </p>
            <div className="space-y-2">
              {reports.filter(r => !isImage(r.fileName)).map((r) => (
                <div
                  key={r.$id}
                  className="flex items-center justify-between rounded-lg border p-2.5 transition hover:border-gray-300"
                  style={{ borderColor: '#E5E7EB' }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg shrink-0">{fileIcon(r.fileName)}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800">{r.fileName}</p>
                      <p className="text-[10px] text-gray-400">
                        {r.uploadedByName} · {new Date(r.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <a
                    href={downloadUrl(r.fileId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 shrink-0 rounded px-2 py-1 text-xs font-bold"
                    style={{ backgroundColor: '#EEF6F7', color: '#054653' }}
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
