import { Card } from '@/components/ui/card';
import type { CalendarEvent } from '@/stores/useAppStore';
import EventChip from './EventChip';
import CalendarEmptyState from './CalendarEmptyState';

interface UpcomingEventsPanelProps {
  events: CalendarEvent[];
  onEditEvent: (event: CalendarEvent) => void;
}

export default function UpcomingEventsPanel({ events, onEditEvent }: UpcomingEventsPanelProps) {
  return (
    <Card className="glass p-4">
      <h3 className="font-heading font-semibold text-text-primary mb-3">Közelgő események</h3>
      {events.length === 0 ? (
        <CalendarEmptyState mode="no-upcoming" />
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <EventChip key={event.id} event={event} onClick={() => onEditEvent(event)} />
          ))}
        </div>
      )}
    </Card>
  );
}
