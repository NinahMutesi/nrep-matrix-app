'use client';

import { useEffect, useRef, useState } from 'react';
import { ID } from 'appwrite';
import { storage } from '@/lib/appwrite/client';
import { BUCKET_REPORTS } from '@/lib/appwrite/config';
import { authedFetch } from '@/lib/authed-fetch';
import type { ReportDoc } from '@/types';

export function ReportUploader({
  targetId,
  canUpload,
  onReportUploaded,
}: {
  targetId: string;
  canUpload: boolean;
  onReportUploaded?: () => void;
}) {
  const [reports,   setReports]  = useState<ReportDoc[]>([]);
  const [loading,   setLoading]  = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]    = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await authedFetch(`/api/targets/${targetId}/reports`);
      // Only general reports (not year-specific ones)
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
      onReportUploaded?.(); // ← triggers count refresh on parent
    } catch (err: any) {
      setError('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  const downloadUrl = (fileId: string) =>
    storage.getFileDownload(BUCKET_REPORTS, fileId).toString();

  return (
    <div className="overflow-hidden rounded-lg border-2 bg-white" style={{ borderColor: '#D0D8DA' }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: '#E5E7EB', backgroundColor: '#F8FAFB' }}>
        <p className="text-sm font-bold text-gray-700">Supporting Reports</p>
        <p className="text-xs text-gray-400">Upload documents, evidence, or deliverables</p>
      </div>

      <div className="p-4">
        {canUpload && (
          <label
            className="mb-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 text-sm font-bold transition hover:opacity-80"
            style={{ borderColor: '#D98E2B', color: '#D97706' }}
          >
            📎 {uploading ? 'Uploading…' : 'Choose file to upload'}
            <input
              ref={fileInput}
              type="file"
              className="hidden"
              disabled={uploading}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>
        )}
        {error && <p className="mb-2 text-sm text-red-500">{error}</p>}

        {loading && <p className="text-sm text-gray-400">Loading…</p>}
        {!loading && reports.length === 0 && (
          <p className="text-sm italic text-gray-300">No reports uploaded yet.</p>
        )}
        <div className="space-y-2">
          {reports.map((r) => (
            <div key={r.$id} className="flex items-center justify-between border-t border-gray-100 pt-2 first:border-0 first:pt-0">
              <div>
                <a
                  href={downloadUrl(r.fileId)}
                  className="text-sm font-medium underline"
                  style={{ color: '#054653' }}
                >
                  {r.fileName}
                </a>
                <p className="font-mono text-[10px] text-gray-400">
                  {r.uploadedByName} · {new Date(r.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
