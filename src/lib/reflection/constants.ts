import type { ReflectionMood, ReflectionSourceType, ReflectionType } from './types';

export const REFLECTION_SCHEMA_VERSION = 2 as const;
export const REFLECTION_TYPES: ReflectionType[] = ['quick', 'normal', 'deep'];
export const REFLECTION_SOURCE_TYPES: ReflectionSourceType[] = ['manual', 'import', 'suggestion', 'system', 'integration'];
export const REFLECTION_MOODS: ReflectionMood[] = [1, 2, 3, 4, 5];

export const REFLECTION_TYPE_LABELS: Record<ReflectionType, string> = {
  quick: 'Gyors',
  normal: 'Normal',
  deep: 'Mely',
};

export const REFLECTION_MAX_TITLE = 140;
export const REFLECTION_MAX_TEXT = 6000;
