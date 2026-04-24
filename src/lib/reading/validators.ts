import { MAX_BOOK_AUTHOR_LENGTH, MAX_BOOK_TITLE_LENGTH, MAX_ENTRY_FIELD_LENGTH, READING_BOOK_STATUSES } from './constants';
import type { Book, ReadingEntry } from './types';

export type ReadingFieldError = { field: string; message: string };

export function validateBookTitle(title: unknown): ReadingFieldError | null {
  if (typeof title !== 'string' || !title.trim()) return { field: 'title', message: 'A cim kotelezo.' };
  if (title.trim().length > MAX_BOOK_TITLE_LENGTH) return { field: 'title', message: 'A cim tul hosszu.' };
  return null;
}

export function validateBookAuthor(author: unknown): ReadingFieldError | null {
  if (author === undefined || author === null) return null;
  if (typeof author !== 'string') return { field: 'author', message: 'A szerzo csak szoveg lehet.' };
  if (author.trim().length > MAX_BOOK_AUTHOR_LENGTH) return { field: 'author', message: 'A szerzo tul hosszu.' };
  return null;
}

export function validateBookStatus(status: unknown): ReadingFieldError | null {
  if (!READING_BOOK_STATUSES.includes(status as Book['status'])) return { field: 'status', message: 'Ervenytelen statusz.' };
  return null;
}

export function validateBookPages(totalPages: unknown, currentPage: unknown): ReadingFieldError | null {
  const total = Number(totalPages);
  const current = Number(currentPage);
  if (!Number.isFinite(total) || total <= 0) return { field: 'totalPages', message: 'Az osszes oldal legyen pozitiv szam.' };
  if (!Number.isFinite(current) || current < 0) return { field: 'currentPage', message: 'Az aktualis oldal nem lehet negativ.' };
  if (current > total) return { field: 'currentPage', message: 'Az aktualis oldal nem lehet nagyobb az osszesnel.' };
  return null;
}

export function validateBookRating(rating: unknown): ReadingFieldError | null {
  if (rating === undefined || rating === null) return null;
  const n = Number(rating);
  if (!Number.isFinite(n) || n < 1 || n > 5) return { field: 'rating', message: 'Ertekeles 1-5 kozott lehet.' };
  return null;
}

export function validateReadingEntry(entry: Partial<ReadingEntry>): ReadingFieldError[] {
  const errors: ReadingFieldError[] = [];
  if (!entry.bookId || typeof entry.bookId !== 'string') errors.push({ field: 'bookId', message: 'A bejegyzeshez konyv azonosito kell.' });
  if (!entry.date || typeof entry.date !== 'string') errors.push({ field: 'date', message: 'A datum kotelezo.' });
  if (entry.pageFrom !== undefined && (!Number.isFinite(entry.pageFrom) || entry.pageFrom < 0)) {
    errors.push({ field: 'pageFrom', message: 'A kezdo oldal nem lehet negativ.' });
  }
  if (entry.pageTo !== undefined && (!Number.isFinite(entry.pageTo) || entry.pageTo < 0)) {
    errors.push({ field: 'pageTo', message: 'A zaro oldal nem lehet negativ.' });
  }
  if (entry.pageFrom !== undefined && entry.pageTo !== undefined && entry.pageTo < entry.pageFrom) {
    errors.push({ field: 'pageTo', message: 'A zaro oldal nem lehet kisebb a kezdonel.' });
  }
  for (const field of ['note', 'quote', 'lesson'] as const) {
    const value = entry[field];
    if (value !== undefined && typeof value === 'string' && value.length > MAX_ENTRY_FIELD_LENGTH) {
      errors.push({ field, message: 'A mezot roviditsd le.' });
    }
  }
  return errors;
}

export function validateBookInput(input: Partial<Book>): ReadingFieldError[] {
  const errors: ReadingFieldError[] = [];
  const titleErr = validateBookTitle(input.title);
  if (titleErr) errors.push(titleErr);
  const authorErr = validateBookAuthor(input.author);
  if (authorErr) errors.push(authorErr);
  const statusErr = validateBookStatus(input.status);
  if (statusErr) errors.push(statusErr);
  const pagesErr = validateBookPages(input.totalPages, input.currentPage);
  if (pagesErr) errors.push(pagesErr);
  const ratingErr = validateBookRating(input.rating);
  if (ratingErr) errors.push(ratingErr);
  return errors;
}
