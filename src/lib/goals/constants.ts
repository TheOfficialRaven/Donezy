import type { GoalPriority, GoalStatus, GoalType, GoalsViewFilter, LegacyGoalArea } from './types';

/** Current persisted schema for growth goals (additive migrations bump this). */
export const GOALS_SCHEMA_VERSION = 2 as const;

export type GoalsSchemaVersion = typeof GOALS_SCHEMA_VERSION;

/** Goal nature: what kind of growth this represents (UX + future guidance differ). */
export const GOAL_TYPES: GoalType[] = ['outcome', 'process', 'identity', 'project'];

/** Lifecycle — separate from `archived` flag (see types JSDoc). */
export const GOAL_STATUSES: GoalStatus[] = ['active', 'paused', 'completed', 'archived', 'abandoned'];

export const GOAL_PRIORITIES: GoalPriority[] = ['low', 'medium', 'high'];

/** Where the entity was created; integration layer may set this later. */
export const GOAL_SOURCE_TYPES = ['manual', 'import', 'suggestion', 'system', 'integration'] as const;

export const MILESTONE_SOURCE_TYPES = ['manual', 'import', 'suggestion', 'system', 'integration'] as const;

/** Legacy `area` from v1 goals → maps to `type` + default `category` label. */
export const LEGACY_AREA_TO_TYPE: Record<LegacyGoalArea, GoalType> = {
  mindset: 'identity',
  habit: 'process',
  skill: 'outcome',
  wellbeing: 'outcome',
};

export const LEGACY_AREA_TO_CATEGORY_LABEL: Record<LegacyGoalArea, string> = {
  mindset: 'Szemlélet',
  habit: 'Szokás',
  skill: 'Készség',
  wellbeing: 'Jóllét',
};

/** Days without milestone movement before we surface “stuck” (heuristic). */
export const GOAL_STUCK_IDLE_DAYS = 14;

/** “Too many active goals” soft warning threshold. */
export const GOAL_ACTIVE_FOCUS_WARNING_THRESHOLD = 6;

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  outcome: 'Eredmény',
  process: 'Folyamat / rendszer',
  identity: 'Azonosság / szemlélet',
  project: 'Projekt / lebontás',
};

export const GOAL_TYPE_HINTS: Record<GoalType, string> = {
  outcome: 'Konkrét eredményre fókusz — mit szeretnél elérni?',
  process: 'Rendszerességre fókusz — mit csinálsz rendszeresen?',
  identity: 'Ki szeretnél lenni — milyen értékek mentén fejlődsz?',
  project: 'Lépésekre bontott haladás — mérföldkövek és ütem.',
};

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  active: 'Aktív',
  paused: 'Szünetel',
  completed: 'Befejezve',
  archived: 'Archiválva',
  abandoned: 'Elengedve',
};

export const GOAL_PRIORITY_LABELS: Record<GoalPriority, string> = {
  low: 'Alacsony',
  medium: 'Közepes',
  high: 'Magas',
};

export const GOALS_VIEW_FILTER_LABELS: Record<GoalsViewFilter, string> = {
  all: 'Összes',
  active: 'Aktív',
  completed: 'Befejezett',
  archived: 'Archivált',
};
