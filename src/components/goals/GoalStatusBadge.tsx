import { Badge } from '@/components/ui/badge';
import { GOAL_STATUS_LABELS } from '@/lib/goals/constants';
import type { Goal } from '@/lib/goals/types';
import { cn } from '@/lib/utils';

const tone: Record<Goal['status'], string> = {
  active: 'bg-primary/15 text-primary border-primary/25',
  paused: 'bg-amber-500/15 text-amber-200 border-amber-500/25',
  completed: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
  archived: 'bg-white/5 text-text-muted border-white/15',
  abandoned: 'bg-surface-2 text-text-muted border-white/10',
};

export default function GoalStatusBadge({ status, className }: { status: Goal['status']; className?: string }) {
  return (
    <Badge variant="outline" className={cn('text-xs', tone[status], className)}>
      {GOAL_STATUS_LABELS[status]}
    </Badge>
  );
}
