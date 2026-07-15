/**
 * Score bands — 0 to 100 in increments of 20, then Exceptional above 100.
 *
 *   0–20   Very Poor   🔴
 *  21–40   Poor        🟠
 *  41–60   Fair        🟡
 *  61–80   Good        🟢
 *  81–100  Very Good   🔵
 *  101+    Exceptional ⭐
 */

export type ProgressBand =
  | 'very_poor'
  | 'poor'
  | 'fair'
  | 'good'
  | 'very_good'
  | 'exceptional';

export const BAND_LABELS: Record<ProgressBand, string> = {
  very_poor:   'Very Poor',
  poor:        'Poor',
  fair:        'Fair',
  good:        'Good',
  very_good:   'Very Good',
  exceptional: 'Exceptional',
};

export const BAND_RANGES: Record<ProgressBand, string> = {
  very_poor:   '0–20',
  poor:        '21–40',
  fair:        '41–60',
  good:        '61–80',
  very_good:   '81–100',
  exceptional: '101+',
};

export function getProgressBand(score: number): ProgressBand {
  if (score > 100) return 'exceptional';
  if (score >= 81)  return 'very_good';
  if (score >= 61)  return 'good';
  if (score >= 41)  return 'fair';
  if (score >= 21)  return 'poor';
  return 'very_poor';
}

export interface BandColors {
  bg: string;
  text: string;
  border: string;
  bar: string;
  badge: string;
}

export function getBandColors(band: ProgressBand): BandColors {
  switch (band) {
    case 'very_poor':
      return { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444', bar: '#EF4444', badge: '#DC2626' };
    case 'poor':
      return { bg: '#FFF0E6', text: '#9A3412', border: '#F97316', bar: '#F97316', badge: '#EA580C' };
    case 'fair':
      return { bg: '#FFFBEB', text: '#92400E', border: '#F59E0B', bar: '#F59E0B', badge: '#D97706' };
    case 'good':
      return { bg: '#ECFDF5', text: '#065F46', border: '#059669', bar: '#059669', badge: '#059669' };
    case 'very_good':
      return { bg: '#EEF6F7', text: '#054653', border: '#054653', bar: '#054653', badge: '#054653' };
    case 'exceptional':
      return { bg: '#FDF4E7', text: '#92400E', border: '#D98E2B', bar: '#D98E2B', badge: '#D97706' };
  }
}

export function getPctColors(score: number): BandColors {
  return getBandColors(getProgressBand(score));
}

/** For the progress bar visual — cap at 100% width, exceptional fills fully */
export function getBarWidth(score: number): number {
  return Math.min(100, score);
}
