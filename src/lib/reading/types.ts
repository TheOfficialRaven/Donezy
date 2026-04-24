export type ReadingBookStatus = 'wishlist' | 'reading' | 'finished' | 'paused';
export type ReadingSourceType = 'manual' | 'import' | 'suggestion' | 'system' | 'integration';
export type ReadingViewFilter = 'bookshelf' | 'reading' | 'finished' | 'wishlist' | 'paused' | 'all';
export type ReadingSelectedView = 'bookshelf' | 'list' | 'detail';
export type ReadingLayoutMode = 'bookshelf' | 'split' | 'list';

export type ReadingFutureOriginReference = {
  module?: 'notes' | 'habits' | 'goals' | 'dashboard' | 'reflection' | 'reading' | 'unknown';
  entityId?: string;
  note?: string;
};

export type ReadingFutureLinkTargets = {
  noteCandidate?: boolean;
  habitSignalCandidate?: boolean;
  goalLinkCandidate?: boolean;
  dashboardHighlightCandidate?: boolean;
  reflectionPromptCandidate?: boolean;
};

/**
 * DOMAIN SEMANTICS
 * - Book stores lifecycle and current state of a reading item.
 * - ReadingEntry stores concrete reading updates with knowledge capture.
 * - currentPage and totalPages drive progress; status remains explicit lifecycle state.
 * - notesSummary is the compact synthesis after/while reading.
 * - quote/lesson/note keep micro-knowledge granular and searchable.
 */
export interface Book {
  id: string;
  userId?: string;
  title: string;
  author: string;
  cover?: string;
  totalPages: number;
  currentPage: number;
  status: ReadingBookStatus;
  category: string;
  tags: string[];
  rating?: number;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
  updatedAt: string;
  notesSummary?: string;
  sourceType: ReadingSourceType;
  futureOriginReference?: ReadingFutureOriginReference;
  futureLinkTargets: ReadingFutureLinkTargets;
  schemaVersion: number;
  coverColor?: string;
}

export interface ReadingEntry {
  id: string;
  bookId: string;
  pageFrom?: number;
  pageTo?: number;
  date: string;
  note?: string;
  quote?: string;
  lesson?: string;
  createdAt: string;
  updatedAt?: string;
}

export type BookRaw = Partial<Book> & { id: string };
export type ReadingEntryRaw = Partial<ReadingEntry> & { id: string };

export interface ReadingProductivityMetrics {
  totalBooks: number;
  readingBooks: number;
  finishedBooks: number;
  wishlistBooks: number;
  pausedBooks: number;
  totalEntries: number;
  totalPagesEstimated: number;
  averageCompletionPercent: number;
  booksNeedingAttention: number;
}
