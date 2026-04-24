import { DEFAULT_DAY_END_HOUR, DEFAULT_DAY_START_HOUR } from './constants';
import { EVENT_TYPE_CAPACITY_WEIGHT } from './constants';
import type { CalendarEventEntity, CalendarProductivityMetrics } from './types';

function startOfWeek(base: Date) {
  const out = new Date(base);
  out.setHours(0, 0, 0, 0);
  const day = (out.getDay() + 6) % 7;
  out.setDate(out.getDate() - day);
  return out;
}

function addDays(date: Date, days: number) {
  const out = new Date(date);
  out.setDate(out.getDate() + days);
  return out;
}

function startOfDay(date: Date) {
  const out = new Date(date);
  out.setHours(0, 0, 0, 0);
  return out;
}

function endOfDay(date: Date) {
  const out = new Date(date);
  out.setHours(23, 59, 59, 999);
  return out;
}

function getMinutesOnDay(event: Pick<CalendarEventEntity, 'startTime' | 'endTime'>, date: Date) {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const segmentStart = start > dayStart ? start : dayStart;
  const segmentEnd = end < dayEnd ? end : dayEnd;
  if (segmentEnd <= segmentStart) return 0;
  const minutes = Math.round((segmentEnd.getTime() - segmentStart.getTime()) / 60000);
  return Math.max(0, Math.min(24 * 60, minutes));
}

export function getEventsForDay(events: CalendarEventEntity[], date: Date) {
  return events
    .filter((event) => getMinutesOnDay(event, date) > 0)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

export function getEventsForWeek(events: CalendarEventEntity[], date: Date) {
  const start = startOfWeek(date);
  const end = addDays(start, 7);
  return events
    .filter((event) => {
      const time = new Date(event.startTime).getTime();
      return time >= start.getTime() && time < end.getTime();
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

export function getEventsForMonth(events: CalendarEventEntity[], date: Date) {
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const gridStart = startOfWeek(firstOfMonth);
  const gridEnd = addDays(gridStart, 42);
  return events
    .filter((event) => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      return start < gridEnd && end >= gridStart;
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

export function getUpcomingEvents(events: CalendarEventEntity[], now = new Date(), limit = 8) {
  return events
    .filter((event) => new Date(event.startTime).getTime() >= now.getTime() && event.status === 'scheduled')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, limit);
}

export function getTodayEvents(events: CalendarEventEntity[]) {
  return getEventsForDay(events, new Date());
}

export function getOverdueOrMissedEvents(events: CalendarEventEntity[], now = new Date()) {
  return events.filter((event) => {
    if (event.status === 'missed') return true;
    return event.status === 'scheduled' && new Date(event.endTime).getTime() < now.getTime();
  });
}

export function getCompletedEventsCount(events: CalendarEventEntity[]) {
  return events.filter((event) => event.status === 'completed').length;
}

export function getScheduledEventsCount(events: CalendarEventEntity[]) {
  return events.filter((event) => event.status === 'scheduled').length;
}

export function getFocusBlocksForDay(events: CalendarEventEntity[], date: Date) {
  return getEventsForDay(events, date).filter((event) => event.type === 'focus-block');
}

export function getTotalScheduledMinutesForDay(events: CalendarEventEntity[], date: Date) {
  const minutes = getEventsForDay(events, date)
    .filter((event) => event.status === 'scheduled' || event.status === 'completed')
    .reduce((sum, event) => {
      const dayMinutes = getMinutesOnDay(event, date);
      const weight = EVENT_TYPE_CAPACITY_WEIGHT[event.type] ?? 1;
      return sum + dayMinutes * weight;
    }, 0);
  return Math.min(24 * 60, Math.round(minutes));
}

export function getFreeTimeGapsForDay(events: CalendarEventEntity[], date: Date) {
  const dayEvents = getEventsForDay(events, date)
    .filter((event) => event.status !== 'cancelled' && (EVENT_TYPE_CAPACITY_WEIGHT[event.type] ?? 1) > 0)
    .map((event) => {
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      return {
        start: start > dayStart ? start : dayStart,
        end: end < dayEnd ? end : dayEnd,
      };
    });
  const dayStart = new Date(date);
  dayStart.setHours(DEFAULT_DAY_START_HOUR, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(DEFAULT_DAY_END_HOUR, 0, 0, 0);
  if (dayEvents.length === 0) {
    return [{ start: dayStart, end: dayEnd, minutes: Math.round((dayEnd.getTime() - dayStart.getTime()) / 60000) }];
  }
  const gaps: Array<{ start: Date; end: Date; minutes: number }> = [];
  let cursor = dayStart;
  for (const event of dayEvents) {
    if (event.start.getTime() > cursor.getTime()) {
      const minutes = Math.round((event.start.getTime() - cursor.getTime()) / 60000);
      gaps.push({ start: new Date(cursor), end: new Date(event.start), minutes });
    }
    if (event.end.getTime() > cursor.getTime()) cursor = new Date(event.end);
  }
  if (cursor.getTime() < dayEnd.getTime()) {
    gaps.push({ start: new Date(cursor), end: dayEnd, minutes: Math.round((dayEnd.getTime() - cursor.getTime()) / 60000) });
  }
  return gaps.filter((gap) => gap.minutes > 0);
}

export function getDailyLoadIndicator(events: CalendarEventEntity[], date: Date): 'low' | 'balanced' | 'high' | 'overloaded' {
  const minutes = getTotalScheduledMinutesForDay(events, date);
  if (minutes >= 540) return 'overloaded';
  if (minutes >= 420) return 'high';
  if (minutes >= 180) return 'balanced';
  return 'low';
}

export function getEventCandidatesForGuidance(events: CalendarEventEntity[], date = new Date()) {
  const todayEvents = getEventsForDay(events, date);
  return todayEvents
    .filter(
      (event) =>
        event.status === 'scheduled' &&
        (event.type === 'focus-block' ||
          event.priority === 'high' ||
          event.futureLinkTargets?.dailyGuidanceCandidate)
    )
    .map((event) => ({
      id: event.id,
      title: event.title,
      type: event.type,
      startTime: event.startTime,
      priority: event.priority,
    }));
}

export function getCalendarProductivityMetrics(events: CalendarEventEntity[], date = new Date()): CalendarProductivityMetrics {
  const totalScheduledMinutesForDay = getTotalScheduledMinutesForDay(events, date);
  const freeMinutes = getFreeTimeGapsForDay(events, date).reduce((sum, gap) => sum + gap.minutes, 0);
  return {
    completedEventsCount: getCompletedEventsCount(events),
    scheduledEventsCount: getScheduledEventsCount(events),
    overdueOrMissedEventsCount: getOverdueOrMissedEvents(events).length,
    todayEventsCount: getTodayEvents(events).length,
    todayFocusBlocksCount: getFocusBlocksForDay(events, date).length,
    totalScheduledMinutesForDay,
    totalFreeMinutesForDay: freeMinutes,
    dailyLoadIndicator: getDailyLoadIndicator(events, date),
  };
}
