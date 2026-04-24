import { ArrowLeft, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  GOAL_TYPE_HINTS,
  GOAL_TYPE_LABELS,
  GOAL_PRIORITY_LABELS,
  GOAL_STATUS_LABELS,
  GOAL_STATUSES,
} from '@/lib/goals/constants';
import type { Goal } from '@/lib/goals/types';
import type { GoalMomentumIndicator } from '@/lib/goals/types';
import GoalProgress from './GoalProgress';
import GoalStatusBadge from './GoalStatusBadge';
import MilestoneRow from './MilestoneRow';

interface GoalDetailPanelProps {
  goal: Goal;
  momentum: GoalMomentumIndicator;
  nextStep: string | null;
  onBack: () => void;
  onToggleMilestone: (milestoneId: string) => void;
  onMoveMilestone: (milestoneId: string, dir: -1 | 1) => void;
  onSetStatus: (status: Goal['status']) => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export default function GoalDetailPanel({
  goal,
  momentum,
  nextStep,
  onBack,
  onToggleMilestone,
  onMoveMilestone,
  onSetStatus,
  onArchive,
  onUnarchive,
  onDelete,
  onEdit,
}: GoalDetailPanelProps) {
  const sorted = [...goal.milestones].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));

  return (
    <div className="space-y-6 pb-10">
      <Button variant="ghost" className="gap-2 -ml-2" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Vissza a célokhoz
      </Button>

      <Card className="glass p-6 border-white/5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-heading font-bold text-text-primary">{goal.title}</h1>
            {goal.description && <p className="text-text-secondary mt-2 max-w-2xl">{goal.description}</p>}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <GoalStatusBadge status={goal.status} />
            <Badge variant="outline" className="border-white/15">
              {GOAL_TYPE_LABELS[goal.type]}
            </Badge>
            <Badge className="bg-primary/15 text-primary border-primary/25">{GOAL_PRIORITY_LABELS[goal.priority]}</Badge>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-surface-0/30 p-4 text-sm text-text-secondary">
          <p className="text-xs uppercase tracking-wide text-text-muted mb-1">Típus szerinti fókusz</p>
          <p>{GOAL_TYPE_HINTS[goal.type]}</p>
        </div>

        {goal.reasonWhy && (
          <div>
            <p className="text-xs text-text-muted mb-1">Miért fontos</p>
            <p className="text-text-primary">{goal.reasonWhy}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 text-sm text-text-muted">
          {goal.category && <span>Kategória: {goal.category}</span>}
          {goal.tags?.length > 0 && <span>Címkék: {goal.tags.join(', ')}</span>}
          {goal.startDate && <span>Kezdés: {goal.startDate}</span>}
          {goal.targetDate && <span>Céldátum: {goal.targetDate}</span>}
        </div>

        {momentum.kind === 'stuck' && (
          <div className="rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">{momentum.reason}</div>
        )}

        {nextStep && goal.status === 'active' && !goal.archived && (
          <div className="rounded-md border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-text-primary">
            <span className="font-medium text-primary">Következő legjobb lépés: </span>
            {nextStep}
          </div>
        )}

        <GoalProgress goal={goal} />

        <div className="flex flex-wrap gap-2">
          <Select value={goal.status} onValueChange={(v) => onSetStatus(v as Goal['status'])}>
            <SelectTrigger className="w-[200px] bg-surface-0/50 border-white/10">
              <SelectValue placeholder="Státusz" />
            </SelectTrigger>
            <SelectContent className="bg-surface-1 border-white/10">
              {GOAL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {GOAL_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-white/15" onClick={onEdit}>
            Szerkesztés (részletes űrlap)
          </Button>
          {!goal.archived ? (
            <Button variant="outline" className="border-white/15" onClick={onArchive}>
              Archiválás
            </Button>
          ) : (
            <Button variant="outline" className="border-white/15" onClick={onUnarchive}>
              Visszaállítás az archívumból
            </Button>
          )}
          <Button variant="outline" className="border-danger/30 text-danger hover:bg-danger/10" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-1" />
            Törlés
          </Button>
        </div>
      </Card>

      <Card className="glass p-6 border-white/5">
        <h2 className="font-heading font-semibold text-text-primary mb-4">Mérföldkövek</h2>
        {sorted.length === 0 ? (
          <p className="text-sm text-text-muted">Még nincs mérföldkő — a szerkesztőben adhatsz hozzá lépéseket.</p>
        ) : (
          <div className="space-y-2">
            {sorted.map((milestone, index) => (
              <div key={milestone.id} className="flex items-stretch gap-2">
                <div className="flex flex-col gap-0.5 shrink-0">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    disabled={index === 0}
                    onClick={() => onMoveMilestone(milestone.id, -1)}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    disabled={index === sorted.length - 1}
                    onClick={() => onMoveMilestone(milestone.id, 1)}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 min-w-0">
                  <MilestoneRow milestone={milestone} onToggle={() => onToggleMilestone(milestone.id)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
