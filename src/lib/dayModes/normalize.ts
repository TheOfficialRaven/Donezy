import { DAY_MODE_PROFILES, DEFAULT_DAY_MODE } from './constants';
import { isValidDayModeKey } from './validators';
import type { DayModeKey, DayModeProfile } from './types';

export function normalizeDayModeKey(value: unknown, fallback: DayModeKey = DEFAULT_DAY_MODE): DayModeKey {
  if (isValidDayModeKey(value)) return value;
  return fallback;
}

export function getDayModeProfile(key: unknown): DayModeProfile {
  return DAY_MODE_PROFILES[normalizeDayModeKey(key)];
}

export function getDefaultDayMode(): DayModeKey {
  return DEFAULT_DAY_MODE;
}
