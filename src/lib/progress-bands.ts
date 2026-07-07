/**
 * Progress-percentage based color bands (0–100%)
 * Used for cards, badges, and borders throughout the dashboard.
 *
 *  0–25%   Very Poor  — Red
 * 26–50%   Poor       — Orange
 * 51–75%   Fair       — Amber
 * 76–100%  Good       — Green (#054653 teal accent on borders)
 */

export type ProgressBand = 'very_poor' | 'poor' | 'fair' | 'good' | 'exceptional';

export const BAND_LABELS: Record<ProgressBand, string> = {
  very_poor:   'Very Poor',
  poor:        'Poor',
  fair:        'Fair',
  good:        'Good',
  exceptional: 'Exceptional',
};

export function getProgressBand(pct: number): ProgressBand {
  if (pct > 100) return 'exceptional';
  if (pct <= 25)  return 'very_poor';
  if (pct <= 50)  return 'poor';
  if (pct <= 75)  return 'fair';
  return 'good';
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
      return { bg: '#ECFDF5', text: '#065F46', border: '#054653', bar: '#059669', badge: '#054653' };
    case 'exceptional':
      return { bg: '#FDF4E7', text: '#7C4D00', border: '#D98E2B', bar: '#D98E2B', badge: '#92400E' };
  }
}

export function getPctColors(pct: number): BandColors {
  return getBandColors(getProgressBand(pct));
}
