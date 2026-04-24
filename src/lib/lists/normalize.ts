import { DEFAULT_LIST_COLOR, DEFAULT_LIST_ICON, DEFAULT_LIST_TYPE, LISTS_SCHEMA_VERSION } from './constants';
import type { ListEntity, ListItemEntity, ListType } from './types';

function inferLegacyListType(name?: string): ListType {
  const value = (name || '').toLowerCase();
  if (value.includes('bevásárl') || value.includes('bevasarl')) return 'shopping';
  if (value.includes('ötlet') || value.includes('otlet')) return 'ideas';
  if (value.includes('projekt')) return 'project';
  if (value.includes('rutin')) return 'routine';
  if (value.includes('teend')) return 'todo';
  return DEFAULT_LIST_TYPE;
}

export function normalizeListItem(raw: any, listId: string, index: number): ListItemEntity {
  const now = new Date().toISOString();
  const completed = Boolean(raw?.completed);
  const shoppingStatus = raw?.shoppingStatus;
  const normalizedShoppingStatus = shoppingStatus || (completed ? 'purchased' : 'pending');
  const workflowStatus =
    raw?.workflowStatus === 'today' || raw?.workflowStatus === 'later' || raw?.workflowStatus === 'someday'
      ? raw.workflowStatus
      : 'active';
  return {
    id: raw?.id || `${listId}-item-${index}`,
    listId,
    title: raw?.title || '',
    description: raw?.description || '',
    completed: raw?.shoppingStatus ? raw.shoppingStatus === 'purchased' : completed,
    priority: raw?.priority || 'medium',
    dueDate: raw?.dueDate,
    estimatedMinutes: raw?.estimatedMinutes,
    tags: Array.isArray(raw?.tags) ? raw.tags : [],
    notes: raw?.notes,
    createdAt: raw?.createdAt || now,
    updatedAt: raw?.updatedAt || now,
    completedAt: raw?.completedAt,
    sortOrder: Number.isFinite(raw?.sortOrder) ? raw.sortOrder : index,
    sourceType: raw?.sourceType || 'manual',
    workflowStatus,
    futureLinkTargets: raw?.futureLinkTargets || {},
    shoppingStatus: normalizedShoppingStatus,
    focusArea: raw?.focusArea,
    focusAreaSource: raw?.focusAreaSource,
    manualPriority: raw?.manualPriority,
    lastInteractedAt: raw?.lastInteractedAt || now,
    postponedCount: raw?.postponedCount || 0,
    xpAwarded: raw?.xpAwarded,
  };
}

export function normalizeList(raw: any, userId?: string, index = 0): ListEntity {
  const now = new Date().toISOString();
  const type = (raw?.type as ListType) || inferLegacyListType(raw?.title || raw?.name);
  const tasksRaw = Array.isArray(raw?.tasks) ? raw.tasks : [];
  const tasks = tasksRaw.map((task, taskIndex) => normalizeListItem(task, raw?.id || `list-${index}`, taskIndex));
  return {
    id: raw?.id || `list-${index}`,
    userId,
    title: raw?.title || raw?.name || 'Névtelen lista',
    description: raw?.description || '',
    type,
    color: raw?.color || DEFAULT_LIST_COLOR,
    icon: raw?.icon || DEFAULT_LIST_ICON,
    createdAt: raw?.createdAt || now,
    updatedAt: raw?.updatedAt || now,
    archived: Boolean(raw?.archived),
    pinned: Boolean(raw?.pinned),
    sortOrder: Number.isFinite(raw?.sortOrder) ? raw.sortOrder : index,
    targetGroupVisibility: Array.isArray(raw?.targetGroupVisibility) ? raw.targetGroupVisibility : ['all'],
    tags: Array.isArray(raw?.tags) ? raw.tags : [],
    schemaVersion: LISTS_SCHEMA_VERSION,
    tasks,
  };
}
