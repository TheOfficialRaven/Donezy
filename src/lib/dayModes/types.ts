export type DayModeKey = 'normal' | 'focus' | 'light' | 'recovery' | 'busy';

export interface DayModeEmphasisProfile {
  planning: number;
  execution: number;
  maintenance: number;
  recovery: number;
}

export interface DayModePriorityBias {
  strictness: number;
  deepWorkBoost: number;
  quickWinBoost: number;
  urgentBoost: number;
}

export interface DayModeToneBias {
  preferredToneShift: 'none' | 'supportive' | 'neutral' | 'direct';
  label: string;
  summary: string;
}

export interface DayModeQuickActionBias {
  boostedActionIds: string[];
  demotedActionIds: string[];
}

export interface DayModeProfile {
  key: DayModeKey;
  label: string;
  description: string;
  emphasisProfile: DayModeEmphasisProfile;
  blockDensityDelta: number;
  overloadSensitivityDelta: number;
  priorityBias: DayModePriorityBias;
  toneBias: DayModeToneBias;
  quickActionBias: DayModeQuickActionBias;
  enabled: boolean;
}

export interface DayModeDashboardWeightsAdjustment {
  lists: number;
  goals: number;
  habits: number;
  calendar: number;
  missions: number;
  reflection: number;
  reading: number;
  notes: number;
}

export interface DayModeDashboardBehaviorAdjustment {
  mode: DayModeProfile;
  densityDelta: number;
  overloadDelta: number;
  weightAdjustment: DayModeDashboardWeightsAdjustment;
  quickActionBoostIds: string[];
  quickActionDemoteIds: string[];
}

export type DayModeSuggestionConfidence = 'low' | 'medium' | 'high';

export type DayModeSuggestionReasonCode =
  | 'high-load-and-calendar-pressure'
  | 'high-load-with-overload-protection'
  | 'many-overdue-or-urgent-items'
  | 'few-clear-focus-points'
  | 'light-day-low-pressure'
  | 'balanced-day'
  | 'insufficient-signal';

export interface DayModeSuggestionInputs {
  loadLevel: 'low' | 'balanced' | 'high';
  openTasksCount: number;
  highPriorityOpenItemsCount: number;
  overdueItemsCount: number;
  todayEventsCount: number;
  upcomingEventsCount: number;
  activeGoalsCount: number;
  goalsNeedingAttentionCount: number;
  habitsNeedingAttentionCount: number;
  activeMissionsCount: number;
  preferences: {
    productivityMode: 'balanced' | 'focus' | 'light' | 'recovery';
    overloadProtection: 'on' | 'off';
    defaultTimeHorizon: 'today' | 'this-week' | 'mixed';
    missionVisibility: 'secondary' | 'balanced' | 'strong';
    targetGroup: 'self-development' | 'student' | 'young-professional' | 'freelancer' | 'organizer' | 'other';
  };
}

export interface DayModeSuggestion {
  suggestedMode: DayModeKey;
  confidence: DayModeSuggestionConfidence;
  reasons: string[];
  reasonCodes: DayModeSuggestionReasonCode[];
  computedAt: string;
  sourceMetricsSummary?: {
    loadLevel: DayModeSuggestionInputs['loadLevel'];
    pressureScore: number;
    focusScore: number;
    recoveryScore: number;
  };
}
