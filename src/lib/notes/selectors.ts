import { NOTE_RECENT_DAYS, NOTE_STALE_OPEN_DAYS, NOTE_TYPES } from './constants';
import type {
  Note,
  NoteFolder,
  NoteMentalInboxItem,
  NoteProductivityMetrics,
  NoteType,
  NotesArchivedFilter,
} from './types';

function safeNotes(notes: Note[] | undefined): Note[] {
  return Array.isArray(notes) ? notes : [];
}

function parseIso(date: string): number {
  const t = Date.parse(date);
  return Number.isNaN(t) ? 0 : t;
}

function daysSince(iso: string): number {
  return (Date.now() - parseIso(iso)) / (24 * 60 * 60 * 1000);
}

/** Stable filter token for v1 string folders. */
export function legacyFolderFilterKey(folderName: string): string {
  return `legacy::${folderName.trim().toLowerCase().replace(/\s+/g, ' ')}`;
}

export function getNoteFolderLabel(note: Note, folders: NoteFolder[]): string {
  if (note.folderId) {
    const f = folders.find((x) => x.id === note.folderId);
    return f?.title || 'Mappa';
  }
  if (note.legacyFolder) return note.legacyFolder;
  return 'Nincs mappa';
}

export function getNoteFolderFilterValue(note: Note): string {
  if (note.folderId) return note.folderId;
  if (note.legacyFolder) return legacyFolderFilterKey(note.legacyFolder);
  return '__inbox__';
}

export function getAllNotes(notes?: Note[]): Note[] {
  return safeNotes(notes).slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function filterNotesByArchived(notes: Note[], filter: NotesArchivedFilter): Note[] {
  if (filter === 'archived') return notes.filter((n) => n.archived);
  if (filter === 'active') return notes.filter((n) => !n.archived);
  return notes;
}

export function getPinnedNotes(notes?: Note[]): Note[] {
  return safeNotes(notes)
    .filter((n) => n.pinned && !n.archived)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getArchivedNotes(notes?: Note[]): Note[] {
  return safeNotes(notes)
    .filter((n) => n.archived)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getNotesByType(notes: Note[] | undefined, type: NoteType | 'all'): Note[] {
  const list = safeNotes(notes);
  if (type === 'all') return list;
  return list.filter((n) => n.type === type);
}

export function getNotesByFolder(notes: Note[] | undefined, folderFilter: string): Note[] {
  const list = safeNotes(notes);
  if (folderFilter === 'all') return list;
  if (folderFilter === '__inbox__') {
    return list.filter((n) => !n.folderId && !n.legacyFolder);
  }
  return list.filter((n) => getNoteFolderFilterValue(n) === folderFilter);
}

export function getRecentNotes(notes?: Note[], withinDays = NOTE_RECENT_DAYS): Note[] {
  return safeNotes(notes)
    .filter((n) => daysSince(n.updatedAt) <= withinDays)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * Captures that look “unprocessed”: quick types, still active, heuristic stale open.
 */
export function getUnprocessedNotes(notes?: Note[]): Note[] {
  return safeNotes(notes).filter((n) => {
    if (n.archived || n.locked) return false;
    if (!['dump', 'idea', 'lesson', 'plan'].includes(n.type)) return false;
    if (!n.lastOpenedAt) return true;
    return daysSince(n.lastOpenedAt) > NOTE_STALE_OPEN_DAYS;
  });
}

export function getMentalInboxCandidates(notes?: Note[]): NoteMentalInboxItem[] {
  const out: NoteMentalInboxItem[] = [];
  for (const note of safeNotes(notes)) {
    if (note.archived || note.locked) continue;
    if (note.type === 'dump') {
      out.push({ note, reason: 'dump' });
      continue;
    }
    if (note.type === 'idea') {
      out.push({ note, reason: 'idea' });
      continue;
    }
    if (!note.lastOpenedAt && daysSince(note.createdAt) >= 3) {
      out.push({ note, reason: 'no_review' });
      continue;
    }
    if (note.lastOpenedAt && parseIso(note.updatedAt) > parseIso(note.lastOpenedAt)) {
      if (daysSince(note.lastOpenedAt) >= NOTE_STALE_OPEN_DAYS) {
        out.push({ note, reason: 'stale_capture' });
      }
    }
  }
  return out.sort((a, b) => b.note.updatedAt.localeCompare(a.note.updatedAt));
}

/** Soft nudges: stale quick captures, long-running ideas without reopen. */
export function getNotesNeedingAttention(notes?: Note[]): Note[] {
  return safeNotes(notes).filter((n) => {
    if (n.archived || n.locked) return false;
    if (['dump', 'idea'].includes(n.type)) {
      if (!n.lastOpenedAt && daysSince(n.updatedAt) >= NOTE_STALE_OPEN_DAYS) return true;
      if (n.lastOpenedAt && daysSince(n.lastOpenedAt) >= NOTE_STALE_OPEN_DAYS) return true;
    }
    if (n.type === 'lesson' && !n.lastOpenedAt && daysSince(n.createdAt) >= NOTE_STALE_OPEN_DAYS) return true;
    return false;
  });
}

export function getNotesBySearch(notes: Note[] | undefined, query: string): Note[] {
  const q = (query || '').trim().toLowerCase();
  if (!q) return safeNotes(notes);
  return safeNotes(notes).filter((n) => {
    const hay = [n.title, n.content, n.preview, ...(n.tags || [])].join('\n').toLowerCase();
    return hay.includes(q);
  });
}

export function getNoteProductivityMetrics(notes?: Note[], folders?: NoteFolder[]): NoteProductivityMetrics {
  const list = safeNotes(notes);
  const fd = Array.isArray(folders) ? folders : [];
  const byType = NOTE_TYPES.reduce(
    (acc, t) => {
      acc[t] = list.filter((n) => n.type === t).length;
      return acc;
    },
    {} as Record<NoteType, number>
  );

  const inboxCandidates = getMentalInboxCandidates(list);
  const unprocessed = getUnprocessedNotes(list);
  const attention = getNotesNeedingAttention(list);

  return {
    totalCount: list.length,
    activeCount: list.filter((n) => !n.archived).length,
    archivedCount: list.filter((n) => n.archived).length,
    pinnedCount: list.filter((n) => n.pinned && !n.archived).length,
    byType,
    inboxCandidateCount: inboxCandidates.length,
    unprocessedHeuristicCount: unprocessed.length,
    needingAttentionCount: attention.length,
    folderCount: fd.length,
    recent7dCount: getRecentNotes(list, 7).length,
  };
}

/** Single list pipeline for the main Notes page. */
/** Sidebar: real folders + distinct legacy string folders + inbox. */
export function getNoteFolderSidebarEntries(
  notes: Note[] | undefined,
  folders: NoteFolder[] | undefined
): Array<{ key: string; label: string; count: number; color?: string; icon?: string }> {
  const list = safeNotes(notes);
  const fd = Array.isArray(folders) ? folders : [];
  const entries: Array<{ key: string; label: string; count: number; color?: string; icon?: string }> = [];

  const inboxCount = list.filter((n) => !n.folderId && !n.legacyFolder && !n.archived).length;
  entries.push({ key: '__inbox__', label: 'Mappa nélkül', count: inboxCount });

  for (const f of fd) {
    const count = list.filter((n) => n.folderId === f.id && !n.archived).length;
    entries.push({ key: f.id, label: f.title, count, color: f.color, icon: f.icon });
  }

  const uniqLegacy = [...new Set(list.map((n) => n.legacyFolder).filter((x): x is string => Boolean(x)))];
  for (const title of uniqLegacy) {
    const key = legacyFolderFilterKey(title);
    const count = list.filter((n) => n.legacyFolder === title && !n.archived).length;
    entries.push({ key, label: title, count });
  }

  return entries;
}

export function filterNotesForMainView(
  notes: Note[] | undefined,
  options: {
    view: 'all' | 'inbox' | 'pinned' | 'archived' | 'recent' | 'mental_inbox';
    searchQuery: string;
    typeFilter: NoteType | 'all';
    folderFilter: string;
    archivedFilter: NotesArchivedFilter;
  }
): Note[] {
  let list = getAllNotes(notes);

  if (options.view === 'archived') {
    list = list.filter((n) => n.archived);
  } else {
    if (options.archivedFilter === 'active') list = list.filter((n) => !n.archived);
    else if (options.archivedFilter === 'archived') list = list.filter((n) => n.archived);
  }

  if (options.view === 'pinned') list = list.filter((n) => n.pinned);
  else if (options.view === 'inbox') list = list.filter((n) => !n.folderId && !n.legacyFolder);
  else if (options.view === 'recent') list = getRecentNotes(list, NOTE_RECENT_DAYS);
  else if (options.view === 'mental_inbox') {
    const ids = new Set(getMentalInboxCandidates(list).map((x) => x.note.id));
    list = list.filter((n) => ids.has(n.id));
  }

  if (options.typeFilter !== 'all') {
    list = list.filter((n) => n.type === options.typeFilter);
  }

  if (options.folderFilter !== 'all') {
    list = getNotesByFolder(list, options.folderFilter);
  }

  list = getNotesBySearch(list, options.searchQuery);
  return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
