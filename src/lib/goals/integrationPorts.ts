import type { Goal, Milestone } from './types';

/** Shape other modules can consume later without importing full Goal. */
export interface GoalGuidanceSignal {
  goalId: string;
  title: string;
  status: Goal['status'];
  type: Goal['type'];
  priority: Goal['priority'];
  progress: number;
  needsAttention: boolean;
  momentum: 'advancing' | 'stuck' | 'paused' | 'closed' | 'idle';
}

export interface MilestoneListItemBridgeCandidate {
  milestoneId: string;
  goalId: string;
  title: string;
  dueDate?: string;
  priority: Milestone['priority'];
}

export interface MilestoneCalendarBridgeCandidate {
  milestoneId: string;
  goalId: string;
  title: string;
  dueDate?: string;
}

/** When `futureLinkTargets` marks a goal for dashboard focus (not active yet). */
export function toDashboardFocusStub(goal: Goal): GoalGuidanceSignal | null {
  if (!goal.futureLinkTargets?.dashboardFocusCandidate) return null;
  return {
    goalId: goal.id,
    title: goal.title,
    status: goal.status,
    type: goal.type,
    priority: goal.priority,
    progress: goal.progress,
    needsAttention: false,
    momentum: 'idle',
  };
}

/** Milestone flagged as future list row (integration hook). */
export function toListItemBridgeCandidate(goal: Goal, milestone: Milestone): MilestoneListItemBridgeCandidate | null {
  if (!milestone.futureLinkTargets?.listItemCandidate) return null;
  return {
    milestoneId: milestone.id,
    goalId: goal.id,
    title: milestone.title,
    dueDate: milestone.dueDate,
    priority: milestone.priority,
  };
}

export function toCalendarBridgeCandidate(goal: Goal, milestone: Milestone): MilestoneCalendarBridgeCandidate | null {
  if (!milestone.futureLinkTargets?.calendarEventCandidate) return null;
  return {
    milestoneId: milestone.id,
    goalId: goal.id,
    title: milestone.title,
    dueDate: milestone.dueDate,
  };
}
