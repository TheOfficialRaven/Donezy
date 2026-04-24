import type { DailyGuidanceProfile, GuidanceEngineInputs } from './types';

export function buildGuidanceNarrativeSummary(input: GuidanceEngineInputs, profile: Omit<DailyGuidanceProfile, 'narrativeSummary'>): string {
  const focusCount = profile.topFocusItems.length;
  const attentionCount = profile.attentionItems.length;
  const base =
    input.effectiveTone === 'direct'
      ? `Ma ${focusCount} fo fokuszpont eleg, ${attentionCount} elem ker extra figyelmet.`
      : input.effectiveTone === 'neutral'
        ? `Ma ${focusCount} kiemelt fokuszponttal es ${attentionCount} figyelmet kero elemmel erdemes szamolni.`
        : `Ma ${focusCount} jol vallalhato fokuszpontot emeltunk ki, es ${attentionCount} elemre erdemes finoman ranezni.`;

  if (input.effectiveDayMode === 'recovery' || input.effectiveDayMode === 'light') {
    return `${base} Kimelo ritmussal haladj, az egyszeru lepesek most tobbet ernek.`;
  }
  if (input.effectiveDayMode === 'focus') {
    return `${base} Most a melyebb, zavarszegeny haladas a legerosebb irany.`;
  }
  if (input.targetGroup === 'student') {
    return `${base} A tanulasi idosavok es kozeli hataridok most elsobbseget kapnak.`;
  }
  if (input.targetGroup === 'freelancer') {
    return `${base} A projektelorehaladast tamogato lepesek kerultek elore.`;
  }
  return base;
}

export function buildSupportiveInsights(input: GuidanceEngineInputs): string[] {
  const insights: string[] = [];
  if (input.signals.overdueItemsCount > 0) {
    insights.push(`Van ${input.signals.overdueItemsCount} lejart nyitott elem, ezeket erdemes roviden atnezni.`);
  }
  if (input.signals.todayEventsCount >= 3) {
    insights.push('A mai nap idoben surubb, erdemes rovidebb feladatblokkokban gondolkodni.');
  }
  if (input.signals.quickCaptureUnprocessedCount >= 3) {
    insights.push('A mental inboxban tobb feldolgozatlan elem van, egy rovid rendszerezes sokat tisztit.');
  }
  if (input.signals.reflectionMissingToday) {
    insights.push('Ma meg nincs reflexio, egy rovid zaromondat segithet a napi keretben.');
  }
  return insights.slice(0, 3);
}
