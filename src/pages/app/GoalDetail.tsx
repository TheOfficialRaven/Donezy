import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import GoalDetailPanel from '@/components/goals/GoalDetailPanel';
import GoalDialog from '@/components/goals/GoalDialog';
import type { GoalDialogSavePayload } from '@/components/goals/GoalDialog';
import { useAppStore } from '@/stores/useAppStore';
import { getGoalMomentumIndicator, getGoalNextMilestone, getGoalProgressPercent } from '@/lib/goals/selectors';
import type { Goal, Milestone } from '@/lib/goals/types';

export default function GoalDetail() {
  const navigate = useNavigate();
  const { goalId } = useParams();
  const {
    growthGoals,
    toggleGrowthMilestone,
    reorderMilestones,
    setGoalStatus,
    archiveGoal,
    updateGoal,
    deleteGoal,
  } = useAppStore();
  const [dialogOpen, setDialogOpen] = useState(false);

  const goal = useMemo(() => growthGoals.find((g) => g.id === goalId), [growthGoals, goalId]);
  const momentum = useMemo(() => (goal ? getGoalMomentumIndicator(goal) : null), [goal]);
  const nextMs = goal ? getGoalNextMilestone(goal) : null;
  const nextStep = nextMs ? nextMs.title : goal && getGoalProgressPercent(goal) === 0 ? 'Adj hozzá egy első mérföldkövet vagy írj le egy mini lépést a leírásba.' : null;

  const handleMoveMilestone = useCallback(
    async (milestoneId: string, dir: -1 | 1) => {
      if (!goal) return;
      const sorted = [...goal.milestones].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
      const idx = sorted.findIndex((m) => m.id === milestoneId);
      const ni = idx + dir;
      if (idx < 0 || ni < 0 || ni >= sorted.length) return;
      const next = [...sorted];
      const [item] = next.splice(idx, 1);
      next.splice(ni, 0, item);
      await reorderMilestones(goal.id, next.map((m) => m.id));
    },
    [goal, reorderMilestones]
  );

  const mergeMilestonesForEdit = (current: Goal, titles: string[]): Milestone[] => {
    const now = new Date().toISOString();
    const cleaned = titles.map((t) => t.trim()).filter(Boolean);
    return cleaned.map((title, index) => {
      const existing = current.milestones[index];
      if (existing) {
        return { ...existing, title, sortOrder: index, updatedAt: now };
      }
      return {
        id: `m-${now}-${index}-${Math.random().toString(36).slice(2, 7)}`,
        goalId: current.id,
        title,
        description: '',
        completed: false,
        sortOrder: index,
        createdAt: now,
        updatedAt: now,
        priority: 'medium' as const,
        notes: '',
        sourceType: 'manual' as const,
        futureLinkTargets: {},
      };
    });
  };

  const handleDialogSave = async (payload: GoalDialogSavePayload) => {
    if (!goal) return;
    const titles = (payload.milestones || []).map((m) => m.title);
    const milestones = mergeMilestonesForEdit(goal, titles);
    await updateGoal(goal.id, {
      title: payload.title,
      description: payload.description,
      reasonWhy: payload.reasonWhy,
      category: payload.category,
      tags: payload.tags,
      type: payload.type,
      priority: payload.priority,
      targetDate: payload.targetDate,
      startDate: payload.startDate,
      milestones,
      status: payload.status ?? goal.status,
    });
    toast.success('Cél frissítve.');
  };

  if (!goal || !momentum) {
    return (
      <Card className="glass p-8 text-center">
        <p className="text-text-muted mb-4">A cél nem található.</p>
        <Button variant="outline" onClick={() => navigate('/app/growth')}>
          Vissza a célokhoz
        </Button>
      </Card>
    );
  }

  return (
    <>
      <GoalDetailPanel
        goal={goal}
        momentum={momentum}
        nextStep={nextStep}
        onBack={() => navigate('/app/growth')}
        onToggleMilestone={(id) => toggleGrowthMilestone(goal.id, id)}
        onMoveMilestone={handleMoveMilestone}
        onSetStatus={(status) => setGoalStatus(goal.id, status)}
        onArchive={() => archiveGoal(goal.id, true)}
        onUnarchive={() => archiveGoal(goal.id, false)}
        onDelete={async () => {
          await deleteGoal(goal.id);
          toast.success('Cél törölve.');
          navigate('/app/growth');
        }}
        onEdit={() => setDialogOpen(true)}
      />
      <GoalDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={goal} onSave={handleDialogSave} />
    </>
  );
}
