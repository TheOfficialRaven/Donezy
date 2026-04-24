import { DAY_MODE_SUGGESTION_REASON_MESSAGES } from './constants';
import type {
  DayModeKey,
  DayModeSuggestion,
  DayModeSuggestionConfidence,
  DayModeSuggestionInputs,
  DayModeSuggestionReasonCode,
} from './types';

function toConfidence(topScore: number, deltaFromSecond: number): DayModeSuggestionConfidence {
  if (topScore >= 7 && deltaFromSecond >= 2) return 'high';
  if (topScore >= 4 && deltaFromSecond >= 1) return 'medium';
  return 'low';
}

function sortScores(scores: Record<DayModeKey, number>): [DayModeKey, number][] {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1]) as [DayModeKey, number][];
}

export function suggestDayMode(input: DayModeSuggestionInputs): DayModeSuggestion {
  const reasons: DayModeSuggestionReasonCode[] = [];
  const scores: Record<DayModeKey, number> = {
    normal: 1,
    focus: 0,
    light: 0,
    recovery: 0,
    busy: 0,
  };

  const pressureScore =
    (input.loadLevel === 'high' ? 3 : input.loadLevel === 'balanced' ? 1 : 0) +
    (input.todayEventsCount >= 4 ? 2 : input.todayEventsCount >= 2 ? 1 : 0) +
    (input.overdueItemsCount >= 3 ? 2 : input.overdueItemsCount >= 1 ? 1 : 0) +
    (input.highPriorityOpenItemsCount >= 4 ? 2 : input.highPriorityOpenItemsCount >= 2 ? 1 : 0);

  const focusScore =
    (input.highPriorityOpenItemsCount >= 2 ? 2 : 0) +
    (input.todayEventsCount <= 2 ? 1 : 0) +
    (input.openTasksCount <= 8 ? 1 : 0);

  const recoveryScore =
    (input.loadLevel === 'high' ? 2 : 0) +
    (input.habitsNeedingAttentionCount >= 3 ? 1 : 0) +
    (input.goalsNeedingAttentionCount >= 2 ? 1 : 0) +
    (input.preferences.overloadProtection === 'on' ? 1 : 0);

  if (pressureScore >= 6) {
    scores.busy += 4;
    reasons.push('high-load-and-calendar-pressure');
  } else if (pressureScore >= 4) {
    scores.busy += 2;
  }

  if (input.preferences.overloadProtection === 'on' && (input.loadLevel === 'high' || recoveryScore >= 4)) {
    scores.recovery += 3;
    reasons.push('high-load-with-overload-protection');
  }

  if (input.overdueItemsCount >= 2 || input.highPriorityOpenItemsCount >= 3) {
    scores.busy += 2;
    scores.focus += 1;
    reasons.push('many-overdue-or-urgent-items');
  }

  if (focusScore >= 4 && input.preferences.productivityMode === 'focus') {
    scores.focus += 4;
    reasons.push('few-clear-focus-points');
  } else if (focusScore >= 3) {
    scores.focus += 2;
  }

  if (input.loadLevel === 'low' && input.openTasksCount <= 6 && input.todayEventsCount <= 1) {
    scores.light += 3;
    reasons.push('light-day-low-pressure');
  }

  if (input.preferences.productivityMode === 'recovery') scores.recovery += 2;
  if (input.preferences.productivityMode === 'light') scores.light += 1;
  if (input.preferences.defaultTimeHorizon === 'today') scores.busy += 1;
  if (input.preferences.defaultTimeHorizon === 'this-week') scores.focus += 1;
  if (input.preferences.targetGroup === 'student' && input.upcomingEventsCount >= 3) scores.busy += 1;

  if (input.activeMissionsCount >= 6 && input.preferences.missionVisibility === 'strong') {
    scores.normal += 1;
  }

  const ranked = sortScores(scores);
  const [bestMode, bestScore] = ranked[0];
  const [, secondScore] = ranked[1];
  const confidence = toConfidence(bestScore, bestScore - secondScore);

  if (reasons.length === 0) {
    reasons.push('balanced-day');
  }

  const reasonMessages = reasons.map((code) => DAY_MODE_SUGGESTION_REASON_MESSAGES[code]);

  return {
    suggestedMode: bestMode,
    confidence,
    reasons: reasonMessages,
    reasonCodes: reasons,
    computedAt: new Date().toISOString(),
    sourceMetricsSummary: {
      loadLevel: input.loadLevel,
      pressureScore,
      focusScore,
      recoveryScore,
    },
  };
}
