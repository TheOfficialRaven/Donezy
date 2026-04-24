import {
  DEFAULT_HABIT_COLOR,
  DEFAULT_HABIT_ICON,
  HABITS_SCHEMA_VERSION,
} from './constants';
import type {
  Habit,
  HabitActivitySignal,
  HabitActivitySignalRaw,
  HabitCandidate,
  HabitCandidateRaw,
  HabitCompletion,
  HabitCompletionRaw,
  HabitRaw,
} from './types';
import { getLocalDateString } from '@/lib/dateUtils';

function clampTarget(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(31, Math.round(n)));
}

function normalizeDateKey(input?: string): string {
  if (input && /^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  return getLocalDateString();
}

export function normalizeHabit(raw: HabitRaw, userId?: string): Habit {
  const now = new Date().toISOString();
  const frequencyType = raw.frequencyType === 'weekly' || raw.frequencyType === 'custom' ? raw.frequencyType : 'daily';
  return {
    id: raw.id,
    userId: raw.userId || userId,
    title: (raw.title || '').trim() || 'Nevtelen szokas',
    description: typeof raw.description === 'string' ? raw.description : '',
    category: typeof raw.category === 'string' ? raw.category : '',
    trackingMode: raw.trackingMode === 'manual' || raw.trackingMode === 'hybrid' ? raw.trackingMode : 'auto',
    detectionMode: raw.detectionMode || 'system-detected',
    sourceModule: raw.sourceModule,
    sourceEventTypes: Array.isArray(raw.sourceEventTypes) ? raw.sourceEventTypes : [],
    frequencyType,
    frequencyTarget: clampTarget(Number(raw.frequencyTarget) || (frequencyType === 'weekly' ? 3 : 1)),
    preferredDays: Array.isArray(raw.preferredDays)
      ? raw.preferredDays.filter((d): d is number => Number.isInteger(d) && d >= 1 && d <= 7)
      : [],
    preferredTimeOfDay: raw.preferredTimeOfDay || 'any',
    color: raw.color || DEFAULT_HABIT_COLOR,
    icon: raw.icon || DEFAULT_HABIT_ICON,
    active: raw.active !== false,
    archived: Boolean(raw.archived),
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
    startDate: raw.startDate,
    endDate: raw.endDate,
    targetGroupVisibility: Array.isArray(raw.targetGroupVisibility) ? raw.targetGroupVisibility : ['all'],
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === 'string') : [],
    sourceType:
      raw.sourceType === 'manual' ||
      raw.sourceType === 'import' ||
      raw.sourceType === 'suggestion' ||
      raw.sourceType === 'integration'
        ? raw.sourceType
        : 'system',
    futureOriginReference: raw.futureOriginReference,
    futureLinkTargets: raw.futureLinkTargets && typeof raw.futureLinkTargets === 'object' ? raw.futureLinkTargets : {},
    schemaVersion: HABITS_SCHEMA_VERSION,
  };
}

export function normalizeHabitCompletion(raw: HabitCompletionRaw, habitId?: string): HabitCompletion {
  const now = new Date().toISOString();
  const completedAt = raw.completedAt || now;
  return {
    id: raw.id,
    habitId: raw.habitId || habitId || '',
    completedAt,
    completionDateKey: normalizeDateKey(raw.completionDateKey || completedAt.slice(0, 10)),
    value: Number.isFinite(raw.value) ? Number(raw.value) : undefined,
    note: typeof raw.note === 'string' ? raw.note : '',
    source: raw.source === 'manual' || raw.source === 'hybrid' ? raw.source : 'auto',
    sourceEventType: raw.sourceEventType,
    sourceReferenceId: raw.sourceReferenceId,
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt,
  };
}

export function normalizeHabitActivitySignal(raw: HabitActivitySignalRaw, userId?: string): HabitActivitySignal {
  const now = new Date().toISOString();
  const occurredAt = raw.occurredAt || now;
  return {
    id: raw.id,
    userId: raw.userId || userId,
    eventType: raw.eventType || 'other',
    sourceModule: raw.sourceModule || 'unknown',
    referenceId: raw.referenceId,
    occurredAt,
    dateKey: normalizeDateKey(raw.dateKey || occurredAt.slice(0, 10)),
    metadata: raw.metadata && typeof raw.metadata === 'object' ? raw.metadata : undefined,
  };
}

export function normalizeHabitCandidate(raw: HabitCandidateRaw, userId?: string): HabitCandidate {
  const now = new Date().toISOString();
  return {
    id: raw.id,
    userId: raw.userId || userId,
    eventType: raw.eventType || 'other',
    sourceModule: raw.sourceModule || 'unknown',
    firstSeenAt: raw.firstSeenAt || now,
    lastSeenAt: raw.lastSeenAt || now,
    occurrencesCount: Math.max(0, Number(raw.occurrencesCount) || 0),
    activeDaysCount: Math.max(0, Number(raw.activeDaysCount) || 0),
    repeatScore: Math.max(0, Math.min(1, Number(raw.repeatScore) || 0)),
    promotedToHabit: Boolean(raw.promotedToHabit),
    promotedHabitId: raw.promotedHabitId,
    titleHint: raw.titleHint,
    linkedHabitId: raw.linkedHabitId,
  };
}
