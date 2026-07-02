'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { databases } from '@/lib/appwrite/client';
import { DATABASE_ID, COLLECTIONS } from '@/lib/appwrite/config';
import { AppShell } from '@/components/AppShell';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressControls } from '@/components/ProgressControls';
import { CommentThread } from '@/components/CommentThread';
import { ReportUploader } from '@/components/ReportUploader';
import { YearlyTracker } from '@/components/YearlyTracker';
import { useAuth } from '@/lib/auth-context';
import { canEditTarget, canContributeToTarget } from '@/lib/permissions';
import type { TargetDoc, OutputDoc, ResultDoc } from '@/types';

export default function TargetDetailPage() {
  const params = useParams<{ targetId: string }>();
  const { profile } = useAuth();
  const [target, setTarget] = useState<TargetDoc | null>(null);
  const [output, setOutput] = useState<OutputDoc | null>(null);
  const [result, setResult] = useState<ResultDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const t = (await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.TARGETS,
        params.targetId
      )) as unknown as TargetDoc;
      setTarget(t);
      const [o, r] = await Promise.all([
        databases.getDocument(DATABASE_ID, COLLECTIONS.OUTPUTS, t.outputId),
        databases.getDocument(DATABASE_ID, COLLECTIONS.RESULTS, t.resultId),
      ]);
      setOutput(o as unknown as OutputDoc);
      setResult(r as unknown as ResultDoc);
      setLoading(false);
    }
    load();
  }, [params.targetId]);

  if (loading || !target) {
    return (
      <AppShell>
        <div className="px-8 py-10 font-mono text-sm text-charcoal/50">Loading task…</div>
      </AppShell>
    );
  }

  const editable = canEditTarget(profile, target);
  const contributable = canContributeToTarget(profile, target);
  const adminUser = profile?.role === 'admin';

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-8 py-10">
        <Link href="/matrix" className="font-mono text-xs uppercase tracking-wider text-charcoal/50 hover:text-ink">
          ← Back to matrix
        </Link>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-clay">
              {result?.code} · Output {output?.code} · Target {target.code}
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-charcoal/40">
              Deliverable / 5-year target
            </p>
            <h1 className="mt-0.5 font-display text-2xl text-ink">{target.description}</h1>
          </div>
          <StatusBadge status={target.status} />
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 border border-line bg-white p-5 text-sm sm:grid-cols-3">
          <Detail label="Lead organization / section" value={target.leadOrg} />
          <Detail label="Timeline" value={target.timeline ?? '—'} />
          <Detail label="Result" value={result?.title ?? '—'} />
          <Detail label="Output indicator" value={output?.title ?? '—'} />
          <Detail label="Outcome indicator" value={result?.outcome ?? '—'} />
        </dl>

        {target.activities && (
          <div className="mt-6 border border-line bg-white p-5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-charcoal/50">
              Activities (inputs)
            </p>
            <p className="mt-0.5 text-xs text-charcoal/40">
              The work being put in to reach the deliverable above.
            </p>
            <ul className="mt-2 space-y-1 text-sm text-charcoal/80">
              {target.activities.split('\n').filter(Boolean).map((a, i) => (
                <li key={i}>{a.trim()}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6">
          {editable ? (
            <ProgressControls
              targetId={target.$id}
              initialPercent={target.progressPercent ?? 0}
              initialStatus={target.status}
              isAdmin={adminUser}
              onUpdated={(percent, status) => setTarget({ ...target, progressPercent: percent, status })}
            />
          ) : (
            <div className="border border-line bg-white p-5">
              <p className="font-mono text-[11px] uppercase tracking-wider text-charcoal/50">
                Current progress
              </p>
              <p className="mt-1 font-display text-2xl text-ink">{target.progressPercent ?? 0}%</p>
              <p className="mt-1 text-xs text-charcoal/40">
                Only members of {target.leadOrg} or an administrator can update this task.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <YearlyTracker targetId={target.$id} canEdit={editable} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <CommentThread targetId={target.$id} canPost={contributable} />
          <ReportUploader targetId={target.$id} canUpload={contributable} />
        </div>
      </div>
    </AppShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-wider text-charcoal/40">{label}</dt>
      <dd className="mt-0.5 text-charcoal/80">{value}</dd>
    </div>
  );
}
