import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HABIT_FREQUENCY_TYPE_LABELS, HABIT_TRACKING_MODE_LABELS } from '@/lib/habits/constants';
import type { Habit, HabitFrequencyType, HabitTrackingMode } from '@/lib/habits/types';

const TRACKING: HabitTrackingMode[] = ['auto', 'manual', 'hybrid'];
const FREQ: HabitFrequencyType[] = ['daily', 'weekly', 'custom'];

export default function HabitDialog({
  open,
  onOpenChange,
  editing,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Habit | null;
  onSave: (payload: Partial<Habit> & Pick<Habit, 'title'>) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [trackingMode, setTrackingMode] = useState<HabitTrackingMode>('auto');
  const [frequencyType, setFrequencyType] = useState<HabitFrequencyType>('daily');
  const [frequencyTarget, setFrequencyTarget] = useState(1);
  const [preferredDaysRaw, setPreferredDaysRaw] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTitle(editing.title);
      setDescription(editing.description || '');
      setCategory(editing.category || '');
      setTrackingMode(editing.trackingMode);
      setFrequencyType(editing.frequencyType);
      setFrequencyTarget(editing.frequencyTarget);
      setPreferredDaysRaw((editing.preferredDays || []).join(','));
    } else {
      setTitle('');
      setDescription('');
      setCategory('');
      setTrackingMode('auto');
      setFrequencyType('daily');
      setFrequencyTarget(1);
      setPreferredDaysRaw('');
    }
  }, [open, editing]);

  const handleSave = async () => {
    const preferredDays = preferredDaysRaw
      .split(',')
      .map((n) => Number(n.trim()))
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= 7);

    await onSave({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      trackingMode,
      frequencyType,
      frequencyTarget,
      preferredDays,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-1 border border-white/10 text-text-primary max-w-lg max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Szokas szerkesztese' : 'Uj szokas'}</DialogTitle>
          <DialogDescription className="text-text-secondary">
            Az automatikus kovetes marad, de itt finomhangolhatod a modot es a celritmust.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Cim</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-surface-0/50 border-white/10" placeholder="Pl. Reggeli fokusz blokk" />
          </div>
          <div className="space-y-2">
            <Label>Leiras</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-surface-0/50 border-white/10" rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Kategoria</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} className="bg-surface-0/50 border-white/10" placeholder="Pl. egeszseg / tanulas" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Tracking mod</Label>
              <Select value={trackingMode} onValueChange={(v) => setTrackingMode(v as HabitTrackingMode)}>
                <SelectTrigger className="bg-surface-0/50 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-surface-1 border-white/10">
                  {TRACKING.map((m) => (
                    <SelectItem key={m} value={m}>{HABIT_TRACKING_MODE_LABELS[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Gyakorisag</Label>
              <Select value={frequencyType} onValueChange={(v) => setFrequencyType(v as HabitFrequencyType)}>
                <SelectTrigger className="bg-surface-0/50 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-surface-1 border-white/10">
                  {FREQ.map((f) => (
                    <SelectItem key={f} value={f}>{HABIT_FREQUENCY_TYPE_LABELS[f]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cel</Label>
              <Input type="number" min={1} max={31} value={frequencyTarget} onChange={(e) => setFrequencyTarget(Number(e.target.value) || 1)} className="bg-surface-0/50 border-white/10" />
            </div>
          </div>

          {frequencyType === 'weekly' && (
            <div className="space-y-2">
              <Label>Preferalt napok (1-7, vesszovel)</Label>
              <Input value={preferredDaysRaw} onChange={(e) => setPreferredDaysRaw(e.target.value)} placeholder="1,3,5" className="bg-surface-0/50 border-white/10" />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Megse</Button>
            <Button className="bg-primary text-surface-0" onClick={handleSave} disabled={!title.trim()}>
              {editing ? 'Mentes' : 'Letrehozas'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
