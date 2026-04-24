import { GOALS_SCHEMA_VERSION, LEGACY_AREA_TO_CATEGORY_LABEL, LEGACY_AREA_TO_TYPE } from './constants';
import { clampGoalProgress, computeMilestoneDerivedProgress } from './progress';
import type { Goal, GoalRaw, GoalStatus, GoalType, Milestone } from './types';

function isGoalType(value: unknown): value is GoalType {
  return value === 'outcome' || value === 'process' || value === 'identity' || value === 'project';
}

function isGoalStatus(value: unknown): value is GoalStatus {
  return (
    value === 'active' ||
    value === 'paused' ||
    value === 'completed' ||
    value === 'archived' ||
    value === 'abandoned'
  );
}

function inferStatusFromLegacy(raw: GoalRaw): GoalStatus {
  if (raw.status && isGoalStatus(raw.status)) return raw.status;
  /** `archived` boolean is independent — do not map shelf-only archive to lifecycle status. */
  if (raw.completed === true) {
    const ms = raw.milestones || [];
    if (ms.length === 0) return 'completed';
    const allDone = ms.every((m) => Boolean(m?.completed));
    return allDone ? 'completed' : 'active';
  }
  return 'active';
}

function inferTypeFromLegacy(raw: GoalRaw): GoalType {
  if (raw.type && isGoalType(raw.type)) return raw.type;
  if (raw.area && LEGACY_AREA_TO_TYPE[raw.area]) return LEGACY_AREA_TO_TYPE[raw.area];
  return 'project';
}

function inferCategory(raw: GoalRaw): string {
  if (typeof raw.category === 'string' && raw.category.trim()) return raw.category.trim();
  if (raw.area && LEGACY_AREA_TO_CATEGORY_LABEL[raw.area]) return LEGACY_AREA_TO_CATEGORY_LABEL[raw.area];
  return '';
}

export function normalizeMilestone(raw: Partial<Milestone> | undefined, goalId: string, index: number, now: string): Milestone {
  const id = raw?.id || `${goalId}-m-${index}`;
  const completed = Boolean(raw?.completed);
  const legacyCompletedAt = (raw as { completedAt?: string }).completedAt;
  const completionDate = raw?.completionDate || legacyCompletedAt;
  const sortOrder = Number.isFinite(raw?.sortOrder) ? (raw!.sortOrder as number) : index;
  return {
    id,
    goalId: raw?.goalId || goalId,
    title: (raw?.title || '').trim() || `Mérföldkő ${index + 1}`,
    description: typeof raw?.description === 'string' ? raw.description : '',
    completed,
    dueDate: raw?.dueDate,
    sortOrder,
    createdAt: raw?.createdAt || now,
    updatedAt: raw?.updatedAt || now,
    completionDate: completed ? completionDate || now : undefined,
    effortEstimate: raw?.effortEstimate,
    priority: raw?.priority === 'low' || raw?.priority === 'high' ? raw.priority : 'medium',
    notes: typeof raw?.notes === 'string' ? raw.notes : '',
    sourceType:
      raw?.sourceType === 'import' ||
      raw?.sourceType === 'suggestion' ||
      raw?.sourceType === 'system' ||
      raw?.sourceType === 'integration'
        ? raw.sourceType
        : 'manual',
    futureOriginReference: raw?.futureOriginReference,
    futureLinkTargets: raw?.futureLinkTargets && typeof raw.futureLinkTargets === 'object' ? raw.futureLinkTargets : {},
  };
}

/**
 * Maps Firebase / legacy payloads into the v2 Goal entity. Safe for partial / old rows.
 */
export function normalizeGoal(raw: GoalRaw, userId?: string): Goal {
  const now = new Date().toISOString();
  const id = raw.id;
  const milestonesRaw = Array.isArray(raw.milestones) ? raw.milestones : [];
  const milestones = milestonesRaw.map((m, index) => normalizeMilestone(m, id, index, raw.updatedAt || raw.createdAt || now));

  const status = inferStatusFromLegacy(raw);
  const type = inferTypeFromLegacy(raw);
  const archived = Boolean(raw.archived) || status === 'archived';

  let progress = clampGoalProgress(typeof raw.progress === 'number' ? raw.progress : Number(raw.progress) || 0);
  const derived = computeMilestoneDerivedProgress(milestones);
  if (milestones.length > 0) {
    progress = derived;
  } else if (status === 'completed') {
    progress = 100;
  }

  const completedAt =
    raw.completedAt ||
    (status === 'completed' ? raw.updatedAt || now : undefined);

  return {
    id,
    userId: raw.userId || userId,
    title: (raw.title || '').trim() || 'Névtelen cél',
    description: typeof raw.description === 'string' ? raw.description : '',
    type,
    priority: raw.priority === 'low' || raw.priority === 'high' ? raw.priority : 'medium',
    status,
    progress,
    targetDate: raw.targetDate,
    startDate: raw.startDate,
    reasonWhy: typeof raw.reasonWhy === 'string' ? raw.reasonWhy : '',
    category: inferCategory(raw),
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === 'string') : [],
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
    completedAt: status === 'completed' ? completedAt : undefined,
    archived,
    milestones,
    sourceType:
      raw.sourceType === 'import' ||
      raw.sourceType === 'suggestion' ||
      raw.sourceType === 'system' ||
      raw.sourceType === 'integration'
        ? raw.sourceType
        : 'manual',
    futureOriginReference: raw.futureOriginReference,
    futureLinkTargets: raw.futureLinkTargets && typeof raw.futureLinkTargets === 'object' ? raw.futureLinkTargets : {},
    schemaVersion: GOALS_SCHEMA_VERSION,
  };
}

/** Bump schema version on writes when persisting v2 shape. */
export function goalEntityForPersistence(goal: Goal): Goal {
  return { ...goal, schemaVersion: GOALS_SCHEMA_VERSION };
}
