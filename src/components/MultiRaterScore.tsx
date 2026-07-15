'use client';

import { useState } from 'react';
import { authedFetch } from '@/lib/authed-fetch';
import {
  getProgressBand, getBandColors, BAND_LABELS, BAND_RANGES, getBarWidth,
} from '@/lib/progress-bands';
import { canGiveMemberScore, canScoreTarget } from '@/lib/permissions';
import type { Profile, TargetDoc } from '@/types';

interface Props {
  targetId: string;
  target: TargetDoc;
  scoreUser: number | null;
  scoreAdmin: number | null;
  profile: Profile | null;
  onUpdated: () => void;
}

/** Map result code to the specific section admin name */
function getSectionAdminName(resultCode: string | undefined): string {
  if (!resultCode) return 'Section admin';
  if (resultCode === 'R1' || resultCode === 'R3') return 'M. Kizza';
  if (resultCode === 'R2' || resultCode === 'R6') return 'E. Nabaho';
  if (resultCode === 'R4' || resultCode === 'R5') return 'P. Nduhuura';
  return 'Section admin';
}

function avg(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v != null);
  if (!valid.length) return null;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}

function ScorePill({ score }: { score: number }) {
  const band   = getProgressBand(score);
  const colors = getBandColors(band);
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold" style={{ color: colors.badge }}>{score}</span>
        {score <= 100
          ? <span className="text-base text-gray-400 font-mono">/100</span>
          : <span className="text-lg font-bold" style={{ color: colors.badge }}>⭐</span>}
      </div>
      <span
        className="inline-block rounded-full px-3 py-0.5 text-xs font-bold"
        style={{ backgroundColor: colors.bg, color: colors.badge }}
      >
        {BAND_LABELS[band]}
      </span>
      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${getBarWidth(score)}%`, backgroundColor: colors.bar }}
        />
      </div>
    </div>
  );
}

export function MultiRaterScore({
  targetId, target, scoreUser, scoreAdmin, profile, onUpdated,
}: Props) {
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft,   setDraft]   = useState('');

  const memberCanScore     = canGiveMemberScore(profile, target);
  const adminCanScore      = canScoreTarget(profile, target);
  const finalScore         = avg([scoreUser, scoreAdmin]);
  const finalBand          = finalScore != null ? getProgressBand(finalScore) : null;
  const finalColors        = finalBand ? getBandColors(finalBand) : null;

  // Get the specific section admin name for this target's result
  const resultCode = target
  ? ((target as any).resultCode ?? target.code?.split('.')?.[0] ?? '')
  : '';
  const sectionAdminName = getSectionAdminName(resultCode);
  
  async function save(field: string, value: number) {
    setSaving(true);
    setError(null);
    try {
      await authedFetch(`/api/targets/${targetId}`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: Math.max(0, Math.round(value)) }),
      });
      setEditing(null);
      onUpdated();
    } catch (err: any) {
      setError(err.message ?? 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  const slots = [
    {
      field:     'scoreUser',
      label:     'Member score',
      sublabel:  'Your own assessment of progress on this target',
      value:     scoreUser,
      canEdit:   memberCanScore,
      noEditMsg: 'Only the assigned member can enter this score',
    },
    {
      field:     'scoreAdmin',
      label:     `Section admin score`,
      sublabel:  `Assessed by ${sectionAdminName}`, // SPECIFIC name
      value:     scoreAdmin,
      canEdit:   adminCanScore,
      noEditMsg: `Only ${sectionAdminName} can enter this score`,
    },
  ];

  return (
    <div className="overflow-hidden rounded-lg border-2 bg-white" style={{ borderColor: '#054653' }}>

      {/* Compact header — description removed */}
      <div className="flex items-center justify-between px-5 py-3"
        style={{ backgroundColor: '#054653' }}>
        <p className="text-base font-bold text-white">Performance Assessment</p>
        {finalScore != null && finalColors && (
          <div className="rounded-lg px-3 py-1.5 text-center" style={{ backgroundColor: finalColors.bg }}>
            <span className="text-lg font-bold" style={{ color: finalColors.badge }}>
              {finalScore}{finalScore > 100 ? ' ⭐' : '/100'}
            </span>
            <span className="ml-2 text-xs font-semibold" style={{ color: finalColors.badge }}>
              {BAND_LABELS[finalBand!]}
            </span>
          </div>
        )}
      </div>

      {/* Two score columns */}
      <div className="grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0 divide-gray-100">
        {slots.map((slot) => {
          const isEditing = editing === slot.field;
          const hasScore  = slot.value != null;
          const draftNum  = Number(draft);

          return (
            <div key={slot.field} className="p-5">
              <p className="text-sm font-bold text-gray-800">{slot.label}</p>
              <p className="text-xs text-gray-400 mb-4">{slot.sublabel}</p>

              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                      Score (0–100, above 100 = Exceptional)
                    </label>
                    <input
                      type="number" min={0}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="e.g. 60"
                      className="w-28 rounded-lg border-2 px-3 py-2 text-center text-2xl font-bold"
                      style={{ borderColor: '#054653', color: '#054653' }}
                      autoFocus
                    />
                    {draft !== '' && !isNaN(draftNum) && draftNum >= 0 && (
                      <div className="mt-3"><ScorePill score={draftNum} /></div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => save(slot.field, draftNum)}
                      disabled={saving || draft === '' || isNaN(draftNum)}
                      className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                      style={{ backgroundColor: '#054653' }}
                    >
                      {saving ? 'Saving…' : 'Save score'}
                    </button>
                    <button onClick={() => setEditing(null)}
                      className="rounded-lg border px-3 py-2 text-sm text-gray-500">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {hasScore
                    ? <ScorePill score={slot.value!} />
                    : <p className="mb-4 text-sm text-gray-300 italic">Not scored yet</p>
                  }
                  <div className="mt-4">
                    {slot.canEdit ? (
                      /* Prominent button */
                      <button
                        onClick={() => { setEditing(slot.field); setDraft(String(slot.value ?? '')); }}
                        className="w-full rounded-lg py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                        style={{ backgroundColor: hasScore ? '#054653' : '#D98E2B' }}
                      >
                        {hasScore ? '✏ Update score' : '＋ Add score'}
                      </button>
                    ) : (
                      <p className="text-xs italic text-gray-300">{slot.noEditMsg}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Band legend */}
      <div className="border-t border-gray-100 px-5 py-3" style={{ backgroundColor: '#F8FAFB' }}>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {([
            { band: 'very_poor',   color: '#DC2626' },
            { band: 'poor',        color: '#EA580C' },
            { band: 'fair',        color: '#D97706' },
            { band: 'good',        color: '#059669' },
            { band: 'very_good',   color: '#054653' },
            { band: 'exceptional', color: '#D98E2B' },
          ] as const).map(({ band, color }) => (
            <span key={band} className="flex items-center gap-1.5 text-xs">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              <span style={{ color }}>
                {BAND_RANGES[band]} {BAND_LABELS[band]}
              </span>
            </span>
          ))}
        </div>
        {finalScore != null && (
          <p className="mt-1.5 text-xs text-gray-400">
            Final = (
            {[scoreUser != null ? `${scoreUser}` : null, scoreAdmin != null ? `${scoreAdmin}` : null]
              .filter(Boolean).join(' + ')})
            {' ÷ '}{[scoreUser, scoreAdmin].filter(v => v != null).length}
            {' = '}
            <strong style={{ color: '#054653' }}>
              {finalScore}{finalScore > 100 ? ' ⭐ Exceptional' : '/100'}
            </strong>
          </p>
        )}
      </div>

      {error && <p className="px-5 pb-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
