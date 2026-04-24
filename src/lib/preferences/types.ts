export type PreferenceTargetGroup =
  | 'self-development'
  | 'student'
  | 'young-professional'
  | 'freelancer'
  | 'organizer'
  | 'other';

export type ProductivityMode = 'balanced' | 'focus' | 'light' | 'recovery';
export type PreferredTone = 'supportive' | 'neutral' | 'direct';
export type DashboardDensity = 'minimal' | 'balanced' | 'detailed';
export type DayPlanningStyle = 'strict' | 'flexible' | 'mixed';
export type DefaultTimeHorizon = 'today' | 'this-week' | 'mixed';
export type ReminderSensitivity = 'low' | 'medium' | 'high';
export type HabitTrackingPreference = 'auto-first' | 'hybrid' | 'manual-light';
export type MissionVisibility = 'secondary' | 'balanced' | 'strong';
export type ReflectionStyle = 'quick' | 'mixed' | 'deep';
export type ReadingVisibility = 'low' | 'medium' | 'high';
export type NotesInboxBehavior = 'simple' | 'structured';
export type OverloadProtection = 'on' | 'off';
export type ThemePreference = 'system' | 'dark' | 'light';

export interface PreferencesCoreProfile {
  userId?: string;
  targetGroup: PreferenceTargetGroup;
  productivityMode: ProductivityMode;
  preferredTone: PreferredTone;
}

export interface PreferencesBehaviorProfile {
  dayPlanningStyle: DayPlanningStyle;
  defaultTimeHorizon: DefaultTimeHorizon;
  reminderSensitivity: ReminderSensitivity;
  habitTrackingPreference: HabitTrackingPreference;
  missionVisibility: MissionVisibility;
  reflectionStyle: ReflectionStyle;
  readingVisibility: ReadingVisibility;
  notesInboxBehavior: NotesInboxBehavior;
  overloadProtection: OverloadProtection;
}

export interface PreferencesUiProfile {
  dashboardDensity: DashboardDensity;
  showAdvancedFilters: boolean;
  themePreference?: ThemePreference;
  languagePreference?: string;
}

/**
 * Backward compatible profile:
 * - legacy onboarding fields stay additive for existing quest generation.
 */
export interface UserProfilePreferences
  extends PreferencesCoreProfile,
    PreferencesBehaviorProfile,
    PreferencesUiProfile {
  onboardingCompleted: boolean;
  interests: string[];
  challenge: string;
  questFrequency: 'low' | 'medium' | 'high';
  activeTime: 'morning' | 'afternoon' | 'evening';
  livingWith: string[];
  focusAreasOrder: string[];
  focusAreasEnabled: string[];
  wellbeingMode: boolean;
  maxActiveItems: number;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}

export type UserProfilePreferencesRaw = Partial<UserProfilePreferences> & {
  userId?: string;
};

export type PreferencesViewSection =
  | 'profile-target-group'
  | 'productivity-style'
  | 'dashboard-focus'
  | 'habits-missions'
  | 'reflection-reading'
  | 'appearance-advanced';
