import { REFLECTION_MAX_TEXT, REFLECTION_MAX_TITLE, REFLECTION_MOODS, REFLECTION_TYPES } from './constants';
import type { ReflectionEntry } from './types';

export type ReflectionFieldError = { field: string; message: string };

function hasMeaningfulContent(entry: Partial<ReflectionEntry>): boolean {
  return Boolean(
    entry.content?.trim() ||
    entry.wins?.trim() ||
    entry.difficulties?.trim() ||
    entry.lessons?.trim() ||
    entry.gratitude?.trim() ||
    entry.freeWrite?.trim() ||
    entry.feelings?.trim()
  );
}

export function validateReflectionEntry(input: Partial<ReflectionEntry>): ReflectionFieldError[] {
  const errors: ReflectionFieldError[] = [];
  if (!input.date) errors.push({ field: 'date', message: 'A datum kotelezo.' });
  if (!REFLECTION_TYPES.includes(input.type as any)) errors.push({ field: 'type', message: 'Ervenytelen reflexio tipus.' });
  if (input.mood !== undefined && !REFLECTION_MOODS.includes(input.mood as any)) errors.push({ field: 'mood', message: 'Ervenytelen hangulat skala.' });
  if (!hasMeaningfulContent(input)) errors.push({ field: 'content', message: 'Legalabb egy reflexios tartalom kell.' });
  if (input.title && input.title.length > REFLECTION_MAX_TITLE) errors.push({ field: 'title', message: 'A cim tul hosszu.' });
  for (const key of ['content', 'wins', 'difficulties', 'lessons', 'gratitude', 'freeWrite', 'feelings', 'growth'] as const) {
    const value = input[key];
    if (value && value.length > REFLECTION_MAX_TEXT) errors.push({ field: key, message: 'A szoveg tul hosszu.' });
  }
  return errors;
}
