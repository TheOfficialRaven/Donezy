import type { DayModeKey } from '@/lib/dayModes/types';
import type { PreferenceTargetGroup, PreferredTone } from '@/lib/preferences/types';
import type { DashboardBlock, DashboardLoadIndicator } from '@/lib/dashboard/types';

export type GuidanceItemKind = 'focus' | 'quick-win' | 'maintenance' | 'attention' | 'support';

export interface GuidanceItem {
  id: string;
  title: string;
  subtitle?: string;
  reason: string;
  sourceModule: DashboardBlock['sourceModule'];
  sourceReference?: string;
  kind: GuidanceItemKind;
  priorityScore: number;
  estimatedMinutes?: number;
  actionTarget?: string;
}

export interface DailyGuidanceProfile {
  date: string;
  targetGroup: PreferenceTargetGroup;
  effectiveDayMode: DayModeKey;
  effectiveTone: PreferredTone;
  loadLevel: DashboardLoadIndicator['level'];
  topFocusItems: GuidanceItem[];
  quickWinItem?: GuidanceItem;
  maintenanceItem?: GuidanceItem;
  attentionItems: GuidanceItem[];
  supportiveInsights: string[];
  quickActions: string[];
  narrativeSummary: string;
  computedAt: string;
}

export interface GuidanceEngineInputs {
  date: string;
  targetGroup: PreferenceTargetGroup;
  effectiveDayMode: DayModeKey;
  effectiveTone: PreferredTone;
  loadIndicator: DashboardLoadIndicator;
  blocks: DashboardBlock[];
  signals: {
    openTasksCount: number;
    overdueItemsCount: number;
    highPriorityOpenItemsCount: number;
    todayEventsCount: number;
    upcomingEventsCount: number;
    goalsNeedingAttentionCount: number;
    habitsNeedingAttentionCount: number;
    missionActiveCount: number;
    quickCaptureUnprocessedCount: number;
    readingActiveCount: number;
    reflectionMissingToday: boolean;
  };
  preferences: {
    dashboardDensity: 'minimal' | 'balanced' | 'detailed';
    overloadProtection: 'on' | 'off';
    missionVisibility: 'secondary' | 'balanced' | 'strong';
    defaultTimeHorizon: 'today' | 'this-week' | 'mixed';
    notesInboxBehavior: 'simple' | 'structured';
  };
}
