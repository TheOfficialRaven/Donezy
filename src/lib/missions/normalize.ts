import { MISSIONS_SCHEMA_VERSION } from './constants';
import type { Mission, MissionRaw } from './types';

export function normalizeMission(raw: MissionRaw, userId?: string): Mission {
  const now = new Date().toISOString();
  return {
    id: raw.id,
    userId: raw.userId || userId,
    title: (raw.title || '').trim() || 'Nevtelen kuldetes',
    description: typeof raw.description === 'string' ? raw.description : '',
    type: raw.type === 'weekly' || raw.type === 'suggested' || raw.type === 'guided' ? raw.type : 'daily',
    difficulty: raw.difficulty === 'easy' || raw.difficulty === 'hard' ? raw.difficulty : 'medium',
    category: typeof raw.category === 'string' ? raw.category : 'altalanos',
    estimatedMinutes: Math.max(0, Math.round(Number(raw.estimatedMinutes) || 0)),
    rewardXp: Number.isFinite(raw.rewardXp) ? Number(raw.rewardXp) : undefined,
    priority: raw.priority === 'low' || raw.priority === 'high' ? raw.priority : 'medium',
    status: raw.status === 'completed' || raw.status === 'skipped' || raw.status === 'archived' ? raw.status : 'active',
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
    completedAt: raw.completedAt,
    sourceType:
      raw.sourceType === 'manual' ||
      raw.sourceType === 'list' ||
      raw.sourceType === 'goal' ||
      raw.sourceType === 'habit' ||
      raw.sourceType === 'calendar' ||
      raw.sourceType === 'reflection' ||
      raw.sourceType === 'dashboard' ||
      raw.sourceType === 'integration'
        ? raw.sourceType
        : 'generated',
    futureOriginReference: raw.futureOriginReference,
    futureLinkTargets: raw.futureLinkTargets && typeof raw.futureLinkTargets === 'object' ? raw.futureLinkTargets : {},
    schemaVersion: MISSIONS_SCHEMA_VERSION,
  };
}
