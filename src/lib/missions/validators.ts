import { MISSION_DIFFICULTIES, MISSION_STATUSES, MISSION_TYPES } from './constants';
import type { Mission } from './types';

export type MissionFieldError = { field: string; message: string };

export function validateMissionInput(input: Partial<Mission>): MissionFieldError[] {
  const errors: MissionFieldError[] = [];
  if (!input.title || !input.title.trim()) errors.push({ field: 'title', message: 'A kuldetes cime kotelezo.' });
  if (!MISSION_TYPES.includes(input.type as any)) errors.push({ field: 'type', message: 'Ervenytelen kuldetes tipus.' });
  if (!MISSION_DIFFICULTIES.includes(input.difficulty as any)) errors.push({ field: 'difficulty', message: 'Ervenytelen nehezseg.' });
  if (!MISSION_STATUSES.includes(input.status as any)) errors.push({ field: 'status', message: 'Ervenytelen statusz.' });
  if (!Number.isFinite(input.estimatedMinutes) || Number(input.estimatedMinutes) < 0 || Number(input.estimatedMinutes) > 16 * 60) {
    errors.push({ field: 'estimatedMinutes', message: 'A becsult ido 0-960 perc kozott legyen.' });
  }
  return errors;
}
