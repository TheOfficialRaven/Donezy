import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAppStore, type CalendarEvent } from '@/stores/useAppStore';
import { toast } from 'sonner';
import { EVENT_PRIORITY_LABELS, EVENT_STATUS_LABELS, EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from '@/lib/calendar/constants';
import { validateCalendarEventInput } from '@/lib/calendar/validators';
import { toLocalDateKey } from '@/lib/calendar/dateKey';

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent | null;
  defaultCategory?: string;
  defaultStartTime?: Date;
  onDeleteRequest?: (eventId: string) => void;
}

function formatDatetimeLocal(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventDialog({ open, onOpenChange, event, defaultCategory, defaultStartTime, onDeleteRequest }: EventDialogProps) {
  const { addEvent, updateEvent } = useAppStore();

  const defaultWindow = useMemo(() => {
    if (defaultStartTime) {
      const start = new Date(defaultStartTime);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      return { start, end };
    }
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return { start, end };
  }, [defaultStartTime, open]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    date: toLocalDateKey(new Date()),
    startTime: formatDatetimeLocal(defaultWindow.start),
    endTime: formatDatetimeLocal(defaultWindow.end),
    allDay: false,
    type: 'event' as NonNullable<CalendarEvent['type']>,
    priority: 'medium' as NonNullable<CalendarEvent['priority']>,
    category: defaultCategory || 'Általános',
    color: EVENT_TYPE_COLORS.event,
    location: '',
    notes: '',
    reminderEnabled: true,
    reminderMinutes: '15',
    reminderLabel: '',
    status: 'scheduled' as NonNullable<CalendarEvent['status']>,
  });

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title,
        description: event.description || '',
        date: event.date || toLocalDateKey(new Date(event.startTime)),
        startTime: formatDatetimeLocal(new Date(event.startTime)),
        endTime: formatDatetimeLocal(new Date(event.endTime)),
        allDay: Boolean(event.allDay),
        type: event.type || 'event',
        priority: event.priority || 'medium',
        category: event.category || 'Általános',
        color: event.color || EVENT_TYPE_COLORS[event.type || 'event'],
        location: event.location || '',
        notes: event.notes || '',
        reminderEnabled: event.reminderSettings ? event.reminderSettings.enabled : event.reminder !== 0,
        reminderMinutes: String(event.reminderSettings?.minutesBefore ?? event.reminder ?? 15),
        reminderLabel: event.reminderSettings?.customLabel || '',
        status: event.status || 'scheduled',
      });
      return;
    }
    setForm({
      title: '',
      description: '',
      date: toLocalDateKey(defaultWindow.start),
      startTime: formatDatetimeLocal(defaultWindow.start),
      endTime: formatDatetimeLocal(defaultWindow.end),
      allDay: false,
      type: 'event',
      priority: 'medium',
      category: defaultCategory || 'Általános',
      color: EVENT_TYPE_COLORS.event,
      location: '',
      notes: '',
      reminderEnabled: true,
      reminderMinutes: '15',
      reminderLabel: '',
      status: 'scheduled',
    });
  }, [event, defaultCategory, defaultWindow]);

  const handleTypeChange = (type: NonNullable<CalendarEvent['type']>) => {
    setForm((prev) => ({
      ...prev,
      type,
      color: EVENT_TYPE_COLORS[type],
      category: prev.category === 'Általános' ? EVENT_TYPE_LABELS[type] : prev.category,
    }));
  };

  const handleAllDayChange = (allDay: boolean) => {
    setForm((prev) => {
      if (!allDay) return { ...prev, allDay };
      const start = new Date(`${prev.date}T00:00:00`);
      const end = new Date(`${prev.date}T23:59:00`);
      return { ...prev, allDay, startTime: formatDatetimeLocal(start), endTime: formatDatetimeLocal(end) };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const startISO = new Date(form.startTime).toISOString();
    const endISO = new Date(form.endTime).toISOString();
    const payload: Omit<CalendarEvent, 'id'> = {
      title: form.title.trim(),
      description: form.description || undefined,
      date: form.date,
      startTime: startISO,
      endTime: endISO,
      allDay: form.allDay,
      type: form.type,
      priority: form.priority,
      color: form.color,
      category: form.category,
      notes: form.notes || undefined,
      location: form.location || undefined,
      reminderSettings: {
        enabled: form.reminderEnabled,
        minutesBefore: Number(form.reminderMinutes),
        customLabel: form.reminderLabel || undefined,
      },
      reminder: Number(form.reminderMinutes),
      status: form.status,
      sourceType: event?.sourceType || 'manual',
      futureOriginReference: event?.futureOriginReference,
      futureLinkTargets: event?.futureLinkTargets || { dailyGuidanceCandidate: form.type === 'focus-block' },
    };
    const errors = validateCalendarEventInput(payload as any);
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    try {
      if (event) {
        await updateEvent(event.id, payload);
        toast.success('Esemény frissítve.');
      } else {
        await addEvent(payload);
        toast.success('Esemény létrehozva.');
      }
      onOpenChange(false);
    } catch {
      toast.error('Nem sikerült menteni az eseményt.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-1 border border-white/10 text-text-primary max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">{event ? 'Esemény szerkesztése' : 'Új esemény'}</DialogTitle>
          <DialogDescription className="text-text-secondary">
            Időblokk, emlékeztető vagy személyes esemény gyors felvétele és szerkesztése.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Cím</Label>
            <Input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className="bg-surface-0/50 border-white/10" required />
          </div>
          <div className="space-y-2">
            <Label>Leírás</Label>
            <Textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} className="bg-surface-0/50 border-white/10 resize-none" rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Dátum</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} className="bg-surface-0/50 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>Egész nap</Label>
              <div className="h-10 px-3 rounded-md border border-white/10 bg-surface-0/50 flex items-center justify-between">
                <span className="text-sm text-text-secondary">All-day esemény</span>
                <Switch checked={form.allDay} onCheckedChange={handleAllDayChange} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Kezdés</Label>
              <Input type="datetime-local" value={form.startTime} onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))} className="bg-surface-0/50 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>Befejezés</Label>
              <Input type="datetime-local" value={form.endTime} onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))} className="bg-surface-0/50 border-white/10" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Típus</Label>
              <Select value={form.type} onValueChange={(v) => handleTypeChange(v as any)}>
                <SelectTrigger className="bg-surface-0/50 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-surface-1 border-white/10">
                  {(Object.keys(EVENT_TYPE_LABELS) as Array<keyof typeof EVENT_TYPE_LABELS>).map((key) => (
                    <SelectItem key={key} value={key}>{EVENT_TYPE_LABELS[key]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioritás</Label>
              <Select value={form.priority} onValueChange={(v) => setForm((prev) => ({ ...prev, priority: v as any }))}>
                <SelectTrigger className="bg-surface-0/50 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-surface-1 border-white/10">
                  {(Object.keys(EVENT_PRIORITY_LABELS) as Array<keyof typeof EVENT_PRIORITY_LABELS>).map((key) => (
                    <SelectItem key={key} value={key}>{EVENT_PRIORITY_LABELS[key]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Kategória</Label>
              <Input value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} className="bg-surface-0/50 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>Szín</Label>
              <Input type="color" value={form.color} onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))} className="bg-surface-0/50 border-white/10 h-10 p-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Státusz</Label>
              <Select value={form.status} onValueChange={(v) => setForm((prev) => ({ ...prev, status: v as any }))}>
                <SelectTrigger className="bg-surface-0/50 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-surface-1 border-white/10">
                  {(Object.keys(EVENT_STATUS_LABELS) as Array<keyof typeof EVENT_STATUS_LABELS>).map((key) => (
                    <SelectItem key={key} value={key}>{EVENT_STATUS_LABELS[key]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Helyszín</Label>
              <Input value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} className="bg-surface-0/50 border-white/10" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Emlékeztető</Label>
              <div className="h-10 px-3 rounded-md border border-white/10 bg-surface-0/50 flex items-center justify-between">
                <span className="text-sm text-text-secondary">Bekapcsolva</span>
                <Switch checked={form.reminderEnabled} onCheckedChange={(value) => setForm((prev) => ({ ...prev, reminderEnabled: value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Perccel előtte</Label>
              <Input
                type="number"
                min={0}
                value={form.reminderMinutes}
                onChange={(e) => setForm((prev) => ({ ...prev, reminderMinutes: e.target.value }))}
                className="bg-surface-0/50 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Rem. címke</Label>
              <Input value={form.reminderLabel} onChange={(e) => setForm((prev) => ({ ...prev, reminderLabel: e.target.value }))} className="bg-surface-0/50 border-white/10" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Jegyzet</Label>
            <Textarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} className="bg-surface-0/50 border-white/10 resize-none" rows={2} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {event && onDeleteRequest && (
              <Button
                type="button"
                variant="outline"
                className="border-danger/30 text-danger hover:bg-danger/10"
                onClick={() => onDeleteRequest(event.id)}
              >
                Törlés
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Mégse</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-surface-0">{event ? 'Mentés' : 'Létrehozás'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
