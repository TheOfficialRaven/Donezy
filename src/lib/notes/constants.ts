import type { NoteSourceType, NoteType, NotesViewFilter } from './types';

export const NOTES_SCHEMA_VERSION = 2 as const;

export const NOTE_TYPES: NoteType[] = ['note', 'idea', 'lesson', 'plan', 'dump', 'quote'];

export const NOTE_SOURCE_TYPES: NoteSourceType[] = [
  'manual',
  'import',
  'suggestion',
  'system',
  'integration',
  'reading',
  'journal',
];

/** Days without `lastOpenedAt` before a capture is “stale” in inbox heuristics. */
export const NOTE_STALE_OPEN_DAYS = 10;

/** Recent list window. */
export const NOTE_RECENT_DAYS = 14;

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  note: 'Jegyzet',
  idea: 'Ötlet',
  lesson: 'Tanulság',
  plan: 'Terv',
  dump: 'Gyors ürítés',
  quote: 'Idézet',
};

/** Short UX hints — type-aware microcopy. */
export const NOTE_TYPE_HINTS: Record<NoteType, string> = {
  note: 'Általános rögzítés — bármilyen szöveg.',
  idea: 'Villanás — később kidolgozhatod.',
  lesson: 'Amit megtanultál vagy másképp csinálnál.',
  plan: 'Lépések, ütem, teendő-féle gondolat.',
  dump: 'Szóljon ki a fejedből — nem kell tökéletesnek lennie.',
  quote: 'Egy mondat vagy idézet, ami számít.',
};

export const NOTES_VIEW_FILTER_LABELS: Record<NotesViewFilter, string> = {
  all: 'Összes',
  inbox: 'Mappa nélküli',
  pinned: 'Kitűzve',
  archived: 'Archivált',
  recent: 'Legutóbbi',
  mental_inbox: 'Mentális inbox',
};

export const DEFAULT_NOTE_FOLDER_COLOR = '#8B5CF6';
export const DEFAULT_NOTE_FOLDER_ICON = 'folder';

export const NOTE_PREVIEW_MAX_LENGTH = 220;
