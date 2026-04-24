import { ROUTING_SCHEMA_VERSION } from './constants';
import type { RoutingCandidate } from './types';

export function normalizeRoutingCandidate(raw: Partial<RoutingCandidate> & { id: string }): RoutingCandidate {
  const now = new Date().toISOString();
  return {
    id: raw.id,
    sourceModule: raw.sourceModule || 'capture',
    sourceEntityType: raw.sourceEntityType || 'unknown',
    sourceEntityId: raw.sourceEntityId || raw.id,
    candidateType: raw.candidateType || 'note-seed',
    targetModule: raw.targetModule || 'notes',
    title: raw.title || 'Atalakithato javaslat',
    description: raw.description || '',
    reason: raw.reason || 'Erdemes lehet tovabbvinni masik modulba.',
    confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.6,
    suggestedPayload: raw.suggestedPayload || {},
    createdAt: raw.createdAt || now,
    status: raw.status || 'pending',
    futureLinkTargets: raw.futureLinkTargets || {},
    schemaVersion: raw.schemaVersion || ROUTING_SCHEMA_VERSION,
  };
}
