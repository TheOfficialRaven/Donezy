import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAppStore, type Task } from '@/stores/useAppStore';
import { toast } from 'sonner';
import { FOCUS_AREAS, FOCUS_AREA_LABELS, type FocusArea } from '@/lib/focusAreas';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listId: string;
  task?: Task | null;
}

export default function TaskDialog({ open, onOpenChange, listId, task }: TaskDialogProps) {
  const { addTask, updateTask } = useAppStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    dueDate: '',
    estimatedMinutes: '',
    notes: '',
    workflowStatus: 'active' as Task['workflowStatus'],
    focusArea: 'munka_tanulas' as FocusArea,
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        dueDate: task.dueDate || '',
        estimatedMinutes: task.estimatedMinutes ? String(task.estimatedMinutes) : '',
        notes: task.notes || '',
        workflowStatus: task.workflowStatus || 'active',
        focusArea: task.focusArea || 'munka_tanulas',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        estimatedMinutes: '',
        notes: '',
        workflowStatus: 'active',
        focusArea: 'munka_tanulas',
      });
    }
  }, [task, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      if (task) {
        await updateTask(listId, task.id, {
          title: formData.title,
          description: formData.description || undefined,
          priority: formData.priority,
          dueDate: formData.dueDate || undefined,
          estimatedMinutes: formData.estimatedMinutes ? Number(formData.estimatedMinutes) : undefined,
          notes: formData.notes || undefined,
          workflowStatus: formData.workflowStatus,
          focusArea: formData.focusArea,
          focusAreaSource: 'manual',
        });
        toast.success('Feladat frissítve!');
      } else {
        await addTask(listId, {
          title: formData.title,
          description: formData.description || undefined,
          completed: false,
          priority: formData.priority,
          dueDate: formData.dueDate || undefined,
          estimatedMinutes: formData.estimatedMinutes ? Number(formData.estimatedMinutes) : undefined,
          notes: formData.notes || undefined,
          workflowStatus: formData.workflowStatus,
          sourceType: 'manual',
          tags: [],
          futureLinkTargets: {
            dailyFocusCandidate: false,
            questCandidate: false,
            calendarCandidate: false,
            habitCandidate: false,
            goalCandidate: false,
          },
          focusArea: formData.focusArea,
          focusAreaSource: 'manual',
        });
        toast.success('Feladat hozzáadva!');
      }
      onOpenChange(false);
    } catch {
      toast.error('Hiba történt.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-1 border border-white/10 text-text-primary max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {task ? 'Feladat szerkesztése' : 'Új feladat'}
          </DialogTitle>
          <DialogDescription className="text-text-secondary">
            {task ? 'Módosítsd a feladat adatait.' : 'Adj hozzá egy új feladatot a listához.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Feladat neve</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
              placeholder="Mit kell elvégezni?"
              className="bg-surface-0/50 border-white/10"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Leírás</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
              placeholder="Rövid leírás (opcionális)"
              className="bg-surface-0/50 border-white/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioritás</Label>
              <Select
                value={formData.priority}
                onValueChange={(v) => setFormData((f) => ({ ...f, priority: v as Task['priority'] }))}
              >
                <SelectTrigger className="bg-surface-0/50 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-1 border-white/10">
                  <SelectItem value="low">Alacsony</SelectItem>
                  <SelectItem value="medium">Közepes</SelectItem>
                  <SelectItem value="high">Magas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Határidő</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData((f) => ({ ...f, dueDate: e.target.value }))}
                className="bg-surface-0/50 border-white/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Becsült idő (perc)</Label>
              <Input
                type="number"
                min={0}
                value={formData.estimatedMinutes}
                onChange={(e) => setFormData((f) => ({ ...f, estimatedMinutes: e.target.value }))}
                className="bg-surface-0/50 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Munkafolyamat</Label>
              <Select
                value={formData.workflowStatus || 'active'}
                onValueChange={(v) => setFormData((f) => ({ ...f, workflowStatus: v as Task['workflowStatus'] }))}
              >
                <SelectTrigger className="bg-surface-0/50 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-1 border-white/10">
                  <SelectItem value="active">Aktív</SelectItem>
                  <SelectItem value="today">Ma</SelectItem>
                  <SelectItem value="later">Később</SelectItem>
                  <SelectItem value="someday">Valamikor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rövid jegyzet</Label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Jegyzet (opcionális)"
              className="bg-surface-0/50 border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label>Fókuszterület</Label>
            <Select
              value={formData.focusArea}
              onValueChange={(v) => setFormData((f) => ({ ...f, focusArea: v as FocusArea }))}
            >
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
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Mégse
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-surface-0">
              {task ? 'Mentés' : 'Hozzáadás'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
