export type HabitTrackingMode = 'auto' | 'manual' | 'hybrid';
export type HabitDetectionMode = 'system-detected' | 'user-created' | 'promoted-from-pattern';
export type HabitFrequencyType = 'daily' | 'weekly' | 'custom';
export type HabitSourceType = 'manual' | 'import' | 'suggestion' | 'system' | 'integration';
export type HabitCompletionSource = 'manual' | 'auto' | 'hybrid';
export type HabitSignalEventType =
  | 'reflection_completed'
  | 'reading_log_added'
  | 'goal_milestone_completed'
  | 'list_item_completed'
  | 'calendar_event_completed'
  | 'note_added'
  | 'planning_activity'
  | 'other';

export type HabitTimeRangeFilter = '7d' | '14d' | '30d' | '90d';
export type HabitsViewFilter = 'all' | 'active' | 'archived' | 'today' | 'auto' | 'manual' | 'hybrid' | 'trends';
export type HabitsStatusFilter = 'all' | 'active' | 'paused' | 'inactive' | 'archived';
export type HabitTrackingModeFilter = 'all' | HabitTrackingMode;
export type HabitSelectedView = 'list' | 'detail' | 'trends';

export type HabitFutureLinkTargets = {
  dashboardTodayCandidate?: boolean;
  goalProcessLinkCandidate?: boolean;
  questMaintenanceCandidate?: boolean;
  guidanceSignal?: boolean;
};

export type HabitFutureOriginReference = {
  module?: string;
  entityId?: string;
  note?: string;
};

/**
 * DOMAIN SEMANTICS
 * ----------------
 * - HabitActivitySignal: raw app activity (events), no assumption yet that it's a routine.
 * - HabitCandidate: repeated pattern cluster derived from signals.
 * - Habit (promoted): explicitly tracked routine entity (manual or auto/hybrid).
 * - trackingMode: how completions are expected (auto/manual/hybrid).
 * - detectionMode: origin of habit creation (system, user, candidate promotion).
 * - active + archived: active controls tracking; archived is shelf flag for list hygiene.
 * - completionDateKey: local YYYY-MM-DD for streak/stat/chart aggregates.
 * - source/sourceEventType/sourceReferenceId: traceability for auto completions/signals.
 */
export interface Habit {
  id: string;
  userId?: string;
  title: string;
  description: string;
  category: string;
  trackingMode: HabitTrackingMode;
  detectionMode?: HabitDetectionMode;
  sourceModule?: string;
  sourceEventTypes?: HabitSignalEventType[];
  frequencyType: HabitFrequencyType;
  frequencyTarget: number;
  preferredDays: number[];
  preferredTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'any';
  color: string;
  icon: string;
  active: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  endDate?: string;
  targetGroupVisibility?: string[];
  tags: string[];
  sourceType: HabitSourceType;
  futureOriginReference?: HabitFutureOriginReference;
  futureLinkTargets: HabitFutureLinkTargets;
  schemaVersion: number;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  completedAt: string;
  completionDateKey: string;
  value?: number;
  note: string;
  source: HabitCompletionSource;
  sourceEventType?: HabitSignalEventType;
  sourceReferenceId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface HabitActivitySignal {
  id: string;
  userId?: string;
  eventType: HabitSignalEventType;
  sourceModule: string;
  referenceId?: string;
  occurredAt: string;
  dateKey: string;
  metadata?: Record<string, unknown>;
}

export interface HabitCandidate {
  id: string;
  userId?: string;
  eventType: HabitSignalEventType;
  sourceModule: string;
  firstSeenAt: string;
  lastSeenAt: string;
  occurrencesCount: number;
  activeDaysCount: number;
  repeatScore: number;
  promotedToHabit: boolean;
  promotedHabitId?: string;
  titleHint?: string;
  linkedHabitId?: string;
}

export interface HabitConsistencyIndicator {
  state: 'on-track' | 'wobbling' | 'neglected' | 'paused';
  reason: string;
}

export interface HabitProductivityMetrics {
  totalHabits: number;
  activeHabits: number;
  archivedHabits: number;
  autoTrackedHabits: number;
  manualHabits: number;
  hybridHabits: number;
  todayCompletions: number;
  weeklyCompletionRate: number;
  habitsNeedingAttention: number;
  candidateCount: number;
  promotableCandidateCount: number;
  overloadedActiveHabits: boolean;
}

export interface UserFacingHabit {
  groupKey: string;
  title: string;
  description: string;
  trendLabel: string;
  insight: string;
  streak: number;
  weeklyRate: number;
  lastActivityDateKey?: string;
  state: HabitConsistencyIndicator['state'];
  insightStatus: 'stable' | 'strengthening' | 'needs-attention' | 'emerging';
  signalStrength: number;
  sourceHabitIds: string[];
}

export interface UserFacingHabitMetrics {
  groupedCount: number;
  stableCount: number;
  strengtheningCount: number;
  needsAttentionCount: number;
  emergingCount: number;
}

export type HabitRaw = Partial<Habit> & {
  id: string;
};

export type HabitCompletionRaw = Partial<HabitCompletion> & { id: string };
export type HabitActivitySignalRaw = Partial<HabitActivitySignal> & { id: string };
export type HabitCandidateRaw = Partial<HabitCandidate> & { id: string };
