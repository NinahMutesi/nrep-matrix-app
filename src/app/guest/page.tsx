'use client';

import { useEffect, useState } from 'react';
import { databases } from '@/lib/appwrite/client';
import { DATABASE_ID, COLLECTIONS, computeScore, scoreBand, scoreBandColors } from '@/lib/appwrite/config';
import { Query } from 'appwrite';
import { ScoreBar } from '@/components/ScoreBadge';
import type { ResultDoc, TargetDoc, OutputDoc } from '@/types';
import { averageProgress } from '@/lib/progress';

export default function GuestDashboard() {
  const [results, setResults] = useState<ResultDoc[]>([]);
  const [targets, setTargets] = useState<TargetDoc[]>([]);
  const [outputs, setOutputs] = useState<OutputDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [r, t, o] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.RESULTS, [Query.orderAsc('order'), Query.limit(50)]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.TARGETS, [Query.limit(500)]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.OUTPUTS, [Query.orderAsc('order'), Query.limit(200)]),
      ]);
      setResults(r.documents as unknown as ResultDoc[]);
      setTargets(t.documents as unknown as TargetDoc[]);
      setOutputs(o.documents as unknown as OutputDoc[]);
      setLoading(false);
    }
    load();
  }, []);

  const overallPct = averageProgress(targets.map((t) => t.progressPercent ?? 0));
  const overallScore = computeScore({ progressPercent: overallPct });
  const band = scoreBand(overallScore);
  const colors = scoreBandColors(band);

  return (
    <div className="min-h-screen bg-parchment">
      {/* Header */}
      <div className="border-b border-line bg-ink px-8 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-amber">Public Dashboard</p>
            <h1 className="font-display text-2xl text-parchment">NREP Strategic Plan — Implementation Status</h1>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-wider text-parchment/40">Ministry of Energy &amp; Mineral Development</p>
            <p className="font-mono text-xs text-parchment/60">Strategic Plan 2023–2028</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-8 py-10">
        {loading && <p className="font-mono text-sm text-charcoal/50">Loading…</p>}

        {!loading && (
          <>
            {/* Overall score */}
            <div
              className="mb-8 border p-6"
              style={{ borderColor: colors.ring, backgroundColor: colors.bg }}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-wider" style={{ color: colors.text }}>
                    Overall implementation score
                  </p>
                  <p className="mt-1 font-display text-5xl" style={{ color: colors.text }}>
                    {overallScore}<span className="text-2xl opacity-50">/25</span>
                  </p>
                  <p className="mt-1 font-mono text-sm" style={{ color: colors.text }}>
                    {overallPct}% average progress across {targets.length} targets
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <StatBox label="Results" value={results.length} />
                  <StatBox label="Targets" value={targets.length} />
                  <StatBox label="Completed" value={targets.filter((t) => t.status === 'completed').length} />
                </div>
              </div>
            </div>

            {/* Results grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {results.map((result) => {
                const rTargets = targets.filter((t) => t.resultId === result.$id);
                const pct = averageProgress(rTargets.map((t) => t.progressPercent ?? 0));
                const score = computeScore({ progressPercent: pct });
                const rb = scoreBand(score);
                const rc = scoreBandColors(rb);

                return (
                  <div key={result.$id} className="border border-line bg-white p-5">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-clay">{result.code}</p>
                    <p className="mt-1 font-display text-base leading-snug text-ink">{result.title}</p>
                    <div className="mt-4">
                      <ScoreBar progressPercent={pct} height={6} />
                    </div>
                    <div className="mt-3 flex items-center justify-between font-mono text-[10px] text-charcoal/50">
                      <span>{rTargets.length} targets</span>
                      <span
                        className="rounded px-2 py-0.5 font-bold"
                        style={{ backgroundColor: rc.bg, color: rc.text }}
                      >
                        {score}/25
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-10 text-center font-mono text-xs text-charcoal/30">
              Read-only public view · Data updated in real-time · MEMD/NREP Secretariat
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-line bg-white px-4 py-3">
      <p className="font-display text-2xl text-ink">{value}</p>
      <p className="font-mono text-[10px] uppercase tracking-wider text-charcoal/50">{label}</p>
    </div>
  );
}
