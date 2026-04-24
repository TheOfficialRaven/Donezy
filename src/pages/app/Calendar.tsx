import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore, type CalendarEvent } from '@/stores/useAppStore';
import {
  getCalendarProductivityMetrics,
  getEventsForDay,
  getEventsForMonth,
  getEventsForWeek,
  getUpcomingEvents,
} from '@/lib/calendar/selectors';
import CalendarToolbar from '@/components/calendar/CalendarToolbar';
import CalendarMonthView from '@/components/calendar/CalendarMonthView';
import CalendarWeekView from '@/components/calendar/CalendarWeekView';
import CalendarDayView from '@/components/calendar/CalendarDayView';
import UpcomingEventsPanel from '@/components/calendar/UpcomingEventsPanel';
import TodaySummaryPanel from '@/components/calendar/TodaySummaryPanel';
import CalendarEmptyState from '@/components/calendar/CalendarEmptyState';
import EventPreviewDialog from '@/components/calendar/EventPreviewDialog';
import EventDialog from '@/components/dialogs/EventDialog';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import { toast } from 'sonner';
import { fromLocalDateKey, toLocalDateKey } from '@/lib/calendar/dateKey';
import { Trash2 } from 'lucide-react';

function dateFromKey(key: string) {
  return fromLocalDateKey(key);
}
function addDays(date: Date, days: number) {
  const out = new Date(date);
  out.setDate(out.getDate() + days);
  return out;
}
function startOfWeek(base: Date) {
  const d = new Date(base);
  const mondayIndex = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - mondayIndex);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function Calendar() {
  const {
    events,
    currentCalendarView,
    selectedCalendarDate,
    calendarSearchQuery,
    calendarFilterType,
    calendarFilterStatus,
    calendarFilterCategory,
    setCalendarView,
    setSelectedCalendarDate,
    setCalendarSearchQuery,
    setCalendarFilterType,
    setCalendarFilterStatus,
    setCalendarFilterCategory,
    addEvent,
    deleteEvent,
  } = useAppStore();

  const selectedDate = useMemo(() => dateFromKey(selectedCalendarDate), [selectedCalendarDate]);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewEvent, setPreviewEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [defaultCategory, setDefaultCategory] = useState<string | undefined>(undefined);
  const [defaultStartTime, setDefaultStartTime] = useState<Date | undefined>(undefined);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        const query = calendarSearchQuery.trim().toLowerCase();
        const queryMatch =
          !query ||
          event.title.toLowerCase().includes(query) ||
          (event.description || '').toLowerCase().includes(query) ||
          (event.category || '').toLowerCase().includes(query);
        const typeMatch = calendarFilterType === 'all' || event.type === calendarFilterType;
        const statusMatch = calendarFilterStatus === 'all' || event.status === calendarFilterStatus;
        const categoryMatch = calendarFilterCategory === 'all' || event.category === calendarFilterCategory;
        return queryMatch && typeMatch && statusMatch && categoryMatch;
      }),
    [events, calendarSearchQuery, calendarFilterType, calendarFilterStatus, calendarFilterCategory]
  );

  const monthEvents = useMemo(() => getEventsForMonth(filteredEvents as any, selectedDate), [filteredEvents, selectedDate]);
  const weekEvents = useMemo(() => getEventsForWeek(filteredEvents as any, selectedDate), [filteredEvents, selectedDate]);
  const dayEvents = useMemo(() => getEventsForDay(filteredEvents as any, selectedDate), [filteredEvents, selectedDate]);
  const upcomingEvents = useMemo(() => getUpcomingEvents(filteredEvents as any, new Date(), 6), [filteredEvents]);
  const metrics = useMemo(() => getCalendarProductivityMetrics(filteredEvents as any, selectedDate), [filteredEvents, selectedDate]);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(selectedDate), i)), [selectedDate]);
  const categories = useMemo(
    () => Array.from(new Set(events.map((event) => event.category).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'hu')),
    [events]
  );

  const headerTitle = useMemo(() => {
    if (currentCalendarView === 'month') return selectedDate.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' });
    if (currentCalendarView === 'week') {
      const from = weekDays[0];
      const to = weekDays[6];
      return `${from.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })} - ${to.toLocaleDateString('hu-HU', {
        month: 'short',
        day: 'numeric',
      })}`;
    }
    return selectedDate.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  }, [currentCalendarView, selectedDate, weekDays]);

  const navigatePeriod = (direction: 'prev' | 'next') => {
    const delta = direction === 'next' ? 1 : -1;
    const next = new Date(selectedDate);
    if (currentCalendarView === 'month') next.setMonth(next.getMonth() + delta);
    if (currentCalendarView === 'week') next.setDate(next.getDate() + delta * 7);
    if (currentCalendarView === 'day') next.setDate(next.getDate() + delta);
    setSelectedCalendarDate(toLocalDateKey(next));
  };

  const handleNewEvent = (category?: string, startTime?: Date) => {
    setEditingEvent(null);
    setDefaultCategory(category);
    setDefaultStartTime(startTime);
    setEventDialogOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setDefaultCategory(undefined);
    setDefaultStartTime(undefined);
    setEventDialogOpen(true);
  };

  const handlePreviewEvent = (event: CalendarEvent) => {
    setPreviewEvent(event);
    setPreviewDialogOpen(true);
  };

  const handleQuickCreateAt = async (date: Date, hour: number) => {
    const start = new Date(date);
    start.setHours(hour, 0, 0, 0);
    handleNewEvent(undefined, start);
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    await deleteEvent(eventToDelete);
    setDeleteConfirmOpen(false);
    setEventToDelete(null);
    toast.success('Esemény törölve.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-text-primary">Naptár</h1>
        <p className="text-text-secondary">Átlátható napi/heti időtervezés fókuszblokkokkal és támogatott terhelésérzettel.</p>
      </div>

      <CalendarToolbar
        title={headerTitle}
        view={currentCalendarView}
        onViewChange={setCalendarView}
        onPrev={() => navigatePeriod('prev')}
        onNext={() => navigatePeriod('next')}
        onToday={() => {
          setSelectedCalendarDate(toDateKey(new Date()));
          setCalendarView('day');
        }}
        onCreate={() => handleNewEvent()}
        searchQuery={calendarSearchQuery}
        onSearchQueryChange={setCalendarSearchQuery}
        filterType={calendarFilterType}
        onFilterTypeChange={setCalendarFilterType}
        filterStatus={calendarFilterStatus}
        onFilterStatusChange={setCalendarFilterStatus}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="glass p-3 sm:p-5">
            <div className="flex justify-end mb-3">
              <Select value={calendarFilterCategory} onValueChange={setCalendarFilterCategory}>
                <SelectTrigger className="w-[220px] bg-surface-1/50 border-white/10">
                  <SelectValue placeholder="Kategória" />
                </SelectTrigger>
                <SelectContent className="bg-surface-1 border-white/10">
                  <SelectItem value="all">Minden kategória</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filteredEvents.length === 0 ? (
              <CalendarEmptyState mode="no-filter-results" />
            ) : currentCalendarView === 'month' ? (
              <CalendarMonthView
                currentDate={selectedDate}
                selectedDate={selectedDate}
                events={monthEvents as CalendarEvent[]}
                onSelectDate={(date) => setSelectedCalendarDate(toLocalDateKey(date))}
                onEditEvent={handlePreviewEvent}
                onQuickAddEvent={(date) => {
                  const start = new Date(date);
                  start.setHours(9, 0, 0, 0);
                  handleNewEvent(undefined, start);
                }}
              />
            ) : currentCalendarView === 'week' ? (
              <CalendarWeekView
                weekDays={weekDays}
                events={weekEvents as CalendarEvent[]}
                selectedDate={selectedDate}
                onSelectDate={(date) => setSelectedCalendarDate(toLocalDateKey(date))}
                onCreateAt={(date, hour) => handleQuickCreateAt(date, hour)}
                onEditEvent={handlePreviewEvent}
              />
            ) : (
              <CalendarDayView
                date={selectedDate}
                events={dayEvents as CalendarEvent[]}
                onCreateAt={(hour) => handleQuickCreateAt(selectedDate, hour)}
                onEditEvent={handlePreviewEvent}
              />
            )}

            <div className="mt-4 rounded-lg border border-white/10 bg-surface-1/30 p-3">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    {selectedDate.toLocaleDateString('hu-HU', { month: 'long', day: 'numeric', weekday: 'long' })}
                  </h3>
                  <p className="text-xs text-text-muted">
                    {dayEvents.length > 0 ? `${dayEvents.length} esemény ezen a napon` : 'Nincs esemény erre a napra'}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs px-2 py-1 rounded border border-white/20 text-text-primary hover:bg-white/5"
                  onClick={() => {
                    const start = new Date(selectedDate);
                    start.setHours(9, 0, 0, 0);
                    handleNewEvent(undefined, start);
                  }}
                >
                  + Esemény ehhez a naphoz
                </button>
              </div>
              {dayEvents.length > 0 && (
                <div className="space-y-1">
                  {dayEvents.slice(0, 4).map((event) => (
                    <div
                      key={event.id}
                      role="button"
                      tabIndex={0}
                      className="w-full text-left px-2 py-1 rounded bg-surface-1/50 hover:bg-surface-1/70 text-sm text-text-primary flex items-center justify-between gap-2 cursor-pointer"
                      onClick={() => handlePreviewEvent(event)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handlePreviewEvent(event);
                        }
                      }}
                    >
                      <span className="flex-1 min-w-0 truncate">
                        {new Date(event.startTime).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })} · {event.title}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-danger hover:text-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEventToDelete(event.id);
                          setDeleteConfirmOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {metrics.dailyLoadIndicator === 'overloaded' && <CalendarEmptyState mode="overloaded-day" />}
          <TodaySummaryPanel metrics={metrics} />
          <UpcomingEventsPanel events={upcomingEvents as CalendarEvent[]} onEditEvent={handlePreviewEvent} />
        </div>
      </div>

      <EventPreviewDialog
        open={previewDialogOpen}
        event={previewEvent}
        onOpenChange={(open) => {
          setPreviewDialogOpen(open);
          if (!open) setPreviewEvent(null);
        }}
        onEdit={(event) => {
          setPreviewDialogOpen(false);
          handleEditEvent(event);
        }}
      />
      <EventDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        event={editingEvent}
        defaultCategory={defaultCategory}
        defaultStartTime={defaultStartTime}
        onDeleteRequest={(eventId) => {
          setEventToDelete(eventId);
          setDeleteConfirmOpen(true);
          setPreviewDialogOpen(false);
          setPreviewEvent(null);
        }}
      />
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Esemény törlése"
        description="Biztosan törölni szeretnéd ezt az eseményt?"
        confirmLabel="Törlés"
        onConfirm={handleDeleteEvent}
        destructive
      />
    </div>
  );
}
