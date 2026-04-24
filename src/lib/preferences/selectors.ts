import type { UserProfilePreferences } from './types';
import { getDefaultUserPreferences } from './normalize';

export function getUserPreferences(preferences: UserProfilePreferences | null | undefined): UserProfilePreferences {
  return preferences || getDefaultUserPreferences();
}

export function getTargetGroupProfile(preferences: UserProfilePreferences | null | undefined) {
  const p = getUserPreferences(preferences);
  return {
    targetGroup: p.targetGroup,
    preferredTone: p.preferredTone,
    productivityMode: p.productivityMode,
  };
}

export function getDashboardPreferenceProfile(preferences: UserProfilePreferences | null | undefined) {
  const p = getUserPreferences(preferences);
  return {
    dashboardDensity: p.dashboardDensity,
    defaultTimeHorizon: p.defaultTimeHorizon,
    missionVisibility: p.missionVisibility,
    overloadProtection: p.overloadProtection,
  };
}

export function getGuidancePreferenceProfile(preferences: UserProfilePreferences | null | undefined) {
  const p = getUserPreferences(preferences);
  return {
    preferredTone: p.preferredTone,
    reminderSensitivity: p.reminderSensitivity,
    dayPlanningStyle: p.dayPlanningStyle,
    overloadProtection: p.overloadProtection,
  };
}

export function getHabitPreferenceProfile(preferences: UserProfilePreferences | null | undefined) {
  const p = getUserPreferences(preferences);
  return {
    habitTrackingPreference: p.habitTrackingPreference,
    dashboardDensity: p.dashboardDensity,
  };
}

export function getMissionPreferenceProfile(preferences: UserProfilePreferences | null | undefined) {
  const p = getUserPreferences(preferences);
  return {
    missionVisibility: p.missionVisibility,
    productivityMode: p.productivityMode,
  };
}

export function getReflectionPreferenceProfile(preferences: UserProfilePreferences | null | undefined) {
  const p = getUserPreferences(preferences);
  return {
    reflectionStyle: p.reflectionStyle,
    preferredTone: p.preferredTone,
  };
}

export function getNotesPreferenceProfile(preferences: UserProfilePreferences | null | undefined) {
  const p = getUserPreferences(preferences);
  return {
    notesInboxBehavior: p.notesInboxBehavior,
    dashboardDensity: p.dashboardDensity,
  };
}

export function getOverloadProtectionEnabled(preferences: UserProfilePreferences | null | undefined): boolean {
  return getUserPreferences(preferences).overloadProtection === 'on';
}

export function getPreferenceSummary(preferences: UserProfilePreferences | null | undefined): string {
  const p = getUserPreferences(preferences);
  return `${p.targetGroup} • ${p.productivityMode} mod • ${p.dashboardDensity} dashboard • ${p.preferredTone} hangnem`;
}
