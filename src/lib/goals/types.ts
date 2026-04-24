export type GoalType = 'outcome' | 'process' | 'identity' | 'project';
export type GoalStatus = 'active' | 'paused' | 'completed' | 'archived' | 'abandoned';
export type GoalPriority = 'low' | 'medium' | 'high';
export type GoalSourceType = 'manual' | 'import' | 'suggestion' | 'system' | 'integration';
export type MilestoneSourceType = 'manual' | 'import' | 'suggestion' | 'system' | 'integration';

export type LegacyGoalArea = 'mindset' | 'habit' | 'skill' | 'wellbeing';

/**
 * Optional cross-module link hints (not wired yet). Consumers check flags before acting.
 */
export type GoalFutureLinkTargets = {
  listItemCandidate?: boolean;
  calendarEventCandidate?: boolean;
  questCandidate?: boolean;
  dashboardFocusCandidate?: boolean;
  habitAnchorCandidate?: boolean;
  guidanceSignal?: boolean;
};

export type MilestoneFutureLinkTargets = {
  listItemCandidate?: boolean;
  calendarEventCandidate?: boolean;
  questCandidate?: boolean;
};

/**
 * Integration provenance: where this row came from. Does not drive lifecycle.
 */
export type FutureOriginReference = {
  module?: string;
  entityId?: string;
  note?: string;
};

/**
 * GOAL SEMANTICS
 * --------------
 * `type` — nature of the goal (outcome vs process vs identity vs project). Drives UX emphasis.
 * `status` — lifecycle: active work, paused, completed success, shelved archived, abandoned intent.
 * `progress` — persisted 0–100 snapshot. When milestones exist, selectors prefer milestone-derived %;
 *   store actions sync `progress` after milestone changes.
 * `archived` — shelf flag: hidden from default “active” lists but NOT the same as “completed”.
 *   A completed goal may stay unarchived (visible in Completed view). Archiving tidies history.
 *   When `status === 'archived'`, normalize sets `archived: true` for consistency.
 * `sourceType` / `futureOriginReference` / `futureLinkTargets` — integration metadata; no deep links yet.
 */
export interface Goal {
  id: string;
  userId?: string;
  title: string;
  description: string;
  type: GoalType;
  priority: GoalPriority;
  status: GoalStatus;
  /** 0–100 persisted progress; mirrors milestone-derived value when applicable. */
  progress: number;
  targetDate?: string;
  startDate?: string;
  reasonWhy: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  archived: boolean;
  milestones: Milestone[];
  sourceType: GoalSourceType;
  futureOriginReference?: FutureOriginReference;
  futureLinkTargets: GoalFutureLinkTargets;
  schemaVersion: number;
}

/**
 * MILESTONE SEMANTICS
 * -------------------
 * Stepping stone inside a goal. `completed` + `completionDate` capture closure.
 * `sortOrder` defines display / “next step” ordering within the goal.
 */
export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  description: string;
  completed: boolean;
  dueDate?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  completionDate?: string;
  effortEstimate?: string;
  priority: GoalPriority;
  notes: string;
  sourceType: MilestoneSourceType;
  futureOriginReference?: FutureOriginReference;
  futureLinkTargets: MilestoneFutureLinkTargets;
}

/** Raw Firebase / API shape before normalize (permissive). */
export type GoalRaw = Partial<Goal> & {
  id: string;
  /** v1 field */
  area?: LegacyGoalArea;
  /** v1 completion flag */
  completed?: boolean;
  milestones?: Partial<Milestone>[];
};

export type GoalMomentumKind = 'advancing' | 'stuck' | 'paused' | 'closed' | 'idle';

export interface GoalMomentumIndicator {
  kind: GoalMomentumKind;
  reason: string;
}

export interface GoalProductivityMetrics {
  activeCount: number;
  completedCount: number;
  archivedCount: number;
  pausedCount: number;
  openMilestoneCount: number;
  overdueMilestoneCount: number;
  goalsNeedingAttentionCount: number;
  activeFocusOverload: boolean;
}

export type SelectedGoalView = 'list' | 'detail';

export type GoalsViewFilter = 'all' | 'active' | 'completed' | 'archived';
