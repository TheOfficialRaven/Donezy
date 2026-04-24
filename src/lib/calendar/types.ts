export type CalendarView = 'month' | 'week' | 'day';

export type CalendarEventType =
  | 'event'
  | 'reminder'
  | 'focus-block'
  | 'appointment'
  | 'personal'
  | 'task-block'
  | 'rest'
  | 'vacation'
  | 'birthday'
  | 'trip';

export type CalendarEventPriority = 'low' | 'medium' | 'high';
export type CalendarEventStatus = 'scheduled' | 'completed' | 'cancelled' | 'missed';
export type CalendarSourceType = 'manual' | 'quick-add' | 'imported' | 'suggested' | 'list-candidate' | 'goal-candidate';

export interface ReminderSettings {
  enabled: boolean;
  minutesBefore: number;
  customLabel?: string;
}

export interface FutureOriginReference {
  module: 'lists' | 'goals' | 'quests' | 'habits' | 'dashboard' | 'calendar' | 'unknown';
  id?: string;
  note?: string;
}

export interface CalendarFutureLinkTargets {
  dailyGuidanceCandidate?: boolean;
  dashboardHighlightCandidate?: boolean;
  focusBlockCandidate?: boolean;
  loadAnalyzerCandidate?: boolean;
}

export interface CalendarEventEntity {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD local date key
  startTime: string; // ISO
  endTime: string; // ISO
  allDay: boolean;
  type: CalendarEventType;
  priority: CalendarEventPriority;
  color: string;
  category: string;
  notes?: string;
  location?: string;
  reminderSettings: ReminderSettings;
  status: CalendarEventStatus;
  createdAt: string;
  updatedAt: string;
  sourceType: CalendarSourceType;
  futureOriginReference?: FutureOriginReference;
  futureLinkTargets: CalendarFutureLinkTargets;
  schemaVersion: 2;
}

export interface CalendarProductivityMetrics {
  completedEventsCount: number;
  scheduledEventsCount: number;
  overdueOrMissedEventsCount: number;
  todayEventsCount: number;
  todayFocusBlocksCount: number;
  totalScheduledMinutesForDay: number;
  totalFreeMinutesForDay: number;
  dailyLoadIndicator: 'low' | 'balanced' | 'high' | 'overloaded';
}
