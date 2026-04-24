import { ONBOARDING_PRESETS, ONBOARDING_TOTAL_STEPS } from './constants';
import type { OnboardingAnswerSet } from './types';
import { canCompleteOnboarding } from './validators';

export function getOnboardingProgress(step: number) {
  return Math.min(100, Math.max(0, Math.round(((step + 1) / ONBOARDING_TOTAL_STEPS) * 100)));
}

export function getOnboardingPresetById(id?: string | null) {
  if (!id) return undefined;
  return ONBOARDING_PRESETS.find((preset) => preset.id === id);
}

export function getOnboardingSummaryLines(answers: OnboardingAnswerSet) {
  const emphasis =
    answers.dashboardEmphasis === 'growth-habits'
      ? 'a fejlodesre es szokasokra'
      : answers.dashboardEmphasis === 'learning-progress'
        ? 'a tanulasra es haladasra'
        : answers.dashboardEmphasis === 'projects-focus'
          ? 'a projektekre es fokuszra'
          : answers.dashboardEmphasis === 'order-clarity'
            ? 'a rendre es atlathatosagra'
            : 'a napi feladatokra es esemenyekre';
  return [
    `A Dashboard indulaskor jobban ${emphasis} epul.`,
    'A beallitasokat barmikor modositani tudod a Settings oldalon.',
    canCompleteOnboarding(answers)
      ? 'A kezdoelmeny mar szemelyre szabottan fog betoltodni.'
      : 'Par valasz hianyzik a teljes szemelyre szabashoz.',
  ];
}
