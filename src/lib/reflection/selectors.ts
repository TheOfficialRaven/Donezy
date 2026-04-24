import type { ReflectionEntry, ReflectionMood, ReflectionProductivityMetrics, ReflectionType } from './types';
import { getReflectionConsistencyMetrics, getReflectionStreak } from './stats';

function safe(list?: ReflectionEntry[]): ReflectionEntry[] {
  return Array.isArray(list) ? list : [];
}

export function getAllReflections(entries?: ReflectionEntry[]): ReflectionEntry[] {
  return safe(entries).slice().sort((a, b) => b.date.localeCompare(a.date));
}

export function getRecentReflections(entries?: ReflectionEntry[], limit = 10): ReflectionEntry[] {
  return getAllReflections(entries).slice(0, limit);
}

export function getReflectionsByType(entries: ReflectionEntry[] | undefined, type: ReflectionType): ReflectionEntry[] {
  return safe(entries).filter((entry) => entry.type === type);
}

export function getReflectionsByMood(entries: ReflectionEntry[] | undefined, mood: ReflectionMood): ReflectionEntry[] {
  return safe(entries).filter((entry) => entry.mood === mood);
}

export function getReflectionByDate(entries: ReflectionEntry[] | undefined, date: string): ReflectionEntry | undefined {
  return safe(entries).find((entry) => entry.date === date);
}

export function getReflectionCalendarMap(entries?: ReflectionEntry[]): Record<string, { hasEntry: boolean; mood?: number; type?: ReflectionType }> {
  return safe(entries).reduce<Record<string, { hasEntry: boolean; mood?: number; type?: ReflectionType }>>((acc, entry) => {
    acc[entry.date] = { hasEntry: true, mood: entry.mood, type: entry.type };
    return acc;
  }, {});
}

export function getReflectionMoodTrend(entries?: ReflectionEntry[], limit = 14): Array<{ date: string; mood: number }> {
  return getRecentReflections(entries, limit)
    .filter((entry) => entry.mood !== undefined)
    .map((entry) => ({ date: entry.date, mood: entry.mood! }))
    .reverse();
}

export { getReflectionStreak, getReflectionConsistencyMetrics };

export function getRecentLessons(entries?: ReflectionEntry[], limit = 8): string[] {
  return getRecentReflections(entries, 40).map((entry) => entry.lessons?.trim()).filter((x): x is string => Boolean(x)).slice(0, limit);
}

export function getRecentWins(entries?: ReflectionEntry[], limit = 8): string[] {
  return getRecentReflections(entries, 40).map((entry) => entry.wins?.trim()).filter((x): x is string => Boolean(x)).slice(0, limit);
}

export function getRecentDifficulties(entries?: ReflectionEntry[], limit = 8): string[] {
  return getRecentReflections(entries, 40).map((entry) => entry.difficulties?.trim()).filter((x): x is string => Boolean(x)).slice(0, limit);
}

export function getReflectionsBySearch(entries: ReflectionEntry[] | undefined, query: string): ReflectionEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return safe(entries);
  return safe(entries).filter((entry) =>
    [entry.title || '', entry.content || '', entry.wins || '', entry.difficulties || '', entry.lessons || '', entry.gratitude || '', ...(entry.tags || [])]
      .join(' ')
      .toLowerCase()
      .includes(q)
  );
}

export function getReflectionsNeedingReview(entries?: ReflectionEntry[]): ReflectionEntry[] {
  return safe(entries).filter((entry) => !entry.lessons?.trim() && !entry.gratitude?.trim() && entry.type !== 'quick');
}

export function getReflectionProductivityMetrics(entries?: ReflectionEntry[]): ReflectionProductivityMetrics {
  const list = safe(entries);
  const avgMoodRaw = list.filter((entry) => entry.mood !== undefined).reduce((sum, entry, _, arr) => sum + (entry.mood || 0) / (arr.length || 1), 0);
  return {
    totalEntries: list.length,
    quickCount: getReflectionsByType(list, 'quick').length,
    normalCount: getReflectionsByType(list, 'normal').length,
    deepCount: getReflectionsByType(list, 'deep').length,
    avgMood: Number.isFinite(avgMoodRaw) ? Number(avgMoodRaw.toFixed(1)) : 0,
    streak: getReflectionStreak(list),
    lessonsCaptured: list.filter((entry) => Boolean(entry.lessons?.trim())).length,
  };
}
