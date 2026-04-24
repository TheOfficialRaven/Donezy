import { CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Milestone } from '@/lib/goals/types';
import { cn } from '@/lib/utils';

interface MilestoneRowProps {
  milestone: Milestone;
  onToggle?: () => void;
  dense?: boolean;
}

export default function MilestoneRow({ milestone, onToggle, dense }: MilestoneRowProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg border border-white/5 bg-surface-0/30 px-2 py-2',
        dense && 'py-1.5'
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-auto p-0 shrink-0 hover:bg-transparent"
        onClick={onToggle}
        aria-pressed={milestone.completed}
        aria-label={milestone.completed ? 'Mérföldkő visszanyitása' : 'Mérföldkő kész'}
      >
        {milestone.completed ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        ) : (
          <Circle className="h-4 w-4 text-text-muted" />
        )}
      </Button>
      <div className="min-w-0 flex-1 text-left">
        <p
          className={cn(
            'text-sm text-text-primary',
            milestone.completed && 'text-text-muted line-through'
          )}
        >
          {milestone.title}
        </p>
        {milestone.dueDate && (
          <p className="text-[11px] text-text-muted mt-0.5">Határidő: {milestone.dueDate}</p>
        )}
      </div>
    </div>
  );
}
