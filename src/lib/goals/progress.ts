import type { Goal, GoalStatus, Milestone } from './types';

export function clampGoalProgress(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Progress from milestone completion ratio only (0 if no milestones). */
export function computeMilestoneDerivedProgress(milestones: Milestone[]): number {
  if (!milestones.length) return 0;
  const done = milestones.filter((m) => m.completed).length;
  return clampGoalProgress((done / milestones.length) * 100);
}

/**
 * Effective progress for UI: milestones drive % when present; else stored `goal.progress`;
 * terminal statuses clamp to sensible values.
 */
export function getGoalProgressPercent(goal: Goal): number {
  if (goal.status === 'completed') return 100;
  if (goal.status === 'abandoned' || goal.status === 'archived') {
    return clampGoalProgress(goal.progress);
  }
  if (goal.milestones.length > 0) return computeMilestoneDerivedProgress(goal.milestones);
  return clampGoalProgress(goal.progress);
}

/** Next “best step”: first incomplete milestone by sortOrder, else null. */
export function getNextOpenMilestone(goal: Goal): Milestone | null {
  const open = goal.milestones
    .filter((m) => !m.completed)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
  return open[0] || null;
}

export function isTerminalGoalStatus(status: GoalStatus): boolean {
  return status === 'completed' || status === 'abandoned' || status === 'archived';
}
