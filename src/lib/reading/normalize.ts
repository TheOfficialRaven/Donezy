import { getLocalDateString } from '@/lib/dateUtils';
import { DEFAULT_READING_CATEGORY, DEFAULT_READING_COLOR, READING_SCHEMA_VERSION } from './constants';
import type { Book, BookRaw, ReadingEntry, ReadingEntryRaw, ReadingBookStatus } from './types';

function normalizeStatus(status: unknown): ReadingBookStatus {
  if (status === 'reading' || status === 'finished' || status === 'wishlist' || status === 'paused') return status;
  if (status === 'completed') return 'finished';
  if (status === 'want-to-read') return 'wishlist';
  return 'wishlist';
}

export function normalizeBook(raw: BookRaw, userId?: string): Book {
  const now = new Date().toISOString();
  const totalPages = Math.max(1, Math.round(Number(raw.totalPages) || 1));
  const currentPage = Math.max(0, Math.min(totalPages, Math.round(Number(raw.currentPage) || 0)));
  const status = normalizeStatus(raw.status);
  const startedAt = raw.startedAt || (status === 'reading' || currentPage > 0 ? getLocalDateString() : undefined);
  const finishedAt = raw.finishedAt || (status === 'finished' ? getLocalDateString() : undefined) || (raw as any).completedAt;

  return {
    id: raw.id,
    userId: raw.userId || userId,
    title: String(raw.title || '').trim() || 'Nevtelen konyv',
    author: String(raw.author || '').trim() || 'Ismeretlen szerzo',
    cover: raw.cover,
    totalPages,
    currentPage,
    status,
    category: (raw.category || (raw as any).genre || DEFAULT_READING_CATEGORY) as string,
    tags: Array.isArray(raw.tags) ? raw.tags.filter((x): x is string => typeof x === 'string') : [],
    rating: Number.isFinite(raw.rating) ? Number(raw.rating) : undefined,
    startedAt,
    finishedAt,
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
    notesSummary: raw.notesSummary || (raw as any).summary,
    sourceType: raw.sourceType || 'manual',
    futureOriginReference: raw.futureOriginReference,
    futureLinkTargets: raw.futureLinkTargets && typeof raw.futureLinkTargets === 'object' ? raw.futureLinkTargets : {},
    schemaVersion: READING_SCHEMA_VERSION,
    coverColor: raw.coverColor || DEFAULT_READING_COLOR,
  };
}

export function normalizeReadingEntry(raw: ReadingEntryRaw): ReadingEntry {
  const now = new Date().toISOString();
  const pageFrom = Number.isFinite(raw.pageFrom) ? Math.max(0, Math.round(Number(raw.pageFrom))) : undefined;
  const pageTo = Number.isFinite(raw.pageTo) ? Math.max(0, Math.round(Number(raw.pageTo))) : undefined;
  return {
    id: raw.id,
    bookId: String(raw.bookId || ''),
    pageFrom,
    pageTo,
    date: raw.date || getLocalDateString(),
    note: raw.note,
    quote: raw.quote,
    lesson: raw.lesson,
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt,
  };
}
