import type { GuidanceEngineInputs } from './types';

export function normalizeGuidanceInputs(input: GuidanceEngineInputs): GuidanceEngineInputs {
  return {
    ...input,
    signals: {
      ...input.signals,
      openTasksCount: Math.max(0, input.signals.openTasksCount),
      overdueItemsCount: Math.max(0, input.signals.overdueItemsCount),
      highPriorityOpenItemsCount: Math.max(0, input.signals.highPriorityOpenItemsCount),
      todayEventsCount: Math.max(0, input.signals.todayEventsCount),
      upcomingEventsCount: Math.max(0, input.signals.upcomingEventsCount),
      goalsNeedingAttentionCount: Math.max(0, input.signals.goalsNeedingAttentionCount),
      habitsNeedingAttentionCount: Math.max(0, input.signals.habitsNeedingAttentionCount),
      missionActiveCount: Math.max(0, input.signals.missionActiveCount),
      quickCaptureUnprocessedCount: Math.max(0, input.signals.quickCaptureUnprocessedCount),
      readingActiveCount: Math.max(0, input.signals.readingActiveCount),
    },
  };
}
