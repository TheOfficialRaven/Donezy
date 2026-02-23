import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, MoreHorizontal, Check, Circle, Trash2, Edit3, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAppStore, type TodoList, type Task } from '@/stores/useAppStore';
import ListDialog from '@/components/dialogs/ListDialog';
import TaskDialog from '@/components/dialogs/TaskDialog';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import { toast } from 'sonner';

const priorityColors = {
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  medium: 'bg-warning/20 text-warning border-warning/30',
  high: 'bg-danger/20 text-danger border-danger/30'
};

const priorityLabels = {
  low: 'Alacsony',
  medium: 'Közepes',
  high: 'Magas'
};

export default function Lists() {
  const { lists, addTask, updateTask, deleteTask, deleteList } = useAppStore();
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, string>>({});
  const [newTaskPriorities, setNewTaskPriorities] = useState<Record<string, Task['priority']>>({});
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<TodoList | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<string | null>(null);
  const [taskDeleteConfirmOpen, setTaskDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{ listId: string; taskId: string } | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskDialogListId, setTaskDialogListId] = useState<string>('');

  const handleEditTask = (listId: string, task: Task) => {
    setTaskDialogListId(listId);
    setEditingTask(task);
    setTaskDialogOpen(true);
  };

  const toggleTask = async (listId: string, taskId: string, completed: boolean) => {
    await updateTask(listId, taskId, { completed: !completed });
  };

  const handleAddTask = async (listId: string) => {
    const title = newTaskInputs[listId]?.trim();
    if (!title) return;

    await addTask(listId, {
      title,
      completed: false,
      priority: newTaskPriorities[listId] || 'medium',
    });
    setNewTaskInputs({ ...newTaskInputs, [listId]: '' });
    setNewTaskPriorities({ ...newTaskPriorities, [listId]: 'medium' });
  };

  const confirmDeleteTask = (listId: string, taskId: string) => {
    setTaskToDelete({ listId, taskId });
    setTaskDeleteConfirmOpen(true);
  };

  const handleDeleteTask = async () => {
    if (taskToDelete) {
      await deleteTask(taskToDelete.listId, taskToDelete.taskId);
      toast.success('Feladat törölve.');
      setTaskDeleteConfirmOpen(false);
      setTaskToDelete(null);
    }
  };

  const handleEditList = (list: TodoList) => {
    setEditingList(list);
    setListDialogOpen(true);
  };

  const handleDeleteList = async () => {
    if (listToDelete) {
      await deleteList(listToDelete);
      toast.success('Lista törölve.');
      setDeleteConfirmOpen(false);
      setListToDelete(null);
    }
  };

  const getCompletedCount = (tasks: { completed: boolean }[]) => {
    return tasks.filter(task => task.completed).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary">Listák</h1>
          <p className="text-text-secondary">Szervezd meg teendőidet intelligens listákba</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-surface-0" onClick={() => { setEditingList(null); setListDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Új lista
        </Button>
      </div>

      {/* Lists Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {lists.map((list, index) => (
          <motion.div key={list.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <Card className="glass p-6 h-fit">
              {/* List Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: list.color }} />
                  <h3 className="font-heading font-semibold text-text-primary">{list.name}</h3>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-surface-1 border border-white/10">
                    <DropdownMenuItem className="text-text-primary hover:bg-white/5" onClick={() => handleEditList(list)}>
                      <Edit3 className="h-4 w-4 mr-2" />Szerkesztés
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-danger hover:bg-danger/10" onClick={() => { setListToDelete(list.id); setDeleteConfirmOpen(true); }}>
                      <Trash2 className="h-4 w-4 mr-2" />Törlés
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Progress */}
              {list.tasks.length > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-text-muted mb-2">
                    <span>{getCompletedCount(list.tasks)} / {list.tasks.length} kész</span>
                    <span>{Math.round((getCompletedCount(list.tasks) / list.tasks.length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-surface-2 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: list.color,
                        width: `${(getCompletedCount(list.tasks) / list.tasks.length) * 100}%`
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Tasks */}
              <div className="space-y-3 mb-4">
                {list.tasks.map((task) => (
                  <motion.div key={task.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group">
                    <div className={cn(
                      "flex items-center gap-3 p-3 rounded-lg bg-surface-1/30 hover:bg-surface-1/50 transition-colors",
                      task.completed && "opacity-60"
                    )}>
                      <button onClick={() => toggleTask(list.id, task.id, task.completed)} className="text-text-muted hover:text-primary transition-colors">
                        {task.completed ? (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: list.color }}>
                            <Check className="h-3 w-3 text-surface-0" />
                          </div>
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </button>
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleEditTask(list.id, task)}
                      >
                        <p className={cn("text-sm text-text-primary", task.completed && "line-through")}>{task.title}</p>
                        <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="focus:outline-none">
                              <Badge className={cn('text-xs cursor-pointer hover:opacity-80 transition-opacity', priorityColors[task.priority])}>
                                {priorityLabels[task.priority]}
                              </Badge>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="bg-surface-1 border border-white/10 min-w-[140px]">
                              <DropdownMenuItem
                                onClick={() => updateTask(list.id, task.id, { priority: 'low' })}
                                className="text-blue-400 hover:bg-white/5 cursor-pointer"
                              >
                                <div className="w-2 h-2 rounded-full bg-blue-400 mr-2" />
                                Alacsony
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateTask(list.id, task.id, { priority: 'medium' })}
                                className="text-warning hover:bg-white/5 cursor-pointer"
                              >
                                <div className="w-2 h-2 rounded-full bg-warning mr-2" />
                                Közepes
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateTask(list.id, task.id, { priority: 'high' })}
                                className="text-danger hover:bg-white/5 cursor-pointer"
                              >
                                <div className="w-2 h-2 rounded-full bg-danger mr-2" />
                                Magas
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          {task.dueDate && (
                            <Badge variant="outline" className="text-xs border-white/20">{new Date(task.dueDate).toLocaleDateString('hu-HU')}</Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTask(list.id, task)}
                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-text-muted hover:text-primary flex-shrink-0 w-8 h-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => confirmDeleteTask(list.id, task.id)}
                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-text-muted hover:text-danger flex-shrink-0 w-8 h-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Add Task Input */}
              <div className="flex gap-2 items-center">
                <Select
                  value={newTaskPriorities[list.id] || 'medium'}
                  onValueChange={(v) => setNewTaskPriorities({ ...newTaskPriorities, [list.id]: v as Task['priority'] })}
                >
                  <SelectTrigger className={cn(
                    "w-9 h-9 flex-shrink-0 border-white/10 px-0 justify-center [&>svg.lucide-chevron-down]:hidden",
                    (newTaskPriorities[list.id] || 'medium') === 'low' && 'bg-blue-500/10',
                    (newTaskPriorities[list.id] || 'medium') === 'medium' && 'bg-warning/10',
                    (newTaskPriorities[list.id] || 'medium') === 'high' && 'bg-danger/10',
                  )}>
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      (newTaskPriorities[list.id] || 'medium') === 'low' && 'bg-blue-400',
                      (newTaskPriorities[list.id] || 'medium') === 'medium' && 'bg-warning',
                      (newTaskPriorities[list.id] || 'medium') === 'high' && 'bg-danger',
                    )} />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-1 border-white/10">
                    <SelectItem value="low" className="text-blue-400">Alacsony</SelectItem>
                    <SelectItem value="medium" className="text-warning">Közepes</SelectItem>
                    <SelectItem value="high" className="text-danger">Magas</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Új feladat hozzáadása..."
                  value={newTaskInputs[list.id] || ''}
                  onChange={(e) => setNewTaskInputs({ ...newTaskInputs, [list.id]: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask(list.id); }}
                  className="flex-1 bg-surface-1/50 border-white/10 text-text-primary placeholder:text-text-muted"
                />
                <Button
                  onClick={() => handleAddTask(list.id)}
                  size="sm"
                  disabled={!newTaskInputs[list.id]?.trim()}
                  style={{ backgroundColor: list.color }}
                  className="text-surface-0 hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}

        {lists.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="col-span-full">
            <Card className="glass p-12 text-center">
              <Check className="h-16 w-16 text-text-disabled mx-auto mb-4" />
              <h3 className="text-lg font-heading font-semibold text-text-primary mb-2">Még nincsenek listáid</h3>
              <p className="text-text-muted mb-6">Hozd létre az első listádat a teendők szervezéséhez</p>
              <Button className="bg-primary hover:bg-primary/90 text-surface-0" onClick={() => { setEditingList(null); setListDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Első lista létrehozása
              </Button>
            </Card>
          </motion.div>
        )}
      </div>

      <ListDialog open={listDialogOpen} onOpenChange={setListDialogOpen} list={editingList} />
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        listId={taskDialogListId}
        task={editingTask}
      />
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Lista törlése"
        description="Biztosan törölni szeretnéd ezt a listát és az összes benne lévő feladatot? Ez a művelet nem vonható vissza."
        confirmLabel="Törlés"
        onConfirm={handleDeleteList}
        destructive
      />
      <ConfirmDialog
        open={taskDeleteConfirmOpen}
        onOpenChange={setTaskDeleteConfirmOpen}
        title="Feladat törlése"
        description="Biztosan törölni szeretnéd ezt a feladatot?"
        confirmLabel="Törlés"
        onConfirm={handleDeleteTask}
        destructive
      />
    </div>
  );
}
