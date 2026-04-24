import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { Habit, HabitConsistencyIndicator } from '@/lib/habits/types';
import HabitStreakBadge from './HabitStreakBadge';
import HabitProgress from './HabitProgress';
import ActivitySourceBadge from './ActivitySourceBadge';

export default function HabitCard({
  habit,
  weeklyRate,
  streak,
  consistency,
  onOpen,
  compact,
}: {
  habit: Habit;
  weeklyRate: number;
  streak: number;
  consistency: HabitConsistencyIndicator;
  onOpen: () => void;
  compact?: boolean;
}) {
  return (
    <Card className={`glass border-white/5 h-full flex flex-col ${compact ? 'p-3 gap-2' : 'p-4 gap-3'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <button type="button" onClick={onOpen} className="text-left">
            <h3 className="font-heading font-semibold text-text-primary truncate hover:text-primary">{habit.title}</h3>
          </button>
          {!compact && habit.description && <p className="text-sm text-text-secondary line-clamp-2 mt-1">{habit.description}</p>}
        </div>
        <ActivitySourceBadge mode={habit.trackingMode} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="border-white/15 text-xs">{habit.frequencyType}</Badge>
        <Badge variant="outline" className="border-white/15 text-xs">Cel: {habit.frequencyTarget}</Badge>
        <HabitStreakBadge streak={streak} />
      </div>

      <div className="rounded-md border border-white/10 bg-surface-0/30 px-3 py-2 text-xs text-text-secondary flex items-start gap-2">
        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
        <span>
          <span className="text-text-primary font-medium">Allapot: </span>
          {consistency.reason}
        </span>
      </div>

      <HabitProgress label={compact ? 'Heti arány' : 'Heti teljesitesi arany'} value={weeklyRate} />

      <div className="flex justify-end mt-auto">
        <Button size="sm" variant="outline" className="border-white/15" onClick={onOpen}>
          Reszletek
          <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>
    </Card>
  );
}
