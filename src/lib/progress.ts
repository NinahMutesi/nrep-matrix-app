import { STATUS_LABELS, type TargetStatus } from '@/lib/appwrite/config';

export function statusLabel(status: TargetStatus): string {
  return STATUS_LABELS[status] ?? status;
}

/** Tailwind color classes per status, used consistently across cards/tables/dials. */
export function statusColor(status: TargetStatus): { text: string; bg: string; ring: string } {
  switch (status) {
    case 'completed':
      return { text: 'text-teal', bg: 'bg-teal/10', ring: 'ring-teal' };
    case 'on_track':
      return { text: 'text-amber', bg: 'bg-amber/10', ring: 'ring-amber' };
    case 'in_progress':
      return { text: 'text-charcoal', bg: 'bg-charcoal/5', ring: 'ring-charcoal' };
    case 'at_risk':
      return { text: 'text-clay', bg: 'bg-clay/10', ring: 'ring-clay' };
    case 'delayed':
      return { text: 'text-clay', bg: 'bg-clay/10', ring: 'ring-clay' };
    default:
      return { text: 'text-charcoal/50', bg: 'bg-charcoal/5', ring: 'ring-charcoal/30' };
  }
}

export function averageProgress(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}
