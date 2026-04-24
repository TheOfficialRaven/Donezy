import type { ListType } from './types';

export const LISTS_SCHEMA_VERSION = 2 as const;

export const DEFAULT_LIST_TYPE: ListType = 'general';
export const DEFAULT_LIST_COLOR = '#4DA3FF';
export const DEFAULT_LIST_ICON = 'list';

export const LIST_TYPE_META: Record<ListType, { label: string; icon: string }> = {
  general: { label: 'Általános', icon: 'list' },
  todo: { label: 'Teendők', icon: 'check-square' },
  shopping: { label: 'Bevásárlás', icon: 'shopping-cart' },
  project: { label: 'Projekt', icon: 'folder-kanban' },
  ideas: { label: 'Ötletek', icon: 'lightbulb' },
  routine: { label: 'Rutin', icon: 'repeat' },
  'self-development': { label: 'Önfejlesztés', icon: 'sparkles' },
};

export const LARGE_LIST_OPEN_ITEMS_THRESHOLD = 20;
