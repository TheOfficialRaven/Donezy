import { Button } from '@/components/ui/button';
import type { CalendarEvent } from '@/stores/useAppStore';
import EventChip from './EventChip';
import { Plus } from 'lucide-react';

interface CalendarWeekViewProps {
  weekDays: Date[];
  events: CalendarEvent[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onCreateAt: (date: Date, hour: number) => void;
  onEditEvent: (event: CalendarEvent) => void;
}

const START_HOUR = 7;
const END_HOUR = 21;
const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);
const GRID_HEIGHT = 840; // 14h * 60px

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getEventBlockStyleForDay(event: CalendarEvent, day: Date) {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);
  const segmentStart = start > dayStart ? start : dayStart;
  const segmentEnd = end < dayEnd ? end : dayEnd;
  const rangeStartMinutes = START_HOUR * 60;
  const rangeEndMinutes = END_HOUR * 60;
  const startMinutes = segmentStart.getHours() * 60 + segmentStart.getMinutes();
  const endMinutes = Math.max(startMinutes + 15, segmentEnd.getHours() * 60 + segmentEnd.getMinutes());
  const clampedStart = clamp(startMinutes, rangeStartMinutes, rangeEndMinutes - 15);
  const clampedEnd = clamp(endMinutes, clampedStart + 15, rangeEndMinutes);
  const top = ((clampedStart - rangeStartMinutes) / (rangeEndMinutes - rangeStartMinutes)) * GRID_HEIGHT;
  const height = ((clampedEnd - clampedStart) / (rangeEndMinutes - rangeStartMinutes)) * GRID_HEIGHT;
  return { top, height: Math.max(24, height) };
}

function eventIntersectsDay(event: CalendarEvent, day: Date) {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);
  const eventStart = new Date(event.startTime);
  const eventEnd = new Date(event.endTime);
  return eventStart <= dayEnd && eventEnd >= dayStart;
}

function hourFromClick(clientY: number, rectTop: number, rectHeight: number): number {
  const ratio = clamp((clientY - rectTop) / rectHeight, 0, 0.999);
  const minutesFromStart = Math.floor(ratio * (END_HOUR - START_HOUR) * 60);
  return clamp(START_HOUR + Math.floor(minutesFromStart / 60), START_HOUR, END_HOUR - 1);
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

function dayDiff(a: Date, b: Date) {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function getWeekRibbonRows(weekDays: Date[], events: CalendarEvent[]) {
  const weekStart = startOfDay(weekDays[0]);
  const weekEnd = endOfDay(weekDays[6]);
  const spanning = events
    .filter((event) => {
      const s = new Date(event.startTime);
      const e = new Date(event.endTime);
      return s <= weekEnd && e >= weekStart && (e.getTime() - s.getTime() >= 24 * 60 * 60 * 1000 || s.toDateString() !== e.toDateString());
    })
    .map((event) => {
      const s = new Date(event.startTime);
      const e = new Date(event.endTime);
      const clampedStart = s < weekStart ? weekStart : s;
      const clampedEnd = e > weekEnd ? weekEnd : e;
      const startIndex = clamp(dayDiff(clampedStart, weekStart), 0, 6);
      const endIndex = clamp(dayDiff(clampedEnd, weekStart), 0, 6);
      return { event, startIndex, endIndex };
    })
    .sort((a, b) => a.startIndex - b.startIndex || b.endIndex - a.endIndex);

  const rows: Array<Array<{ event: CalendarEvent; startIndex: number; endIndex: number }>> = [];
  for (const item of spanning) {
    let placed = false;
    for (const row of rows) {
      const overlaps = row.some((existing) => !(item.endIndex < existing.startIndex || item.startIndex > existing.endIndex));
      if (!overlaps) {
        row.push(item);
        placed = true;
        break;
      }
    }
    if (!placed) rows.push([item]);
  }
  return rows.slice(0, 2);
}

export default function CalendarWeekView({ weekDays, events, selectedDate, onSelectDate, onCreateAt, onEditEvent }: CalendarWeekViewProps) {
  const ribbonRows = getWeekRibbonRows(weekDays, events);
  return (
    <div className="overflow-x-auto scrollbar-custom">
      <div className="grid grid-cols-8 gap-1 min-w-[720px]">
        <div />
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={`p-2 text-center text-xs font-medium rounded-md ${
              day.toDateString() === selectedDate.toDateString() ? 'bg-primary/10 text-primary' : 'text-text-muted'
            }`}
          >
            <div>{day.toLocaleDateString('hu-HU', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 mt-1 text-[10px] text-text-secondary"
              onClick={() => onCreateAt(day, 9)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Új esemény
            </Button>
          </div>
        ))}
        <div />
        <div className="col-span-7 rounded-md border border-white/5 bg-surface-1/10 px-1 py-1">
          {ribbonRows.length === 0 ? (
            <div className="h-5 text-[10px] text-text-muted px-2 flex items-center">Tobbnapos esemenyek itt jelennek meg</div>
          ) : (
            <div className="space-y-1">
              {ribbonRows.map((row, rowIdx) => (
                <div key={`ribbon-row-${rowIdx}`} className="grid grid-cols-7 gap-1">
                  {row.map((item) => (
                    <button
                      key={item.event.id}
                      type="button"
                      className="h-5 rounded px-2 text-[10px] text-surface-0 truncate text-left"
                      style={{
                        backgroundColor: item.event.color,
                        gridColumn: `${item.startIndex + 1} / ${item.endIndex + 2}`,
                      }}
                      onClick={() => onEditEvent(item.event)}
                      title={item.event.title}
                    >
                      {item.event.title}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          {hours.map((hour) => (
            <div key={`hour-label-${hour}`} className="h-[60px] p-2 text-xs text-text-muted text-right">
              {hour}:00
            </div>
          ))}
        </div>
        {weekDays.map((day) => {
          const dayEvents = events
            .filter((event) => eventIntersectsDay(event, day))
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
          return (
            <div
              key={`day-column-${day.toISOString()}`}
              className={`relative rounded-md border overflow-hidden cursor-pointer ${
                day.toDateString() === selectedDate.toDateString() ? 'border-primary/40 bg-primary/5' : 'border-white/5 bg-surface-1/10'
              }`}
              style={{ height: GRID_HEIGHT }}
              onClick={(e) => {
                onSelectDate(day);
                const rect = e.currentTarget.getBoundingClientRect();
                onCreateAt(day, hourFromClick(e.clientY, rect.top, rect.height));
              }}
            >
              {hours.slice(0, -1).map((hour) => (
                <div key={`line-${day.toISOString()}-${hour}`} className="absolute left-0 right-0 border-t border-white/10" style={{ top: (hour - START_HOUR) * 60 }} />
              ))}
              {dayEvents.map((event) => {
                const style = getEventBlockStyleForDay(event, day);
                return (
                  <div
                    key={event.id}
                    className="absolute left-1 right-1"
                    style={{ top: style.top, height: style.height }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <EventChip event={event} compact stretch onClick={() => onEditEvent(event)} />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
