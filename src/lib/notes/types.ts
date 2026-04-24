/**
 * NOTES DOMAIN — semantics
 * -------------------------
 * `type` — intent of the capture (idea vs lesson vs mental dump…). Drives microcopy and light UI accents.
 * `folderId` — optional link to a `NoteFolder` row for library-style grouping. Prefer over string folders.
 * `legacyFolder` — migrated from v1 `folder` string when no `folderId` exists yet.
 * `tags` — free labels for cross-cutting retrieval (orthogonal to folders).
 * `pinned` — user highlight; surfaced in “pinned” views regardless of folder.
 * `archived` — soft shelf; distinct from delete. Archived notes hide from default lists unless filter says so.
 * `preview` — short plain-text snippet for cards and search; derived from `content` when empty on write.
 * `sourceType` — provenance (manual vs import vs system…); integration may set later.
 * `futureOriginReference` — optional back-link to an originating module/entity id (not enforced yet).
 * `futureLinkTargets` — boolean flags: what downstream entities this note MAY spawn later (no automation yet).
 */
export type NoteType = 'note' | 'idea' | 'lesson' | 'plan' | 'dump' | 'quote';

export type NoteSourceType = 'manual' | 'import' | 'suggestion' | 'system' | 'integration' | 'reading' | 'journal';

export type NotesViewFilter = 'all' | 'inbox' | 'pinned' | 'archived' | 'recent' | 'mental_inbox';

export type NotesTypeFilter = 'all' | NoteType;

/** `all` | folder id | `legacy::${normalizedTitle}` for v1 string folders */
export type NotesFolderFilter = string;

export type NotesArchivedFilter = 'active' | 'archived' | 'all';

export type NoteSelectedView = 'list' | 'detail';

export type NotesLayoutMode = 'comfortable' | 'compact';

export type FutureOriginReference = {
  module?: string;
  entityId?: string;
  note?: string;
};

export type NoteFutureLinkTargets = {
  listItemCandidate?: boolean;
  goalSeedCandidate?: boolean;
  reflectionTopicCandidate?: boolean;
  dashboardHighlightCandidate?: boolean;
  readingLogLessonCandidate?: boolean;
  habitAnchorCandidate?: boolean;
};

export interface Note {
  id: string;
  userId?: string;
  title: string;
  content: string;
  /** Plain-text snippet for lists / SEO-style cards; auto-filled from content when blank. */
  preview: string;
  type: NoteType;
  folderId?: string;
  /** v1 migration: former free-text folder name when no folder entity id. */
  legacyFolder?: string;
  tags: string[];
  pinned: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
  sourceType: NoteSourceType;
  futureOriginReference?: FutureOriginReference;
  futureLinkTargets: NoteFutureLinkTargets;
  schemaVersion: number;
  /**
   * Legacy “lock” from v1 UI — content hidden behind placeholder in cards when true.
   * Not part of the forward mental-inbox model; kept for compatibility.
   */
  locked?: boolean;
}

export interface NoteFolder {
  id: string;
  userId?: string;
  title: string;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

/** Raw Firebase / API row before normalize (permissive). */
export type NoteRaw = Partial<Note> & {
  id: string;
  /** v1 field */
  folder?: string;
  /** v1 field name aligned with Note.locked */
  isLocked?: boolean;
};

export type NoteFolderRaw = Partial<NoteFolder> & { id: string };

export interface NoteProductivityMetrics {
  totalCount: number;
  activeCount: number;
  archivedCount: number;
  pinnedCount: number;
  byType: Record<NoteType, number>;
  inboxCandidateCount: number;
  unprocessedHeuristicCount: number;
  needingAttentionCount: number;
  folderCount: number;
  recent7dCount: number;
}

export interface NoteMentalInboxItem {
  note: Note;
  reason: 'dump' | 'idea' | 'stale_capture' | 'no_review' | 'pinned_quick';
}
