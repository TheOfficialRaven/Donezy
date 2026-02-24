import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Calendar, CheckSquare } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FOCUS_AREAS, FOCUS_AREA_LABELS, type FocusArea } from '@/lib/focusAreas';

const QUICK_TASK_LIST_NAME = 'Gyors feladatok';
const QUICK_TASK_LIST_COLOR = '#11E1B1';

interface QuickAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuickAddDialog({ open, onOpenChange }: QuickAddDialogProps) {
  const { addNote, addEvent, addTask, addList, lists } = useAppStore();
  const [title, setTitle] = useState('');
  const [activeTab, setActiveTab] = useState('task');
  const [focusArea, setFocusArea] = useState<FocusArea>('munka_tanulas');

  const getOrCreateQuickList = async (): Promise<string> => {
    const existing = lists.find((l) => l.name === QUICK_TASK_LIST_NAME);
    if (existing) return existing.id;

    await addList({ name: QUICK_TASK_LIST_NAME, color: QUICK_TASK_LIST_COLOR });
    const updated = useAppStore.getState().lists;
    const created = updated.find((l) => l.name === QUICK_TASK_LIST_NAME);
    if (created) return created.id;

    await new Promise((r) => setTimeout(r, 500));
    const retry = useAppStore.getState().lists.find((l) => l.name === QUICK_TASK_LIST_NAME);
    return retry?.id ?? '';
  };

  const handleAddTask = async () => {
    if (!title.trim()) return;
    const listId = await getOrCreateQuickList();
    if (!listId) {
      toast.error('Nem sikerült a listát létrehozni.');
      return;
    }
    await addTask(listId, {
      title,
      completed: false,
      priority: 'medium',
      focusArea,
      focusAreaSource: 'manual',
    });
    toast.success('Feladat hozzáadva a Gyors feladatokhoz!');
    setTitle('');
    onOpenChange(false);
  };

  const handleAddNote = async () => {
    if (!title.trim()) return;
    await addNote({
      title,
      content: '',
      folder: 'Általános',
      tags: [],
      isLocked: false,
    });
    toast.success('Jegyzet hozzáadva!');
    setTitle('');
    onOpenChange(false);
  };

  const handleAddEvent = async () => {
    if (!title.trim()) return;
    const start = new Date();
    start.setHours(start.getHours() + 1, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    await addEvent({
      title,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      category: 'Személyes',
      color: '#4DA3FF',
      reminder: 15,
      focusArea,
      focusAreaSource: 'manual',
    });
    toast.success('Esemény hozzáadva!');
    setTitle('');
    onOpenChange(false);
  };

  const handleSubmit = () => {
    if (activeTab === 'task') handleAddTask();
    else if (activeTab === 'note') handleAddNote();
    else handleAddEvent();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-1 border border-white/10 text-text-primary max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Gyors hozzáadás</DialogTitle>
          <DialogDescription className="text-text-secondary">
            Gyorsan adj hozzá feladatot, jegyzetet vagy eseményt.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-surface-0/50 border border-white/10 w-full">
            <TabsTrigger value="task" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-surface-0">
              <CheckSquare className="h-4 w-4 mr-1" />
              Feladat
            </TabsTrigger>
            <TabsTrigger value="note" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-surface-0">
              <FileText className="h-4 w-4 mr-1" />
              Jegyzet
            </TabsTrigger>
            <TabsTrigger value="event" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-surface-0">
              <Calendar className="h-4 w-4 mr-1" />
              Esemény
            </TabsTrigger>
          </TabsList>

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={activeTab === 'task' ? 'Feladat neve...' : activeTab === 'note' ? 'Jegyzet címe...' : 'Esemény címe...'}
            className="bg-surface-0/50 border-white/10"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
          />

          <Select value={focusArea} onValueChange={(value) => setFocusArea(value as FocusArea)}>
            <SelectTrigger className="bg-surface-0/50 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-surface-1 border-white/10">
              {FOCUS_AREAS.map((area) => (
                <SelectItem key={area} value={area}>
                  {FOCUS_AREA_LABELS[area]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <TabsContent value="task">
            <div className="space-y-2">
              <p className="text-xs text-text-muted">
                A feladat a „Gyors feladatok" listába kerül.
              </p>
              <Button onClick={handleAddTask} disabled={!title.trim()} className="w-full bg-primary hover:bg-primary/90 text-surface-0">
                <CheckSquare className="h-4 w-4 mr-2" />
                Feladat hozzáadása
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="note">
            <Button onClick={handleAddNote} disabled={!title.trim()} className="w-full bg-primary hover:bg-primary/90 text-surface-0">
              <FileText className="h-4 w-4 mr-2" />
              Jegyzet hozzáadása
            </Button>
          </TabsContent>

          <TabsContent value="event">
            <Button onClick={handleAddEvent} disabled={!title.trim()} className="w-full bg-primary hover:bg-primary/90 text-surface-0">
              <Calendar className="h-4 w-4 mr-2" />
              Esemény hozzáadása
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
