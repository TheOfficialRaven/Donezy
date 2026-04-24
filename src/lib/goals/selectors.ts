import { GOAL_ACTIVE_FOCUS_WARNING_THRESHOLD, GOAL_STUCK_IDLE_DAYS } from './constants';
import { getLocalDateString } from '@/lib/dateUtils';
import type { Goal, GoalMomentumIndicator, GoalPriority, GoalProductivityMetrics, GoalStatus, GoalType, Milestone } from './types';
import {
  computeMilestoneDerivedProgress,
  getGoalProgressPercent,
  getNextOpenMilestone,
  isTerminalGoalStatus,
} from './progress';

export { computeMilestoneDerivedProgress, getGoalProgressPercent, getNextOpenMilestone } from './progress';

export type GoalsTypeFilter = 'all' | GoalType;
export type GoalsStatusFilter = 'all' | GoalStatus;
export type GoalsPriorityFilter = 'all' | GoalPriority;

function daysBetween(isoA: string, isoB: string): number {
  const a = new Date(isoA).getTime();
  const b = new Date(isoB).getTime();
  return Math.floor((b - a) / (86400 * 1000));
}

export function getActiveGoals(goals: Goal[]): Goal[] {
  return goals.filter((g) => g.status === 'active' && !g.archived);
}

export function getPausedGoals(goals: Goal[]): Goal[] {
  return goals.filter((g) => g.status === 'paused' && !g.archived);
}

export function getCompletedGoals(goals: Goal[]): Goal[] {
  return goals.filter((g) => g.status === 'completed');
}

export function getArchivedGoals(goals: Goal[]): Goal[] {
  return goals.filter((g) => g.archived || g.status === 'archived');
}

export function getGoalsByType(goals: Goal[], type: GoalType): Goal[] {
  return goals.filter((g) => g.type === type);
}

export function getGoalsByPriority(goals: Goal[], priority: GoalPriority): Goal[] {
  return goals.filter((g) => g.priority === priority);
}

export function getGoalProgress(goal: Goal): number {
  return getGoalProgressPercent(goal);
}

export function getGoalNextMilestone(goal: Goal): Milestone | null {
  return getNextOpenMilestone(goal);
}

export function getOverdueMilestones(goal: Goal, today = getLocalDateString()): Milestone[] {
  return goal.milestones.filter((m) => !m.completed && m.dueDate && m.dueDate < today);
}

export function getUpcomingMilestones(goal: Goal, today = getLocalDateString(), withinDays = 14): Milestone[] {
  const end = new Date(`${today}T12:00:00`);
  end.setDate(end.getDate() + withinDays);
  const endStr = getLocalDateString(end);
  return goal.milestones
    .filter((m) => !m.completed && m.dueDate && m.dueDate >= today && m.dueDate <= endStr)
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
}

export function getGoalMomentumIndicator(goal: Goal, today = getLocalDateString()): GoalMomentumIndicator {
  if (goal.status === 'paused') {
    return { kind: 'paused', reason: 'A cél szünetel — nem vár el azonnali lépést.' };
  }
  if (isTerminalGoalStatus(goal.status)) {
    return { kind: 'closed', reason: 'A cél le van zárva ebben az életciklusban.' };
  }

  const overdue = getOverdueMilestones(goal, today).length;
  if (overdue > 0) {
    return { kind: 'stuck', reason: 'Lejárt határidejű mérföldkő — érdemes újratervezni a következő lépést.' };
  }

  if (goal.targetDate && goal.targetDate < today && goal.status === 'active') {
    return { kind: 'stuck', reason: 'A céldátum elmúlt — állítsd át a dátumot vagy a tartalmat.' };
  }

  const idleDays = daysBetween(goal.updatedAt.slice(0, 10), today);
  const hasOpenMilestone = goal.milestones.some((m) => !m.completed);
  if (goal.status === 'active' && hasOpenMilestone && idleDays >= GOAL_STUCK_IDLE_DAYS) {
    return { kind: 'stuck', reason: 'Régen frissült — kicsi lépés is újra mozdítja.' };
  }

  const progress = getGoalProgressPercent(goal);
  if (goal.status === 'active' && progress > 0 && progress < 100) {
    return { kind: 'advancing', reason: 'Van haladás — következő lépés a soron következő mérföldkő.' };
  }

  if (goal.status === 'active' && progress === 0 && goal.milestones.length === 0) {
    return { kind: 'idle', reason: 'Még nincs mérföldkő — egy apró első lépés sokat segít.' };
  }

  return { kind: 'advancing', reason: 'Következő lépés: mérföldkő vagy finomhangolás.' };
}

export function getGoalsNeedingAttention(goals: Goal[], today = getLocalDateString()): Goal[] {
  return goals.filter((g) => {
    if (g.archived || isTerminalGoalStatus(g.status)) return false;
    const m = getGoalMomentumIndicator(g, today);
    return m.kind === 'stuck' || getOverdueMilestones(g, today).length > 0;
  });
}

const priorityRank: Record<GoalPriority, number> = { high: 3, medium: 2, low: 1 };

export function getFocusGoalCandidates(goals: Goal[], limit = 5): Goal[] {
  const pool = goals.filter((g) => g.status === 'active' && !g.archived);
  return [...pool]
    .sort((a, b) => {
      const pr = priorityRank[b.priority] - priorityRank[a.priority];
      if (pr !== 0) return pr;
      const ta = a.targetDate || '9999-12-31';
      const tb = b.targetDate || '9999-12-31';
      if (ta !== tb) return ta.localeCompare(tb);
      return getGoalProgressPercent(a) - getGoalProgressPercent(b);
    })
    .slice(0, limit);
}

export function getGoalMomentumIndicators(goals: Goal[], today = getLocalDateString()): Record<string, GoalMomentumIndicator> {
  const out: Record<string, GoalMomentumIndicator> = {};
  for (const g of goals) {
    out[g.id] = getGoalMomentumIndicator(g, today);
  }
  return out;
}

export function getGoalProductivityMetrics(goals: Goal[], today = getLocalDateString()): GoalProductivityMetrics {
  const active = getActiveGoals(goals);
  const completed = getCompletedGoals(goals);
  const archived = getArchivedGoals(goals);
  const paused = getPausedGoals(goals);
  let openMilestoneCount = 0;
  let overdueMilestoneCount = 0;
  for (const g of goals) {
    for (const m of g.milestones) {
      if (!m.completed) {
        openMilestoneCount += 1;
        if (m.dueDate && m.dueDate < today) overdueMilestoneCount += 1;
      }
    }
  }
  const goalsNeedingAttentionCount = getGoalsNeedingAttention(goals, today).length;
  return {
    activeCount: active.length,
    completedCount: completed.length,
    archivedCount: archived.length,
    pausedCount: paused.length,
    openMilestoneCount,
    overdueMilestoneCount,
    goalsNeedingAttentionCount,
    activeFocusOverload: active.length >= GOAL_ACTIVE_FOCUS_WARNING_THRESHOLD,
  };
}

export function filterGoalsBySearch(goals: Goal[], query: string): Goal[] {
  const q = query.trim().toLowerCase();
  if (!q) return goals;
  return goals.filter(
    (g) =>
      g.title.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q) ||
      g.reasonWhy.toLowerCase().includes(q) ||
      g.category.toLowerCase().includes(q) ||
      g.tags.some((t) => t.toLowerCase().includes(q))
  );
}

export function filterGoalsForView(
  goals: Goal[],
  view: 'all' | 'active' | 'completed' | 'archived',
  options?: {
    typeFilter?: GoalsTypeFilter;
    statusFilter?: GoalsStatusFilter;
    priorityFilter?: GoalsPriorityFilter;
    search?: string;
  }
): Goal[] {
  let list = [...goals];
  if (view === 'active') {
    list = list.filter((g) => (g.status === 'active' || g.status === 'paused') && !g.archived);
  } else if (view === 'completed') {
    list = list.filter((g) => g.status === 'completed');
  } else if (view === 'archived') {
    list = list.filter((g) => g.archived || g.status === 'archived');
  }

  const { typeFilter, statusFilter, priorityFilter, search } = options || {};
  if (typeFilter && typeFilter !== 'all') {
    list = list.filter((g) => g.type === typeFilter);
  }
  if (statusFilter && statusFilter !== 'all') {
    list = list.filter((g) => g.status === statusFilter);
  }
  if (priorityFilter && priorityFilter !== 'all') {
    list = list.filter((g) => g.priority === priorityFilter);
  }
  if (search) {
    list = filterGoalsBySearch(list, search);
  }
  return list;
}
