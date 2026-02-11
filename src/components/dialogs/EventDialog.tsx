import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAppStore, type CalendarEvent } from '@/stores/useAppStore';
import { toast } from 'sonner';

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent | null;
  defaultCategory?: string;
}

const categories = [
  { value: 'Munka', color: '#4DA3FF' },
  { value: 'Személyes', color: '#11E1B1' },
  { value: 'Egészség', color: '#24D68A' },
  { value: 'Tanulás', color: '#FFC056' },
  { value: 'Szórakozás', color: '#A78BFA' },
  { value: 'Meeting', color: '#4DA3FF' },
  { value: 'Emlékeztető', color: '#F87171' },
  { value: 'Időblokk', color: '#818CF8' },
];

export default function EventDialog({ open, onOpenChange, event, defaultCategory }: EventDialogProps) {
  const { addEvent, updateEvent } = useAppStore();

  const now = new Date();
  const defaultStart = new Date(now.getTime() + 60 * 60 * 1000);
  const defaultEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const formatDatetimeLocal = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: formatDatetimeLocal(defaultStart),
    endTime: formatDatetimeLocal(defaultEnd),
    category: defaultCategory || 'Személyes',
    reminder: 15,
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        startTime: formatDatetimeLocal(new Date(event.startTime)),
        endTime: formatDatetimeLocal(new Date(event.endTime)),
        category: event.category,
        reminder: event.reminder || 15,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        startTime: formatDatetimeLocal(defaultStart),
        endTime: formatDatetimeLocal(defaultEnd),
        category: defaultCategory || 'Személyes',
        reminder: 15,
      });
    }
  }, [event, open, defaultCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const cat = categories.find((c) => c.value === formData.category);
    const color = cat?.color || '#4DA3FF';

    try {
      if (event) {
        await updateEvent(event.id, {
          title: formData.title,
          description: formData.description || undefined,
          startTime: new Date(formData.startTime).toISOString(),
          endTime: new Date(formData.endTime).toISOString(),
          category: formData.category,
          color,
          reminder: formData.reminder,
        });
        toast.success('Esemény frissítve!');
      } else {
        await addEvent({
          title: formData.title,
          description: formData.description || undefined,
          startTime: new Date(formData.startTime).toISOString(),
          endTime: new Date(formData.endTime).toISOString(),
          category: formData.category,
          color,
          reminder: formData.reminder,
        });
        toast.success('Új esemény létrehozva!');
      }
      onOpenChange(false);
    } catch {
      toast.error('Hiba történt.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-1 border border-white/10 text-text-primary max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {event ? 'Esemény szerkesztése' : 'Új esemény'}
          </DialogTitle>
          <DialogDescription className="text-text-secondary">
            {event ? 'Módosítsd az esemény adatait.' : 'Adj hozzá egy új eseményt a naptáradhoz.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Cím</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
              placeholder="Esemény címe..."
              className="bg-surface-0/50 border-white/10"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Leírás</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
              placeholder="Rövid leírás..."
              className="bg-surface-0/50 border-white/10 resize-none"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kezdés</Label>
              <Input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData((f) => ({ ...f, startTime: e.target.value }))}
                className="bg-surface-0/50 border-white/10"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Befejezés</Label>
              <Input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData((f) => ({ ...f, endTime: e.target.value }))}
                className="bg-surface-0/50 border-white/10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kategória</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData((f) => ({ ...f, category: v }))}>
                <SelectTrigger className="bg-surface-0/50 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-1 border-white/10">
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                        {c.value}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Emlékeztető (perc)</Label>
              <Select
                value={formData.reminder.toString()}
                onValueChange={(v) => setFormData((f) => ({ ...f, reminder: Number(v) }))}
              >
                <SelectTrigger className="bg-surface-0/50 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-1 border-white/10">
                  <SelectItem value="5">5 perc</SelectItem>
                  <SelectItem value="15">15 perc</SelectItem>
                  <SelectItem value="30">30 perc</SelectItem>
                  <SelectItem value="60">1 óra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Mégse
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-surface-0">
              {event ? 'Mentés' : 'Létrehozás'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
