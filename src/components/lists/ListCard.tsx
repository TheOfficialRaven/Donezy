import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, ChevronUp, MoreHorizontal, Plus } from 'lucide-react';
import type { Task, TodoList } from '@/stores/useAppStore';
import { getListProgress, getListTypeBehavior, isListOverloaded, isTaskHandled, sortAndFilterItems } from '@/lib/lists/selectors';
import type { ListItemsFilter, ListItemsSort } from '@/lib/lists/types';
import { cn } from '@/lib/utils';
import ListProgress from './ListProgress';
import ListItemRow from './ListItemRow';

interface ListCardProps {
  list: TodoList;
  itemFilter: ListItemsFilter;
  itemSort: ListItemsSort;
  onAddTask: (title: string, priority?: Task['priority']) => Promise<void>;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onEditList: () => void;
  onDeleteList: () => void;
  onArchiveList: () => void;
  onPinList: () => void;
  onMoveListUp: () => void;
  onMoveListDown: () => void;
  onOpenDetail: () => void;
}

export default function ListCard({
  list,
  itemFilter,
  itemSort,
  onAddTask,
  onUpdateTask,
  onEditTask,
  onDeleteTask,
  onEditList,
  onDeleteList,
  onArchiveList,
  onPinList,
  onMoveListUp,
  onMoveListDown,
  onOpenDetail,
}: ListCardProps) {
  const [newTitle, setNewTitle] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const progress = getListProgress(list as any);
  const shopping = list.type === 'shopping';
  const behavior = getListTypeBehavior(list as any);
  const tasks = sortAndFilterItems(list as any, itemFilter, itemSort);

  const handleAdd = async () => {
    const title = newTitle.trim();
    if (!title) return;
    await onAddTask(title, shopping ? 'medium' : priority);
    setNewTitle('');
  };

  return (
    <Card className="glass p-5 h-fit">
      <div className="flex items-center justify-between mb-3 gap-2">
        <button className="flex items-center gap-3 min-w-0" onClick={onOpenDetail}>
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: list.color }} />
          <h3 className="font-heading font-semibold text-text-primary truncate">{list.title || list.name}</h3>
          {list.pinned && <Badge variant="outline" className="text-xs border-primary/30 text-primary">Pinned</Badge>}
          {isListOverloaded(list as any) && <Badge className="text-xs bg-warning/20 text-warning border-warning/30">Túl sok nyitott</Badge>}
        </button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onMoveListUp}><ChevronUp className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={onMoveListDown}><ChevronDown className="h-4 w-4" /></Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-surface-1 border-white/10">
              <DropdownMenuItem onClick={onOpenDetail}>Részletes nézet</DropdownMenuItem>
              <DropdownMenuItem onClick={onEditList}>Szerkesztés</DropdownMenuItem>
              <DropdownMenuItem onClick={onPinList}>{list.pinned ? 'Pin levétele' : 'Pinelés'}</DropdownMenuItem>
              <DropdownMenuItem onClick={onArchiveList}>{list.archived ? 'Visszaállítás' : 'Archiválás'}</DropdownMenuItem>
              <DropdownMenuItem onClick={onDeleteList} className="text-danger">Törlés</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ListProgress done={progress.done} total={progress.total} color={list.color} />
      {list.type === 'project' && (
        <p className="text-xs text-text-muted mb-3">Projekt előrehaladás fókuszban: tartsd kicsiben az aktív elemeket.</p>
      )}
      {list.type === 'self-development' && (
        <p className="text-xs text-text-muted mb-3">
          Önfejlesztés: jelöld „Ma”-ra, amin tényleg dolgozol.
          {` Címkék: ${list.tasks.reduce((sum, item) => sum + ((item.tags || []).length > 0 ? 1 : 0), 0)} elem.`}
        </p>
      )}
      {list.type === 'ideas' && (
        <p className="text-xs text-text-muted mb-3">Ötletlista: először rögzíts, utána priorizálj.</p>
      )}

      <div className="space-y-2 mb-3">
        {tasks.map((task) => (
          <ListItemRow
            key={task.id}
            list={list}
            task={task as Task}
            handled={isTaskHandled(list as any, task)}
            onToggle={() => onUpdateTask(task.id, { completed: !task.completed })}
            onSetShoppingStatus={(status) => onUpdateTask(task.id, { shoppingStatus: status })}
            onEdit={() => onEditTask(task as Task)}
            onDelete={() => onDeleteTask(task.id)}
            onPriorityChange={(next) => onUpdateTask(task.id, { priority: next })}
            onWorkflowStatusChange={(status) => onUpdateTask(task.id, { workflowStatus: status })}
          />
        ))}
        {tasks.length === 0 && (
          <p className="text-xs text-text-muted px-1">
            {progress.total === 0
              ? 'Még nincs elem. Kezdd egy apró lépéssel.'
              : progress.open === 0
                ? 'Szuper, minden elem kész ezen a listán.'
                : 'A szűrőben most nincs megjeleníthető elem.'}
          </p>
        )}
      </div>

      <div className={cn('flex gap-2 items-center', behavior.quickEntry && 'gap-1')}>
        {!shopping && behavior.checkboxFirst && (
          <div className="flex flex-col gap-0.5 shrink-0 min-w-[7.5rem]">
            <span className="text-[10px] text-text-muted leading-none px-0.5">Prioritás</span>
            <Select value={priority} onValueChange={(v) => setPriority(v as Task['priority'])}>
              <SelectTrigger
                className="h-9 border-white/10 bg-surface-1/50 text-xs text-text-primary px-2"
                aria-label="Új tétel prioritása"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-surface-1 border-white/10">
                <SelectItem value="low">Alacsony</SelectItem>
                <SelectItem value="medium">Közepes</SelectItem>
                <SelectItem value="high">Magas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <Input
          placeholder={
            shopping
              ? 'Termék hozzáadása...'
              : list.type === 'ideas'
                ? 'Új ötlet...'
                : 'Új tétel...'
          }
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className={cn('bg-surface-1/50 border-white/10', behavior.quickEntry && 'text-sm')}
        />
        <Button onClick={handleAdd} size="sm" style={{ backgroundColor: list.color }} className="text-surface-0 hover:opacity-90">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
