'use client';
import { Suspense } from 'react';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { databases } from '@/lib/appwrite/client';
import { DATABASE_ID, COLLECTIONS, computeScore, scoreBand, scoreBandColors } from '@/lib/appwrite/config';
import { AppShell } from '@/components/AppShell';
import { StatusBadge } from '@/components/StatusBadge';
import { ScoreBadge, ScoreBar } from '@/components/ScoreBadge';
import { ProgressControls } from '@/components/ProgressControls';
import { CommentThread } from '@/components/CommentThread';
import { ReportUploader } from '@/components/ReportUploader';
import { YearlyTracker } from '@/components/YearlyTracker';
import { RecActionTracker } from '@/components/RecActionTracker';
import { SectionAdminReview } from '@/components/SectionAdminReview';
import { useAuth } from '@/lib/auth-context';
import { canEditTarget, canContributeToTarget, isAdmin } from '@/lib/permissions';
import type { TargetDoc, OutputDoc, ResultDoc } from '@/types';

function TargetDetailPageInner() {
  const params = useParams<{ targetId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profile } = useAuth();

  const [target, setTarget] = useState<TargetDoc | null>(null);
  const [output, setOutput] = useState<OutputDoc | null>(null);
  const [result, setResult] = useState<ResultDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFullActivities, setShowFullActivities] = useState(false);

  // Smart back: go back to My Section if that's where user came from
  const from = searchParams.get('from');
  const backHref = from === 'my_section' ? '/dashboard?mode=my_section' : '/matrix';
  const backLabel = from === 'my_section' ? '← My Section' : '← Back to matrix';

  useEffect(() => {
    async function load() {
      setLoading(true);
      const t = (await databases.getDocument(
        DATABASE_ID, COLLECTIONS.TARGETS, params.targetId
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
  const adminUser = isAdmin(profile);
  const isSectionAdmin = !!(adminUser || (profile?.sectionSlugs?.includes(target.sectionSlug) && (profile?.role === 'admin' || profile?.role === 'super_admin')));
  const score = computeScore({ progressPercent: target.progressPercent ?? 0, weightTarget: target.weightTarget, scoreManual: target.scoreManual });
  const band = scoreBand(score);
  const colors = scoreBandColors(band);
  const isR6 = result?.code === 'R6';

  // Activities — show first activity line only, expand on demand
  const activitiesLines = (target.activities ?? '').split('\n').filter(Boolean).map(a => a.trim());
  const firstActivity = activitiesLines[0] ?? '';
  const hasMoreActivities = activitiesLines.length > 1;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-8 py-10">
        {/* Smart back button */}
        <button
          onClick={() => router.push(backHref)}
          className="font-mono text-xs uppercase tracking-wider text-charcoal/50 hover:text-ink"
        >
          {backLabel}
        </button>

        {/* Title block */}
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider" style={{ color: '#054653' }}>
              {result?.code} · Output {output?.code} · Target {target.code}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-charcoal/40 mt-0.5">
              Deliverable / 5-year target
            </p>
            <h1 className="mt-1 font-display text-2xl text-ink">{target.description}</h1>
          </div>
          <StatusBadge status={target.status} />
        </div>

        {/* Section indicator */}
        <div className="mt-3 inline-flex items-center gap-2 rounded px-3 py-1.5 font-mono text-xs"
          style={{ backgroundColor: '#EEF6F7', border: '1px solid #054653', color: '#054653' }}>
          <span>Section:</span>
          <strong>{target.leadOrg}</strong>
          <span className="opacity-50">({target.sectionSlug})</span>
          {editable
            ? <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: '#054653', color: 'white' }}>You can edit this</span>
            : <span className="ml-1 text-[10px] text-charcoal/40">Read-only for you</span>
          }
        </div>

        {/* Performance score — keep as is */}
        <div className="mt-5 rounded-lg border-l-4 border-line bg-white p-4" style={{ borderLeftColor: colors.ring }}>
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] uppercase tracking-wider text-charcoal/50">Performance score</p>
            <ScoreBadge progressPercent={target.progressPercent ?? 0} weightTarget={target.weightTarget} scoreManual={target.scoreManual} showLabel size="md" />
          </div>
          <div className="mt-2">
            <ScoreBar progressPercent={target.progressPercent ?? 0} weightTarget={target.weightTarget} scoreManual={target.scoreManual} height={8} />
          </div>
          <p className="mt-1 font-mono text-[10px] text-charcoal/40">
            {target.scoreManual != null ? 'Manual score set by reviewer' : target.weightTarget ? 'Weighted from strategic plan' : 'Auto-calculated from progress %'}
          </p>
        </div>

        {/* Details grid */}
        <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-line bg-white p-5 text-sm sm:grid-cols-3">
          <Detail label="Timeline" value={target.timeline ?? '—'} />
          <Detail label="Output indicator" value={output?.title ?? '—'} />
          <Detail label="Outcome indicator" value={result?.outcome ?? '—'} />
        </dl>

        {/* Activities — truncated */}
        {target.activities && (
          <div className="mt-4 rounded-lg border border-line bg-white p-5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-charcoal/50">
              Activities (inputs)
            </p>
            <p className="mt-0.5 text-xs text-charcoal/40">The work being put in to reach the deliverable above.</p>
            <div className="mt-2 text-sm text-charcoal/80">
              {showFullActivities ? (
                <ul className="space-y-1">
                  {activitiesLines.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              ) : (
                <p className="line-clamp-2">{firstActivity}</p>
              )}
            </div>
            {hasMoreActivities && (
              <button
                onClick={() => setShowFullActivities(!showFullActivities)}
                className="mt-2 font-mono text-[10px] uppercase tracking-wider underline text-charcoal/40 hover:text-ink"
              >
                {showFullActivities ? 'Show less' : `Show all ${activitiesLines.length} activities`}
              </button>
            )}
          </div>
        )}

        {/* Progress update */}
        <div className="mt-5">
          {editable ? (
            <ProgressControls
              targetId={target.$id}
              initialPercent={target.progressPercent ?? 0}
              initialStatus={target.status}
              isAdmin={adminUser}
              onUpdated={(percent, status) => setTarget({ ...target, progressPercent: percent, status })}
            />
          ) : (
            <div className="rounded-lg border border-line bg-white p-5">
              <p className="font-mono text-[11px] uppercase tracking-wider text-charcoal/50">Current progress</p>
              <p className="mt-1 font-display text-2xl text-ink">{target.progressPercent ?? 0}%</p>
              <p className="mt-1 text-xs text-charcoal/40">
                Only members of <strong>{target.leadOrg}</strong> or an administrator can update this task.
              </p>
            </div>
          )}
        </div>

        {/* Yearly tracking */}
        <div className="mt-5">
          <YearlyTracker targetId={target.$id} canEdit={editable} />
        </div>

        {/* R6 recommendation actions */}
        {isR6 && (
          <div className="mt-5">
            <RecActionTracker targetId={target.$id} canAdd={contributable} />
          </div>
        )}

        {/* Section admin review — admins see a separate formal review panel */}
        {(isSectionAdmin || (profile?.sectionSlugs?.includes(target.sectionSlug))) && (
          <div className="mt-5">
            <SectionAdminReview
              targetId={target.$id}
              sectionSlug={target.sectionSlug}
              isAdmin={isSectionAdmin}
            />
          </div>
        )}

        {/* Comments + reports */}
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
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

export default function TargetDetailPage() {
  return <Suspense fallback={null}><TargetDetailPageInner /></Suspense>;
}
