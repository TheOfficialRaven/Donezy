import { DEFAULT_USER_PREFERENCES, PREFERENCES_SCHEMA_VERSION } from './constants';
import type { UserProfilePreferences, UserProfilePreferencesRaw } from './types';
import { validateUserPreferences } from './validators';

function pick<T>(value: T | undefined, fallback: T): T {
  return value === undefined || value === null ? fallback : value;
}

export function getDefaultUserPreferences(userId?: string): UserProfilePreferences {
  const now = new Date().toISOString();
  return {
    ...DEFAULT_USER_PREFERENCES,
    userId,
    createdAt: now,
    updatedAt: now,
  };
}

export function normalizeUserPreferences(raw: UserProfilePreferencesRaw | null | undefined, userId?: string): UserProfilePreferences {
  const base = getDefaultUserPreferences(userId);
  if (!raw) return base;
  const issues = validateUserPreferences(raw);
  const normalized: UserProfilePreferences = {
    ...base,
    userId: raw.userId || userId || base.userId,
    targetGroup: pick(raw.targetGroup, base.targetGroup),
    productivityMode: pick(raw.productivityMode, base.productivityMode),
    preferredTone: pick(raw.preferredTone, base.preferredTone),
    dashboardDensity: pick(raw.dashboardDensity, base.dashboardDensity),
    dayPlanningStyle: pick(raw.dayPlanningStyle, base.dayPlanningStyle),
    defaultTimeHorizon: pick(raw.defaultTimeHorizon, base.defaultTimeHorizon),
    reminderSensitivity: pick(raw.reminderSensitivity, base.reminderSensitivity),
    habitTrackingPreference: pick(raw.habitTrackingPreference, base.habitTrackingPreference),
    missionVisibility: pick(raw.missionVisibility, base.missionVisibility),
    reflectionStyle: pick(raw.reflectionStyle, base.reflectionStyle),
    readingVisibility: pick(raw.readingVisibility, base.readingVisibility),
    notesInboxBehavior: pick(raw.notesInboxBehavior, base.notesInboxBehavior),
    overloadProtection: pick(raw.overloadProtection, base.overloadProtection),
    showAdvancedFilters: pick(raw.showAdvancedFilters, base.showAdvancedFilters),
    themePreference: pick(raw.themePreference, base.themePreference),
    languagePreference: pick(raw.languagePreference, base.languagePreference),
    onboardingCompleted: pick(raw.onboardingCompleted, base.onboardingCompleted),
    interests: Array.isArray(raw.interests) ? raw.interests : base.interests,
    challenge: typeof raw.challenge === 'string' ? raw.challenge : base.challenge,
    questFrequency: pick(raw.questFrequency, base.questFrequency),
    activeTime: pick(raw.activeTime, base.activeTime),
    livingWith: Array.isArray(raw.livingWith) ? raw.livingWith : base.livingWith,
    focusAreasOrder: Array.isArray(raw.focusAreasOrder) ? raw.focusAreasOrder : base.focusAreasOrder,
    focusAreasEnabled: Array.isArray(raw.focusAreasEnabled) ? raw.focusAreasEnabled : base.focusAreasEnabled,
    wellbeingMode: pick(raw.wellbeingMode, base.wellbeingMode),
    maxActiveItems: typeof raw.maxActiveItems === 'number' ? raw.maxActiveItems : base.maxActiveItems,
    createdAt: raw.createdAt || base.createdAt,
    updatedAt: raw.updatedAt || base.updatedAt,
    schemaVersion: typeof raw.schemaVersion === 'number' ? raw.schemaVersion : PREFERENCES_SCHEMA_VERSION,
  };

  if (issues.length > 0) {
    // keep normalized values with safe defaults; issue list is available via validators when needed
    normalized.updatedAt = new Date().toISOString();
  }
  return normalized;
}
