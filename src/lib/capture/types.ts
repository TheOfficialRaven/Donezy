export type QuickCaptureSuggestedType =
  | 'list_item'
  | 'note'
  | 'goal_seed'
  | 'mission_seed'
  | 'habit_seed'
  | 'event_seed'
  | 'reflection_seed'
  | 'reading_seed';

export type QuickCaptureTargetModule =
  | 'lists'
  | 'notes'
  | 'goals'
  | 'missions'
  | 'habits'
  | 'calendar'
  | 'reflection'
  | 'reading'
  | 'inbox';

export type QuickCaptureStatus = 'unprocessed' | 'routed' | 'archived' | 'discarded';

export type QuickCaptureSourceType =
  | 'manual'
  | 'quick-add-dialog'
  | 'header-quick-add'
  | 'mobile-quick-add'
  | 'import'
  | 'integration';

export interface QuickCaptureFutureOriginReference {
  module?: string;
  entityId?: string;
  note?: string;
}

export interface QuickCaptureFutureLinkTargets {
  listItemCandidate?: boolean;
  noteCandidate?: boolean;
  goalSeedCandidate?: boolean;
  missionSeedCandidate?: boolean;
  habitSeedCandidate?: boolean;
  eventSeedCandidate?: boolean;
  reflectionSeedCandidate?: boolean;
  readingSeedCandidate?: boolean;
  dashboardInboxCandidate?: boolean;
}

export interface QuickCaptureItem {
  id: string;
  userId?: string;
  rawInput: string;
  normalizedText?: string;
  suggestedType?: QuickCaptureSuggestedType;
  suggestedTargetModule?: QuickCaptureTargetModule;
  confirmedTargetModule?: QuickCaptureTargetModule;
  status: QuickCaptureStatus;
  createdAt: string;
  updatedAt: string;
  sourceType: QuickCaptureSourceType;
  sourceContext?: string;
  extractedMetadata?: Record<string, unknown>;
  futureOriginReference?: QuickCaptureFutureOriginReference;
  futureLinkTargets: QuickCaptureFutureLinkTargets;
  schemaVersion: number;
}

export type QuickCaptureItemRaw = Partial<QuickCaptureItem> & { id: string };

export interface QuickCaptureSuggestion {
  suggestedType?: QuickCaptureSuggestedType;
  suggestedTargetModule?: QuickCaptureTargetModule;
  confidence: number;
  extractedMetadata?: Record<string, unknown>;
  reason: string;
}

export interface QuickCaptureProductivityMetrics {
  total: number;
  unprocessed: number;
  routed: number;
  archived: number;
  discarded: number;
  needingReview: number;
}
