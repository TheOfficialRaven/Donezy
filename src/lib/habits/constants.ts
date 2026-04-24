import type {
  HabitDetectionMode,
  HabitFrequencyType,
  HabitSignalEventType,
  HabitSourceType,
  HabitTrackingMode,
  HabitsViewFilter,
  HabitTrackingModeFilter,
  HabitsStatusFilter,
  HabitTimeRangeFilter,
} from './types';

export const HABITS_SCHEMA_VERSION = 2 as const;

export const HABIT_TRACKING_MODES: HabitTrackingMode[] = ['auto', 'manual', 'hybrid'];
export const HABIT_DETECTION_MODES: HabitDetectionMode[] = ['system-detected', 'user-created', 'promoted-from-pattern'];
export const HABIT_FREQUENCY_TYPES: HabitFrequencyType[] = ['daily', 'weekly', 'custom'];
export const HABIT_SOURCE_TYPES: HabitSourceType[] = ['manual', 'import', 'suggestion', 'system', 'integration'];

export const HABIT_SIGNAL_EVENT_TYPES: HabitSignalEventType[] = [
  'reflection_completed',
  'reading_log_added',
  'goal_milestone_completed',
  'list_item_completed',
  'calendar_event_completed',
  'note_added',
  'planning_activity',
  'other',
];

export const HABITS_VIEW_FILTER_LABELS: Record<HabitsViewFilter, string> = {
  all: 'Osszes',
  active: 'Aktiv',
  archived: 'Archivalt',
  today: 'Mai',
  auto: 'Auto tracked',
  manual: 'Manual',
  hybrid: 'Hybrid',
  trends: 'Trendek',
};

export const HABITS_STATUS_FILTER_LABELS: Record<HabitsStatusFilter, string> = {
  all: 'Minden allapot',
  active: 'Aktiv',
  paused: 'Szünetel',
  inactive: 'Inaktiv',
  archived: 'Archivalt',
};

export const HABITS_TRACKING_FILTER_LABELS: Record<HabitTrackingModeFilter, string> = {
  all: 'Minden mod',
  auto: 'Auto',
  manual: 'Manual',
  hybrid: 'Hybrid',
};

export const HABIT_TIME_RANGE_FILTERS: HabitTimeRangeFilter[] = ['7d', '14d', '30d', '90d'];
export const HABIT_TIME_RANGE_LABELS: Record<HabitTimeRangeFilter, string> = {
  '7d': '7 nap',
  '14d': '14 nap',
  '30d': '30 nap',
  '90d': '90 nap',
};

export const HABIT_SIGNAL_EVENT_LABELS: Record<HabitSignalEventType, string> = {
  reflection_completed: 'Reflexio kesz',
  reading_log_added: 'Olvasasi log',
  goal_milestone_completed: 'Cel merfoldko kesz',
  list_item_completed: 'Lista elem kesz',
  calendar_event_completed: 'Naptar esemeny kesz',
  note_added: 'Jegyzet hozzaadva',
  planning_activity: 'Tervezesi aktivitas',
  other: 'Egyeb aktivitas',
};

export const HABIT_TRACKING_MODE_LABELS: Record<HabitTrackingMode, string> = {
  auto: 'Automatikus',
  manual: 'Manualis',
  hybrid: 'Hybrid',
};

export const HABIT_FREQUENCY_TYPE_LABELS: Record<HabitFrequencyType, string> = {
  daily: 'Napi',
  weekly: 'Heti',
  custom: 'Egyedi',
};

export const DEFAULT_HABIT_COLOR = '#8B5CF6';
export const DEFAULT_HABIT_ICON = 'repeat';

export const HABIT_PROMOTION_MIN_OCCURRENCES = 3;
export const HABIT_PROMOTION_MIN_ACTIVE_DAYS = 3;
export const HABIT_PROMOTION_MIN_REPEAT_SCORE = 0.55;
export const HABIT_CANDIDATE_LOOKBACK_DAYS = 30;
export const HABIT_ACTIVE_OVERLOAD_THRESHOLD = 10;
export const HABIT_NEGLECTED_DAYS = 5;
export const HABIT_WOBBLE_DAYS = 2;
