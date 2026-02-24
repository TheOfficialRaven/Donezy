import { isDayDefiningCandidate, type ScoredCandidate } from '@/lib/rules/scoring';
import { detectNonUrgent } from '@/lib/rules/stress';

export interface TodayFocusPack {
  urgent: ScoredCandidate | null;
  important: ScoredCandidate | null;
  momentum: ScoredCandidate | null;
  visible: ScoredCandidate[];
  nonUrgent: ScoredCandidate | null;
}

function pickHighest(candidates: ScoredCandidate[], key: 'urgency' | 'importance' | 'momentum', used: Set<string>) {
  const eligible = candidates.filter((c) => !used.has(c.id)).sort((a, b) => b[key] - a[key]);
  return eligible[0] || null;
}

function getHoursUntilDue(dueDate?: string, now = new Date()): number | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  return (due.getTime() - now.getTime()) / (1000 * 60 * 60);
}

function isTrulyUrgent(candidate: ScoredCandidate, now = new Date()): boolean {
  const hoursUntilDue = getHoursUntilDue(candidate.dueDate, now);
  const overdueOrSoon = hoursUntilDue !== null && hoursUntilDue <= 24;
  const dayDefining = isDayDefiningCandidate(candidate);
  const strongDeadlinePressure = candidate.urgency >= 65 && (overdueOrSoon || (hoursUntilDue !== null && hoursUntilDue <= 48));
  const eventSoon = candidate.kind === 'event' && hoursUntilDue !== null && hoursUntilDue <= 18;
  const highPriorityTask = candidate.kind === 'task' && candidate.priority === 'high';
  const nearDeadlineTask = candidate.kind === 'task' && hoursUntilDue !== null && hoursUntilDue <= 48;
  return dayDefining || strongDeadlinePressure || eventSoon || highPriorityTask || nearDeadlineTask;
}

export function selectTodayFocus(candidates: ScoredCandidate[], maxVisible = 5, now = new Date()): TodayFocusPack {
  const used = new Set<string>();
  const urgentPool = candidates
    .filter((candidate) => isTrulyUrgent(candidate, now))
    .sort((a, b) => b.urgency - a.urgency);
  const urgent = urgentPool[0] || null;
  if (urgent) used.add(urgent.id);

  const important = pickHighest(candidates, 'importance', used);
  if (important) used.add(important.id);

  const momentum = pickHighest(candidates, 'momentum', used);
  if (momentum) used.add(momentum.id);

  const visible = [urgent, important, momentum].filter(Boolean) as ScoredCandidate[];

  const remaining = candidates
    .filter((c) => !used.has(c.id))
    .sort((a, b) => b.importance + b.urgency + b.momentum - (a.importance + a.urgency + a.momentum));
  for (const candidate of remaining) {
    if (visible.length >= maxVisible) break;
    visible.push(candidate);
  }

  const nonUrgent = candidates.find((candidate) => detectNonUrgent(candidate)) || null;
  return { urgent, important, momentum, visible, nonUrgent };
}
