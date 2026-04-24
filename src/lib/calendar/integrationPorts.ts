import type { CalendarEventEntity } from './types';

export interface CalendarGuidanceCandidate {
  eventId: string;
  title: string;
  date: string;
  startTime: string;
  type: string;
  priority: string;
}

export function toGuidanceCandidate(event: CalendarEventEntity): CalendarGuidanceCandidate | null {
  if (!event.futureLinkTargets?.dailyGuidanceCandidate) return null;
  return {
    eventId: event.id,
    title: event.title,
    date: event.date,
    startTime: event.startTime,
    type: event.type,
    priority: event.priority,
  };
}

export function toDashboardHighlightCandidate(event: CalendarEventEntity): CalendarGuidanceCandidate | null {
  if (!event.futureLinkTargets?.dashboardHighlightCandidate) return null;
  return {
    eventId: event.id,
    title: event.title,
    date: event.date,
    startTime: event.startTime,
    type: event.type,
    priority: event.priority,
  };
}
