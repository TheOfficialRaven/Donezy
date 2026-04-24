import { DAY_MODE_PROFILES } from './constants';
import type { DayModeKey } from './types';

export function isValidDayModeKey(value: unknown): value is DayModeKey {
  return typeof value === 'string' && value in DAY_MODE_PROFILES;
}

export function validateDayModeKey(value: unknown): { valid: boolean; modeKey: DayModeKey | null } {
  if (!isValidDayModeKey(value)) {
    return { valid: false, modeKey: null };
  }
  return { valid: true, modeKey: value };
}
