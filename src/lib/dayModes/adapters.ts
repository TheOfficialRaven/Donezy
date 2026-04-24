import type { DashboardBehaviorProfile } from '@/lib/dashboard/preferencesAdapter';
import { getDayModeProfile } from './normalize';
import type { DayModeDashboardBehaviorAdjustment, DayModeDashboardWeightsAdjustment, DayModeKey } from './types';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function dayModeToDashboardWeights(modeKey: DayModeKey): DayModeDashboardWeightsAdjustment {
  const mode = getDayModeProfile(modeKey);
  if (mode.key === 'focus') {
    return { lists: 1.1, goals: 1.16, habits: 0.98, calendar: 1.04, missions: 0.92, reflection: 0.95, reading: 0.92, notes: 0.98 };
  }
  if (mode.key === 'light') {
    return { lists: 1.02, goals: 0.95, habits: 1.08, calendar: 0.98, missions: 0.88, reflection: 1.1, reading: 0.95, notes: 1.08 };
  }
  if (mode.key === 'recovery') {
    return { lists: 1.05, goals: 0.9, habits: 1.2, calendar: 0.95, missions: 0.8, reflection: 1.2, reading: 0.9, notes: 1.15 };
  }
  if (mode.key === 'busy') {
    return { lists: 1.15, goals: 1.05, habits: 0.9, calendar: 1.2, missions: 0.9, reflection: 0.88, reading: 0.82, notes: 1.05 };
  }
  return { lists: 1, goals: 1, habits: 1, calendar: 1, missions: 1, reflection: 1, reading: 1, notes: 1 };
}

export function dayModeToDashboardDensity(modeKey: DayModeKey): number {
  return getDayModeProfile(modeKey).blockDensityDelta;
}

export function dayModeToToneAdjustment(modeKey: DayModeKey) {
  return getDayModeProfile(modeKey).toneBias;
}

export function dayModeToQuickActionAdjustment(modeKey: DayModeKey) {
  const mode = getDayModeProfile(modeKey);
  return {
    boostedActionIds: mode.quickActionBias.boostedActionIds,
    demotedActionIds: mode.quickActionBias.demotedActionIds,
  };
}

export function dayModeToOverloadBehavior(modeKey: DayModeKey): number {
  return getDayModeProfile(modeKey).overloadSensitivityDelta;
}

export function dayModeToDashboardBehavior(modeKey: DayModeKey): DayModeDashboardBehaviorAdjustment {
  const mode = getDayModeProfile(modeKey);
  return {
    mode,
    densityDelta: dayModeToDashboardDensity(mode.key),
    overloadDelta: dayModeToOverloadBehavior(mode.key),
    weightAdjustment: dayModeToDashboardWeights(mode.key),
    quickActionBoostIds: mode.quickActionBias.boostedActionIds,
    quickActionDemoteIds: mode.quickActionBias.demotedActionIds,
  };
}

export function applyDayModeToDashboardBehavior(
  base: DashboardBehaviorProfile,
  modeKey: DayModeKey
): DashboardBehaviorProfile {
  const adjustment = dayModeToDashboardBehavior(modeKey);

  const next = {
    ...base,
    weights: {
      ...base.weights,
      moduleWeights: {
        lists: clamp(base.weights.moduleWeights.lists * adjustment.weightAdjustment.lists, 0.7, 1.5),
        goals: clamp(base.weights.moduleWeights.goals * adjustment.weightAdjustment.goals, 0.7, 1.5),
        habits: clamp(base.weights.moduleWeights.habits * adjustment.weightAdjustment.habits, 0.7, 1.5),
        calendar: clamp(base.weights.moduleWeights.calendar * adjustment.weightAdjustment.calendar, 0.7, 1.5),
        missions: clamp(base.weights.moduleWeights.missions * adjustment.weightAdjustment.missions, 0.55, 1.2),
        reflection: clamp(base.weights.moduleWeights.reflection * adjustment.weightAdjustment.reflection, 0.7, 1.5),
        reading: clamp(base.weights.moduleWeights.reading * adjustment.weightAdjustment.reading, 0.65, 1.4),
        notes: clamp(base.weights.moduleWeights.notes * adjustment.weightAdjustment.notes, 0.7, 1.5),
      },
      missionPriorityOffset: clamp(base.weights.missionPriorityOffset - (modeKey === 'focus' ? 3 : modeKey === 'recovery' ? 5 : 0), -20, 12),
    },
    layout: {
      ...base.layout,
      focusLimit: clamp(base.layout.focusLimit + adjustment.densityDelta, 1, 5),
      attentionLimit: clamp(base.layout.attentionLimit + (modeKey === 'busy' ? 1 : adjustment.densityDelta), 1, 6),
      secondaryLimit: clamp(base.layout.secondaryLimit + adjustment.densityDelta, 2, 10),
      missionLimit: clamp(base.layout.missionLimit + (modeKey === 'focus' || modeKey === 'recovery' ? -1 : 0), 1, 4),
    },
  };

  if (modeKey === 'recovery' || modeKey === 'busy' || modeKey === 'focus') {
    next.overloadProtection = true;
  }

  const tonePrefix = adjustment.mode.toneBias.summary;
  next.tone = {
    ...next.tone,
    intro: `${tonePrefix} ${next.tone.intro}`,
  };

  return next;
}
