import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CalendarEvent } from '@/stores/useAppStore';
import { EVENT_PRIORITY_LABELS, EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from '@/lib/calendar/constants';
import { CalendarDays, Clock3, MapPin, Pencil } from 'lucide-react';

interface EventPreviewDialogProps {
  open: boolean;
  event: CalendarEvent | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (event: CalendarEvent) => void;
}

export default function EventPreviewDialog({ open, event, onOpenChange, onEdit }: EventPreviewDialogProps) {
  const start = event ? new Date(event.startTime) : null;
  const end = event ? new Date(event.endTime) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border border-primary/20 bg-gradient-to-b from-surface-1 to-surface-0 text-text-primary pr-14">
        {!event ? null : (
          <>
            <DialogHeader className="space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div>
                  <DialogTitle className="font-heading text-xl">{event.title}</DialogTitle>
                  <DialogDescription className="text-text-secondary mt-1">
                    Gyors előnézet az eseményről.
                  </DialogDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-primary/30 bg-primary/10">
                  {EVENT_TYPE_LABELS[event.type || 'event']}
                </Badge>
                <Badge variant="outline" className="border-white/20 bg-surface-0/40">
                  {EVENT_PRIORITY_LABELS[event.priority || 'medium']}
                </Badge>
                <Badge variant="outline" className="border-white/20 bg-surface-0/40">
                  {EVENT_STATUS_LABELS[event.status || 'scheduled']}
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-surface-0/35 px-3 py-2 text-text-secondary">
                <CalendarDays className="h-4 w-4 mt-0.5 text-primary" />
                <span className="text-text-primary">
                  {start?.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                </span>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-surface-0/35 px-3 py-2 text-text-secondary">
                <Clock3 className="h-4 w-4 mt-0.5 text-primary" />
                <span className="text-text-primary">
                  {start?.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {end?.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {event.location && (
                <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-surface-0/35 px-3 py-2 text-text-secondary">
                  <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                  <span className="text-text-primary">{event.location}</span>
                </div>
              )}
              {event.description && (
                <div className="rounded-lg border border-white/10 bg-surface-0/40 p-3 text-text-secondary">
                  {event.description}
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                className="w-full border-white/15"
                onClick={() => onEdit(event)}
                title="Szerkesztés"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Esemény szerkesztése
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
