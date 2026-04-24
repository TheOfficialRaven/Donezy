import { GUIDANCE_ATTENTION_LIMIT_BY_LOAD, GUIDANCE_FOCUS_LIMIT_BY_LOAD } from './constants';
import { dashboardBlockToGuidanceItem, fallbackGuidanceItem } from './adapters';
import type { GuidanceEngineInputs, GuidanceItem } from './types';
import { getTargetGroupGuidanceProfile } from './targetGroupAdapter';

function sortByScore(blocks: GuidanceEngineInputs['blocks']) {
  return [...blocks].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
}

function focusLimit(input: GuidanceEngineInputs) {
  let base = GUIDANCE_FOCUS_LIMIT_BY_LOAD[input.loadIndicator.level];
  if (input.effectiveDayMode === 'focus' || input.effectiveDayMode === 'recovery') base = Math.max(1, base - 1);
  if (input.loadIndicator.level === 'low' && input.preferences.dashboardDensity === 'detailed') base += 1;
  return base;
}

export function buildTopFocusItems(input: GuidanceEngineInputs): GuidanceItem[] {
  const tg = getTargetGroupGuidanceProfile(input.targetGroup);
  const preferredModules = tg.focusBias;
  const ranked = sortByScore(input.blocks).filter((b) => b.type === 'focus' && preferredModules.includes(b.sourceModule));
  const selected = ranked.slice(0, focusLimit(input));
  if (selected.length === 0) return [fallbackGuidanceItem(input.date)];
  return selected.map((block) => dashboardBlockToGuidanceItem(block, 'focus', 'Ez ma valos, magas hatasu fokuszpont.'));
}

export function buildQuickWinItem(input: GuidanceEngineInputs): GuidanceItem | undefined {
  const tg = getTargetGroupGuidanceProfile(input.targetGroup);
  const candidates = sortByScore(input.blocks).filter((b) => {
    if (!b.actionTarget) return false;
    if (b.sourceModule === 'missions' && input.preferences.missionVisibility === 'secondary') return false;
    const title = b.title.toLowerCase();
    return (
      title.includes('gyors') ||
      title.includes('rovid') ||
      b.sourceModule === 'lists' ||
      b.sourceModule === 'habits' ||
      tg.focusBias.includes(b.sourceModule)
    );
  });
  const pick = candidates[0];
  return pick ? dashboardBlockToGuidanceItem(pick, 'quick-win', 'Gyorsan lezarhato, de ertelmes lepessel segit lenduletet epiteni.') : undefined;
}

export function buildMaintenanceItem(input: GuidanceEngineInputs): GuidanceItem | undefined {
  const tg = getTargetGroupGuidanceProfile(input.targetGroup);
  const preferredMaintenance =
    input.targetGroup === 'self-development'
      ? ['habits', 'reading', 'reflection', 'notes']
      : input.targetGroup === 'student'
        ? ['lists', 'calendar', 'notes', 'habits']
        : input.targetGroup === 'freelancer'
          ? ['goals', 'lists', 'notes', 'habits']
          : input.targetGroup === 'organizer'
            ? ['lists', 'notes', 'calendar', 'habits']
            : ['habits', 'reflection', 'notes'];
  const candidate = sortByScore(input.blocks).find((b) => preferredMaintenance.includes(b.sourceModule) && (tg.emphasisWeights[b.sourceModule] || 1) >= 0.8);
  return candidate
    ? dashboardBlockToGuidanceItem(candidate, 'maintenance', 'Fenntarto lepes, ami segit stabilan tartani a nap ritmusat.')
    : undefined;
}

export function buildAttentionItems(input: GuidanceEngineInputs): GuidanceItem[] {
  const tg = getTargetGroupGuidanceProfile(input.targetGroup);
  let limit = GUIDANCE_ATTENTION_LIMIT_BY_LOAD[input.loadIndicator.level];
  if (input.preferences.overloadProtection === 'on' && input.loadIndicator.level === 'high') limit = Math.max(1, limit - 1);
  const base = sortByScore(input.blocks)
    .filter((b) => b.type === 'attention' && (tg.attentionBias.includes(b.sourceModule) || (tg.emphasisWeights[b.sourceModule] || 1) > 1))
    .slice(0, limit)
    .map((block) => dashboardBlockToGuidanceItem(block, 'attention', 'Ez az elem most idoben figyelmet igenyel.'));
  if (input.signals.routingHighConfidenceCount > 0 && base.length < limit) {
    base.push({
      id: `${input.date}-routing-attention`,
      title: 'Van konnyen tovabbviheto javaslat',
      subtitle: `${input.signals.routingHighConfidenceCount} eros routing candidate var feldolgozasra.`,
      reason: 'Egy gyors atalakitas most tehermentesitheti a tobbi modult.',
      sourceModule: 'notes',
      kind: 'attention',
      priorityScore: 68,
      actionTarget: '/app/dashboard',
    });
  }
  return base.slice(0, limit);
}

export function buildGuidanceQuickActions(input: GuidanceEngineInputs): string[] {
  const tg = getTargetGroupGuidanceProfile(input.targetGroup);
  const out: string[] = [];
  if (input.signals.quickCaptureUnprocessedCount >= 3) out.push('quick-note');
  if (input.signals.todayEventsCount >= 3) out.push('quick-event');
  if (input.signals.highPriorityOpenItemsCount >= 2) out.push('quick-list');
  if (input.signals.routingHighConfidenceCount > 0) out.push('quick-list', 'quick-note');
  if (input.signals.reflectionMissingToday && input.effectiveDayMode !== 'busy') out.push('quick-reflection');
  if (input.targetGroup === 'self-development') out.push('quick-reading');
  for (const action of tg.quickActionBias) out.push(action);
  return Array.from(new Set(out));
}
