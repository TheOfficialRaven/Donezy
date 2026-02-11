import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Bell, MoreHorizontal, Trash2, Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppStore, type CalendarEvent } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';
import EventDialog from '@/components/dialogs/EventDialog';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import { toast } from 'sonner';

type ViewMode = 'month' | 'week' | 'day';

export default function Calendar() {
  const { events, deleteEvent } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [defaultCategory, setDefaultCategory] = useState<string | undefined>(undefined);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();
  const isSameMonth = (date: Date, ref: Date) => date.getMonth() === ref.getMonth() && date.getFullYear() === ref.getFullYear();

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    for (let i = firstDay.getDay() - 1; i >= 0; i--) days.push(new Date(year, month, -i));
    for (let day = 1; day <= lastDay.getDate(); day++) days.push(new Date(year, month, day));
    const rem = 42 - days.length;
    for (let day = 1; day <= rem; day++) days.push(new Date(year, month + 1, day));
    return days;
  };

  const getEventsForDate = (date: Date) => events.filter(e => new Date(e.startTime).toDateString() === date.toDateString());
  const navigateMonth = (dir: 'prev' | 'next') => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + (dir === 'next' ? 1 : -1)));

  const today = new Date();
  const upcomingEvents = events.filter(e => new Date(e.startTime) >= today).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).slice(0, 5);

  const handleNewEvent = (category?: string) => {
    setEditingEvent(null);
    setDefaultCategory(category);
    setEventDialogOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setDefaultCategory(undefined);
    setEventDialogOpen(true);
  };

  const handleDeleteEvent = async () => {
    if (eventToDelete) {
      await deleteEvent(eventToDelete);
      toast.success('Esemény törölve.');
      setDeleteConfirmOpen(false);
      setEventToDelete(null);
    }
  };

  // Week view helpers
  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay() + 1); // Monday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7-20

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary">Naptár</h1>
          <p className="text-text-secondary">Szervezd meg időd és eseményeid</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-surface-0" onClick={() => handleNewEvent()}>
          <Plus className="h-4 w-4 mr-2" />Új esemény
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="lg:col-span-3 min-w-0">
          <Card className="glass p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <h2 className="text-lg sm:text-2xl font-heading font-bold text-text-primary">
                  {currentDate.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' })}
                </h2>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="flex bg-surface-1/50 rounded-lg p-1 self-start sm:self-auto">
                {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
                  <Button key={mode} variant={viewMode === mode ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode(mode)}
                    className={cn('px-2 sm:px-3 py-1 text-xs', viewMode === mode ? 'bg-primary text-surface-0' : 'text-text-secondary hover:text-text-primary')}>
                    {mode === 'month' ? 'Hónap' : mode === 'week' ? 'Hét' : 'Nap'}
                  </Button>
                ))}
              </div>
            </div>

            {viewMode === 'month' && (
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                {[
                  { key: 'mon', label: 'H' },
                  { key: 'tue', label: 'K' },
                  { key: 'wed', label: 'Sz' },
                  { key: 'thu', label: 'Cs' },
                  { key: 'fri', label: 'P' },
                  { key: 'sat', label: 'Sz' },
                  { key: 'sun', label: 'V' },
                ].map((d) => (
                  <div key={d.key} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-text-muted">{d.label}</div>
                ))}
                {getDaysInMonth().map((date, index) => {
                  const dayEvents = getEventsForDate(date);
                  return (
                    <motion.div key={index} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.01 }}
                      className={cn("min-h-[48px] sm:min-h-[100px] p-1 sm:p-2 border border-white/5 rounded-md sm:rounded-lg transition-colors cursor-pointer hover:bg-surface-1/30",
                        !isSameMonth(date, currentDate) && "text-text-disabled bg-surface-1/10",
                        isToday(date) && "bg-primary/20 border-primary/30"
                      )}
                      onClick={() => { setCurrentDate(date); setViewMode('day'); }}
                    >
                      <div className={cn("text-xs sm:text-sm font-medium mb-0.5 sm:mb-1", isToday(date) ? "text-primary" : isSameMonth(date, currentDate) ? "text-text-primary" : "text-text-disabled")}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-0.5 sm:space-y-1 hidden sm:block">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div key={event.id} className="text-xs p-1 rounded text-surface-0 truncate cursor-pointer" style={{ backgroundColor: event.color }} onClick={(e) => { e.stopPropagation(); handleEditEvent(event); }}>
                            {formatTime(event.startTime)} {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && <div className="text-xs text-text-muted">+{dayEvents.length - 2} további</div>}
                      </div>
                      {/* Mobile: just show dots for events */}
                      {dayEvents.length > 0 && (
                        <div className="flex gap-0.5 sm:hidden mt-0.5">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div key={event.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: event.color }} />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {viewMode === 'week' && (
              <div className="overflow-x-auto -mx-1 px-1 scrollbar-custom">
                <div className="grid grid-cols-8 gap-0.5 sm:gap-1 min-w-[560px]">
                  <div className="p-1 sm:p-2" />
                  {getWeekDays().map((d) => (
                    <div key={d.toISOString()} className={cn("p-1 sm:p-2 text-center text-xs sm:text-sm font-medium", isToday(d) ? "text-primary" : "text-text-muted")}>
                      {d.toLocaleDateString('hu-HU', { weekday: 'short' })} {d.getDate()}
                    </div>
                  ))}
                  {hours.map((hour) => (
                    <>
                      <div key={`h-${hour}`} className="p-1 sm:p-2 text-xs text-text-muted text-right">{hour}:00</div>
                      {getWeekDays().map((d) => {
                        const dayEvents = getEventsForDate(d).filter(e => new Date(e.startTime).getHours() === hour);
                        return (
                          <div key={`${d.toISOString()}-${hour}`} className="p-0.5 sm:p-1 border border-white/5 min-h-[32px] sm:min-h-[40px] cursor-pointer hover:bg-surface-1/20"
                            onClick={() => { setCurrentDate(d); handleNewEvent(); }}>
                            {dayEvents.map((ev) => (
                              <div key={ev.id} className="text-xs p-0.5 sm:p-1 rounded text-surface-0 truncate cursor-pointer mb-0.5" style={{ backgroundColor: ev.color }} onClick={(e) => { e.stopPropagation(); handleEditEvent(ev); }}>
                                {ev.title}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </>
                  ))}
                </div>
              </div>
            )}

            {viewMode === 'day' && (
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-4">
                  {currentDate.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                </h3>
                <div className="space-y-1">
                  {hours.map((hour) => {
                    const hourEvents = getEventsForDate(currentDate).filter(e => new Date(e.startTime).getHours() === hour);
                    return (
                      <div key={hour} className="flex gap-2 sm:gap-3 min-h-[44px] sm:min-h-[50px]">
                        <div className="w-12 sm:w-16 text-xs sm:text-sm text-text-muted text-right pt-2 flex-shrink-0">{hour}:00</div>
                        <div className="flex-1 min-w-0 border-t border-white/5 pt-2 cursor-pointer hover:bg-surface-1/20 rounded px-1 sm:px-2" onClick={() => handleNewEvent()}>
                          {hourEvents.map((ev) => (
                            <div key={ev.id} className="p-1.5 sm:p-2 rounded text-surface-0 text-xs sm:text-sm mb-1 cursor-pointer" style={{ backgroundColor: ev.color }} onClick={(e) => { e.stopPropagation(); handleEditEvent(ev); }}>
                              <span className="font-medium">{ev.title}</span>
                              <span className="ml-1 sm:ml-2 opacity-75 text-xs">{formatTime(ev.startTime)} - {formatTime(ev.endTime)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="glass p-4">
            <h3 className="font-heading font-semibold text-text-primary mb-3">Gyors műveletek</h3>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start border-white/20" onClick={() => handleNewEvent('Meeting')}>
                <Plus className="h-4 w-4 mr-2" />Meeting hozzáadása
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start border-white/20" onClick={() => handleNewEvent('Emlékeztető')}>
                <Clock className="h-4 w-4 mr-2" />Emlékeztető
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start border-white/20" onClick={() => handleNewEvent('Időblokk')}>
                <CalendarIcon className="h-4 w-4 mr-2" />Időblokk foglalása
              </Button>
            </div>
          </Card>

          <Card className="glass p-4">
            <h3 className="font-heading font-semibold text-text-primary mb-4">Közelgő események</h3>
            <div className="space-y-3">
              {upcomingEvents.length > 0 ? upcomingEvents.map((event, index) => (
                <motion.div key={event.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="group">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-1/30 hover:bg-surface-1/50 transition-colors cursor-pointer" onClick={() => handleEditEvent(event)}>
                    <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: event.color }} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-text-primary text-sm truncate">{event.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                        <span>{formatDate(event.startTime)}</span><span>•</span><span>{formatTime(event.startTime)}</span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 p-0" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-surface-1 border border-white/10">
                        <DropdownMenuItem className="text-text-primary hover:bg-white/5" onClick={() => handleEditEvent(event)}>
                          <Edit3 className="h-4 w-4 mr-2" />Szerkesztés
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-danger hover:bg-danger/10" onClick={() => { setEventToDelete(event.id); setDeleteConfirmOpen(true); }}>
                          <Trash2 className="h-4 w-4 mr-2" />Törlés
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              )) : (
                <div className="text-center py-6 text-text-muted">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-text-disabled" />
                  <p className="text-sm">Nincsenek közelgő események</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="glass p-4">
            <h3 className="font-heading font-semibold text-text-primary mb-3">Mai összefoglaló</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-muted">Események</span>
                <Badge variant="outline" className="border-white/20">{getEventsForDate(today).length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-muted">Következő</span>
                <span className="text-sm text-text-primary">{upcomingEvents[0] ? formatTime(upcomingEvents[0].startTime) : 'Nincs'}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <EventDialog open={eventDialogOpen} onOpenChange={setEventDialogOpen} event={editingEvent} defaultCategory={defaultCategory} />
      <ConfirmDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen} title="Esemény törlése" description="Biztosan törölni szeretnéd ezt az eseményt?" confirmLabel="Törlés" onConfirm={handleDeleteEvent} destructive />
    </div>
  );
}
