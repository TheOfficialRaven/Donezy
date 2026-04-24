import type { Book, ReadingEntry } from './types';

export function getBookCompletionPercent(book: Book): number {
  if (!book.totalPages) return 0;
  return Math.max(0, Math.min(100, Math.round((book.currentPage / book.totalPages) * 100)));
}

export function getBookProgress(book: Book): { currentPage: number; totalPages: number; percent: number } {
  return {
    currentPage: book.currentPage,
    totalPages: book.totalPages,
    percent: getBookCompletionPercent(book),
  };
}

export function getBookReadingTimeline(entries: ReadingEntry[], bookId: string): ReadingEntry[] {
  return entries
    .filter((entry) => entry.bookId === bookId)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));
}
