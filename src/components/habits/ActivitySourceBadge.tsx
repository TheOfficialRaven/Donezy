import { Badge } from '@/components/ui/badge';
import type { HabitTrackingMode } from '@/lib/habits/types';
import { HABIT_TRACKING_MODE_LABELS } from '@/lib/habits/constants';

export default function ActivitySourceBadge({ mode }: { mode: HabitTrackingMode }) {
  const tone =
    mode === 'auto'
      ? 'bg-primary/15 text-primary border-primary/25'
      : mode === 'hybrid'
        ? 'bg-amber-500/15 text-amber-200 border-amber-500/25'
        : 'bg-white/10 text-text-muted border-white/20';
  return (
    <Badge variant="outline" className={`text-xs ${tone}`}>
      {HABIT_TRACKING_MODE_LABELS[mode]}
    </Badge>
  );
}
