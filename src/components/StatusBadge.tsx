import clsx from 'clsx';
import { statusColor, statusLabel } from '@/lib/progress';
import type { TargetStatus } from '@/lib/appwrite/config';

export function StatusBadge({ status }: { status: TargetStatus }) {
  const c = statusColor(status);
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider',
        c.text,
        c.bg
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
