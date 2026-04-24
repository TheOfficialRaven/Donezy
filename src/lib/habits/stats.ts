import { getLocalDateString } from '@/lib/dateUtils';
import type { Habit, HabitActivitySignal, HabitCompletion, HabitConsistencyIndicator, HabitTimeRangeFilter } from './types';
import { HABIT_NEGLECTED_DAYS, HABIT_WOBBLE_DAYS } from './constants';

function parseRangeDays(range: HabitTimeRangeFilter): number {
  if (range === '7d') return 7;
  if (range === '14d') return 14;
  if (range === '30d') return 30;
  return 90;
}

function uniqueSortedDateKeys(completions: HabitCompletion[]): string[] {
  return [...new Set(completions.map((c) => c.completionDateKey))].sort();
}

export function getHabitCurrentStreak(habit: Habit, completions: HabitCompletion[], today = getLocalDateString()): number {
  if (!habit.active || habit.archived) return 0;
  const set = new Set(completions.map((c) => c.completionDateKey));
  if (habit.frequencyType === 'weekly') {
    let streak = 0;
    const base = new Date(`${today}T12:00:00`);
    for (let w = 0; w < 52; w++) {
      const weekStart = new Date(base);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() - w * 7 + 1);
      const startKey = getLocalDateString(weekStart);
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 6);
      const endKey = getLocalDateString(end);
      let count = 0;
      for (const d of set) if (d >= startKey && d <= endKey) count += 1;
      if (count >= habit.frequencyTarget) streak += 1;
      else break;
    }
    return streak;
  }

  let streak = 0;
  const t = new Date(`${today}T12:00:00`);
  for (let i = 0; i < 366; i++) {
    const d = new Date(t);
    d.setDate(d.getDate() - i);
    const key = getLocalDateString(d);
    if (set.has(key)) streak += 1;
    else break;
  }
  return streak;
}

export function getHabitLongestStreak(habit: Habit, completions: HabitCompletion[]): number {
  const keys = uniqueSortedDateKeys(completions);
  if (keys.length === 0) return 0;
  if (habit.frequencyType === 'weekly') {
    return Math.max(1, Math.floor(keys.length / Math.max(1, habit.frequencyTarget)));
  }
  let best = 1;
  let curr = 1;
  for (let i = 1; i < keys.length; i++) {
    const prev = new Date(`${keys[i - 1]}T12:00:00`);
    const next = new Date(`${keys[i]}T12:00:00`);
    const diff = Math.round((next.getTime() - prev.getTime()) / (86400 * 1000));
    curr = diff === 1 ? curr + 1 : 1;
    best = Math.max(best, curr);
  }
  return best;
}

function completionRate(habit: Habit, completions: HabitCompletion[], days: number, today = getLocalDateString()): number {
  const from = new Date(`${today}T12:00:00`);
  from.setDate(from.getDate() - days + 1);
  const fromKey = getLocalDateString(from);
  const relevant = completions.filter((c) => c.completionDateKey >= fromKey && c.completionDateKey <= today);
  if (habit.frequencyType === 'weekly') {
    const weeks = Math.max(1, Math.ceil(days / 7));
    return Math.max(0, Math.min(100, Math.round((relevant.length / (habit.frequencyTarget * weeks)) * 100)));
  }
  return Math.max(0, Math.min(100, Math.round((relevant.length / (habit.frequencyTarget * days)) * 100)));
}

export function getHabitWeeklyCompletionRate(habit: Habit, completions: HabitCompletion[]): number {
  return completionRate(habit, completions, 7);
}

export function getHabitMonthlyCompletionRate(habit: Habit, completions: HabitCompletion[]): number {
  return completionRate(habit, completions, 30);
}

export function getHabitConsistencyIndicators(habit: Habit, completions: HabitCompletion[], today = getLocalDateString()): HabitConsistencyIndicator {
  if (!habit.active || habit.archived) {
    return { state: 'paused', reason: 'A szokas jelenleg szunetel vagy archivalt.' };
  }
  const currentStreak = getHabitCurrentStreak(habit, completions, today);
  if (currentStreak >= Math.max(2, habit.frequencyTarget)) {
    return { state: 'on-track', reason: 'Jol tartod a ritmust.' };
  }

  const last = completions
    .slice()
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
  if (!last) {
    return { state: 'neglected', reason: 'M�g nincs teljesites ehhez a szokashoz.' };
  }
  const daysSince = Math.floor((new Date(`${today}T12:00:00`).getTime() - new Date(`${last.completionDateKey}T12:00:00`).getTime()) / (86400 * 1000));
  if (daysSince >= HABIT_NEGLECTED_DAYS) {
    return { state: 'neglected', reason: 'Regota nem volt teljesites, erdemes ujrainditani.' };
  }
  if (daysSince >= HABIT_WOBBLE_DAYS) {
    return { state: 'wobbling', reason: 'Megingott a ritmus, egy mai mini lepes segit.' };
  }
  return { state: 'on-track', reason: 'Friss teljesites, jo iranyban haladsz.' };
}

export function getHabitCompletionTrend(habit: Habit, completions: HabitCompletion[], range: HabitTimeRangeFilter) {
  const days = parseRangeDays(range);
  const today = new Date();
  const map = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    map.set(getLocalDateString(d), 0);
  }
  for (const item of completions) {
    if (map.has(item.completionDateKey)) {
      map.set(item.completionDateKey, (map.get(item.completionDateKey) || 0) + 1);
    }
  }
  return [...map.entries()].map(([dateKey, count]) => ({ dateKey, count, label: dateKey.slice(5) }));
}

export function getHabitChartSeries(habit: Habit, completions: HabitCompletion[], range: HabitTimeRangeFilter) {
  const series = getHabitCompletionTrend(habit, completions, range);
  return series.map((row) => ({
    ...row,
    target: habit.frequencyType === 'daily' ? habit.frequencyTarget : undefined,
  }));
}

export function getActivityDensitySeries(
  signals: HabitActivitySignal[],
  range: HabitTimeRangeFilter
): Array<{ dateKey: string; count: number; label: string }> {
  const days = parseRangeDays(range);
  const today = new Date();
  const map = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = getLocalDateString(d);
    map.set(key, 0);
  }
  for (const signal of signals) {
    if (map.has(signal.dateKey)) {
      map.set(signal.dateKey, (map.get(signal.dateKey) || 0) + 1);
    }
  }
  return [...map.entries()].map(([dateKey, count]) => ({ dateKey, count, label: dateKey.slice(5) }));
}

export function getConsistencySeries(
  habits: Habit[],
  completions: HabitCompletion[]
): Array<{ habitId: string; title: string; consistencyScore: number; weeklyRate: number }> {
  return habits.map((habit) => {
    const own = completions.filter((c) => c.habitId === habit.id);
    const weeklyRate = getHabitWeeklyCompletionRate(habit, own);
    const streak = getHabitCurrentStreak(habit, own);
    const consistencyScore = Math.max(0, Math.min(100, Math.round(weeklyRate * 0.7 + Math.min(10, streak) * 3)));
    return { habitId: habit.id, title: habit.title, consistencyScore, weeklyRate };
  });
}
