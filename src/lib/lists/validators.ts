import type { ListEntity, ListItemEntity } from './types';

export function validateListTitle(value: string): string | null {
  const title = value.trim();
  if (!title) return 'A lista címe kötelező.';
  if (title.length > 80) return 'A lista címe legfeljebb 80 karakter lehet.';
  return null;
}

export function validateListItemTitle(value: string): string | null {
  const title = value.trim();
  if (!title) return 'Az elem címe kötelező.';
  if (title.length > 140) return 'Az elem címe legfeljebb 140 karakter lehet.';
  return null;
}

export function validateEstimatedMinutes(value?: number): string | null {
  if (value === undefined) return null;
  if (!Number.isFinite(value) || value < 0) return 'A becsült idő nem lehet negatív.';
  if (value > 24 * 60) return 'A becsült idő legfeljebb 1440 perc lehet.';
  return null;
}

export function validateListEntity(list: Partial<ListEntity>): string[] {
  const errors: string[] = [];
  if (list.title !== undefined) {
    const error = validateListTitle(list.title);
    if (error) errors.push(error);
  }
  return errors;
}

export function validateListItemEntity(item: Partial<ListItemEntity>): string[] {
  const errors: string[] = [];
  if (item.title !== undefined) {
    const error = validateListItemTitle(item.title);
    if (error) errors.push(error);
  }
  const estimateError = validateEstimatedMinutes(item.estimatedMinutes);
  if (estimateError) errors.push(estimateError);
  return errors;
}
