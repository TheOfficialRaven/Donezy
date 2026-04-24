import type { CalendarEventEntity } from './types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateKey(date: string) {
  if (!DATE_RE.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
}

export function isValidISO(value: string) {
  return !Number.isNaN(new Date(value).getTime());
}

export function validateCalendarEventInput(event: Partial<CalendarEventEntity>) {
  const errors: string[] = [];
  if (!event.title || !event.title.trim()) errors.push('Az esemény címe kötelező.');
  if (!event.date || !isValidDateKey(event.date)) errors.push('Érvénytelen dátum.');
  if (!event.startTime || !isValidISO(event.startTime)) errors.push('Érvénytelen kezdési idő.');
  if (!event.endTime || !isValidISO(event.endTime)) errors.push('Érvénytelen befejezési idő.');
  if (event.startTime && event.endTime && isValidISO(event.startTime) && isValidISO(event.endTime)) {
    if (new Date(event.endTime).getTime() < new Date(event.startTime).getTime()) {
      errors.push('A befejezés nem lehet a kezdés előtt.');
    }
  }
  if (event.allDay && event.startTime && event.endTime) {
    const s = new Date(event.startTime);
    const e = new Date(event.endTime);
    if (s.getHours() !== 0 || s.getMinutes() !== 0 || e.getHours() !== 23 || e.getMinutes() !== 59) {
      errors.push('Egész napos eseménynél a kezdés 00:00 és a befejezés 23:59 legyen.');
    }
  }
  return errors;
}
