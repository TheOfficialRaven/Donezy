import type { ListItemEntity } from './types';

export interface ListIntegrationCandidate {
  id: string;
  title: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  sourceType: string;
}

export function toDailyFocusCandidate(item: ListItemEntity): ListIntegrationCandidate | null {
  if (!item.futureLinkTargets?.dailyFocusCandidate) return null;
  return {
    id: item.id,
    title: item.title,
    dueDate: item.dueDate,
    priority: item.priority,
    sourceType: item.sourceType,
  };
}

export function toQuestCandidate(item: ListItemEntity): ListIntegrationCandidate | null {
  if (!item.futureLinkTargets?.questCandidate) return null;
  return {
    id: item.id,
    title: item.title,
    dueDate: item.dueDate,
    priority: item.priority,
    sourceType: item.sourceType,
  };
}

export function toCalendarCandidate(item: ListItemEntity): ListIntegrationCandidate | null {
  if (!item.futureLinkTargets?.calendarCandidate) return null;
  return {
    id: item.id,
    title: item.title,
    dueDate: item.dueDate,
    priority: item.priority,
    sourceType: item.sourceType,
  };
}
