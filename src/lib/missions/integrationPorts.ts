import type { Mission } from './types';

export interface MissionCandidate {
  title: string;
  description?: string;
  estimatedMinutes?: number;
  category?: string;
  sourceModule: 'lists' | 'goals' | 'habits' | 'calendar' | 'reflection' | 'dashboard' | 'unknown';
  sourceId?: string;
}

export function toDashboardFocusStub(mission: Mission) {
  if (!mission.futureLinkTargets.dashboardFocusCandidate) return null;
  return {
    missionId: mission.id,
    title: mission.title,
    priority: mission.priority,
    estimatedMinutes: mission.estimatedMinutes,
  };
}

export function toGuidanceRankingStub(mission: Mission) {
  if (!mission.futureLinkTargets.guidanceRankCandidate) return null;
  return {
    missionId: mission.id,
    type: mission.type,
    difficulty: mission.difficulty,
    priority: mission.priority,
    status: mission.status,
  };
}
