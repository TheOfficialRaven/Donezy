import type { OnboardingAnswerSet } from './types';

export function normalizeOnboardingAnswers(raw: Partial<OnboardingAnswerSet> | null | undefined): OnboardingAnswerSet {
  return {
    goalPrimary: raw?.goalPrimary,
    targetGroupChoice: raw?.targetGroupChoice,
    productivityPreference: raw?.productivityPreference,
    dashboardDensityPreference: raw?.dashboardDensityPreference,
    tonePreference: raw?.tonePreference,
    planningStylePreference: raw?.planningStylePreference,
    missionVisibilityPreference: raw?.missionVisibilityPreference,
    reflectionPreference: raw?.reflectionPreference,
    readingPreference: raw?.readingPreference,
    habitPreference: raw?.habitPreference,
    overwhelmPreference: raw?.overwhelmPreference,
    dashboardEmphasis: raw?.dashboardEmphasis,
    visibleModulePreference: raw?.visibleModulePreference,
    prioritiesFreeform: raw?.prioritiesFreeform?.trim() || '',
    selectedPresetId: raw?.selectedPresetId,
  };
}
