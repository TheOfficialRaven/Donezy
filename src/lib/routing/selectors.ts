import { ROUTING_MAX_DASHBOARD_CANDIDATES } from './constants';
import type { RoutingCandidate, RoutingReviewFilter } from './types';

export function getPendingRoutingCandidates(candidates: RoutingCandidate[]): RoutingCandidate[] {
  return candidates.filter((candidate) => candidate.status === 'pending');
}

export function getRoutingCandidatesByFilter(candidates: RoutingCandidate[], filter: RoutingReviewFilter): RoutingCandidate[] {
  if (filter === 'all') return candidates;
  if (filter === 'high-confidence') return candidates.filter((candidate) => (candidate.confidence || 0) >= 0.8);
  return candidates.filter((candidate) => candidate.status === filter);
}

export function getDashboardRoutingHints(candidates: RoutingCandidate[]): RoutingCandidate[] {
  return getPendingRoutingCandidates(candidates)
    .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
    .slice(0, ROUTING_MAX_DASHBOARD_CANDIDATES);
}
