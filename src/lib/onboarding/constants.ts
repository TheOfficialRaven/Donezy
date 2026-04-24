import type { OnboardingPreset } from './types';

export const ONBOARDING_SCHEMA_VERSION = 1 as const;

export const ONBOARDING_TOTAL_STEPS = 7 as const;

export const ONBOARDING_PRESETS: OnboardingPreset[] = [
  {
    id: 'balanced-start',
    label: 'Kiegyensulyozott indulas',
    description: 'Attekintheto, de nem tul reszletes kezdes.',
    answersPatch: {
      productivityPreference: 'balanced',
      dashboardDensityPreference: 'balanced',
      overwhelmPreference: 'medium',
      missionVisibilityPreference: 'balanced',
      visibleModulePreference: 'simple',
    },
  },
  {
    id: 'focus-start',
    label: 'Fokuszalt indulas',
    description: 'Kevesebb zaj, erosebb napi celorientaltsag.',
    answersPatch: {
      productivityPreference: 'focus',
      dashboardDensityPreference: 'minimal',
      planningStylePreference: 'strict',
      missionVisibilityPreference: 'strong',
      dashboardEmphasis: 'projects-focus',
    },
  },
  {
    id: 'gentle-start',
    label: 'Kimelo indulas',
    description: 'Nyugodtabb ritmus, tulterheles elleni vedelmessel.',
    answersPatch: {
      productivityPreference: 'recovery',
      dashboardDensityPreference: 'minimal',
      overwhelmPreference: 'high',
      reflectionPreference: 'quick',
    },
  },
  {
    id: 'learning-start',
    label: 'Tanulasi fokusz',
    description: 'Tanulas, haladas es emlekezteto jellegu ritmus.',
    answersPatch: {
      targetGroupChoice: 'student',
      dashboardEmphasis: 'learning-progress',
      readingPreference: 'high',
      missionVisibilityPreference: 'balanced',
    },
  },
  {
    id: 'organizing-start',
    label: 'Rendszerezo indulas',
    description: 'Feladatok, esemenyek es tiszta napi struktura.',
    answersPatch: {
      targetGroupChoice: 'organizer',
      dashboardEmphasis: 'order-clarity',
      dashboardDensityPreference: 'balanced',
      productivityPreference: 'balanced',
    },
  },
];
