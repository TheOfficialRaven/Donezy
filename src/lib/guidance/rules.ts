import { GUIDANCE_ATTENTION_LIMIT_BY_LOAD, GUIDANCE_FOCUS_LIMIT_BY_LOAD } from './constants';
import { dashboardBlockToGuidanceItem, fallbackGuidanceItem } from './adapters';
import type { GuidanceEngineInputs, GuidanceItem } from './types';

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
  const preferredModules = ['lists', 'goals', 'calendar'];
  const ranked = sortByScore(input.blocks).filter((b) => b.type === 'focus' && preferredModules.includes(b.sourceModule));
  const selected = ranked.slice(0, focusLimit(input));
  if (selected.length === 0) return [fallbackGuidanceItem(input.date)];
  return selected.map((block) => dashboardBlockToGuidanceItem(block, 'focus', 'Ez ma valos, magas hatasu fokuszpont.'));
}

export function buildQuickWinItem(input: GuidanceEngineInputs): GuidanceItem | undefined {
  const candidates = sortByScore(input.blocks).filter((b) => {
    if (!b.actionTarget) return false;
    if (b.sourceModule === 'missions' && input.preferences.missionVisibility === 'secondary') return false;
    const title = b.title.toLowerCase();
    return title.includes('gyors') || title.includes('rovid') || b.sourceModule === 'lists' || b.sourceModule === 'habits';
  });
  const pick = candidates[0];
  return pick ? dashboardBlockToGuidanceItem(pick, 'quick-win', 'Gyorsan lezarhato, de ertelmes lepessel segit lenduletet epiteni.') : undefined;
}

export function buildMaintenanceItem(input: GuidanceEngineInputs): GuidanceItem | undefined {
  const candidate = sortByScore(input.blocks).find((b) => b.sourceModule === 'habits' || b.sourceModule === 'reflection' || b.sourceModule === 'notes');
  return candidate
    ? dashboardBlockToGuidanceItem(candidate, 'maintenance', 'Fenntarto lepes, ami segit stabilan tartani a nap ritmusat.')
    : undefined;
}

export function buildAttentionItems(input: GuidanceEngineInputs): GuidanceItem[] {
  let limit = GUIDANCE_ATTENTION_LIMIT_BY_LOAD[input.loadIndicator.level];
  if (input.preferences.overloadProtection === 'on' && input.loadIndicator.level === 'high') limit = Math.max(1, limit - 1);
  return sortByScore(input.blocks)
    .filter((b) => b.type === 'attention')
    .slice(0, limit)
    .map((block) => dashboardBlockToGuidanceItem(block, 'attention', 'Ez az elem most idoben figyelmet igenyel.'));
}

export function buildGuidanceQuickActions(input: GuidanceEngineInputs): string[] {
  const out: string[] = [];
  if (input.signals.quickCaptureUnprocessedCount >= 3) out.push('quick-note');
  if (input.signals.todayEventsCount >= 3) out.push('quick-event');
  if (input.signals.highPriorityOpenItemsCount >= 2) out.push('quick-list');
  if (input.signals.reflectionMissingToday && input.effectiveDayMode !== 'busy') out.push('quick-reflection');
  if (input.targetGroup === 'self-development') out.push('quick-reading');
  return Array.from(new Set(out));
}
