import { NOTE_TYPES } from './constants';
import type { Note, NoteFolder, NoteType } from './types';

export type FieldError = { field: string; message: string };

export function validateNoteType(type: unknown): FieldError | null {
  if (!NOTE_TYPES.includes(type as NoteType)) {
    return { field: 'type', message: 'Érvénytelen jegyzettípus.' };
  }
  return null;
}

/**
 * Legal note body: non-empty title OR non-empty content (quick capture).
 */
export function validateNoteTitleOrContent(title: unknown, content: unknown): FieldError | null {
  const t = typeof title === 'string' ? title.trim() : '';
  const c = typeof content === 'string' ? content.trim() : '';
  if (!t && !c) {
    return { field: 'title', message: 'Adj meg címet vagy tartalmat.' };
  }
  return null;
}

export function validateNoteTags(tags: unknown): FieldError | null {
  if (tags === undefined || tags === null) return null;
  if (!Array.isArray(tags)) return { field: 'tags', message: 'A címkék tömb formátumúak legyenek.' };
  if (tags.length > 40) return { field: 'tags', message: 'Legfeljebb 40 címke engedélyezett.' };
  for (const t of tags) {
    if (typeof t !== 'string' || t.length > 48) {
      return { field: 'tags', message: 'Minden címke legfeljebb 48 karakter lehet.' };
    }
  }
  return null;
}

export function validateFolderTitle(title: unknown): FieldError | null {
  if (typeof title !== 'string' || !title.trim()) {
    return { field: 'title', message: 'A mappa neve kötelező.' };
  }
  if (title.trim().length > 120) {
    return { field: 'title', message: 'A mappa neve legfeljebb 120 karakter lehet.' };
  }
  return null;
}

export function validateFolderColor(color: unknown): FieldError | null {
  if (color === undefined || color === null || color === '') return null;
  if (typeof color !== 'string') return { field: 'color', message: 'A szín szöveg formátumú legyen.' };
  const ok = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color.trim());
  if (!ok) return { field: 'color', message: 'A szín hex formátumú legyen (#RGB vagy #RRGGBB).' };
  return null;
}

export function validateFolderIcon(icon: unknown): FieldError | null {
  if (icon === undefined || icon === null || icon === '') return null;
  if (typeof icon !== 'string' || icon.length > 64) {
    return { field: 'icon', message: 'Az ikon azonosító legfeljebb 64 karakter.' };
  }
  return null;
}

export function validateNoteCreateInput(input: {
  title?: unknown;
  content?: unknown;
  type?: unknown;
  tags?: unknown;
}): FieldError[] {
  const errors: FieldError[] = [];
  const body = validateNoteTitleOrContent(input.title, input.content);
  if (body) errors.push(body);
  const ty = input.type !== undefined ? validateNoteType(input.type) : null;
  if (ty) errors.push(ty);
  const tg = validateNoteTags(input.tags);
  if (tg) errors.push(tg);
  return errors;
}

/**
 * @param snapshot — current title/content when the patch only updates one of them.
 */
export function validateNotePatch(patch: Partial<Note>, snapshot?: Pick<Note, 'title' | 'content'>): FieldError[] {
  const errors: FieldError[] = [];
  if (patch.type !== undefined) {
    const e = validateNoteType(patch.type);
    if (e) errors.push(e);
  }
  if (patch.title !== undefined || patch.content !== undefined) {
    const title = patch.title !== undefined ? patch.title : snapshot?.title ?? '';
    const content = patch.content !== undefined ? patch.content : snapshot?.content ?? '';
    const e = validateNoteTitleOrContent(title, content);
    if (e) errors.push(e);
  }
  if (patch.tags !== undefined) {
    const e = validateNoteTags(patch.tags);
    if (e) errors.push(e);
  }
  return errors;
}

export function validateFolderCreateInput(input: {
  title: unknown;
  color?: unknown;
  icon?: unknown;
}): FieldError[] {
  const errors: FieldError[] = [];
  const t = validateFolderTitle(input.title);
  if (t) errors.push(t);
  const c = validateFolderColor(input.color);
  if (c) errors.push(c);
  const i = validateFolderIcon(input.icon);
  if (i) errors.push(i);
  return errors;
}

export function validateFolderPatch(patch: Partial<NoteFolder>): FieldError[] {
  const errors: FieldError[] = [];
  if (patch.title !== undefined) {
    const t = validateFolderTitle(patch.title);
    if (t) errors.push(t);
  }
  if (patch.color !== undefined) {
    const c = validateFolderColor(patch.color);
    if (c) errors.push(c);
  }
  if (patch.icon !== undefined) {
    const i = validateFolderIcon(patch.icon);
    if (i) errors.push(i);
  }
  return errors;
}
