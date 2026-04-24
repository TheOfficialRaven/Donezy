import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Habit, HabitActivitySignal, HabitCandidate, HabitCompletion, HabitTimeRangeFilter } from '@/lib/habits/types';
import { getHabitChartSeries, getHabitConsistencyIndicators, getHabitCurrentStreak, getHabitLongestStreak, getHabitWeeklyCompletionRate } from '@/lib/habits/selectors';
import HabitStreakBadge from './HabitStreakBadge';
import HabitProgress from './HabitProgress';
import HabitCompletionGrid from './HabitCompletionGrid';
import { HabitTrendChart, HabitActivityChart } from './HabitCharts';
import ActivitySourceBadge from './ActivitySourceBadge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function HabitDetailPanel({
  habit,
  completions,
  signals,
  range,
  candidates,
  onToggleToday,
  onArchive,
  onActivate,
}: {
  habit: Habit;
  completions: HabitCompletion[];
  signals: HabitActivitySignal[];
  range: HabitTimeRangeFilter;
  candidates: HabitCandidate[];
  onToggleToday: () => void;
  onArchive: () => void;
  onActivate: (active: boolean) => void;
}) {
  const own = completions.filter((c) => c.habitId === habit.id);
  const streak = getHabitCurrentStreak(habit, own);
  const longest = getHabitLongestStreak(habit, own);
  const weeklyRate = getHabitWeeklyCompletionRate(habit, own);
  const consistency = getHabitConsistencyIndicators(habit, own);
  const series = getHabitChartSeries(habit, own, range);

  const signalSeries = useMemo(() => {
    const map = new Map<string, number>();
    const relevant = signals.filter((s) => (habit.sourceEventTypes || []).includes(s.eventType));
    for (const signal of relevant) {
      map.set(signal.dateKey, (map.get(signal.dateKey) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([dateKey, count]) => ({ dateKey, count }));
  }, [signals, habit.sourceEventTypes]);

  const linkedCandidates = candidates.filter((c) => c.linkedHabitId === habit.id || c.promotedHabitId === habit.id);

  return (
    <Card className="glass p-6 space-y-5 border-white/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-heading font-bold text-text-primary">{habit.title}</h2>
          {habit.description && <p className="text-text-secondary mt-1">{habit.description}</p>}
          <div className="flex flex-wrap gap-2 mt-2">
            <HabitStreakBadge streak={streak} />
            <Badge className="bg-emerald-500/15 text-emerald-200 border-emerald-500/25 text-xs">Rekord: {longest}</Badge>
            {habit.category && <Badge variant="outline" className="border-white/15">{habit.category}</Badge>}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="border-white/15" onClick={onToggleToday}>Mai jeloles</Button>
          <Button variant="outline" className="border-white/15" onClick={() => onActivate(!habit.active)}>{habit.active ? 'Szüneteltet' : 'Aktival'}</Button>
          <Button variant="outline" className="border-white/15" onClick={onArchive}>{habit.archived ? 'Visszaallit' : 'Archivál'}</Button>
        </div>
      </div>

      <div className="rounded-md border border-white/10 bg-surface-0/30 px-3 py-2 text-sm text-text-secondary">
        <span className="text-text-primary font-medium">Osszkep:</span> {consistency.reason}
      </div>

      <div className="space-y-2">
        <p className="text-xs text-text-muted uppercase tracking-wide">Kovetkezetesseg</p>
        <HabitProgress label="Heti ritmus" value={weeklyRate} />
      </div>

      <div className="space-y-2">
        <p className="text-xs text-text-muted uppercase tracking-wide">Trend</p>
        <HabitTrendChart data={series} title="Rutin aktivitas trend" />
        <HabitActivityChart data={signalSeries} />
      </div>

      <div className="space-y-2">
        <p className="text-xs text-text-muted uppercase tracking-wide">Elmult napok</p>
        <HabitCompletionGrid completions={own} />
      </div>

      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="h-8 px-2 text-text-muted">Forras es hatteradatok</Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          <div className="flex flex-wrap gap-2">
            <ActivitySourceBadge mode={habit.trackingMode} />
            <Badge variant="outline" className="border-white/15">{habit.frequencyType} / {habit.frequencyTarget}</Badge>
          </div>
          {linkedCandidates.length > 0 && (
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Kapcsolt mintak</p>
              <div className="flex flex-wrap gap-2">
                {linkedCandidates.map((candidate) => (
                  <Badge key={candidate.id} variant="outline" className="border-amber-500/25 text-amber-200">
                    {candidate.sourceModule}: {candidate.eventType} ({Math.round(candidate.repeatScore * 100)}%)
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
