import type { Habit, HabitActivitySignal, HabitCandidate, HabitCompletion } from './types';

export interface HabitDashboardCandidate {
  habitId: string;
  title: string;
  trackingMode: Habit['trackingMode'];
  consistencyState: string;
}

export interface HabitGuidanceSignal {
  habitId: string;
  title: string;
  needsAttention: boolean;
  momentum: 'on-track' | 'wobbling' | 'neglected' | 'paused';
}

export interface HabitSignalIntakePayload {
  eventType: HabitActivitySignal['eventType'];
  sourceModule: string;
  referenceId?: string;
  occurredAt?: string;
  metadata?: Record<string, unknown>;
}

export function toHabitMaintenanceQuestCandidate(habit: Habit): HabitDashboardCandidate | null {
  if (!habit.futureLinkTargets?.questMaintenanceCandidate) return null;
  return {
    habitId: habit.id,
    title: habit.title,
    trackingMode: habit.trackingMode,
    consistencyState: habit.active ? 'active' : 'paused',
  };
}

export function toDashboardTodayCandidate(habit: Habit): HabitDashboardCandidate | null {
  if (!habit.futureLinkTargets?.dashboardTodayCandidate) return null;
  return {
    habitId: habit.id,
    title: habit.title,
    trackingMode: habit.trackingMode,
    consistencyState: habit.active ? 'active' : 'inactive',
  };
}

export function toSignalDrivenCompletionStub(signal: HabitActivitySignal, habit: Habit): Partial<HabitCompletion> | null {
  if (habit.trackingMode === 'manual') return null;
  if (!habit.sourceEventTypes?.includes(signal.eventType)) return null;
  return {
    habitId: habit.id,
    completedAt: signal.occurredAt,
    completionDateKey: signal.dateKey,
    source: habit.trackingMode === 'auto' ? 'auto' : 'hybrid',
    sourceEventType: signal.eventType,
    sourceReferenceId: signal.referenceId,
    note: '',
  };
}

export function toPromotedHabitSkeleton(candidate: HabitCandidate): Pick<Habit, 'title' | 'trackingMode' | 'detectionMode' | 'sourceModule' | 'sourceEventTypes'> {
  return {
    title: candidate.titleHint || `${candidate.sourceModule} rutin`,
    trackingMode: 'auto',
    detectionMode: 'promoted-from-pattern',
    sourceModule: candidate.sourceModule,
    sourceEventTypes: [candidate.eventType],
  };
}
