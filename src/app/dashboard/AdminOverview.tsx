'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authedFetch } from '@/lib/authed-fetch';
import { averageProgress } from '@/lib/progress';
import { getPctColors, BAND_LABELS, getProgressBand } from '@/lib/progress-bands';
import { ProgressBadge, ProgressBar } from '@/components/ProgressBadge';
import { StatusBadge } from '@/components/StatusBadge';

export function AdminOverview({ data }: { data: any }) {
  const [counts, setCounts] = useState({ comments: 0, reviews: 0, reports: 0 });
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const overallPct  = averageProgress(data.targets.map((t: any) => t.progressPercent ?? 0));
  const completed   = data.targets.filter((t: any) => t.status === 'completed').length;
  const atRisk      = data.targets.filter((t: any) => t.status === 'at_risk' || t.status === 'delayed').length;
  const inProgress  = data.targets.filter((t: any) => t.status === 'in_progress' || t.status === 'on_track').length;

  useEffect(() => {
    loadCounts();
    setRecentActivity(
      [...data.targets]
        .filter((t: any) => t.updatedAt)
        .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 10)
    );
  }, [data]);

  async function loadCounts() {
    setLoadingCounts(true);
    let comments = 0, reviews = 0, reports = 0;
    // Sample first 20 targets to get counts (avoid too many requests)
    const sample = data.targets.slice(0, 20);
    await Promise.all(sample.map(async (t: any) => {
      try {
        const [cr, rr] = await Promise.all([
          authedFetch(`/api/targets/${t.$id}/comments`),
          authedFetch(`/api/targets/${t.$id}/reports`),
        ]);
        const allC = cr.comments ?? [];
        comments += allC.filter((c: any) => !c.body?.startsWith('[ADMIN REVIEW]') && !c.body?.startsWith('[LINK] ')).length;
        reviews  += allC.filter((c: any) =>  c.body?.startsWith('[ADMIN REVIEW]')).length;
        reports  += (rr.reports ?? []).filter((r: any) => !r.description?.startsWith('year:')).length;
      } catch {}
    }));
    setCounts({ comments, reviews, reports });
    setLoadingCounts(false);
  }

  const resultBreakdown = data.results.filter((r: any) => r.code !== 'R6').map((result: any) => {
    const targets = data.targets.filter((t: any) => t.resultId === result.$id);
    const pct     = averageProgress(targets.map((t: any) => t.progressPercent ?? 0));
    const done    = targets.filter((t: any) => t.status === 'completed').length;
    const risk    = targets.filter((t: any) => t.status === 'at_risk' || t.status === 'delayed').length;
    return { result, targets, pct, done, risk };
  });

  return (
    <div className="mt-6">
      {/* Summary tiles */}
      <div className="mb-6 rounded-lg bg-white p-5" style={{ border: '2px solid #054653' }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#054653' }}>
          Full system — {data.targets.length} targets across {data.results.filter((r:any) => r.code !== 'R6').length} results
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
          <Tile label="Overall" value={`${overallPct}%`} color="#054653" bg="#EEF6F7" />
          <Tile label="All comments" value={loadingCounts ? '…' : String(counts.comments)} color="#D97706" bg="#FFFBEB"
            link="/admin-comments?filter=comments" />
          <Tile label="Admin reviews" value={loadingCounts ? '…' : String(counts.reviews)} color="#054653" bg="#EEF6F7"
            link="/admin-comments?filter=reviews" />
          <Tile label="Reports" value={loadingCounts ? '…' : String(counts.reports)} color="#EA580C" bg="#FFF0E6"
            link="/admin-comments" />
        </div>
        <ProgressBar percent={overallPct} height={10} />
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Completed', value: completed, color: '#059669' },
            { label: 'In progress', value: inProgress, color: '#D97706' },
            { label: 'At risk', value: atRisk, color: '#DC2626' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded border p-2" style={{ borderColor: '#E5E7EB' }}>
              <p className="text-xl font-bold" style={{ color }}>{value}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Progress by result — matching dashboard card format */}
      <p className="mb-3 font-mono text-xs font-bold uppercase tracking-wider" style={{ color: '#054653' }}>
        Progress by result
      </p>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {resultBreakdown.map(({ result, targets, pct, done, risk }: any) => {
          const colors = getPctColors(pct);
          return (
            <Link key={result.$id} href={`/matrix?result=${result.$id}`}
              className="block bg-white p-4 transition hover:shadow-md"
              style={{ borderRadius: '10px', border: `1.5px solid ${colors.border}`, borderLeft: `4px solid #054653` }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: '#054653' }}>{result.code}</p>
                  <p className="text-sm font-medium text-gray-800 line-clamp-2 mt-0.5">{result.title}</p>
                </div>
                <ProgressBadge percent={pct} showLabel={false} size="sm" />
              </div>
              <ProgressBar percent={pct} height={5} />
              <div className="mt-2 flex justify-between font-mono text-[10px] text-gray-400">
                <span>{targets.length} targets · {done} done</span>
                {risk > 0 && <span className="text-red-500">{risk} at risk</span>}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent activity */}
      <p className="mb-3 font-mono text-xs font-bold uppercase tracking-wider" style={{ color: '#054653' }}>
        Recent team activity
      </p>
      {recentActivity.length === 0 && (
        <p className="text-sm text-gray-400 italic">No activity yet.</p>
      )}
      <div className="space-y-2">
        {recentActivity.map((t: any) => {
          const result = data.results.find((r: any) => r.$id === t.resultId);
          const tc = getPctColors(t.progressPercent ?? 0);
          const days = t.updatedAt ? Math.floor((Date.now() - new Date(t.updatedAt).getTime()) / 86400000) : null;
          return (
            <Link key={t.$id} href={`/matrix/${t.$id}`}
              className="flex items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 transition hover:shadow-sm"
              style={{ border: '1px solid #E5E7EB', borderLeft: '3px solid #054653' }}>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[9px] uppercase tracking-wider text-gray-400">{result?.code} · Target {t.code}</p>
                <p className="text-sm font-medium text-gray-800 line-clamp-1">{t.description}</p>
                <p className="font-mono text-[10px] text-gray-400">
                  {days === 0 ? 'Updated today' : days === 1 ? 'Updated yesterday' : `Updated ${days}d ago`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ProgressBadge percent={t.progressPercent ?? 0} showLabel={false} size="xs" />
                <StatusBadge status={t.status} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Tile({ label, value, color, bg, link }: { label: string; value: string; color: string; bg: string; link?: string }) {
  const content = (
    <div className="rounded-lg border p-3 text-center transition hover:shadow-sm" style={{ borderColor: '#E5E7EB', backgroundColor: bg }}>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="font-mono text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
    </div>
  );
  return link ? <Link href={link}>{content}</Link> : content;
}
