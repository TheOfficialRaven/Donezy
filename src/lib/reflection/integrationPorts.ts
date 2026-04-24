import type { ReflectionEntry } from './types';

export interface ReflectionNoteCandidate {
  reflectionId: string;
  title: string;
  content: string;
}

export interface ReflectionHabitSignalCandidate {
  reflectionId: string;
  date: string;
  mood?: number;
}

export interface ReflectionDashboardStub {
  reflectionId: string;
  date: string;
  mood?: number;
  type: ReflectionEntry['type'];
}

export function toNoteCandidate(entry: ReflectionEntry): ReflectionNoteCandidate | null {
  if (!entry.futureLinkTargets.noteCandidate) return null;
  return {
    reflectionId: entry.id,
    title: entry.title || `Reflexio ${entry.date}`,
    content: entry.lessons || entry.content,
  };
}

export function toHabitSignalCandidate(entry: ReflectionEntry): ReflectionHabitSignalCandidate | null {
  if (!entry.futureLinkTargets.habitSignalCandidate) return null;
  return {
    reflectionId: entry.id,
    date: entry.date,
    mood: entry.mood,
  };
}

export function toDashboardStub(entry: ReflectionEntry): ReflectionDashboardStub | null {
  if (!entry.futureLinkTargets.dashboardMoodTrendCandidate) return null;
  return { reflectionId: entry.id, date: entry.date, mood: entry.mood, type: entry.type };
}
