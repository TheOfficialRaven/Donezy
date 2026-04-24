import type { Book, ReadingEntry } from './types';

export interface ReadingNoteCandidate {
  bookId: string;
  entryId: string;
  title: string;
  content: string;
  type: 'quote' | 'lesson';
}

export interface ReadingHabitSignalCandidate {
  bookId: string;
  date: string;
  pagesDelta: number;
}

export interface ReadingDashboardStub {
  bookId: string;
  title: string;
  status: Book['status'];
  completionPercent: number;
}

export function toNoteCandidates(book: Book, entries: ReadingEntry[]): ReadingNoteCandidate[] {
  if (!book.futureLinkTargets.noteCandidate) return [];
  return entries
    .filter((entry) => entry.bookId === book.id)
    .flatMap((entry) => {
      const out: ReadingNoteCandidate[] = [];
      if (entry.quote?.trim()) out.push({ bookId: book.id, entryId: entry.id, title: `${book.title} - quote`, content: entry.quote.trim(), type: 'quote' });
      if (entry.lesson?.trim()) out.push({ bookId: book.id, entryId: entry.id, title: `${book.title} - lesson`, content: entry.lesson.trim(), type: 'lesson' });
      return out;
    });
}

export function toHabitSignalCandidate(book: Book, entry: ReadingEntry): ReadingHabitSignalCandidate | null {
  if (!book.futureLinkTargets.habitSignalCandidate) return null;
  return {
    bookId: book.id,
    date: entry.date,
    pagesDelta: Math.max(0, (entry.pageTo || 0) - (entry.pageFrom || 0)),
  };
}

export function toDashboardStub(book: Book): ReadingDashboardStub | null {
  if (!book.futureLinkTargets.dashboardHighlightCandidate) return null;
  const completionPercent = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;
  return { bookId: book.id, title: book.title, status: book.status, completionPercent };
}
