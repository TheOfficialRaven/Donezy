import type { DayModeKey } from '@/lib/dayModes';
import type { UserProfilePreferences } from '@/lib/preferences';
import { getDefaultUserPreferences } from '@/lib/preferences';
import type { OnboardingAnswerSet, OnboardingDashboardEmphasis, OnboardingQuickActionsProfile, OnboardingResultProfile } from './types';

export function onboardingToTargetGroup(answers: OnboardingAnswerSet): UserProfilePreferences['targetGroup'] {
  if (answers.targetGroupChoice) return answers.targetGroupChoice;
  if (answers.goalPrimary === 'learning') return 'student';
  if (answers.goalPrimary === 'self-development') return 'self-development';
  if (answers.goalPrimary === 'work-projects') return 'young-professional';
  if (answers.goalPrimary === 'general-order') return 'organizer';
  return 'other';
}

export function onboardingToDashboardEmphasis(answers: OnboardingAnswerSet): OnboardingDashboardEmphasis {
  if (answers.dashboardEmphasis) return answers.dashboardEmphasis;
  if (answers.goalPrimary === 'learning') return 'learning-progress';
  if (answers.goalPrimary === 'self-development') return 'growth-habits';
  if (answers.goalPrimary === 'work-projects') return 'projects-focus';
  if (answers.goalPrimary === 'general-order') return 'order-clarity';
  return 'tasks-events';
}

export function onboardingToQuickActionsBias(answers: OnboardingAnswerSet): OnboardingQuickActionsProfile {
  const emphasis = onboardingToDashboardEmphasis(answers);
  if (emphasis === 'growth-habits') return { boostedActionIds: ['quick-reflection', 'quick-reading'], demotedActionIds: ['quick-event'] };
  if (emphasis === 'learning-progress') return { boostedActionIds: ['quick-reading', 'quick-note'], demotedActionIds: [] };
  if (emphasis === 'projects-focus') return { boostedActionIds: ['quick-list', 'quick-note'], demotedActionIds: ['quick-reflection'] };
  if (emphasis === 'order-clarity') return { boostedActionIds: ['quick-list', 'quick-event'], demotedActionIds: ['quick-reading'] };
  return { boostedActionIds: ['quick-list', 'quick-event'], demotedActionIds: [] };
}

export function onboardingToInitialDayMode(answers: OnboardingAnswerSet): DayModeKey | undefined {
  if (answers.productivityPreference === 'focus') return 'focus';
  if (answers.productivityPreference === 'light' || answers.productivityPreference === 'recovery') return 'light';
  if (answers.overwhelmPreference === 'high') return 'recovery';
  return 'normal';
}

export function onboardingToPreferencesPatch(
  answers: OnboardingAnswerSet,
  current: UserProfilePreferences | null | undefined
): Partial<UserProfilePreferences> {
  const defaults = getDefaultUserPreferences(current?.userId);
  const targetGroup = onboardingToTargetGroup(answers);
  const overwhelm: UserProfilePreferences['overloadProtection'] =
    answers.overwhelmPreference === 'low' ? 'off' : 'on';

  const patch: Partial<UserProfilePreferences> = {
    targetGroup,
    preferredTone: answers.tonePreference || defaults.preferredTone,
    dashboardDensity: answers.dashboardDensityPreference || defaults.dashboardDensity,
    productivityMode: answers.productivityPreference || defaults.productivityMode,
    dayPlanningStyle: answers.planningStylePreference || defaults.dayPlanningStyle,
    missionVisibility: answers.missionVisibilityPreference || defaults.missionVisibility,
    reflectionStyle: answers.reflectionPreference || defaults.reflectionStyle,
    readingVisibility: answers.readingPreference || defaults.readingVisibility,
    habitTrackingPreference: answers.habitPreference || defaults.habitTrackingPreference,
    overloadProtection: overwhelm,
    defaultTimeHorizon:
      answers.dashboardEmphasis === 'tasks-events' || answers.dashboardEmphasis === 'projects-focus'
        ? 'today'
        : 'this-week',
    notesInboxBehavior:
      answers.dashboardDensityPreference === 'detailed' ? 'structured' : 'simple',
    onboardingCompleted: true,
    updatedAt: new Date().toISOString(),
  };

  if (answers.goalPrimary === 'learning') patch.readingVisibility = 'high';
  if (answers.goalPrimary === 'daily-organization') patch.defaultTimeHorizon = 'today';
  if (answers.goalPrimary === 'self-development') patch.reflectionStyle = patch.reflectionStyle || 'mixed';
  if (answers.visibleModulePreference === 'simple') patch.missionVisibility = 'secondary';
  if (answers.visibleModulePreference === 'missions') patch.missionVisibility = 'strong';
  if (answers.visibleModulePreference === 'reflection') patch.reflectionStyle = 'deep';
  if (answers.visibleModulePreference === 'reading') patch.readingVisibility = 'high';
  if (answers.visibleModulePreference === 'habits') patch.habitTrackingPreference = 'auto-first';
  return patch;
}

export function buildOnboardingResultProfile(
  answers: OnboardingAnswerSet,
  current: UserProfilePreferences | null | undefined
): OnboardingResultProfile {
  return {
    derivedTargetGroup: onboardingToTargetGroup(answers),
    derivedPreferencesPatch: onboardingToPreferencesPatch(answers, current),
    suggestedInitialDayMode: onboardingToInitialDayMode(answers),
    suggestedQuickActionsProfile: onboardingToQuickActionsBias(answers),
    suggestedDashboardEmphasis: onboardingToDashboardEmphasis(answers),
    onboardingCompleted: true,
    completedAt: new Date().toISOString(),
  };
}
