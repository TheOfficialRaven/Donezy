import {
  DEFAULT_NOTE_FOLDER_COLOR,
  DEFAULT_NOTE_FOLDER_ICON,
  NOTE_PREVIEW_MAX_LENGTH,
  NOTES_SCHEMA_VERSION,
  NOTE_SOURCE_TYPES,
  NOTE_TYPES,
} from './constants';
import type { Note, NoteFolder, NoteFolderRaw, NoteRaw, NoteSourceType, NoteType } from './types';

function isNoteType(v: unknown): v is NoteType {
  return NOTE_TYPES.includes(v as NoteType);
}

function isNoteSourceType(v: unknown): v is NoteSourceType {
  return NOTE_SOURCE_TYPES.includes(v as NoteSourceType);
}

/** Plain-text preview from body (first lines, collapsed whitespace). */
export function buildNotePreview(content: string, maxLen = NOTE_PREVIEW_MAX_LENGTH): string {
  const flat = (content || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (flat.length <= maxLen) return flat;
  return `${flat.slice(0, maxLen - 1)}…`;
}

function coerceTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((t) => String(t).trim()).filter(Boolean);
}

/**
 * Maps Firebase / legacy payloads into the v2 Note. Safe for partial / old rows.
 * v1 used `folder: string` and `isLocked`; both are absorbed without data loss.
 */
export function normalizeNote(raw: NoteRaw, userId?: string): Note {
  const now = new Date().toISOString();
  const title = typeof raw.title === 'string' ? raw.title : '';
  const content = typeof raw.content === 'string' ? raw.content : '';
  const folderId = typeof raw.folderId === 'string' && raw.folderId.trim() ? raw.folderId.trim() : undefined;
  const legacyFromV1 = typeof raw.folder === 'string' && raw.folder.trim() ? raw.folder.trim() : undefined;
  const legacyFromV2 = typeof raw.legacyFolder === 'string' && raw.legacyFolder.trim() ? raw.legacyFolder.trim() : undefined;
  const legacyFolderRaw = legacyFromV2 || legacyFromV1;
  const legacyFolder = folderId ? undefined : legacyFolderRaw;

  const previewRaw = typeof raw.preview === 'string' ? raw.preview.trim() : '';
  const preview = previewRaw || buildNotePreview(content);

  const type: NoteType = isNoteType(raw.type) ? raw.type : 'note';
  const sourceType: NoteSourceType = isNoteSourceType(raw.sourceType) ? raw.sourceType : 'manual';

  const rawSchema =
    typeof raw.schemaVersion === 'number' && Number.isFinite(raw.schemaVersion) ? Math.floor(raw.schemaVersion) : 1;

  const locked = Boolean(raw.locked ?? raw.isLocked);

  return {
    id: raw.id,
    userId: raw.userId || userId,
    title,
    content,
    preview,
    type,
    folderId,
    legacyFolder,
    tags: coerceTags(raw.tags),
    pinned: Boolean(raw.pinned),
    archived: Boolean(raw.archived),
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
    lastOpenedAt: typeof raw.lastOpenedAt === 'string' ? raw.lastOpenedAt : undefined,
    sourceType,
    futureOriginReference:
      raw.futureOriginReference && typeof raw.futureOriginReference === 'object'
        ? raw.futureOriginReference
        : undefined,
    futureLinkTargets:
      raw.futureLinkTargets && typeof raw.futureLinkTargets === 'object' ? raw.futureLinkTargets : {},
    schemaVersion: Math.max(rawSchema, NOTES_SCHEMA_VERSION),
    locked: locked || undefined,
  };
}

/** Strip undefined-only legacy lock when false to keep payloads small on write. */
export function stripNoteForPersist(note: Partial<Note>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...note };
  if (out.locked === false) delete out.locked;
  if (out.legacyFolder === '' || out.legacyFolder === undefined) delete out.legacyFolder;
  if (out.folderId === '' || out.folderId === undefined) delete out.folderId;
  delete out.userId;
  return out;
}

export function normalizeNoteFolder(raw: NoteFolderRaw, userId?: string): NoteFolder {
  const now = new Date().toISOString();
  return {
    id: raw.id,
    userId: raw.userId || userId,
    title: (raw.title || 'Mappa').trim() || 'Mappa',
    color: typeof raw.color === 'string' && raw.color.trim() ? raw.color.trim() : DEFAULT_NOTE_FOLDER_COLOR,
    icon: typeof raw.icon === 'string' && raw.icon.trim() ? raw.icon.trim() : DEFAULT_NOTE_FOLDER_ICON,
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
  };
}

/** Defaults for creating a new note in the store / UI. */
export function defaultNewNoteFields(userId?: string): Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'title' | 'content'> {
  return {
    userId,
    preview: '',
    type: 'note',
    tags: [],
    pinned: false,
    archived: false,
    sourceType: 'manual',
    futureLinkTargets: {},
    schemaVersion: NOTES_SCHEMA_VERSION,
    lastOpenedAt: undefined,
    futureOriginReference: undefined,
    folderId: undefined,
    legacyFolder: undefined,
    locked: undefined,
  };
}
