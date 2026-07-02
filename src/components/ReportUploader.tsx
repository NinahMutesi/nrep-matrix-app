'use client';

import { useEffect, useRef, useState } from 'react';
import { ID } from 'appwrite';
import { storage } from '@/lib/appwrite/client';
import { BUCKET_REPORTS } from '@/lib/appwrite/config';
import { authedFetch } from '@/lib/authed-fetch';
import type { ReportDoc } from '@/types';

export function ReportUploader({ targetId, canUpload }: { targetId: string; canUpload: boolean }) {
  const [reports, setReports] = useState<ReportDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await authedFetch(`/api/targets/${targetId}/reports`);
      setReports(res.reports);
    } catch (err: any) {
      setError(err.message ?? 'Could not load reports.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId]);

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
    } catch (err: any) {
      setError(err.message ?? 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  function downloadUrl(fileId: string) {
    return storage.getFileDownload(BUCKET_REPORTS, fileId).toString();
  }

  return (
    <div className="border border-line bg-white p-5">
      <p className="font-mono text-[11px] uppercase tracking-wider text-charcoal/50">
        Supporting reports
      </p>

      {canUpload && (
        <div className="mt-3">
          <input
            ref={fileInput}
            type="file"
            disabled={uploading}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="block w-full text-sm text-charcoal/70"
          />
          {uploading && <p className="mt-1 font-mono text-xs text-charcoal/40">Uploading…</p>}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-clay">{error}</p>}

      <ul className="mt-4 space-y-2">
        {loading && <li className="font-mono text-xs text-charcoal/40">Loading…</li>}
        {!loading && reports.length === 0 && (
          <li className="font-mono text-xs text-charcoal/40">No reports uploaded yet.</li>
        )}
        {reports.map((r) => (
          <li key={r.$id} className="flex items-center justify-between border-t border-line pt-2 first:border-0 first:pt-0">
            <div>
              <a href={downloadUrl(r.fileId)} className="text-sm font-medium text-ink underline">
                {r.fileName}
              </a>
              <p className="font-mono text-[10px] text-charcoal/40">
                {r.uploadedByName} · {new Date(r.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
