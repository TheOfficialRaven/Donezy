import {
  HABIT_DETECTION_MODES,
  HABIT_FREQUENCY_TYPES,
  HABIT_PROMOTION_MIN_ACTIVE_DAYS,
  HABIT_PROMOTION_MIN_OCCURRENCES,
  HABIT_PROMOTION_MIN_REPEAT_SCORE,
  HABIT_SIGNAL_EVENT_TYPES,
  HABIT_TRACKING_MODES,
} from './constants';
import type { HabitCandidate, HabitCompletion, HabitTrackingMode } from './types';

export type HabitFieldError = { field: string; message: string };

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T12:00:00`).getTime());
}

export function validateHabitTitle(title: unknown): HabitFieldError | null {
  if (typeof title !== 'string' || !title.trim()) return { field: 'title', message: 'A szokas cime kotelezo.' };
  return null;
}

export function validateHabitTrackingMode(mode: unknown): HabitFieldError | null {
  if (!HABIT_TRACKING_MODES.includes(mode as HabitTrackingMode)) return { field: 'trackingMode', message: 'Ervenytelen tracking mod.' };
  return null;
}

export function validateHabitDetectionMode(mode: unknown): HabitFieldError | null {
  if (mode === undefined || mode === null) return null;
  if (!HABIT_DETECTION_MODES.includes(mode as any)) return { field: 'detectionMode', message: 'Ervenytelen detection mod.' };
  return null;
}

export function validateHabitFrequency(type: unknown, target: unknown, preferredDays?: number[]): HabitFieldError[] {
  const errors: HabitFieldError[] = [];
  if (!HABIT_FREQUENCY_TYPES.includes(type as any)) {
    errors.push({ field: 'frequencyType', message: 'Ervenytelen gyakorisag tipus.' });
  }
  const t = Number(target);
  if (!Number.isFinite(t) || t < 1) {
    errors.push({ field: 'frequencyTarget', message: 'A cel legalabb 1 kell legyen.' });
  }
  if (type === 'weekly') {
    if (!Array.isArray(preferredDays) || preferredDays.length === 0) {
      errors.push({ field: 'preferredDays', message: 'Heti szokasnal valassz napokat.' });
    }
  }
  return errors;
}

export function validateCompletion(input: Partial<HabitCompletion>): HabitFieldError[] {
  const errors: HabitFieldError[] = [];
  if (!input.habitId) errors.push({ field: 'habitId', message: 'A completion-hoz szokas azonosito kell.' });
  if (!input.completedAt) errors.push({ field: 'completedAt', message: 'Hianyzik a teljesitesi ido.' });
  if (input.completionDateKey && !isIsoDate(input.completionDateKey)) {
    errors.push({ field: 'completionDateKey', message: 'Ervenytelen completionDateKey.' });
  }
  if (input.source === 'auto' && !input.sourceEventType) {
    errors.push({ field: 'sourceEventType', message: 'Auto completion eseten sourceEventType kotelezo.' });
  }
  if (input.source === 'auto' && !input.sourceReferenceId) {
    errors.push({ field: 'sourceReferenceId', message: 'Auto completion eseten sourceReferenceId kotelezo.' });
  }
  return errors;
}

export function validateActivitySignal(input: {
  eventType?: string;
  sourceModule?: string;
  occurredAt?: string;
  dateKey?: string;
}): HabitFieldError[] {
  const errors: HabitFieldError[] = [];
  if (!input.eventType || !HABIT_SIGNAL_EVENT_TYPES.includes(input.eventType as any)) {
    errors.push({ field: 'eventType', message: 'Ervenytelen signal eventType.' });
  }
  if (!input.sourceModule) errors.push({ field: 'sourceModule', message: 'Hianyzik a signal forras modul.' });
  if (input.dateKey && !isIsoDate(input.dateKey)) errors.push({ field: 'dateKey', message: 'Ervenytelen dateKey.' });
  if (input.occurredAt && Number.isNaN(new Date(input.occurredAt).getTime())) {
    errors.push({ field: 'occurredAt', message: 'Ervenytelen occurredAt datum.' });
  }
  return errors;
}

export function validateCandidatePromotion(candidate: HabitCandidate): HabitFieldError[] {
  const errors: HabitFieldError[] = [];
  if (candidate.occurrencesCount < HABIT_PROMOTION_MIN_OCCURRENCES) {
    errors.push({ field: 'occurrencesCount', message: 'Meg nem eleg a minta gyakorisaga.' });
  }
  if (candidate.activeDaysCount < HABIT_PROMOTION_MIN_ACTIVE_DAYS) {
    errors.push({ field: 'activeDaysCount', message: 'Meg nem eleg az aktiv napok szama.' });
  }
  if (candidate.repeatScore < HABIT_PROMOTION_MIN_REPEAT_SCORE) {
    errors.push({ field: 'repeatScore', message: 'Meg nem eleg eros az ismetlodesi pontszam.' });
  }
  return errors;
}
