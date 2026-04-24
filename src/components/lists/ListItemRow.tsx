import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Task, TodoList } from '@/stores/useAppStore';
import { Check, Circle, Clock3, Lightbulb, Pencil, Trash2, X } from 'lucide-react';
import { getEffectiveWorkflowStatus } from '@/lib/lists/selectors';

interface ListItemRowProps {
  list: TodoList;
  task: Task;
  handled: boolean;
  onToggle: () => void;
  onSetShoppingStatus: (status: 'pending' | 'purchased' | 'not_available') => void;
  onEdit: () => void;
  onDelete: () => void;
  onPriorityChange: (priority: Task['priority']) => void;
  onWorkflowStatusChange: (status: Task['workflowStatus']) => void;
}

const priorityColors = {
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  medium: 'bg-warning/20 text-warning border-warning/30',
  high: 'bg-danger/20 text-danger border-danger/30',
} as const;

const priorityLabels = {
  low: 'Alacsony',
  medium: 'Közepes',
  high: 'Magas',
} as const;

export default function ListItemRow({
  list,
  task,
  handled,
  onToggle,
  onSetShoppingStatus,
  onEdit,
  onDelete,
  onPriorityChange,
  onWorkflowStatusChange,
}: ListItemRowProps) {
  const shopping = list.type === 'shopping';
  const ideaMode = list.type === 'ideas';
  const workflow = getEffectiveWorkflowStatus(task as any);
  const rowTone =
    workflow === 'today'
      ? 'ring-1 ring-primary/30 bg-primary/10'
      : workflow === 'later' || workflow === 'someday'
        ? 'bg-surface-1/20 border border-white/10'
        : 'bg-surface-1/30 hover:bg-surface-1/50';
  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-lg', rowTone, handled && 'opacity-60')}>
      {shopping ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-text-muted hover:text-primary transition-colors">
              {task.shoppingStatus === 'not_available' ? (
                <div className="w-5 h-5 rounded-full bg-danger/80 flex items-center justify-center">
                  <X className="h-3 w-3 text-surface-0" />
                </div>
              ) : handled ? (
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: list.color }}>
                  <Check className="h-3 w-3 text-surface-0" />
                </div>
              ) : (
                <Circle className="h-5 w-5" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-surface-1 border-white/10">
            <DropdownMenuItem onClick={() => onSetShoppingStatus('pending')}>
              <Circle className="h-4 w-4 mr-2" />Függőben
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSetShoppingStatus('purchased')}>
              <Check className="h-4 w-4 mr-2" />Megvásárolva
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSetShoppingStatus('not_available')}>
              <X className="h-4 w-4 mr-2" />Nem volt a boltban
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <button onClick={onToggle} className="text-text-muted hover:text-primary transition-colors">
          {ideaMode ? (
            <Lightbulb className={cn('h-5 w-5', handled ? 'text-warning' : 'text-text-muted')} />
          ) : handled ? (
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: list.color }}>
              <Check className="h-3 w-3 text-surface-0" />
            </div>
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </button>
      )}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm text-text-primary', handled && 'line-through')}>{task.title}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {!handled && workflow === 'today' && (
            <Badge className="text-xs bg-primary/20 text-primary border-primary/30">Ma</Badge>
          )}
          {!handled && (workflow === 'later' || workflow === 'someday') && (
            <Badge variant="outline" className="text-xs border-white/20">
              {workflow === 'later' ? 'Később' : 'Valamikor'}
            </Badge>
          )}
          {shopping ? (
            task.shoppingStatus === 'not_available' && (
              <Badge className="text-xs bg-danger/20 text-danger border-danger/30">Nem volt a boltban</Badge>
            )
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="focus:outline-none">
                  <Badge className={cn('text-xs cursor-pointer', priorityColors[task.priority])}>{priorityLabels[task.priority]}</Badge>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-surface-1 border-white/10">
                <DropdownMenuItem onClick={() => onPriorityChange('low')}>Alacsony</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPriorityChange('medium')}>Közepes</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPriorityChange('high')}>Magas</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {task.dueDate && <Badge variant="outline" className="text-xs border-white/20">{new Date(task.dueDate).toLocaleDateString('hu-HU')}</Badge>}
          {task.estimatedMinutes && (
            <Badge variant="outline" className="text-xs border-white/20">
              <Clock3 className="h-3 w-3 mr-1" />
              {task.estimatedMinutes}p
            </Badge>
          )}
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onEdit} className="w-8 h-8 p-0">
        <Pencil className="h-4 w-4" />
      </Button>
      {!handled && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
              <Clock3 className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-surface-1 border-white/10">
            <DropdownMenuItem onClick={() => onWorkflowStatusChange('today')}>Jelöld mára</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onWorkflowStatusChange('active')}>Aktív</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onWorkflowStatusChange('later')}>Későbbre</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onWorkflowStatusChange('someday')}>Valamikorra</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <Button variant="ghost" size="sm" onClick={onDelete} className="w-8 h-8 p-0 hover:text-danger">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
