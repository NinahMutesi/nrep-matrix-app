'use client';

import { useEffect, useState } from 'react';
import { authedFetch } from '@/lib/authed-fetch';

interface LinkEntry {
  $id: string;
  url: string;
  title: string;
  userName: string;
  createdAt: string;
}

function decodeLink(body: string) {
  const raw = body.replace('[LINK] ', '');
  const idx = raw.indexOf(' | ');
  if (idx === -1) return { url: raw, title: raw };
  return { url: raw.slice(0, idx), title: raw.slice(idx + 3) };
}

function getFavicon(url: string) {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return null;
  }
}

export function LinksSection({
  targetId,
  canAdd,
  onLinkAdded,
}: {
  targetId: string;
  canAdd: boolean;
  onLinkAdded?: () => void;
}) {
  const [links,   setLinks]   = useState<LinkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [url,     setUrl]     = useState('');
  const [title,   setTitle]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await authedFetch(`/api/targets/${targetId}/links`);
      setLinks(
        (res.links ?? []).map((l: any) => ({
          $id: l.$id,
          ...decodeLink(l.body),
          userName: l.userName,
          createdAt: l.createdAt,
        }))
      );
    } catch { } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [targetId]);

  async function save() {
    if (!url.trim()) return;
    // Auto-add https:// if missing
    const fullUrl = url.startsWith('http') ? url.trim() : `https://${url.trim()}`;
    setSaving(true);
    setError(null);
    try {
      await authedFetch(`/api/targets/${targetId}/links`, {
        method: 'POST',
        body: JSON.stringify({ url: fullUrl, title: title.trim() || fullUrl }),
      });
      setUrl('');
      setTitle('');
      setShowForm(false);
      await load();
      onLinkAdded?.();
    } catch (err: any) {
      setError(err.message ?? 'Could not save link.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border-2 bg-white" style={{ borderColor: '#D0D8DA' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: '#E5E7EB', backgroundColor: '#F8FAFB' }}
      >
        <div>
          <p className="text-sm font-bold text-gray-700">Reference Links</p>
          <p className="text-xs text-gray-400">
            Share relevant URLs — reports, documents, websites, evidence
          </p>
        </div>
        {canAdd && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition"
            style={{ borderColor: '#054653', color: '#054653' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#054653'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#054653'; }}
          >
            {showForm ? 'Cancel' : '+ Add link'}
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && canAdd && (
        <div
          className="border-b p-4 space-y-2"
          style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFBEB' }}
        >
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              URL *
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/report.pdf"
              className="w-full rounded-lg border-2 px-3 py-2 text-sm"
              style={{ borderColor: '#D0D8DA' }}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Title / Description (optional)
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q1 Progress Report, Ministry Website…"
              className="w-full rounded-lg border-2 px-3 py-2 text-sm"
              style={{ borderColor: '#D0D8DA' }}
              onKeyDown={(e) => e.key === 'Enter' && save()}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving || !url.trim()}
              className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              style={{ backgroundColor: '#054653' }}
            >
              {saving ? 'Saving…' : 'Add link'}
            </button>
            <button
              onClick={() => { setShowForm(false); setUrl(''); setTitle(''); }}
              className="rounded-lg border px-3 py-2 text-sm text-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Links list */}
      <div className="p-4">
        {loading && <p className="text-sm text-gray-400">Loading…</p>}
        {!loading && links.length === 0 && (
          <p className="text-sm italic text-gray-300">
            No links added yet{canAdd ? '. Click "+ Add link" above.' : '.'}
          </p>
        )}
        <div className="space-y-2">
          {links.map((link) => {
            const favicon = getFavicon(link.url);
            return (
              <div
                key={link.$id}
                className="flex items-start gap-3 rounded-lg border p-3 transition hover:border-gray-300"
                style={{ borderColor: '#E5E7EB' }}
              >
                {/* Favicon */}
                {favicon && (
                  <img
                    src={favicon}
                    alt=""
                    className="mt-0.5 h-5 w-5 shrink-0 rounded object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm font-medium underline"
                    style={{ color: '#054653' }}
                  >
                    {link.title}
                  </a>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-gray-400">
                    {link.url}
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-400">
                    Added by {link.userName} · {new Date(link.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded px-2 py-1 text-xs font-medium"
                  style={{ backgroundColor: '#EEF6F7', color: '#054653' }}
                >
                  Open ↗
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
