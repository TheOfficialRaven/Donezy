import { LARGE_LIST_OPEN_ITEMS_THRESHOLD } from './constants';
import type { ListEntity, ListItemsFilter, ListItemsSort, ListViewFilter, ListsProductivityMetrics } from './types';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function isOverdueDate(dueDate?: string) {
  if (!dueDate) return false;
  return dueDate < todayKey();
}

export function getEffectiveWorkflowStatus(task: { workflowStatus?: string; completed: boolean }) {
  if (task.completed) return 'done';
  return task.workflowStatus || 'active';
}

export function isTaskHandled(list: Pick<ListEntity, 'type'>, task: { completed: boolean; shoppingStatus?: string }) {
  // Central closure logic:
  // - completed is always the primary closure flag.
  // - shoppingStatus is list-specific compatibility that can also close a shopping item.
  if (task.completed) return true;
  if (list.type === 'shopping') {
    return task.shoppingStatus === 'purchased';
  }
  return false;
}

export function getListProgress(list: ListEntity) {
  const total = list.tasks.length;
  const done = list.tasks.filter((task) => isTaskHandled(list, task)).length;
  const open = Math.max(0, total - done);
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return { total, done, open, percent };
}

export function isListOverloaded(list: ListEntity) {
  const { open } = getListProgress(list);
  return open >= LARGE_LIST_OPEN_ITEMS_THRESHOLD;
}

export function getListTypeBehavior(list: Pick<ListEntity, 'type'>) {
  if (list.type === 'shopping') return { quickEntry: true, checkboxFirst: true, progressEmphasis: 'medium' as const };
  if (list.type === 'project') return { quickEntry: false, checkboxFirst: true, progressEmphasis: 'high' as const };
  if (list.type === 'ideas') return { quickEntry: true, checkboxFirst: false, progressEmphasis: 'low' as const };
  if (list.type === 'self-development') return { quickEntry: false, checkboxFirst: true, progressEmphasis: 'medium' as const };
  return { quickEntry: false, checkboxFirst: true, progressEmphasis: 'medium' as const };
}

export function filterLists(lists: ListEntity[], view: ListViewFilter, query: string) {
  const q = query.trim().toLowerCase();
  return lists
    .filter((list) => {
      if (view === 'pinned') return list.pinned && !list.archived;
      if (view === 'active') return !list.archived;
      if (view === 'archived') return list.archived;
      return true;
    })
    .filter((list) => {
      if (!q) return true;
      const listText = `${list.title} ${list.description || ''}`.toLowerCase();
      if (listText.includes(q)) return true;
      return list.tasks.some((task) => task.title.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.title.localeCompare(b.title, 'hu');
    });
}

export function sortAndFilterItems(list: ListEntity, filter: ListItemsFilter, sort: ListItemsSort) {
  const filtered = list.tasks.filter((task) => {
    const handled = isTaskHandled(list, task);
    if (filter === 'open') return !handled;
    if (filter === 'completed') return handled;
    return true;
  });

  if (sort === 'manual') return [...filtered].sort((a, b) => a.sortOrder - b.sortOrder);
  if (sort === 'priority') {
    const rank = { high: 0, medium: 1, low: 2 };
    return [...filtered].sort((a, b) => rank[a.priority] - rank[b.priority] || a.sortOrder - b.sortOrder);
  }
  return [...filtered].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return a.sortOrder - b.sortOrder;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
}

export function getTotalOpenItems(lists: ListEntity[]) {
  return lists.reduce((sum, list) => sum + list.tasks.filter((task) => !isTaskHandled(list, task)).length, 0);
}

export function getTotalCompletedItems(lists: ListEntity[]) {
  return lists.reduce((sum, list) => sum + list.tasks.filter((task) => isTaskHandled(list, task)).length, 0);
}

export function getOverdueItemsCount(lists: ListEntity[]) {
  return lists.reduce(
    (sum, list) => sum + list.tasks.filter((task) => !isTaskHandled(list, task) && isOverdueDate(task.dueDate)).length,
    0
  );
}

export function getTodayMarkedItemsCount(lists: ListEntity[]) {
  return lists.reduce(
    (sum, list) => sum + list.tasks.filter((task) => !isTaskHandled(list, task) && getEffectiveWorkflowStatus(task) === 'today').length,
    0
  );
}

export function getHighPriorityOpenItemsCount(lists: ListEntity[]) {
  return lists.reduce(
    (sum, list) => sum + list.tasks.filter((task) => !isTaskHandled(list, task) && task.priority === 'high').length,
    0
  );
}

export function getTotalEstimatedMinutesOpen(lists: ListEntity[]) {
  return lists.reduce(
    (sum, list) =>
      sum +
      list.tasks
        .filter((task) => !isTaskHandled(list, task))
        .reduce((acc, task) => acc + (task.estimatedMinutes || 0), 0),
    0
  );
}

export function getDeferredLaterItemsCount(lists: ListEntity[]) {
  return lists.reduce(
    (sum, list) => sum + list.tasks.filter((task) => !isTaskHandled(list, task) && getEffectiveWorkflowStatus(task) === 'later').length,
    0
  );
}

export function getFocusCandidateItems(lists: ListEntity[]) {
  return lists
    .flatMap((list) => list.tasks.map((task) => ({ list, task })))
    .filter(
      ({ list, task }) =>
        !isTaskHandled(list, task) &&
        (task.futureLinkTargets?.dailyFocusCandidate || task.workflowStatus === 'today' || task.priority === 'high')
    )
    .map(({ list, task }) => ({
      listId: list.id,
      listTitle: list.title,
      itemId: task.id,
      itemTitle: task.title,
      priority: task.priority,
      dueDate: task.dueDate,
      workflowStatus: task.workflowStatus || 'active',
    }));
}

export function getListsProductivityMetrics(lists: ListEntity[]): ListsProductivityMetrics {
  return {
    totalOpenItems: getTotalOpenItems(lists),
    totalCompletedItems: getTotalCompletedItems(lists),
    overdueItemsCount: getOverdueItemsCount(lists),
    todayMarkedItemsCount: getTodayMarkedItemsCount(lists),
    highPriorityOpenItemsCount: getHighPriorityOpenItemsCount(lists),
    totalEstimatedMinutesOpen: getTotalEstimatedMinutesOpen(lists),
    deferredLaterItemsCount: getDeferredLaterItemsCount(lists),
    overloadedListsCount: lists.filter(isListOverloaded).length,
  };
}
