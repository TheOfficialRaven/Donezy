import type { CalendarEventPriority, CalendarEventStatus, CalendarEventType, ReminderSettings } from './types';

export const CALENDAR_SCHEMA_VERSION = 2 as const;

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: true,
  minutesBefore: 15,
};

export const EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  event: 'Esemény',
  reminder: 'Emlékeztető',
  'focus-block': 'Fókusz blokk',
  appointment: 'Időpont',
  personal: 'Személyes',
  'task-block': 'Feladat blokk',
  rest: 'Pihenés',
  vacation: 'Szabadság',
  birthday: 'Születésnap',
  trip: 'Kirándulás',
};

export const EVENT_TYPE_COLORS: Record<CalendarEventType, string> = {
  event: '#4DA3FF',
  reminder: '#F87171',
  'focus-block': '#818CF8',
  appointment: '#11E1B1',
  personal: '#A78BFA',
  'task-block': '#FFC056',
  rest: '#34D399',
  vacation: '#22D3EE',
  birthday: '#FB7185',
  trip: '#60A5FA',
};

/**
 * A napi terhelés számításnál mekkora "kapacitást" foglaljon az adott típus.
 * 0 => információs esemény (nem csökkenti a tervezhető napot)
 * 1 => teljesen terhelő esemény
 */
export const EVENT_TYPE_CAPACITY_WEIGHT: Record<CalendarEventType, number> = {
  event: 1,
  reminder: 0.1,
  'focus-block': 1,
  appointment: 1,
  personal: 0.7,
  'task-block': 1,
  rest: 0.4,
  vacation: 0,
  birthday: 0,
  trip: 0.8,
};

export const EVENT_PRIORITY_LABELS: Record<CalendarEventPriority, string> = {
  low: 'Alacsony',
  medium: 'Közepes',
  high: 'Magas',
};

export const EVENT_STATUS_LABELS: Record<CalendarEventStatus, string> = {
  scheduled: 'Tervezett',
  completed: 'Kész',
  cancelled: 'Törölt',
  missed: 'Elmulasztott',
};

export const DEFAULT_DAY_START_HOUR = 7;
export const DEFAULT_DAY_END_HOUR = 21;
