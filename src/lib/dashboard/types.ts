export type DashboardBlockType =
  | 'focus'
  | 'attention'
  | 'calendar'
  | 'habits'
  | 'goals'
  | 'missions'
  | 'reflection'
  | 'reading'
  | 'notes'
  | 'quick_action'
  | 'summary';

export interface DashboardBlock {
  id: string;
  type: DashboardBlockType;
  title: string;
  subtitle?: string;
  priorityScore?: number;
  visualWeight?: 'hero' | 'regular' | 'compact';
  sourceModule: 'lists' | 'goals' | 'habits' | 'calendar' | 'missions' | 'reflection' | 'reading' | 'notes' | 'dashboard';
  payload?: Record<string, unknown>;
  actionable?: boolean;
  actionLabel?: string;
  actionTarget?: string;
}

export interface DashboardTodaySummary {
  openTasks: number;
  activeMissions: number;
  upcomingEvents: number;
  habitsAttention: number;
  moodLabel: string;
}

export interface DashboardLoadIndicator {
  level: 'low' | 'balanced' | 'high';
  message: string;
}
