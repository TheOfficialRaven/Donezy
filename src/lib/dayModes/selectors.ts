import { DAY_MODE_ORDER, DAY_MODE_PROFILES, DEFAULT_DAY_MODE } from './constants';
import { getDayModeProfile, normalizeDayModeKey } from './normalize';
import type { DayModeDashboardBehaviorAdjustment, DayModeKey, DayModeProfile, DayModeSuggestion } from './types';
import { dayModeToDashboardBehavior } from './adapters';
import { DAY_MODE_SUGGESTION_MIN_CONFIDENCE_TO_SHOW } from './constants';
import { suggestDayMode } from './suggestion';
import type { DayModeSuggestionInputs } from './types';

export function getCurrentDayMode(currentDayMode?: DayModeKey | null): DayModeProfile {
  return getDayModeProfile(currentDayMode || DEFAULT_DAY_MODE);
}

export function getEffectiveDayMode(input: {
  currentDayMode?: DayModeKey | null;
  dayModeOverride?: DayModeKey | null;
}): DayModeProfile {
  const effective = input.dayModeOverride || input.currentDayMode || DEFAULT_DAY_MODE;
  return getDayModeProfile(effective);
}

export function getDayModeDashboardProfile(modeKey?: DayModeKey | null): DayModeDashboardBehaviorAdjustment {
  return dayModeToDashboardBehavior(normalizeDayModeKey(modeKey));
}

export function getDayModeQuickActionsProfile(modeKey?: DayModeKey | null) {
  const mode = getDayModeProfile(modeKey);
  return {
    mode: mode.key,
    boostedActionIds: mode.quickActionBias.boostedActionIds,
    demotedActionIds: mode.quickActionBias.demotedActionIds,
  };
}

export function getDayModeToneProfile(modeKey?: DayModeKey | null) {
  const mode = getDayModeProfile(modeKey);
  return mode.toneBias;
}

export function getDayModeBlockLimits(modeKey?: DayModeKey | null) {
  const mode = getDayModeProfile(modeKey);
  return {
    mode: mode.key,
    densityDelta: mode.blockDensityDelta,
    strictness: mode.priorityBias.strictness,
  };
}

export function getDayModeSummary(modeKey?: DayModeKey | null) {
  const mode = getDayModeProfile(modeKey);
  return `${mode.label}: ${mode.toneBias.summary}`;
}

export function getSelectableDayModes(): DayModeProfile[] {
  return DAY_MODE_ORDER.map((key) => DAY_MODE_PROFILES[key]).filter((mode) => mode.enabled);
}

export function getDayModeSuggestion(inputs: DayModeSuggestionInputs): DayModeSuggestion {
  return suggestDayMode(inputs);
}

export function getDayModeSuggestionReasons(suggestion?: DayModeSuggestion | null): string[] {
  return suggestion?.reasons || [];
}

export function getDayModeSuggestionConfidence(suggestion?: DayModeSuggestion | null) {
  return suggestion?.confidence || 'low';
}

export function shouldShowDayModeSuggestion(suggestion?: DayModeSuggestion | null): boolean {
  if (!suggestion) return false;
  if (suggestion.confidence === 'high') return true;
  if (suggestion.confidence === 'medium') return DAY_MODE_SUGGESTION_MIN_CONFIDENCE_TO_SHOW !== 'high';
  return false;
}

export function getEffectiveDayModeWithSuggestion(input: {
  currentDayMode?: DayModeKey | null;
  dayModeOverride?: DayModeKey | null;
  suggestion?: DayModeSuggestion | null;
}): DayModeProfile {
  if (input.dayModeOverride) return getDayModeProfile(input.dayModeOverride);
  if (input.currentDayMode) return getDayModeProfile(input.currentDayMode);
  if (shouldShowDayModeSuggestion(input.suggestion)) return getDayModeProfile(input.suggestion?.suggestedMode);
  return getDayModeProfile(DEFAULT_DAY_MODE);
}
