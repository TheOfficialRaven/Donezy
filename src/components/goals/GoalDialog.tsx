import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { GOAL_TYPE_HINTS, GOAL_TYPE_LABELS, GOAL_PRIORITY_LABELS, GOAL_STATUS_LABELS, GOAL_TYPES, GOAL_STATUSES, GOAL_PRIORITIES } from '@/lib/goals/constants';
import type { Goal, GoalType, GoalPriority, GoalStatus } from '@/lib/goals/types';
import { validateGoalCreatePayload } from '@/lib/goals/validators';
import type { GoalCreatePayload } from '@/stores/useAppStore';

export type GoalDialogSavePayload = GoalCreatePayload & { status?: GoalStatus };

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Goal | null;
  onSave: (payload: GoalDialogSavePayload) => Promise<void>;
}

export default function GoalDialog({ open, onOpenChange, editing, onSave }: GoalDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reasonWhy, setReasonWhy] = useState('');
  const [category, setCategory] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');
  const [type, setType] = useState<GoalType>('project');
  const [priority, setPriority] = useState<GoalPriority>('medium');
  const [status, setStatus] = useState<GoalStatus>('active');
  const [targetDate, setTargetDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [milestoneLines, setMilestoneLines] = useState<string[]>(['']);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTitle(editing.title);
      setDescription(editing.description);
      setReasonWhy(editing.reasonWhy);
      setCategory(editing.category);
      setTagsRaw(editing.tags.join(', '));
      setType(editing.type);
      setPriority(editing.priority);
      setStatus(editing.status);
      setTargetDate(editing.targetDate || '');
      setStartDate(editing.startDate || '');
      setMilestoneLines(
        editing.milestones.length > 0
          ? [...editing.milestones].sort((a, b) => a.sortOrder - b.sortOrder).map((m) => m.title)
          : ['']
      );
    } else {
      setTitle('');
      setDescription('');
      setReasonWhy('');
      setCategory('');
      setTagsRaw('');
      setType('project');
      setPriority('medium');
      setStatus('active');
      setTargetDate('');
      setStartDate('');
      setMilestoneLines(['']);
    }
  }, [open, editing]);

  const handleSave = async () => {
    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const milestones = milestoneLines.map((line) => line.trim()).filter(Boolean).map((line) => ({ title: line }));
    const errs = validateGoalCreatePayload({
      title,
      type,
      status: editing ? status : 'active',
      priority,
      startDate: startDate || undefined,
      targetDate: targetDate || undefined,
    });
    if (errs.length > 0) {
      toast.error(errs[0].message);
      return;
    }
    const base: GoalDialogSavePayload = {
      title: title.trim(),
      description: description.trim(),
      reasonWhy: reasonWhy.trim(),
      category: category.trim(),
      tags,
      type,
      priority,
      targetDate: targetDate || undefined,
      startDate: startDate || undefined,
      milestones,
    };
    if (editing) {
      base.status = status;
    }
    await onSave(base);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-1 border border-white/10 text-text-primary max-w-lg max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">{editing ? 'Cél szerkesztése' : 'Új cél'}</DialogTitle>
          <DialogDescription className="text-text-secondary">
            {editing
              ? 'Finomítsd a célt — a típus és a „miért” sokat segít a mindennapi döntésekben.'
              : 'Gyorsan elindulhatsz: elég a cím és a típus; a többit később is bővítheted.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Cím</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Pl. Stabil, kímélő reggeli rutin"
              className="bg-surface-0/50 border-white/10"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Típus</Label>
              <Select value={type} onValueChange={(v) => setType(v as GoalType)}>
                <SelectTrigger className="bg-surface-0/50 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-1 border-white/10">
                  {GOAL_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {GOAL_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-text-muted leading-snug">{GOAL_TYPE_HINTS[type]}</p>
            </div>
            <div className="space-y-2">
              <Label>Prioritás</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as GoalPriority)}>
                <SelectTrigger className="bg-surface-0/50 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-1 border-white/10">
                  {GOAL_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {GOAL_PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {editing && (
            <div className="space-y-2">
              <Label>Státusz</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as GoalStatus)}>
                <SelectTrigger className="bg-surface-0/50 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-1 border-white/10">
                  {GOAL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {GOAL_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Miért fontos?</Label>
            <Textarea
              value={reasonWhy}
              onChange={(e) => setReasonWhy(e.target.value)}
              placeholder="Egy mondatban: mit ad vissza neked ez a cél?"
              rows={2}
              className="bg-surface-0/50 border-white/10 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Leírás</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kontextus, akadályok, amire figyelsz..."
              rows={2}
              className="bg-surface-0/50 border-white/10 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Kategória</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} className="bg-surface-0/50 border-white/10" placeholder="Pl. egészség, karrier" />
            </div>
            <div className="space-y-2">
              <Label>Címkék (vesszővel)</Label>
              <Input value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} className="bg-surface-0/50 border-white/10" placeholder="fókusz, reggel" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Kezdés (opcionális)</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-surface-0/50 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>Céldátum (opcionális)</Label>
              <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="bg-surface-0/50 border-white/10" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mérföldkövek</Label>
            <div className="space-y-2">
              {milestoneLines.map((line, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={line}
                    onChange={(e) =>
                      setMilestoneLines((prev) => prev.map((item, i) => (i === index ? e.target.value : item)))
                    }
                    placeholder={`Lépés ${index + 1}`}
                    className="bg-surface-0/50 border-white/10"
                  />
                  {milestoneLines.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="border-white/15 shrink-0"
                      onClick={() => setMilestoneLines((prev) => prev.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-white/15"
              onClick={() => setMilestoneLines((prev) => [...prev, ''])}
            >
              <Plus className="h-4 w-4 mr-1" />
              Új sor
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Mégse
            </Button>
            <Button className="bg-primary text-surface-0" onClick={handleSave} disabled={!title.trim()}>
              {editing ? 'Mentés' : 'Létrehozás'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
