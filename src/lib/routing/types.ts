import type { QuickCaptureItem } from '@/lib/capture/types';
import type { DayModeKey } from '@/lib/dayModes';
import type { PreferenceTargetGroup } from '@/lib/preferences';

export type RoutingCandidateStatus = 'pending' | 'accepted' | 'dismissed' | 'expired';

export type RoutingCandidateType =
  | 'list-item-seed'
  | 'goal-seed'
  | 'mission-seed'
  | 'habit-signal'
  | 'event-seed'
  | 'note-seed'
  | 'reflection-topic'
  | 'reading-note-candidate';

export type RoutingModule =
  | 'capture'
  | 'lists'
  | 'notes'
  | 'goals'
  | 'missions'
  | 'habits'
  | 'calendar'
  | 'reflection'
  | 'reading'
  | 'dashboard';

export interface RoutingCandidate {
  id: string;
  sourceModule: RoutingModule;
  sourceEntityType: string;
  sourceEntityId: string;
  candidateType: RoutingCandidateType;
  targetModule: Exclude<RoutingModule, 'capture' | 'dashboard'>;
  title: string;
  description?: string;
  reason: string;
  confidence?: number;
  suggestedPayload: Record<string, unknown>;
  createdAt: string;
  status: RoutingCandidateStatus;
  futureLinkTargets?: Record<string, boolean>;
  schemaVersion?: number;
}

export type RoutingReviewFilter = 'all' | RoutingCandidateStatus | 'high-confidence';

export interface RoutingEngineInput {
  quickCaptureItems: QuickCaptureItem[];
  notes: Array<{ id: string; title: string; content: string; type?: string; updatedAt?: string }>;
  readingEntries: Array<{ id: string; bookId: string; note?: string; quote?: string; lesson?: string; date: string }>;
  goals: Array<{ id: string; title: string; targetDate?: string; milestones?: Array<{ id: string; title: string; dueDate?: string; completed?: boolean }> }>;
  reflections: Array<{ id: string; content?: string; lessons?: string; date: string }>;
  lists: Array<{ id: string; title: string; tasks: Array<{ id: string; title: string; completed: boolean; createdAt?: string }> }>;
  habits: Array<{ id: string; title: string; active: boolean; updatedAt: string }>;
  events: Array<{ id: string; title: string; date: string; type?: string }>;
  currentDayMode?: DayModeKey;
  targetGroup?: PreferenceTargetGroup;
}
