import { motion } from 'framer-motion';
import type { CalendarEvent } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';
import EventChip from './EventChip';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface CalendarMonthViewProps {
  currentDate: Date;
  selectedDate: Date;
  events: CalendarEvent[];
  onSelectDate: (date: Date) => void;
  onEditEvent: (event: CalendarEvent) => void;
  onQuickAddEvent: (date: Date) => void;
}

const DAY_LABELS = ['H', 'K', 'Sz', 'Cs', 'P', 'Szo', 'V'];

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}
function sameMonth(a: Date, b: Date) {
  return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
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

function daysForMonthGrid(currentDate: Date) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const first = new Date(year, month, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const days: Date[] = [];
  for (let i = mondayOffset; i > 0; i--) days.push(new Date(year, month, 1 - i));
  const last = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= last; d++) days.push(new Date(year, month, d));
  while (days.length < 42) days.push(new Date(year, month + 1, days.length - last - mondayOffset + 1));
  return days;
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
      const startIndex = Math.max(0, Math.min(6, dayDiff(clampedStart, weekStart)));
      const endIndex = Math.max(0, Math.min(6, dayDiff(clampedEnd, weekStart)));
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

export default function CalendarMonthView({
  currentDate,
  selectedDate,
  events,
  onSelectDate,
  onEditEvent,
  onQuickAddEvent,
}: CalendarMonthViewProps) {
  const days = daysForMonthGrid(currentDate);
  const weeks = Array.from({ length: 6 }, (_, i) => days.slice(i * 7, i * 7 + 7));
  const today = new Date();
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-7 gap-1">
      {DAY_LABELS.map((label) => (
        <div key={label} className="p-2 text-center text-xs font-medium text-text-muted">{label}</div>
      ))}
      </div>

      {weeks.map((weekDays, weekIdx) => {
        const ribbonRows = getWeekRibbonRows(weekDays, events);
        return (
          <div key={`week-${weekIdx}`} className="space-y-1">
            <div className="grid grid-cols-7 gap-1 rounded-md border border-white/5 bg-surface-1/10 p-1">
              {ribbonRows.length === 0 ? (
                <div className="col-span-7 h-4 text-[10px] text-text-muted px-2 flex items-center">
                  Tobbnapos esemenyek
                </div>
              ) : (
                ribbonRows.map((row, rowIdx) => (
                  <div key={`month-ribbon-${weekIdx}-${rowIdx}`} className="col-span-7 grid grid-cols-7 gap-1">
                    {row.map((item) => (
                      <button
                        key={item.event.id}
                        type="button"
                        className="h-4 rounded px-1.5 text-[10px] text-surface-0 truncate text-left"
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
                ))
              )}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((date, dayIdx) => {
                const dayEvents = events
                  .filter((event) => eventIntersectsDay(event, date))
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
                const index = weekIdx * 7 + dayIdx;
                return (
                  <motion.div
                    key={`${date.toISOString()}-${index}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.005 }}
                    onClick={() => onSelectDate(date)}
                    className={cn(
                      'min-h-[92px] p-2 border border-white/5 rounded-lg cursor-pointer hover:bg-surface-1/30',
                      !sameMonth(date, currentDate) && 'opacity-50',
                      sameDay(date, today) && 'bg-primary/10 border-primary/30',
                      sameDay(date, selectedDate) && 'ring-1 ring-secondary/40'
                    )}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <div className={cn('text-sm', sameDay(date, today) ? 'text-primary font-semibold' : 'text-text-primary')}>{date.getDate()}</div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-text-muted hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickAddEvent(date);
                        }}
                        title="Gyors esemény hozzáadás"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {dayEvents
                        .filter((event) => {
                          const sameStartEndDay = new Date(event.startTime).toDateString() === new Date(event.endTime).toDateString();
                          return sameStartEndDay || new Date(event.startTime).toDateString() === date.toDateString();
                        })
                        .slice(0, 2)
                        .map((event) => (
                          <EventChip key={event.id} event={event} compact onClick={() => onEditEvent(event)} />
                        ))}
                      {dayEvents.length > 2 && <div className="text-[11px] text-text-muted">+{dayEvents.length - 2} további</div>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
