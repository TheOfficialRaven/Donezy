import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, ChevronDown, ChevronUp, Clock3, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/stores/useAppStore';
import { getEffectiveWorkflowStatus, getListProgress, sortAndFilterItems } from '@/lib/lists/selectors';

export default function ListDetail() {
  const navigate = useNavigate();
  const { listId } = useParams();
  const { lists, listItemsFilter, listItemsSort, reorderListItems, updateTask, addTask } = useAppStore();
  const list = useMemo(() => lists.find((l) => l.id === listId), [lists, listId]);
  const [quickTitle, setQuickTitle] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  if (!list) {
    return (
      <Card className="glass p-8 text-center">
        <p className="text-text-muted mb-4">A lista nem található.</p>
        <Button onClick={() => navigate('/app/lists')}>Vissza a listákhoz</Button>
      </Card>
    );
  }

  const progress = getListProgress(list as any);
  const tasks = sortAndFilterItems(list as any, listItemsFilter, listItemsSort);

  const addQuickTask = async () => {
    const title = quickTitle.trim();
    if (!title) return;
    await addTask(list.id, {
      title,
      completed: false,
      priority: 'medium',
      workflowStatus: list.type === 'shopping' ? 'today' : 'active',
      sourceType: 'manual',
      tags: [],
      futureLinkTargets: {},
    });
    setQuickTitle('');
  };

  const moveItem = async (taskId: string, direction: -1 | 1) => {
    const index = tasks.findIndex((task) => task.id === taskId);
    if (index < 0) return;
    const target = index + direction;
    if (target < 0 || target >= tasks.length) return;
    const reordered = [...tasks];
    const [item] = reordered.splice(index, 1);
    reordered.splice(target, 0, item);
    await reorderListItems(list.id, reordered.map((task) => task.id));
  };

  return (
    <div className="space-y-4 pb-8">
      <Button variant="ghost" onClick={() => navigate('/app/lists')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Vissza
      </Button>
      <Card className="glass p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: list.color }} />
          <h1 className="text-2xl font-heading font-bold text-text-primary">{list.title || list.name}</h1>
          {list.pinned && <Badge variant="outline" className="border-primary/30 text-primary">Pinned</Badge>}
          {list.archived && <Badge variant="outline">Archivált</Badge>}
        </div>
        {list.description && <p className="text-text-secondary mb-3">{list.description}</p>}
        <p className="text-sm text-text-muted">{progress.done}/{progress.total} kész, {progress.open} nyitott</p>
        <div className="mt-4 flex gap-2">
          <Input
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addQuickTask()}
            placeholder={list.type === 'shopping' ? 'Új termék gyorsan...' : 'Új elem gyors hozzáadása...'}
            className="bg-surface-1/40 border-white/10"
          />
          <Button onClick={addQuickTask} className="bg-primary hover:bg-primary/90 text-surface-0">
            <Plus className="h-4 w-4 mr-1" />
            Hozzáadás
          </Button>
        </div>
      </Card>

      <div className="space-y-2">
        {tasks.map((task) => (
          <Card
            key={task.id}
            className={`glass p-3 ${
              task.completed
                ? 'opacity-70'
                : getEffectiveWorkflowStatus(task as any) === 'today'
                  ? 'ring-1 ring-primary/30 bg-primary/10'
                  : getEffectiveWorkflowStatus(task as any) === 'later' || getEffectiveWorkflowStatus(task as any) === 'someday'
                    ? 'border border-white/10'
                    : ''
            }`}
          >
            <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-col sm:flex-row">
              <button
                onClick={() => updateTask(list.id, task.id, { completed: !task.completed })}
                className="text-sm px-2 py-1 rounded bg-surface-1/50"
              >
                {task.completed ? <Check className="h-4 w-4" /> : 'Nyitott'}
              </button>
              <div className="flex-1 min-w-0 w-full">
                {editingItemId === task.id ? (
                  <div className="flex gap-2">
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          await updateTask(list.id, task.id, { title: editingTitle.trim() || task.title });
                          setEditingItemId(null);
                        }
                      }}
                      className="bg-surface-1/40 border-white/10"
                    />
                    <Button
                      variant="outline"
                      onClick={async () => {
                        await updateTask(list.id, task.id, { title: editingTitle.trim() || task.title });
                        setEditingItemId(null);
                      }}
                    >
                      Mentés
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-text-primary">{task.title}</p>
                    {task.description && <p className="text-xs text-text-muted">{task.description}</p>}
                  </>
                )}
                <div className="mt-1 flex flex-wrap gap-1">
                  {!task.completed && getEffectiveWorkflowStatus(task as any) === 'today' && (
                    <Badge className="text-xs bg-primary/20 text-primary border-primary/30">Ma</Badge>
                  )}
                  {!task.completed && getEffectiveWorkflowStatus(task as any) === 'later' && (
                    <Badge variant="outline" className="text-xs border-white/20">Később</Badge>
                  )}
                  {!task.completed && getEffectiveWorkflowStatus(task as any) === 'someday' && (
                    <Badge variant="outline" className="text-xs border-white/20">Valamikor</Badge>
                  )}
                  {task.dueDate && <Badge variant="outline" className="text-xs border-white/20">{task.dueDate}</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-1 self-end sm:self-auto">
                <Button variant="ghost" size="sm" onClick={() => updateTask(list.id, task.id, { workflowStatus: 'today' })}>
                  <Clock3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingItemId(task.id);
                    setEditingTitle(task.title);
                  }}
                >
                  Szerk.
                </Button>
                <Button variant="ghost" size="sm" onClick={() => moveItem(task.id, -1)}><ChevronUp className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => moveItem(task.id, 1)}><ChevronDown className="h-4 w-4" /></Button>
              </div>
            </div>
          </Card>
        ))}
        {tasks.length === 0 && (
          <Card className="glass p-4">
            <p className="text-sm text-text-muted">
              {progress.total === 0
                ? 'Még nincs elem ezen a listán. Adj hozzá egyet fent.'
                : progress.open === 0
                  ? 'Minden elem kész. Jöhet a következő lépés.'
                  : 'A jelenlegi szűrő mellett nincs látható elem.'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
