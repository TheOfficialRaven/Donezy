import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore, type Task, type TodoList } from '@/stores/useAppStore';
import { filterLists, getListsProductivityMetrics } from '@/lib/lists/selectors';
import ListDialog from '@/components/dialogs/ListDialog';
import TaskDialog from '@/components/dialogs/TaskDialog';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import ListsToolbar from '@/components/lists/ListsToolbar';
import ListCard from '@/components/lists/ListCard';
import ListsEmptyState from '@/components/lists/ListsEmptyState';
import { toast } from 'sonner';

export default function Lists() {
  const navigate = useNavigate();
  const {
    lists,
    addTask,
    updateTask,
    deleteTask,
    deleteList,
    archiveList,
    pinList,
    reorderLists,
    listViewFilter,
    listSearchQuery,
    listItemsFilter,
    listItemsSort,
    setListViewFilter,
    setListSearchQuery,
    setListItemsFilter,
    setListItemsSort,
  } = useAppStore();

  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<TodoList | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<string | null>(null);
  const [taskDeleteConfirmOpen, setTaskDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{ listId: string; taskId: string } | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskDialogListId, setTaskDialogListId] = useState<string>('');

  const visibleLists = useMemo(
    () => filterLists(lists as any, listViewFilter, listSearchQuery) as TodoList[],
    [lists, listViewFilter, listSearchQuery]
  );
  const metrics = useMemo(() => getListsProductivityMetrics(lists as any), [lists]);

  const handleAddTask = async (list: TodoList, title: string, priority: Task['priority'] = 'medium') => {
    const shopping = list.type === 'shopping';
    await addTask(list.id, {
      title,
      completed: false,
      priority,
      sourceType: 'manual',
      workflowStatus: 'active',
      tags: [],
      futureLinkTargets: {
        dailyFocusCandidate: false,
        questCandidate: false,
        calendarCandidate: false,
        habitCandidate: false,
        goalCandidate: false,
      },
      ...(shopping ? { shoppingStatus: 'pending' as const } : {}),
    });
  };

  const handleEditTask = (listId: string, task: Task) => {
    setTaskDialogListId(listId);
    setEditingTask(task);
    setTaskDialogOpen(true);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    await deleteTask(taskToDelete.listId, taskToDelete.taskId);
    toast.success('Elem törölve.');
    setTaskDeleteConfirmOpen(false);
    setTaskToDelete(null);
  };

  const handleDeleteList = async () => {
    if (!listToDelete) return;
    await deleteList(listToDelete);
    toast.success('Lista törölve.');
    setDeleteConfirmOpen(false);
    setListToDelete(null);
  };

  const moveList = async (listId: string, direction: -1 | 1) => {
    const index = visibleLists.findIndex((l) => l.id === listId);
    if (index < 0) return;
    const target = index + direction;
    if (target < 0 || target >= visibleLists.length) return;
    const reordered = [...visibleLists];
    const [item] = reordered.splice(index, 1);
    reordered.splice(target, 0, item);
    await reorderLists(reordered.map((l) => l.id));
  };

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-text-primary">Listák</h1>
        <p className="text-text-secondary">Központi rendszerező felület feladatokhoz, projektekhez, bevásárláshoz és ötletekhez.</p>
        <p className="text-xs text-text-muted mt-1">
          Nyitott: {metrics.totalOpenItems} · Kész: {metrics.totalCompletedItems} · Mára jelölt: {metrics.todayMarkedItemsCount} · Később: {metrics.deferredLaterItemsCount}
        </p>
      </div>

      <ListsToolbar
        query={listSearchQuery}
        onQueryChange={setListSearchQuery}
        viewFilter={listViewFilter}
        onViewFilterChange={setListViewFilter}
        itemFilter={listItemsFilter}
        onItemFilterChange={setListItemsFilter}
        itemSort={listItemsSort}
        onItemSortChange={setListItemsSort}
        onCreateList={() => {
          setEditingList(null);
          setListDialogOpen(true);
        }}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visibleLists.map((list, index) => (
          <motion.div key={list.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <ListCard
              list={list}
              itemFilter={listItemsFilter}
              itemSort={listItemsSort}
              onAddTask={(title, priority) => handleAddTask(list, title, priority || 'medium')}
              onUpdateTask={(taskId, updates) => updateTask(list.id, taskId, updates)}
              onEditTask={(task) => handleEditTask(list.id, task)}
              onDeleteTask={(taskId) => {
                setTaskToDelete({ listId: list.id, taskId });
                setTaskDeleteConfirmOpen(true);
              }}
              onEditList={() => {
                setEditingList(list);
                setListDialogOpen(true);
              }}
              onDeleteList={() => {
                setListToDelete(list.id);
                setDeleteConfirmOpen(true);
              }}
              onArchiveList={() => archiveList(list.id, !list.archived)}
              onPinList={() => pinList(list.id, !list.pinned)}
              onMoveListUp={() => moveList(list.id, -1)}
              onMoveListDown={() => moveList(list.id, 1)}
              onOpenDetail={() => navigate(`/app/lists/${list.id}`)}
            />
          </motion.div>
        ))}

        {visibleLists.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="col-span-full">
            <ListsEmptyState
              filtered={Boolean(listSearchQuery.trim()) || listViewFilter !== 'all'}
              viewFilter={listViewFilter}
              hasAnyLists={lists.length > 0}
              hasOverload={metrics.overloadedListsCount > 0}
              onCreate={() => {
                setEditingList(null);
                setListDialogOpen(true);
              }}
            />
          </motion.div>
        )}
      </div>

      <ListDialog open={listDialogOpen} onOpenChange={setListDialogOpen} list={editingList} />
      <TaskDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} listId={taskDialogListId} task={editingTask} />
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Lista törlése"
        description="Biztosan törölni szeretnéd ezt a listát az elemeivel együtt?"
        confirmLabel="Törlés"
        onConfirm={handleDeleteList}
        destructive
      />
      <ConfirmDialog
        open={taskDeleteConfirmOpen}
        onOpenChange={setTaskDeleteConfirmOpen}
        title="Elem törlése"
        description="Biztosan törölni szeretnéd ezt az elemet?"
        confirmLabel="Törlés"
        onConfirm={handleDeleteTask}
        destructive
      />
    </div>
  );
}
