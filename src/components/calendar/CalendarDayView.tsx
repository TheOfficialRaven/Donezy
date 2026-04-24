import type { CalendarEvent } from '@/stores/useAppStore';
import EventChip from './EventChip';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface CalendarDayViewProps {
  date: Date;
  events: CalendarEvent[];
  onCreateAt: (hour: number) => void;
  onEditEvent: (event: CalendarEvent) => void;
}

const START_HOUR = 7;
const END_HOUR = 21;
const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);
const GRID_HEIGHT = 840; // 14h * 60px

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getEventBlockStyle(event: CalendarEvent) {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const rangeStartMinutes = START_HOUR * 60;
  const rangeEndMinutes = END_HOUR * 60;
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = Math.max(startMinutes + 15, end.getHours() * 60 + end.getMinutes());
  const clampedStart = clamp(startMinutes, rangeStartMinutes, rangeEndMinutes - 15);
  const clampedEnd = clamp(endMinutes, clampedStart + 15, rangeEndMinutes);
  const top = ((clampedStart - rangeStartMinutes) / (rangeEndMinutes - rangeStartMinutes)) * GRID_HEIGHT;
  const height = ((clampedEnd - clampedStart) / (rangeEndMinutes - rangeStartMinutes)) * GRID_HEIGHT;
  return { top, height: Math.max(28, height) };
}

function hourFromClick(clientY: number, rectTop: number, rectHeight: number): number {
  const ratio = clamp((clientY - rectTop) / rectHeight, 0, 0.999);
  const minutesFromStart = Math.floor(ratio * (END_HOUR - START_HOUR) * 60);
  return clamp(START_HOUR + Math.floor(minutesFromStart / 60), START_HOUR, END_HOUR - 1);
}

export default function CalendarDayView({ date, events, onCreateAt, onEditEvent }: CalendarDayViewProps) {
  const dayEvents = events
    .filter((event) => {
      const d = new Date(event.startTime);
      return d.toDateString() === date.toDateString();
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="text-sm sm:text-base font-semibold text-text-primary">
          {date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </h3>
        <Button size="sm" className="bg-primary hover:bg-primary/90 text-surface-0" onClick={() => onCreateAt(9)}>
          <Plus className="h-4 w-4 mr-1" />
          Új esemény
        </Button>
      </div>
      <div className="flex gap-2">
        <div className="w-14">
          {hours.map((hour) => (
            <div key={hour} className="h-[60px] text-xs text-text-muted text-right pr-1">
              {hour}:00
            </div>
          ))}
        </div>
        <div
          className="relative flex-1 rounded-lg border border-white/10 bg-surface-1/20 overflow-hidden cursor-pointer"
          style={{ height: GRID_HEIGHT }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            onCreateAt(hourFromClick(e.clientY, rect.top, rect.height));
          }}
        >
          {hours.slice(0, -1).map((hour) => (
            <div key={`line-${hour}`} className="absolute left-0 right-0 border-t border-white/10" style={{ top: (hour - START_HOUR) * 60 }} />
          ))}

          {dayEvents.map((event) => {
            const style = getEventBlockStyle(event);
            return (
              <div
                key={event.id}
                className="absolute left-2 right-2"
                style={{ top: style.top, height: style.height }}
                onClick={(e) => e.stopPropagation()}
              >
                <EventChip event={event} stretch onClick={() => onEditEvent(event)} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
