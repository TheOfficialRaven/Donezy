import {
  calendarToRoutingCandidates,
  goalToRoutingCandidates,
  habitToRoutingCandidates,
  listToRoutingCandidates,
  noteToRoutingCandidates,
  quickCaptureToRoutingCandidates,
  readingToRoutingCandidates,
  reflectionToRoutingCandidates,
} from './adapters';
import type { RoutingCandidate, RoutingEngineInput } from './types';
import { normalizeRoutingCandidate } from './normalize';

function dedupe(candidates: RoutingCandidate[]): RoutingCandidate[] {
  const byId = new Map<string, RoutingCandidate>();
  for (const candidate of candidates) {
    if (!byId.has(candidate.id)) byId.set(candidate.id, candidate);
  }
  return [...byId.values()];
}

function clampConfidence(value?: number) {
  if (typeof value !== 'number') return 0.6;
  return Math.min(0.95, Math.max(0.35, value));
}

function applyContextConfidence(candidate: RoutingCandidate, input: RoutingEngineInput): RoutingCandidate {
  let adjusted = candidate.confidence ?? 0.6;
  const dayMode = input.currentDayMode || 'normal';
  const targetGroup = input.targetGroup || 'other';

  if (dayMode === 'focus' && (candidate.targetModule === 'lists' || candidate.targetModule === 'missions')) adjusted += 0.05;
  if (dayMode === 'recovery' && candidate.targetModule === 'reflection') adjusted += 0.06;
  if (dayMode === 'light' && candidate.targetModule === 'notes') adjusted += 0.04;

  if (targetGroup === 'student' && candidate.targetModule === 'calendar') adjusted += 0.05;
  if (targetGroup === 'self-development' && candidate.targetModule === 'habits') adjusted += 0.05;
  if (targetGroup === 'freelancer' && candidate.targetModule === 'missions') adjusted += 0.04;
  if (targetGroup === 'organizer' && candidate.targetModule === 'lists') adjusted += 0.05;

  return { ...candidate, confidence: clampConfidence(adjusted) };
}

export function generateRoutingCandidatesFromModules(input: RoutingEngineInput): RoutingCandidate[] {
  const out: RoutingCandidate[] = [];

  for (const item of input.quickCaptureItems) {
    if (item.status === 'archived' || item.status === 'discarded') continue;
    out.push(...quickCaptureToRoutingCandidates(item));
  }
  for (const note of input.notes) out.push(...noteToRoutingCandidates(note));
  for (const readingEntry of input.readingEntries) out.push(...readingToRoutingCandidates(readingEntry));
  for (const goal of input.goals) out.push(...goalToRoutingCandidates(goal));
  for (const reflection of input.reflections) out.push(...reflectionToRoutingCandidates(reflection));
  for (const list of input.lists) out.push(...listToRoutingCandidates(list));
  for (const habit of input.habits) out.push(...habitToRoutingCandidates(habit));
  for (const event of input.events) out.push(...calendarToRoutingCandidates(event));

  return dedupe(out).map((row) => normalizeRoutingCandidate(applyContextConfidence(row, input)));
}
