import { getLocalDateString } from '@/lib/dateUtils';
import { getBookCompletionPercent, getBookProgress, getBookReadingTimeline } from './stats';
import type { Book, ReadingBookStatus, ReadingEntry, ReadingProductivityMetrics } from './types';

function safeBooks(books?: Book[]): Book[] {
  return Array.isArray(books) ? books : [];
}

function safeEntries(entries?: ReadingEntry[]): ReadingEntry[] {
  return Array.isArray(entries) ? entries : [];
}

export function getAllBooks(books?: Book[]): Book[] {
  return safeBooks(books).slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getBooksByStatus(books: Book[] | undefined, status: ReadingBookStatus): Book[] {
  return safeBooks(books).filter((book) => book.status === status);
}

export const getReadingBooks = (books?: Book[]) => getBooksByStatus(books, 'reading');
export const getFinishedBooks = (books?: Book[]) => getBooksByStatus(books, 'finished');
export const getWishlistBooks = (books?: Book[]) => getBooksByStatus(books, 'wishlist');
export const getPausedBooks = (books?: Book[]) => getBooksByStatus(books, 'paused');

export function getRecentBooks(books?: Book[], limit = 6): Book[] {
  return getAllBooks(books).slice(0, limit);
}

export function getRecentReadingEntries(entries?: ReadingEntry[], limit = 10): ReadingEntry[] {
  return safeEntries(entries).slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

export { getBookProgress, getBookCompletionPercent, getBookReadingTimeline };

export function getBookQuotes(entries: ReadingEntry[] | undefined, bookId: string): string[] {
  return safeEntries(entries).filter((entry) => entry.bookId === bookId && entry.quote?.trim()).map((entry) => entry.quote!.trim());
}

export function getBookLessons(entries: ReadingEntry[] | undefined, bookId: string): string[] {
  return safeEntries(entries).filter((entry) => entry.bookId === bookId && entry.lesson?.trim()).map((entry) => entry.lesson!.trim());
}

export function getBooksBySearch(books: Book[] | undefined, query: string): Book[] {
  const q = query.trim().toLowerCase();
  if (!q) return safeBooks(books);
  return safeBooks(books).filter((book) =>
    [book.title, book.author, book.category, ...(book.tags || []), book.notesSummary || '']
      .join(' ')
      .toLowerCase()
      .includes(q)
  );
}

export function getBooksByCategory(books: Book[] | undefined, category: string): Book[] {
  if (!category || category === 'all') return safeBooks(books);
  return safeBooks(books).filter((book) => book.category === category);
}

export function getBooksNeedingAttention(books: Book[] | undefined, entries: ReadingEntry[] | undefined, today = getLocalDateString()): Book[] {
  const allEntries = safeEntries(entries);
  return safeBooks(books).filter((book) => {
    if (book.status !== 'reading') return false;
    const latest = allEntries
      .filter((entry) => entry.bookId === book.id)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!latest) return true;
    return latest.date < today;
  });
}

export function getReadingProductivityMetrics(books?: Book[], entries?: ReadingEntry[]): ReadingProductivityMetrics {
  const allBooks = safeBooks(books);
  const allEntries = safeEntries(entries);
  const averageCompletionPercent =
    allBooks.length > 0 ? Math.round(allBooks.reduce((sum, book) => sum + getBookCompletionPercent(book), 0) / allBooks.length) : 0;
  return {
    totalBooks: allBooks.length,
    readingBooks: getReadingBooks(allBooks).length,
    finishedBooks: getFinishedBooks(allBooks).length,
    wishlistBooks: getWishlistBooks(allBooks).length,
    pausedBooks: getPausedBooks(allBooks).length,
    totalEntries: allEntries.length,
    totalPagesEstimated: allEntries.reduce((sum, entry) => sum + Math.max(0, (entry.pageTo || 0) - (entry.pageFrom || 0)), 0),
    averageCompletionPercent,
    booksNeedingAttention: getBooksNeedingAttention(allBooks, allEntries).length,
  };
}
