import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CalendarView, CalendarEventType, CalendarEventStatus } from '@/lib/calendar/types';
import { EVENT_TYPE_LABELS } from '@/lib/calendar/constants';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface CalendarToolbarProps {
  title: string;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onCreate: () => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  filterType: 'all' | CalendarEventType;
  onFilterTypeChange: (value: 'all' | CalendarEventType) => void;
  filterStatus: 'all' | CalendarEventStatus;
  onFilterStatusChange: (value: 'all' | CalendarEventStatus) => void;
}

export default function CalendarToolbar(props: CalendarToolbarProps) {
  return (
    <div className="glass p-4 rounded-xl space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-heading font-semibold text-text-primary">{props.title}</h2>
          <Button variant="ghost" size="sm" onClick={props.onPrev}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={props.onNext}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={props.onToday}>Ma</Button>
        </div>
        <div className="flex gap-1 bg-surface-1/50 rounded-lg p-1">
          {(['month', 'week', 'day'] as CalendarView[]).map((mode) => (
            <Button
              key={mode}
              variant={props.view === mode ? 'default' : 'ghost'}
              size="sm"
              className={props.view === mode ? 'bg-primary text-surface-0' : ''}
              onClick={() => props.onViewChange(mode)}
            >
              {mode === 'month' ? 'Hónap' : mode === 'week' ? 'Hét' : 'Nap'}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr,170px,170px,auto] gap-2">
        <Input
          value={props.searchQuery}
          onChange={(e) => props.onSearchQueryChange(e.target.value)}
          placeholder="Keresés esemény címben, kategóriában..."
          className="bg-surface-1/50 border-white/10"
        />
        <Select value={props.filterType} onValueChange={(v) => props.onFilterTypeChange(v as any)}>
          <SelectTrigger className="bg-surface-1/50 border-white/10"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-surface-1 border-white/10">
            <SelectItem value="all">Minden típus</SelectItem>
            {(Object.keys(EVENT_TYPE_LABELS) as CalendarEventType[]).map((type) => (
              <SelectItem key={type} value={type}>
                {EVENT_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={props.filterStatus} onValueChange={(v) => props.onFilterStatusChange(v as any)}>
          <SelectTrigger className="bg-surface-1/50 border-white/10"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-surface-1 border-white/10">
            <SelectItem value="all">Minden státusz</SelectItem>
            <SelectItem value="scheduled">Tervezett</SelectItem>
            <SelectItem value="completed">Kész</SelectItem>
            <SelectItem value="cancelled">Törölt</SelectItem>
            <SelectItem value="missed">Elmulasztott</SelectItem>
          </SelectContent>
        </Select>
        <Button className="bg-primary hover:bg-primary/90 text-surface-0" onClick={props.onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Új esemény
        </Button>
      </div>
    </div>
  );
}
