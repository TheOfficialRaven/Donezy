import type { MissionDifficulty, MissionPriority, MissionStatus, MissionType } from './types';

export const MISSIONS_SCHEMA_VERSION = 2 as const;

export const MISSION_TYPES: MissionType[] = ['daily', 'weekly', 'suggested', 'guided'];
export const MISSION_DIFFICULTIES: MissionDifficulty[] = ['easy', 'medium', 'hard'];
export const MISSION_PRIORITIES: MissionPriority[] = ['low', 'medium', 'high'];
export const MISSION_STATUSES: MissionStatus[] = ['active', 'completed', 'skipped', 'archived'];

export const MISSION_TYPE_LABELS: Record<MissionType, string> = {
  daily: 'Napi',
  weekly: 'Heti',
  suggested: 'Javasolt',
  guided: 'Iranyitott',
};
