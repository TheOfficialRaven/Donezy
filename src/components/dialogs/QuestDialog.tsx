import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAppStore, type Quest } from '@/stores/useAppStore';
import { toast } from 'sonner';

interface QuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quest?: Quest | null; // null = create, Quest = edit
}

const categories = ['Személyes', 'Munka', 'Tanulás', 'Egészség', 'Szórakozás', 'Egyéb'];
const difficulties = [
  { value: 'easy', label: 'Könnyű', xp: 50, essence: 10 },
  { value: 'medium', label: 'Közepes', xp: 100, essence: 20 },
  { value: 'hard', label: 'Nehéz', xp: 200, essence: 40 },
  { value: 'epic', label: 'Epikus', xp: 500, essence: 100 },
];

export default function QuestDialog({ open, onOpenChange, quest }: QuestDialogProps) {
  const { addQuest, updateQuest } = useAppStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Személyes',
    difficulty: 'medium' as Quest['difficulty'],
    estimatedTime: 30,
    dueDate: new Date().toISOString().split('T')[0],
    tags: '',
  });

  useEffect(() => {
    if (quest) {
      setFormData({
        title: quest.title,
        description: quest.description,
        category: quest.category,
        difficulty: quest.difficulty,
        estimatedTime: quest.estimatedTime,
        dueDate: quest.dueDate || '',
        tags: quest.tags.join(', '),
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'Személyes',
        difficulty: 'medium',
        estimatedTime: 30,
        dueDate: new Date().toISOString().split('T')[0],
        tags: '',
      });
    }
  }, [quest, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const diff = difficulties.find((d) => d.value === formData.difficulty)!;
    const tags = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (quest) {
        await updateQuest(quest.id, {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          difficulty: formData.difficulty,
          estimatedTime: formData.estimatedTime,
          dueDate: formData.dueDate || undefined,
          tags,
          xpReward: diff.xp,
          essenceReward: diff.essence,
        });
        toast.success('Küldetés frissítve!');
      } else {
        await addQuest({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          difficulty: formData.difficulty,
          estimatedTime: formData.estimatedTime,
          xpReward: diff.xp,
          essenceReward: diff.essence,
          completed: false,
          dueDate: formData.dueDate || undefined,
          tags,
        });
        toast.success('Új küldetés létrehozva!');
      }
      onOpenChange(false);
    } catch {
      toast.error('Hiba történt. Próbáld újra.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-1 border border-white/10 text-text-primary max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {quest ? 'Küldetés szerkesztése' : 'Új küldetés'}
          </DialogTitle>
          <DialogDescription className="text-text-secondary">
            {quest ? 'Módosítsd a küldetés adatait.' : 'Hozz létre egy új küldetést a célod eléréséhez.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Cím</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
              placeholder="Add meg a küldetés címét..."
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
              rows={3}
            />
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
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nehézség</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(v) => setFormData((f) => ({ ...f, difficulty: v as Quest['difficulty'] }))}
              >
                <SelectTrigger className="bg-surface-0/50 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-1 border-white/10">
                  {difficulties.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label} (+{d.xp} XP)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Becsült idő (perc)</Label>
              <Input
                type="number"
                min={5}
                max={480}
                value={formData.estimatedTime}
                onChange={(e) => setFormData((f) => ({ ...f, estimatedTime: Number(e.target.value) }))}
                className="bg-surface-0/50 border-white/10"
              />
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

          <div className="space-y-2">
            <Label>Címkék (vesszővel elválasztva)</Label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData((f) => ({ ...f, tags: e.target.value }))}
              placeholder="pl. rutin, reggel, fontos"
              className="bg-surface-0/50 border-white/10"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Mégse
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-surface-0">
              {quest ? 'Mentés' : 'Létrehozás'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
