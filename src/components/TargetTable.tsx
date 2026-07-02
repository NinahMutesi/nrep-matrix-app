'use client';

import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import type { MatrixTree } from '@/lib/use-matrix-data';
import type { TargetDoc } from '@/types';
import { canEditTarget } from '@/lib/permissions';
import type { Profile } from '@/types';

export function TargetTable({
  targets,
  data,
  profile,
}: {
  targets: TargetDoc[];
  data: MatrixTree;
  profile: Profile | null;
}) {
  if (targets.length === 0) {
    return (
      <p className="border border-line bg-white px-5 py-8 text-center font-mono text-sm text-charcoal/50">
        No targets match this filter.
      </p>
    );
  }

  return (
    <div className="overflow-hidden border border-line bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-parchdim/60 font-mono text-[10px] uppercase tracking-wider text-charcoal/50">
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">Target</th>
            <th className="px-4 py-3">Lead org / section</th>
            <th className="px-4 py-3">Timeline</th>
            <th className="px-4 py-3">Progress</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {targets.map((t) => {
            const output = data.outputs.find((o) => o.$id === t.outputId);
            const editable = canEditTarget(profile, t);
            return (
              <tr key={t.$id} className="border-b border-line last:border-0 hover:bg-parchment/60">
                <td className="px-4 py-3 align-top font-mono text-xs text-clay">{t.code}</td>
                <td className="px-4 py-3 align-top">
                  <p className="font-medium text-ink line-clamp-2">{t.description}</p>
                  {output && <p className="mt-0.5 text-xs text-charcoal/40">{output.title}</p>}
                </td>
                <td className="px-4 py-3 align-top text-xs text-charcoal/70">{t.leadOrg}</td>
                <td className="px-4 py-3 align-top text-xs text-charcoal/50">{t.timeline ?? '—'}</td>
                <td className="px-4 py-3 align-top">
                  <div className="h-1.5 w-24 bg-parchdim">
                    <div
                      className="h-1.5 bg-amber"
                      style={{ width: `${Math.max(0, Math.min(100, t.progressPercent ?? 0))}%` }}
                    />
                  </div>
                  <span className="font-mono text-[11px] text-charcoal/50">{t.progressPercent ?? 0}%</span>
                </td>
                <td className="px-4 py-3 align-top">
                  <StatusBadge status={t.status} />
                </td>
                <td className="px-4 py-3 align-top text-right">
                  <Link
                    href={`/matrix/${t.$id}`}
                    className="font-mono text-[11px] uppercase tracking-wider text-ink underline"
                  >
                    {editable ? 'Open & update' : 'View'}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
