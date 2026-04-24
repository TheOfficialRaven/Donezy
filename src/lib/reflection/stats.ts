import { getLocalDateString } from '@/lib/dateUtils';
import type { ReflectionConsistencyMetrics, ReflectionEntry } from './types';

export function getReflectionStreak(entries: ReflectionEntry[], today = getLocalDateString()): number {
  const dates = new Set(entries.map((entry) => entry.date));
  let streak = 0;
  const d = new Date(`${today}T12:00:00`);
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (!dates.has(key)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function getReflectionConsistencyMetrics(entries: ReflectionEntry[], today = getLocalDateString()): ReflectionConsistencyMetrics {
  const ts = new Date(`${today}T12:00:00`).getTime();
  const entriesLast7d = entries.filter((entry) => (ts - new Date(`${entry.date}T12:00:00`).getTime()) / 86400000 <= 7).length;
  const entriesLast30d = entries.filter((entry) => (ts - new Date(`${entry.date}T12:00:00`).getTime()) / 86400000 <= 30).length;
  return {
    streak: getReflectionStreak(entries, today),
    entriesLast7d,
    entriesLast30d,
    consistencyPercent30d: Math.round((entriesLast30d / 30) * 100),
  };
}
