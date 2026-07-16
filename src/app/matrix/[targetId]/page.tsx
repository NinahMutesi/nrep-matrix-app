'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { databases } from '@/lib/appwrite/client';
import { DATABASE_ID, COLLECTIONS } from '@/lib/appwrite/config';
import { AppShell } from '@/components/AppShell';
import { StatusBadge } from '@/components/StatusBadge';
import { ScoreBadge, ScoreBar } from '@/components/ScoreBadge';
import { MultiRaterScore } from '@/components/MultiRaterScore';
import { ProgressControls } from '@/components/ProgressControls';
import { CommentThread } from '@/components/CommentThread';
import { ReportUploader } from '@/components/ReportUploader';
import { LinksSection } from '@/components/LinksSection';
import { YearlyTracker } from '@/components/YearlyTracker';
import { RecActionTracker } from '@/components/RecActionTracker';
import { SectionAdminReview } from '@/components/SectionAdminReview';
import { useAuth } from '@/lib/auth-context';
import { canEditTarget, canContributeToTarget, isAdmin, isSectionAdmin } from '@/lib/permissions';
import { authedFetch } from '@/lib/authed-fetch';
import type { TargetDoc, OutputDoc, ResultDoc } from '@/types';

export default function TargetDetailPage() {
  return <Suspense fallback={null}><TargetDetailPageInner /></Suspense>;
}

function TargetDetailPageInner() {
  const params = useParams<{ targetId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profile } = useAuth();

  const [target,  setTarget]  = useState<TargetDoc | null>(null);
  const [output,  setOutput]  = useState<OutputDoc | null>(null);
  const [result,  setResult]  = useState<ResultDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [counts,  setCounts]  = useState({ comments: 0, reviews: 0, reports: 0, links: 0 });

  const from      = searchParams.get('from');
  const backHref  = from === 'my_section' ? '/dashboard?mode=my_section' : '/matrix';
  const backLabel = from === 'my_section' ? '← My Section' : '← Back to matrix';

  const loadTarget = useCallback(async () => {
    setLoading(true);
    try {
      const t = (await databases.getDocument(DATABASE_ID, COLLECTIONS.TARGETS, params.targetId)) as unknown as TargetDoc;
      setTarget(t);
      const [o, r] = await Promise.all([
        databases.getDocument(DATABASE_ID, COLLECTIONS.OUTPUTS, t.outputId),
        databases.getDocument(DATABASE_ID, COLLECTIONS.RESULTS, t.resultId),
      ]);
      setOutput(o as unknown as OutputDoc);
      setResult(r as unknown as ResultDoc);
    } finally {
      setLoading(false);
    }
  }, [params.targetId]);

  const refreshCounts = useCallback(async () => {
    try {
      const [commentsRes, reportsRes] = await Promise.all([
        authedFetch(`/api/targets/${params.targetId}/comments`),
        authedFetch(`/api/targets/${params.targetId}/reports`),
      ]);
      const allComments = commentsRes.comments ?? [];
      const allReports  = reportsRes.reports ?? [];
      setCounts({
        comments: allComments.filter((c: any) => !c.body?.startsWith('[ADMIN REVIEW]') && !c.body?.startsWith('[LINK] ')).length,
        reviews:  allComments.filter((c: any) =>  c.body?.startsWith('[ADMIN REVIEW]')).length,
        links:    allComments.filter((c: any) =>  c.body?.startsWith('[LINK] ')).length,
        reports:  allReports.filter((r: any)  => !r.description?.startsWith('year:')).length,
      });
    } catch { }
  }, [params.targetId]);

  useEffect(() => { loadTarget(); refreshCounts(); }, [loadTarget, refreshCounts]);

  if (loading || !target) {
    return <AppShell><div className="px-8 py-10 text-sm text-gray-400">Loading task…</div></AppShell>;
  }

  const editable         = canEditTarget(profile, target);
  const contributable    = canContributeToTarget(profile, target);
  const adminUser        = isAdmin(profile);
  const sectionAdminUser = isSectionAdmin(profile, target);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-8 py-10">
        <button onClick={() => router.push(backHref)}
          className="mb-4 text-sm font-medium text-gray-500 hover:text-gray-800">
          {backLabel}
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider" style={{ color: '#054653' }}>
              {result?.code} · Output {output?.code} · Target {target.code}
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold text-gray-900">{target.description}</h1>
            <p className="mt-1 text-sm text-gray-500">
              <strong>Lead org:</strong> {target.leadOrg}
              {target.timeline && <> · <strong>Timeline:</strong> {target.timeline}</>}
              {editable
                ? <span className="ml-2 rounded px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: '#054653' }}>You can edit</span>
                : <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Read-only</span>}
            </p>
          </div>
          <StatusBadge status={target.status} />
        </div>

        {/* Activity summary */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard icon="💬" count={counts.comments} label="Comments" />
          <SummaryCard icon="✅" count={counts.reviews}  label="Admin reviews" highlight={counts.reviews > 0} />
          <SummaryCard icon="🔗" count={counts.links}    label="Links shared" />
          <SummaryCard icon="📎" count={counts.reports}  label="Files uploaded" />
        </div>

        {/* Performance score */}
        <div className="mt-5 overflow-hidden rounded-lg border-l-4 bg-white p-4 shadow-sm" style={{ borderLeftColor: '#EF4444' }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold uppercase tracking-wider text-gray-500">Performance Score</p>
            <ScoreBadge progressPercent={target.progressPercent ?? 0} weightTarget={target.weightTarget} scoreManual={target.scoreManual} showLabel size="md" />
          </div>
          <div className="mt-2">
            <ScoreBar progressPercent={target.progressPercent ?? 0} weightTarget={target.weightTarget} scoreManual={target.scoreManual} height={8} />
          </div>
        </div>

        {/* 3-way scoring: Member + Section Admin + Dr. Mukisa */}
        <div className="mt-4">
          <MultiRaterScore
            targetId={target.$id}
            target={{ ...target, resultCode: result?.code } as any}
            scoreUser={(target as any).scoreUser ?? null}
            scoreAdmin={(target as any).scoreAdmin ?? null}
            scoreSuperAdmin={(target as any).scoreSuperAdmin ?? null}
            profile={profile}
            onUpdated={loadTarget}
          />
        </div>

        {/* Progress update */}
        <div className="mt-4">
          {editable ? (
            <ProgressControls targetId={target.$id} initialPercent={target.progressPercent ?? 0}
              initialStatus={target.status} isAdmin={adminUser}
              onUpdated={(percent, status) => setTarget({ ...target, progressPercent: percent, status })} />
          ) : (
            <div className="rounded-lg border-2 bg-white p-5" style={{ borderColor: '#D0D8DA' }}>
              <p className="text-sm font-bold uppercase tracking-wider text-gray-500">Current Progress</p>
              <p className="mt-1 font-display text-2xl font-bold text-gray-900">{target.progressPercent ?? 0}%</p>
              <p className="mt-1 text-sm text-gray-400">Only members of <strong>{target.leadOrg}</strong> or an administrator can update this.</p>
            </div>
          )}
        </div>

        <div className="mt-4"><YearlyTracker targetId={target.$id} canEdit={editable} /></div>

        {result?.code === 'R6' && (
          <div className="mt-4"><RecActionTracker targetId={target.$id} canAdd={contributable} /></div>
        )}

        {(sectionAdminUser || adminUser) && (
          <div className="mt-4">
            <SectionAdminReview targetId={target.$id} target={target} profile={profile} onReviewPosted={refreshCounts} />
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <CommentThread targetId={target.$id} canPost={contributable} onCommentPosted={refreshCounts} />
          <ReportUploader targetId={target.$id} canUpload={contributable} onReportUploaded={refreshCounts} />
        </div>

        <div className="mt-4">
          <LinksSection targetId={target.$id} canAdd={contributable} onLinkAdded={refreshCounts} />
        </div>
      </div>
    </AppShell>
  );
}

function SummaryCard({ icon, count, label, highlight }: { icon: string; count: number; label: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border-2 bg-white px-3 py-3"
      style={{ borderColor: highlight ? '#054653' : '#E5E7EB' }}>
      <span className="text-xl">{icon}</span>
      <div>
        <p className="text-xl font-bold" style={{ color: highlight ? '#054653' : '#1A1A1A' }}>{count}</p>
        <p className="text-xs font-medium text-gray-400">{label}</p>
      </div>
    </div>
  );
}
