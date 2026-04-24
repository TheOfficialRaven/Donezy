import type { DayModeKey } from '@/lib/dayModes';
import type {
  DashboardDensity,
  HabitTrackingPreference,
  MissionVisibility,
  OverloadProtection,
  PreferenceTargetGroup,
  PreferredTone,
  ProductivityMode,
  ReflectionStyle,
  ReadingVisibility,
  UserProfilePreferences,
} from '@/lib/preferences';

export type OnboardingPrimaryGoal = 'daily-organization' | 'self-development' | 'learning' | 'work-projects' | 'general-order';
export type OnboardingDashboardEmphasis = 'tasks-events' | 'growth-habits' | 'learning-progress' | 'projects-focus' | 'order-clarity';

export interface OnboardingAnswerSet {
  goalPrimary?: OnboardingPrimaryGoal;
  targetGroupChoice?: PreferenceTargetGroup;
  productivityPreference?: ProductivityMode;
  dashboardDensityPreference?: DashboardDensity;
  tonePreference?: PreferredTone;
  planningStylePreference?: UserProfilePreferences['dayPlanningStyle'];
  missionVisibilityPreference?: MissionVisibility;
  reflectionPreference?: ReflectionStyle;
  readingPreference?: ReadingVisibility;
  habitPreference?: HabitTrackingPreference;
  overwhelmPreference?: 'high' | 'medium' | 'low';
  dashboardEmphasis?: OnboardingDashboardEmphasis;
  visibleModulePreference?: 'habits' | 'reflection' | 'reading' | 'missions' | 'simple';
  prioritiesFreeform?: string;
  selectedPresetId?: string;
}

export interface OnboardingQuickActionsProfile {
  boostedActionIds: string[];
  demotedActionIds: string[];
}

export interface OnboardingResultProfile {
  derivedTargetGroup: PreferenceTargetGroup;
  derivedPreferencesPatch: Partial<UserProfilePreferences>;
  suggestedInitialDayMode?: DayModeKey;
  suggestedQuickActionsProfile: OnboardingQuickActionsProfile;
  suggestedDashboardEmphasis: OnboardingDashboardEmphasis;
  onboardingCompleted: boolean;
  completedAt: string;
}

export interface OnboardingPreset {
  id: string;
  label: string;
  description: string;
  answersPatch: Partial<OnboardingAnswerSet>;
}
