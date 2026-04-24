import {
  HABIT_CANDIDATE_LOOKBACK_DAYS,
  HABIT_PROMOTION_MIN_ACTIVE_DAYS,
  HABIT_PROMOTION_MIN_OCCURRENCES,
  HABIT_PROMOTION_MIN_REPEAT_SCORE,
} from './constants';
import { getLocalDateString } from '@/lib/dateUtils';
import type { HabitActivitySignal, HabitCandidate } from './types';

function daysBetween(a: string, b: string): number {
  const av = new Date(a).getTime();
  const bv = new Date(b).getTime();
  return Math.max(0, Math.floor((bv - av) / (86400 * 1000)));
}

function toCandidateId(signal: HabitActivitySignal): string {
  return `${signal.sourceModule}:${signal.eventType}`;
}

export function scoreCandidate(input: {
  occurrencesCount: number;
  activeDaysCount: number;
  lookbackDays: number;
}): number {
  const occScore = Math.min(1, input.occurrencesCount / HABIT_PROMOTION_MIN_OCCURRENCES);
  const dayScore = Math.min(1, input.activeDaysCount / HABIT_PROMOTION_MIN_ACTIVE_DAYS);
  const densityScore = Math.min(1, input.activeDaysCount / Math.max(3, Math.ceil(input.lookbackDays / 4)));
  return Math.max(0, Math.min(1, occScore * 0.45 + dayScore * 0.4 + densityScore * 0.15));
}

/**
 * Groups raw signals into repeated-behavior candidates. Noise (single events) remains low score.
 */
export function detectHabitCandidates(
  signals: HabitActivitySignal[] | undefined,
  options?: { nowDateKey?: string; lookbackDays?: number; userId?: string }
): HabitCandidate[] {
  const safeSignals = Array.isArray(signals) ? signals : [];
  const nowDateKey = options?.nowDateKey || getLocalDateString();
  const lookbackDays = options?.lookbackDays || HABIT_CANDIDATE_LOOKBACK_DAYS;
  const from = new Date(`${nowDateKey}T12:00:00`);
  from.setDate(from.getDate() - lookbackDays + 1);
  const fromDateKey = getLocalDateString(from);

  const recent = safeSignals.filter((s) => s.dateKey >= fromDateKey && s.dateKey <= nowDateKey);
  const grouped = new Map<string, HabitActivitySignal[]>();
  for (const signal of recent) {
    const key = toCandidateId(signal);
    const arr = grouped.get(key) || [];
    arr.push(signal);
    grouped.set(key, arr);
  }

  const out: HabitCandidate[] = [];
  for (const [key, bucket] of grouped.entries()) {
    const ordered = [...bucket].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
    const first = ordered[0];
    const last = ordered[ordered.length - 1];
    const daySet = new Set(ordered.map((x) => x.dateKey));
    const activeDaysCount = daySet.size;
    const repeatScore = scoreCandidate({ occurrencesCount: ordered.length, activeDaysCount, lookbackDays });
    const titleHint = String(first.metadata?.title || first.eventType)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (m) => m.toUpperCase());
    out.push({
      id: key,
      userId: options?.userId || first.userId,
      eventType: first.eventType,
      sourceModule: first.sourceModule,
      firstSeenAt: first.occurredAt,
      lastSeenAt: last.occurredAt,
      occurrencesCount: ordered.length,
      activeDaysCount,
      repeatScore,
      promotedToHabit: false,
      titleHint,
    });
  }

  return out.sort((a, b) => b.repeatScore - a.repeatScore || b.occurrencesCount - a.occurrencesCount);
}

export function isPromotableCandidate(candidate: HabitCandidate): boolean {
  return (
    candidate.occurrencesCount >= HABIT_PROMOTION_MIN_OCCURRENCES &&
    candidate.activeDaysCount >= HABIT_PROMOTION_MIN_ACTIVE_DAYS &&
    candidate.repeatScore >= HABIT_PROMOTION_MIN_REPEAT_SCORE
  );
}

export function candidateRecencyDays(candidate: HabitCandidate, nowDateKey = getLocalDateString()): number {
  return daysBetween(candidate.lastSeenAt.slice(0, 10), nowDateKey);
}
