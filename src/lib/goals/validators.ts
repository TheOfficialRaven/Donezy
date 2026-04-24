import { GOAL_PRIORITIES, GOAL_STATUSES, GOAL_TYPES } from './constants';
import type { GoalPriority, GoalStatus, GoalType, Milestone } from './types';

export type FieldError = { field: string; message: string };

export function validateGoalTitle(title: unknown): FieldError | null {
  if (typeof title !== 'string' || !title.trim()) {
    return { field: 'title', message: 'A cél címe kötelező.' };
  }
  return null;
}

export function validateGoalType(type: unknown): FieldError | null {
  if (!GOAL_TYPES.includes(type as GoalType)) {
    return { field: 'type', message: 'Érvénytelen céltípus.' };
  }
  return null;
}

export function validateGoalStatus(status: unknown): FieldError | null {
  if (!GOAL_STATUSES.includes(status as GoalStatus)) {
    return { field: 'status', message: 'Érvénytelen státusz.' };
  }
  return null;
}

export function validateGoalPriority(priority: unknown): FieldError | null {
  if (!GOAL_PRIORITIES.includes(priority as GoalPriority)) {
    return { field: 'priority', message: 'Érvénytelen prioritás.' };
  }
  return null;
}

/** YYYY-MM-DD */
function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const t = new Date(`${value}T12:00:00`);
  return !Number.isNaN(t.getTime());
}

/**
 * startDate / targetDate: when both set, start must not be after target.
 */
export function validateGoalDateWindow(startDate?: string, targetDate?: string): FieldError | null {
  if (startDate && !isIsoDate(startDate)) {
    return { field: 'startDate', message: 'A kezdő dátum formátuma érvénytelen (ÉÉÉÉ-HH-NN).' };
  }
  if (targetDate && !isIsoDate(targetDate)) {
    return { field: 'targetDate', message: 'A céldátum formátuma érvénytelen (ÉÉÉÉ-HH-NN).' };
  }
  if (startDate && targetDate && isIsoDate(startDate) && isIsoDate(targetDate) && startDate > targetDate) {
    return { field: 'targetDate', message: 'A kezdő dátum nem lehet későbbi, mint a céldátum.' };
  }
  return null;
}

export function validateMilestoneTitle(title: unknown): FieldError | null {
  if (typeof title !== 'string' || !title.trim()) {
    return { field: 'title', message: 'A mérföldkő címe kötelező.' };
  }
  return null;
}

export function validateMilestoneDates(m: Partial<Milestone>): FieldError | null {
  if (m.dueDate && !isIsoDate(m.dueDate)) {
    return { field: 'dueDate', message: 'A mérföldkő határideje érvénytelen (ÉÉÉÉ-HH-NN).' };
  }
  return null;
}

export function validateGoalCreatePayload(input: {
  title: unknown;
  type?: unknown;
  status?: unknown;
  priority?: unknown;
  startDate?: string;
  targetDate?: string;
}): FieldError[] {
  const errors: FieldError[] = [];
  const t = validateGoalTitle(input.title);
  if (t) errors.push(t);
  if (input.type !== undefined) {
    const e = validateGoalType(input.type);
    if (e) errors.push(e);
  }
  if (input.status !== undefined) {
    const e = validateGoalStatus(input.status);
    if (e) errors.push(e);
  }
  if (input.priority !== undefined) {
    const e = validateGoalPriority(input.priority);
    if (e) errors.push(e);
  }
  const d = validateGoalDateWindow(input.startDate, input.targetDate);
  if (d) errors.push(d);
  return errors;
}
