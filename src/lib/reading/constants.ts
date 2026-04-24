import type { ReadingBookStatus, ReadingSourceType, ReadingViewFilter } from './types';

export const READING_SCHEMA_VERSION = 2 as const;

export const READING_BOOK_STATUSES: ReadingBookStatus[] = ['wishlist', 'reading', 'finished', 'paused'];
export const READING_SOURCE_TYPES: ReadingSourceType[] = ['manual', 'import', 'suggestion', 'system', 'integration'];
export const READING_VIEW_FILTERS: ReadingViewFilter[] = ['bookshelf', 'reading', 'finished', 'wishlist', 'paused', 'all'];

export const READING_STATUS_LABELS: Record<ReadingBookStatus, string> = {
  wishlist: 'Olvasnam',
  reading: 'Olvasom',
  finished: 'Kesz',
  paused: 'Szüneteltetett',
};

export const DEFAULT_READING_CATEGORY = 'Onfejlesztes';
export const DEFAULT_READING_COLOR = '#6366f1';
export const MAX_BOOK_TITLE_LENGTH = 180;
export const MAX_BOOK_AUTHOR_LENGTH = 120;
export const MAX_ENTRY_FIELD_LENGTH = 2000;
