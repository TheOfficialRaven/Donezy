export type ListType =
  | 'general'
  | 'todo'
  | 'shopping'
  | 'project'
  | 'ideas'
  | 'routine'
  | 'self-development';

export type TargetGroup =
  | 'all'
  | 'selfdev'
  | 'student'
  | 'worker'
  | 'freelancer'
  | 'organizer';

export type ItemPriority = 'low' | 'medium' | 'high';
export type ItemSourceType = 'manual' | 'quick-add' | 'imported' | 'suggested';
// Workflow status is for planning intent, not completion state.
export type ItemWorkflowStatus = 'active' | 'today' | 'later' | 'someday';

export interface FutureLinkTargets {
  dailyFocusCandidate?: boolean;
  questCandidate?: boolean;
  calendarCandidate?: boolean;
  habitCandidate?: boolean;
  goalCandidate?: boolean;
}

export interface ListItemEntity {
  id: string;
  listId: string;
  title: string;
  description?: string;
  // completed only indicates closure of the item lifecycle.
  completed: boolean;
  priority: ItemPriority;
  dueDate?: string;
  estimatedMinutes?: number;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  sortOrder: number;
  // sourceType is integration metadata, not priority/workflow decision.
  sourceType: ItemSourceType;
  workflowStatus?: ItemWorkflowStatus;
  // futureLinkTargets are integration hints for future modules.
  futureLinkTargets?: FutureLinkTargets;
  shoppingStatus?: 'pending' | 'purchased' | 'not_available';
  focusArea?: import('@/lib/focusAreas').FocusArea;
  focusAreaSource?: import('@/lib/focusAreas').FocusAreaSource;
  manualPriority?: number;
  lastInteractedAt?: string;
  postponedCount?: number;
  xpAwarded?: boolean;
}

export interface ListEntity {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  type: ListType;
  color: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  pinned: boolean;
  sortOrder: number;
  targetGroupVisibility: TargetGroup[];
  tags: string[];
  schemaVersion: 2;
  tasks: ListItemEntity[];
}

export type ListViewFilter = 'all' | 'pinned' | 'active' | 'archived';
export type ListItemsFilter = 'all' | 'open' | 'completed';
export type ListItemsSort = 'manual' | 'priority' | 'dueDate';

export interface ListsProductivityMetrics {
  totalOpenItems: number;
  totalCompletedItems: number;
  overdueItemsCount: number;
  todayMarkedItemsCount: number;
  highPriorityOpenItemsCount: number;
  totalEstimatedMinutesOpen: number;
  deferredLaterItemsCount: number;
  overloadedListsCount: number;
}
