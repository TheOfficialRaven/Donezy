import { CALENDAR_SCHEMA_VERSION, DEFAULT_REMINDER_SETTINGS, EVENT_TYPE_COLORS } from './constants';
import type { CalendarEventEntity, CalendarEventType } from './types';
import { toLocalDateKey } from './dateKey';

function toDateKey(value?: string) {
  if (!value) return toLocalDateKey(new Date());
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return toLocalDateKey(new Date());
  return toLocalDateKey(date);
}

function inferType(category?: string): CalendarEventType {
  const c = (category || '').toLowerCase();
  if (c.includes('szabads')) return 'vacation';
  if (c.includes('szület') || c.includes('szulet')) return 'birthday';
  if (c.includes('kiránd') || c.includes('kirand') || c.includes('utaz')) return 'trip';
  if (c.includes('pihen')) return 'rest';
  if (c.includes('emlékezt') || c.includes('emlekezt')) return 'reminder';
  if (c.includes('fókusz') || c.includes('fokusz') || c.includes('időblokk') || c.includes('idoblokk')) return 'focus-block';
  if (c.includes('személyes') || c.includes('szemelyes')) return 'personal';
  if (c.includes('meeting') || c.includes('időpont') || c.includes('idopont')) return 'appointment';
  return 'event';
}

export function normalizeCalendarEvent(raw: any, userId?: string): CalendarEventEntity {
  const now = new Date().toISOString();
  const start = raw?.startTime || now;
  const end = raw?.endTime || new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString();
  const type = (raw?.type as CalendarEventType) || inferType(raw?.category);
  const color = raw?.color || EVENT_TYPE_COLORS[type];
  return {
    id: raw?.id || '',
    userId,
    title: raw?.title || 'Névtelen esemény',
    description: raw?.description || '',
    date: raw?.date || toDateKey(start),
    startTime: start,
    endTime: end,
    allDay: Boolean(raw?.allDay),
    type,
    priority: raw?.priority || 'medium',
    color,
    category: raw?.category || 'Általános',
    notes: raw?.notes,
    location: raw?.location,
    reminderSettings: raw?.reminderSettings
      ? {
          enabled: raw.reminderSettings.enabled !== false,
          minutesBefore: Number(raw.reminderSettings.minutesBefore ?? 15),
          customLabel: raw.reminderSettings.customLabel,
        }
      : {
          ...DEFAULT_REMINDER_SETTINGS,
          ...(raw?.reminder !== undefined ? { minutesBefore: Number(raw.reminder) } : {}),
        },
    status: raw?.status || 'scheduled',
    createdAt: raw?.createdAt || now,
    updatedAt: raw?.updatedAt || now,
    sourceType: raw?.sourceType || 'manual',
    futureOriginReference: raw?.futureOriginReference,
    futureLinkTargets: raw?.futureLinkTargets || {},
    schemaVersion: CALENDAR_SCHEMA_VERSION,
  };
}

export function normalizeCalendarEvents(rawEvents: any[], userId?: string) {
  return rawEvents.map((event) => normalizeCalendarEvent(event, userId));
}
