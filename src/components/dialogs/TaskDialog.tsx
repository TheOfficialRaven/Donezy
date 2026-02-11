import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAppStore, type Task } from '@/stores/useAppStore';
import { toast } from 'sonner';

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
    priority: 'medium' as Task['priority'],
    dueDate: '',
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        priority: task.priority,
        dueDate: task.dueDate || '',
      });
    } else {
      setFormData({ title: '', priority: 'medium', dueDate: '' });
    }
  }, [task, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      if (task) {
        await updateTask(listId, task.id, {
          title: formData.title,
          priority: formData.priority,
          dueDate: formData.dueDate || undefined,
        });
        toast.success('Feladat frissítve!');
      } else {
        await addTask(listId, {
          title: formData.title,
          completed: false,
          priority: formData.priority,
          dueDate: formData.dueDate || undefined,
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
