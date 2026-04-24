import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/stores/useAppStore';
import { EVENT_TYPE_LABELS } from '@/lib/calendar/constants';

interface EventChipProps {
  event: CalendarEvent;
  onClick?: () => void;
  compact?: boolean;
  stretch?: boolean;
}

export default function EventChip({ event, onClick, compact = false, stretch = false }: EventChipProps) {
  const statusTone =
    event.status === 'completed'
      ? 'opacity-70'
      : event.status === 'cancelled'
        ? 'opacity-50 line-through'
        : event.status === 'missed'
          ? 'ring-1 ring-danger/40'
          : '';
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left p-1.5 rounded text-surface-0 text-xs transition-opacity hover:opacity-90',
        stretch && 'h-full flex flex-col justify-start',
        statusTone
      )}
      style={{ backgroundColor: event.color }}
    >
      <div className="font-medium truncate">{event.title}</div>
      {!compact && (
        <div className="flex items-center gap-1 mt-0.5">
          <Badge variant="outline" className="text-[10px] border-white/40 text-surface-0">
            {EVENT_TYPE_LABELS[event.type || 'event']}
          </Badge>
        </div>
      )}
    </button>
  );
}
