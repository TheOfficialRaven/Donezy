export type MissionType = 'daily' | 'weekly' | 'suggested' | 'guided';
export type MissionDifficulty = 'easy' | 'medium' | 'hard';
export type MissionPriority = 'low' | 'medium' | 'high';
export type MissionStatus = 'active' | 'completed' | 'skipped' | 'archived';
export type MissionSourceType = 'manual' | 'generated' | 'list' | 'goal' | 'habit' | 'calendar' | 'reflection' | 'dashboard' | 'integration';
export type MissionViewFilter = 'focus' | 'daily' | 'weekly' | 'active' | 'completed' | 'all';
export type MissionSelectedView = 'list' | 'detail';

export type MissionFutureOriginReference = {
  module?: 'lists' | 'goals' | 'habits' | 'calendar' | 'reflection' | 'dashboard' | 'missions' | 'unknown';
  entityId?: string;
  note?: string;
};

export type MissionFutureLinkTargets = {
  dashboardFocusCandidate?: boolean;
  guidanceRankCandidate?: boolean;
  listBacklinkCandidate?: boolean;
  goalBacklinkCandidate?: boolean;
  habitBacklinkCandidate?: boolean;
};

/**
 * Domain semantics:
 * - type: mission role in planning cadence.
 * - difficulty + estimatedMinutes: realistic effort signal.
 * - priority: focus ordering hint, not strict deadline.
 * - status: lifecycle state for active/completed/skipped/archived.
 */
export interface Mission {
  id: string;
  userId?: string;
  title: string;
  description: string;
  type: MissionType;
  difficulty: MissionDifficulty;
  category: string;
  estimatedMinutes: number;
  rewardXp?: number;
  priority: MissionPriority;
  status: MissionStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  sourceType: MissionSourceType;
  futureOriginReference?: MissionFutureOriginReference;
  futureLinkTargets: MissionFutureLinkTargets;
  schemaVersion: number;
}

export interface MissionProductivityMetrics {
  totalMissions: number;
  activeMissions: number;
  completedMissions: number;
  completionRate: number;
  dailyTimeLoadMinutes: number;
  weeklyTimeLoadMinutes: number;
  focusCandidates: number;
}

export type MissionRaw = Partial<Mission> & { id: string };
