import type { OnboardingAnswerSet } from './types';

export function validateOnboardingStep(step: number, answers: OnboardingAnswerSet): string[] {
  const errors: string[] = [];
  if (step === 1 && !answers.goalPrimary) errors.push('Valassz egy fo hasznalati celt.');
  if (step === 2 && !answers.targetGroupChoice) errors.push('Valassz egy celcsoportot.');
  if (step === 3 && !answers.tonePreference) errors.push('Valassz segito hangnemet.');
  if (step === 4 && !answers.dashboardDensityPreference) errors.push('Valassz dashboard stilust.');
  if (step === 5 && !answers.overwhelmPreference) errors.push('Valassz terhelesi preferenciat.');
  if (step === 6 && !answers.dashboardEmphasis) errors.push('Valassz hangsulyteruletet.');
  return errors;
}

export function canCompleteOnboarding(answers: OnboardingAnswerSet): boolean {
  return Boolean(
    answers.goalPrimary &&
      answers.targetGroupChoice &&
      answers.tonePreference &&
      answers.dashboardDensityPreference &&
      answers.overwhelmPreference &&
      answers.dashboardEmphasis
  );
}
