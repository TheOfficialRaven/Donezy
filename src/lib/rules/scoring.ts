import type { FocusArea } from '@/lib/focusAreas';

export interface ScoreCandidate {
  id: string;
  title: string;
  kind: 'task' | 'quest' | 'event';
  focusArea: FocusArea;
  difficulty?: 'easy' | 'medium' | 'hard' | 'epic';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt?: string;
  lastInteractedAt?: string;
  postponedCount?: number;
  estimatedTime?: number;
  manualPriority?: number;
}

export interface ScoredCandidate extends ScoreCandidate {
  importance: number;
  urgency: number;
  momentum: number;
}

const dayDefiningKeywords = [
  'meeting',
  'megbeszeles',
  'vizsga',
  'exam',
  'hatarido',
  'deadline',
  'prezentacio',
  'interju',
  'ugyfel',
];

const routineKeywords = [
  'napi',
  'reggeli',
  'esti',
  'olvas',
  'seta',
  'reflexio',
  'naplo',
  'rut',
];

const difficultyPoints: Record<string, number> = {
  easy: 20,
  medium: 35,
  hard: 50,
  epic: 65,
};

const priorityPoints: Record<string, number> = {
  low: 15,
  medium: 30,
  high: 50,
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function daysDiff(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function hasKeyword(title: string | undefined, words: string[]): boolean {
  const normalized = normalizeText(title || '');
  return words.some((word) => normalized.includes(word));
}

export function isDayDefiningCandidate(candidate: ScoreCandidate): boolean {
  return hasKeyword(candidate.title, dayDefiningKeywords);
}

export function isRoutineCandidate(candidate: ScoreCandidate): boolean {
  return hasKeyword(candidate.title, routineKeywords);
}

export function scoreImportance(candidate: ScoreCandidate, persona: string): number {
  let score = 20;
  score += difficultyPoints[candidate.difficulty || ''] || 0;
  score += priorityPoints[candidate.priority || ''] || 0;

  // Quests are not globally prioritized over other item types.
  if (candidate.kind === 'quest') score -= 5;
  if (isRoutineCandidate(candidate)) score += 8;
  if (isDayDefiningCandidate(candidate)) score += 12;
  if (persona === 'student' && candidate.focusArea === 'munka_tanulas') score += 8;
  if (persona === 'organizer' && candidate.focusArea === 'otthon') score += 8;
  if (typeof candidate.manualPriority === 'number') score += Math.max(0, Math.min(20, candidate.manualPriority));

  return clamp(score);
}

export function scoreUrgency(candidate: ScoreCandidate, calendarLoad: number, today = new Date()): number {
  let score = 5;
  if (candidate.dueDate) {
    const due = new Date(candidate.dueDate);
    const diff = daysDiff(due, today);
    if (diff < 0) score += 85;
    else if (diff === 0) score += 75;
    else if (diff <= 1) score += 60;
    else if (diff <= 2) score += 45;
    else if (diff <= 7) score += 20;
  }

  if (candidate.kind === 'task' && candidate.priority === 'high') {
    // Explicit user signal: high-priority task should surface as urgent.
    score += 35;
  } else if (candidate.kind === 'task' && candidate.priority === 'medium') {
    score += 10;
  }

  score += Math.min(20, (candidate.postponedCount || 0) * 4);
  score += Math.min(12, calendarLoad * 2);

  if (candidate.createdAt && !candidate.dueDate) {
    const age = daysDiff(today, new Date(candidate.createdAt));
    if (age >= 14) score += 8;
  }
  if (isDayDefiningCandidate(candidate)) score += 20;

  return clamp(score);
}

export function scoreMomentum(candidate: ScoreCandidate, context: { last7dCompletions: number; streak: number; positiveReflectionDays: number }): number {
  let score = 10;
  score += Math.min(30, context.last7dCompletions * 3);
  score += Math.min(20, context.streak * 2);
  score += Math.min(20, context.positiveReflectionDays * 4);

  if ((candidate.estimatedTime || 0) > 0 && (candidate.estimatedTime || 0) <= 20) score += 15;
  if (candidate.priority === 'low') score += 5;
  if (candidate.kind === 'event') score -= 8;

  return clamp(score);
}

export function scoreCandidates(
  candidates: ScoreCandidate[],
  options: {
    persona: string;
    calendarLoad: number;
    last7dCompletions: number;
    streak: number;
    positiveReflectionDays: number;
    today?: Date;
  }
): ScoredCandidate[] {
  return candidates.map((candidate) => ({
    ...candidate,
    importance: scoreImportance(candidate, options.persona),
    urgency: scoreUrgency(candidate, options.calendarLoad, options.today),
    momentum: scoreMomentum(candidate, {
      last7dCompletions: options.last7dCompletions,
      streak: options.streak,
      positiveReflectionDays: options.positiveReflectionDays,
    }),
  }));
}
