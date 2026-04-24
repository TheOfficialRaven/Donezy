import { buildGuidanceNarrativeSummary, buildSupportiveInsights } from './copy';
import {
  buildAttentionItems,
  buildGuidanceQuickActions,
  buildMaintenanceItem,
  buildQuickWinItem,
  buildTopFocusItems,
} from './rules';
import type { DailyGuidanceProfile, GuidanceEngineInputs, GuidanceItem } from './types';

export function getDailyGuidanceProfile(input: GuidanceEngineInputs): DailyGuidanceProfile {
  const topFocusItems = buildTopFocusItems(input);
  const quickWinItem = buildQuickWinItem(input);
  const maintenanceItem = buildMaintenanceItem(input);
  const attentionItems = buildAttentionItems(input);
  const supportiveInsights = buildSupportiveInsights(input);
  const quickActions = buildGuidanceQuickActions(input);

  const partial: Omit<DailyGuidanceProfile, 'narrativeSummary'> = {
    date: input.date,
    targetGroup: input.targetGroup,
    effectiveDayMode: input.effectiveDayMode,
    effectiveTone: input.effectiveTone,
    loadLevel: input.loadIndicator.level,
    topFocusItems,
    quickWinItem,
    maintenanceItem,
    attentionItems,
    supportiveInsights,
    quickActions,
    computedAt: new Date().toISOString(),
  };

  return {
    ...partial,
    narrativeSummary: buildGuidanceNarrativeSummary(input, partial),
  };
}

export function getGuidanceTopFocusItems(profile: DailyGuidanceProfile): GuidanceItem[] {
  return profile.topFocusItems;
}

export function getGuidanceQuickWin(profile: DailyGuidanceProfile): GuidanceItem | undefined {
  return profile.quickWinItem;
}

export function getGuidanceMaintenanceItem(profile: DailyGuidanceProfile): GuidanceItem | undefined {
  return profile.maintenanceItem;
}

export function getGuidanceAttentionItems(profile: DailyGuidanceProfile): GuidanceItem[] {
  return profile.attentionItems;
}

export function getGuidanceSupportiveInsights(profile: DailyGuidanceProfile): string[] {
  return profile.supportiveInsights;
}

export function getGuidanceNarrativeSummary(profile: DailyGuidanceProfile): string {
  return profile.narrativeSummary;
}

export function getGuidanceQuickActions(profile: DailyGuidanceProfile): string[] {
  return profile.quickActions;
}
