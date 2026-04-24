import type { Mission, MissionPriority, MissionProductivityMetrics } from './types';

function safe(list?: Mission[]): Mission[] {
  return Array.isArray(list) ? list : [];
}

export const getAllMissions = (missions?: Mission[]) => safe(missions).slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
export const getDailyMissions = (missions?: Mission[]) => safe(missions).filter((m) => m.type === 'daily');
export const getWeeklyMissions = (missions?: Mission[]) => safe(missions).filter((m) => m.type === 'weekly');
export const getActiveMissions = (missions?: Mission[]) => safe(missions).filter((m) => m.status === 'active');
export const getCompletedMissions = (missions?: Mission[]) => safe(missions).filter((m) => m.status === 'completed');
export const getSkippedMissions = (missions?: Mission[]) => safe(missions).filter((m) => m.status === 'skipped');
export const getMissionById = (missions: Mission[] | undefined, id: string) => safe(missions).find((m) => m.id === id);
export const getMissionsByCategory = (missions: Mission[] | undefined, category: string) => category === 'all' ? safe(missions) : safe(missions).filter((m) => m.category === category);
export const getMissionsByPriority = (missions: Mission[] | undefined, priority: MissionPriority) => safe(missions).filter((m) => m.priority === priority);
export const getMissionsBySearch = (missions: Mission[] | undefined, q: string) => {
  const query = q.trim().toLowerCase();
  if (!query) return safe(missions);
  return safe(missions).filter((m) => `${m.title}\n${m.description}\n${m.category}`.toLowerCase().includes(query));
};

export function getMissionCompletionRate(missions?: Mission[]): number {
  const all = safe(missions);
  if (!all.length) return 0;
  return Math.round((getCompletedMissions(all).length / all.length) * 100);
}

export function getMissionTimeLoad(missions?: Mission[]): { dailyMinutes: number; weeklyMinutes: number } {
  return {
    dailyMinutes: getDailyMissions(missions).filter((m) => m.status === 'active').reduce((s, m) => s + (m.estimatedMinutes || 0), 0),
    weeklyMinutes: getWeeklyMissions(missions).filter((m) => m.status === 'active').reduce((s, m) => s + (m.estimatedMinutes || 0), 0),
  };
}

export function getMissionsNeedingAttention(missions?: Mission[]): Mission[] {
  return safe(missions).filter((m) => m.status === 'active' && m.priority === 'high' && m.estimatedMinutes >= 60);
}

export function getMissionFocusCandidates(missions?: Mission[]): Mission[] {
  return getActiveMissions(missions)
    .filter((m) => m.priority === 'high' || m.estimatedMinutes <= 20)
    .sort((a, b) => (a.priority === 'high' ? -1 : 0) - (b.priority === 'high' ? -1 : 0));
}

export function getMissionProductivityMetrics(missions?: Mission[]): MissionProductivityMetrics {
  const all = safe(missions);
  const time = getMissionTimeLoad(all);
  return {
    totalMissions: all.length,
    activeMissions: getActiveMissions(all).length,
    completedMissions: getCompletedMissions(all).length,
    completionRate: getMissionCompletionRate(all),
    dailyTimeLoadMinutes: time.dailyMinutes,
    weeklyTimeLoadMinutes: time.weeklyMinutes,
    focusCandidates: getMissionFocusCandidates(all).length,
  };
}
