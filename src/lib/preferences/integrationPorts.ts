import type { UserProfilePreferences } from './types';
import {
  getDashboardPreferenceProfile,
  getGuidancePreferenceProfile,
  getHabitPreferenceProfile,
  getMissionPreferenceProfile,
  getNotesPreferenceProfile,
  getReflectionPreferenceProfile,
  getTargetGroupProfile,
} from './selectors';

export function preferencesToDashboardAdapter(preferences: UserProfilePreferences | null | undefined) {
  return getDashboardPreferenceProfile(preferences);
}

export function preferencesToGuidanceAdapter(preferences: UserProfilePreferences | null | undefined) {
  return getGuidancePreferenceProfile(preferences);
}

export function preferencesToHabitAdapter(preferences: UserProfilePreferences | null | undefined) {
  return getHabitPreferenceProfile(preferences);
}

export function preferencesToMissionAdapter(preferences: UserProfilePreferences | null | undefined) {
  return getMissionPreferenceProfile(preferences);
}

export function preferencesToReflectionAdapter(preferences: UserProfilePreferences | null | undefined) {
  return getReflectionPreferenceProfile(preferences);
}

export function preferencesToNotesAdapter(preferences: UserProfilePreferences | null | undefined) {
  return getNotesPreferenceProfile(preferences);
}

export function preferencesToTargetGroupAdapter(preferences: UserProfilePreferences | null | undefined) {
  return getTargetGroupProfile(preferences);
}
