import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { TrendingUp, Sparkles } from 'lucide-react';
import GoalsToolbar from '@/components/goals/GoalsToolbar';
import GoalSummaryPanel from '@/components/goals/GoalSummaryPanel';
import GoalCard from '@/components/goals/GoalCard';
import GoalsEmptyState from '@/components/goals/GoalsEmptyState';
import GoalDialog, { type GoalDialogSavePayload } from '@/components/goals/GoalDialog';
import { useAppStore, type GoalCreatePayload } from '@/stores/useAppStore';
import {
  filterGoalsForView,
  getFocusGoalCandidates,
  getGoalMomentumIndicators,
  getGoalNextMilestone,
  getGoalProductivityMetrics,
  getGoalsNeedingAttention,
} from '@/lib/goals/selectors';
import type { Goal, Milestone } from '@/lib/goals/types';

function mergeMilestonesFromTitles(current: Goal | null, titles: string[]): Milestone[] | undefined {
  if (!current) return undefined;
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
}

export default function GrowthGoals() {
  const navigate = useNavigate();
  const {
    growthGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    toggleGrowthMilestone,
    goalsViewFilter,
    goalsSearchQuery,
    goalsTypeFilter,
    goalsStatusFilter,
    goalsPriorityFilter,
    setGoalsViewFilter,
    setGoalsSearchQuery,
    setGoalsTypeFilter,
    setGoalsStatusFilter,
    setGoalsPriorityFilter,
  } = useAppStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const metrics = useMemo(() => getGoalProductivityMetrics(growthGoals), [growthGoals]);
  const momentumMap = useMemo(() => getGoalMomentumIndicators(growthGoals), [growthGoals]);
  const filtered = useMemo(
    () =>
      filterGoalsForView(growthGoals, goalsViewFilter, {
        typeFilter: goalsTypeFilter,
        statusFilter: goalsStatusFilter,
        priorityFilter: goalsPriorityFilter,
        search: goalsSearchQuery,
      }),
    [growthGoals, goalsViewFilter, goalsTypeFilter, goalsStatusFilter, goalsPriorityFilter, goalsSearchQuery]
  );

  const focusCandidates = useMemo(() => getFocusGoalCandidates(growthGoals, 3), [growthGoals]);
  const attention = useMemo(() => getGoalsNeedingAttention(growthGoals), [growthGoals]);

  const openCreate = () => {
    setEditingGoal(null);
    setDialogOpen(true);
  };

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setDialogOpen(true);
  };

  const handleDialogSave = async (payload: GoalDialogSavePayload) => {
    const titles = (payload.milestones || []).map((m) => m.title);
    if (editingGoal) {
      const milestones = mergeMilestonesFromTitles(editingGoal, titles);
      await updateGoal(editingGoal.id, {
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
        status: payload.status ?? editingGoal.status,
      });
      toast.success('Cél frissítve.');
    } else {
      const createPayload: GoalCreatePayload = {
        title: payload.title,
        description: payload.description,
        reasonWhy: payload.reasonWhy,
        category: payload.category,
        tags: payload.tags,
        type: payload.type,
        priority: payload.priority,
        targetDate: payload.targetDate,
        startDate: payload.startDate,
        milestones: (payload.milestones || []).map((m) => ({ title: m.title })),
      };
      await addGoal(createPayload);
      toast.success('Új cél létrehozva.');
    }
    setEditingGoal(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-text-primary flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-primary" />
          Növekedési célok
        </h1>
        <p className="text-text-secondary mt-1 max-w-2xl">
          Hosszabb távú irányok, lebontott lépések, átlátható haladás — kevesebb fejben tartandó döntés, több nyugalom.
        </p>
      </div>

      <GoalsToolbar
        view={goalsViewFilter}
        onViewChange={setGoalsViewFilter}
        search={goalsSearchQuery}
        onSearchChange={setGoalsSearchQuery}
        typeFilter={goalsTypeFilter}
        onTypeFilter={setGoalsTypeFilter}
        statusFilter={goalsStatusFilter}
        onStatusFilter={setGoalsStatusFilter}
        priorityFilter={goalsPriorityFilter}
        onPriorityFilter={setGoalsPriorityFilter}
        onCreate={openCreate}
      />

      <GoalSummaryPanel metrics={metrics} />

      {attention.length > 0 && goalsViewFilter !== 'archived' && (
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {attention.length} cél figyelmet kérhet (lejárt határidő vagy beragadt haladás). Nézd meg a kártyákon a rövid üzenetet.
        </div>
      )}

      {focusCandidates.length > 0 && goalsViewFilter === 'active' && (
        <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-text-primary">Fókusz jelöltek</p>
          </div>
          <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
            {focusCandidates.map((g) => (
              <li key={g.id}>
                <button type="button" className="text-left hover:text-primary underline-offset-2 hover:underline" onClick={() => navigate(`/app/growth/${g.id}`)}>
                  {g.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {growthGoals.length === 0 ? (
        <GoalsEmptyState variant="none" onCreate={openCreate} />
      ) : filtered.length === 0 ? (
        <GoalsEmptyState
          variant={
            goalsSearchQuery.trim() || goalsTypeFilter !== 'all' || goalsStatusFilter !== 'all' || goalsPriorityFilter !== 'all'
              ? 'no-filter'
              : goalsViewFilter === 'active'
                ? 'no-active'
                : goalsViewFilter === 'completed'
                  ? 'no-completed'
                  : goalsViewFilter === 'archived'
                    ? 'archived-empty'
                    : 'no-filter'
          }
          onCreate={openCreate}
          filterView={goalsViewFilter}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((goal, index) => {
            const next = getGoalNextMilestone(goal);
            const nextLabel = next ? next.title : null;
            return (
              <GoalCard
                key={goal.id}
                goal={goal}
                index={index}
                momentum={momentumMap[goal.id]}
                nextStepLabel={nextLabel}
                onOpenDetail={() => navigate(`/app/growth/${goal.id}`)}
                onToggleMilestone={(milestoneId) => toggleGrowthMilestone(goal.id, milestoneId)}
              />
            );
          })}
        </div>
      )}

      <GoalDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editingGoal} onSave={handleDialogSave} />
    </div>
  );
}
