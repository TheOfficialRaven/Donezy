import type { ScoredCandidate } from '@/lib/rules/scoring';

export interface StressSignals {
  calendarLoad: number;
  lowMoodStreakDays: number;
  postponeCountLast3Days: number;
}

export function detectOverload(signals: StressSignals): boolean {
  return signals.calendarLoad >= 5 && signals.lowMoodStreakDays >= 2 && signals.postponeCountLast3Days >= 3;
}

export function detectNonUrgent(candidate: ScoredCandidate, today = new Date()): boolean {
  if (candidate.dueDate) return false;
  if (!candidate.createdAt) return false;
  if (candidate.lastInteractedAt) return false;
  const ageDays = Math.floor((today.getTime() - new Date(candidate.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  return ageDays >= 14;
}

export function supportiveLoadMessage(overloaded: boolean): string {
  if (!overloaded) return 'Ugy tunik, ma jo egyensulyban vagy. Haladj kis, biztos lepesekkel.';
  return 'Ugy tunik, most nagyobb a terheles. Teljesen rendben van lassitani es a legkisebb kovetkezo lepesre fokuszalni.';
}

export function nonUrgentSuggestionTitle(): string {
  return 'Ez most nem tunik surgosnek. Szeretned kesobbre tenni?';
}
