import { getLocalDateString } from '@/lib/dateUtils';
import { REFLECTION_SCHEMA_VERSION, REFLECTION_TYPES } from './constants';
import type { ReflectionEntry, ReflectionEntryRaw, ReflectionMood } from './types';

function toType(input: unknown): ReflectionEntry['type'] {
  return REFLECTION_TYPES.includes(input as any) ? (input as ReflectionEntry['type']) : 'normal';
}

function toMood(input: unknown): ReflectionMood | undefined {
  const n = Number(input);
  if (!Number.isFinite(n)) return undefined;
  if (n < 1 || n > 5) return undefined;
  return Math.round(n) as ReflectionMood;
}

export function normalizeReflectionEntry(raw: ReflectionEntryRaw, userId?: string): ReflectionEntry {
  const now = new Date().toISOString();
  const content =
    String(raw.content || '').trim() ||
    String(raw.freeWrite || '').trim() ||
    String(raw.feelings || '').trim() ||
    String(raw.lessons || '').trim() ||
    String(raw.gratitude || '').trim() ||
    '';
  return {
    id: raw.id,
    userId: raw.userId || userId,
    date: raw.date || getLocalDateString(),
    type: toType(raw.type),
    mood: toMood(raw.mood) || 3,
    title: raw.title?.trim() || undefined,
    content,
    wins: raw.wins || raw.growth,
    difficulties: raw.difficulties,
    lessons: raw.lessons,
    gratitude: raw.gratitude,
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === 'string') : [],
    privateLevel: raw.privateLevel || 'private',
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
    sourceType: raw.sourceType || 'manual',
    futureOriginReference: raw.futureOriginReference,
    futureLinkTargets: raw.futureLinkTargets && typeof raw.futureLinkTargets === 'object' ? raw.futureLinkTargets : {},
    schemaVersion: REFLECTION_SCHEMA_VERSION,
    feelings: raw.feelings,
    growth: raw.growth,
    freeWrite: raw.freeWrite,
    focusArea: (raw as any).focusArea,
    focusAreaSource: (raw as any).focusAreaSource,
  };
}
