import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GOAL_PRIORITY_LABELS, GOAL_TYPE_LABELS } from '@/lib/goals/constants';
import type { Goal, GoalMomentumIndicator } from '@/lib/goals/types';
import GoalProgress from './GoalProgress';
import GoalStatusBadge from './GoalStatusBadge';
import GoalMilestonesList from './GoalMilestonesList';

interface GoalCardProps {
  goal: Goal;
  index: number;
  momentum: GoalMomentumIndicator;
  nextStepLabel?: string | null;
  onOpenDetail: () => void;
  onToggleMilestone: (milestoneId: string) => void;
}

export default function GoalCard({
  goal,
  index,
  momentum,
  nextStepLabel,
  onOpenDetail,
  onToggleMilestone,
}: GoalCardProps) {
  const needsAttention = momentum.kind === 'stuck';

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
      <Card className="glass p-5 border-white/5 h-full flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <button type="button" onClick={onOpenDetail} className="text-left group">
              <h3 className="font-heading font-semibold text-text-primary truncate group-hover:text-primary transition-colors">
                {goal.title}
              </h3>
            </button>
            {goal.description && (
              <p className="text-sm text-text-secondary mt-1 line-clamp-2">{goal.description}</p>
            )}
          </div>
          <GoalStatusBadge status={goal.status} />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="border-white/15 text-xs">
            {GOAL_TYPE_LABELS[goal.type]}
          </Badge>
          <Badge className="bg-primary/15 text-primary border-primary/25 text-xs">{GOAL_PRIORITY_LABELS[goal.priority]}</Badge>
          {goal.category && (
            <Badge variant="outline" className="border-white/10 text-text-muted text-xs">
              {goal.category}
            </Badge>
          )}
          {goal.targetDate && (
            <Badge variant="outline" className="border-white/10 text-text-muted text-xs">
              Cél: {goal.targetDate}
            </Badge>
          )}
        </div>

        {needsAttention && (
          <div className="rounded-md border border-warning/25 bg-warning/10 px-3 py-2 text-xs text-warning">
            Figyelmet kér: {momentum.reason}
          </div>
        )}

        {nextStepLabel && goal.status === 'active' && !goal.archived && (
          <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-text-secondary flex gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <span>
              <span className="text-text-primary font-medium">Következő lépés: </span>
              {nextStepLabel}
            </span>
          </div>
        )}

        <GoalProgress goal={goal} />

        <GoalMilestonesList milestones={goal.milestones} onToggle={onToggleMilestone} />

        <div className="flex justify-end pt-1 mt-auto">
          <Button size="sm" variant="outline" className="border-white/15 gap-1" onClick={onOpenDetail}>
            Részletek
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
