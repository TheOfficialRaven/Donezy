import { Progress } from '@/components/ui/progress';
import { getGoalProgressPercent } from '@/lib/goals/selectors';
import type { Goal } from '@/lib/goals/types';
import { cn } from '@/lib/utils';

export default function GoalProgress({ goal, className }: { goal: Goal; className?: string }) {
  const pct = getGoalProgressPercent(goal);
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex justify-between text-xs text-text-muted">
        <span>Haladás</span>
        <span>{pct}%</span>
      </div>
      <Progress value={pct} className="h-2 bg-surface-2" />
    </div>
  );
}
