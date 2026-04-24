export type ReflectionType = 'quick' | 'normal' | 'deep';
export type ReflectionMood = 1 | 2 | 3 | 4 | 5;
export type ReflectionPrivateLevel = 'private' | 'shared-later' | 'sensitive';
export type ReflectionSourceType = 'manual' | 'import' | 'suggestion' | 'system' | 'integration';
export type ReflectionViewFilter = 'all' | 'calendar' | 'recent' | 'quick' | 'normal' | 'deep';
export type ReflectionSelectedView = 'list' | 'detail' | 'editor';

export type ReflectionFutureOriginReference = {
  module?: 'notes' | 'habits' | 'reading' | 'dashboard' | 'goals' | 'guidance' | 'reflection' | 'unknown';
  entityId?: string;
  note?: string;
};

export type ReflectionFutureLinkTargets = {
  noteCandidate?: boolean;
  habitSignalCandidate?: boolean;
  dashboardMoodTrendCandidate?: boolean;
  readingBacklinkCandidate?: boolean;
  guidanceSignalCandidate?: boolean;
};

/**
 * Domain semantics:
 * - type: depth intention (quick/normal/deep).
 * - mood: quick emotional state marker (1-5).
 * - wins/difficulties/lessons/gratitude: structured reflection anchors.
 * - privateLevel: safety metadata for future privacy controls.
 */
export interface ReflectionEntry {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  type: ReflectionType;
  mood: ReflectionMood;
  title?: string;
  content: string;
  wins?: string;
  difficulties?: string;
  lessons?: string;
  gratitude?: string;
  tags: string[];
  privateLevel?: ReflectionPrivateLevel;
  createdAt: string;
  updatedAt: string;
  sourceType: ReflectionSourceType;
  futureOriginReference?: ReflectionFutureOriginReference;
  futureLinkTargets: ReflectionFutureLinkTargets;
  schemaVersion: number;
  // legacy compatibility fields
  feelings?: string;
  growth?: string;
  freeWrite?: string;
  focusArea?: import('@/lib/focusAreas').FocusArea;
  focusAreaSource?: import('@/lib/focusAreas').FocusAreaSource;
}

export interface ReflectionConsistencyMetrics {
  streak: number;
  entriesLast7d: number;
  entriesLast30d: number;
  consistencyPercent30d: number;
}

export interface ReflectionProductivityMetrics {
  totalEntries: number;
  quickCount: number;
  normalCount: number;
  deepCount: number;
  avgMood: number;
  streak: number;
  lessonsCaptured: number;
}

export type ReflectionEntryRaw = Partial<ReflectionEntry> & { id: string };
