import type { PreferencesViewSection, UserProfilePreferences } from './types';

export const PREFERENCES_SCHEMA_VERSION = 1 as const;

export const PREFERENCES_SECTION_LABELS: Record<PreferencesViewSection, string> = {
  'profile-target-group': 'Profil es celcsoport',
  'productivity-style': 'Produktivitasi stilus',
  'dashboard-focus': 'Dashboard es fokusz',
  'habits-missions': 'Szokasok es kuldetesek',
  'reflection-reading': 'Reflexio es olvasas',
  'appearance-advanced': 'Megjelenes es halado opciok',
};

export const DEFAULT_USER_PREFERENCES: Omit<UserProfilePreferences, 'createdAt' | 'updatedAt'> = {
  userId: undefined,
  targetGroup: 'self-development',
  productivityMode: 'balanced',
  preferredTone: 'supportive',
  dashboardDensity: 'balanced',
  dayPlanningStyle: 'mixed',
  defaultTimeHorizon: 'mixed',
  reminderSensitivity: 'medium',
  habitTrackingPreference: 'auto-first',
  missionVisibility: 'secondary',
  reflectionStyle: 'mixed',
  readingVisibility: 'medium',
  notesInboxBehavior: 'simple',
  overloadProtection: 'on',
  showAdvancedFilters: false,
  themePreference: 'system',
  languagePreference: 'hu',
  onboardingCompleted: true,
  interests: [],
  challenge: '',
  questFrequency: 'medium',
  activeTime: 'morning',
  livingWith: [],
  focusAreasOrder: ['tudat', 'test', 'munka_tanulas', 'otthon', 'kapcsolatok'],
  focusAreasEnabled: ['tudat', 'test', 'munka_tanulas', 'otthon', 'kapcsolatok'],
  wellbeingMode: true,
  maxActiveItems: 5,
  schemaVersion: PREFERENCES_SCHEMA_VERSION,
};
