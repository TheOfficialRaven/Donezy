import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Target, Sparkles, CheckCircle2, Circle, Trash2, Trophy, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useAppStore, type GrowthGoal } from '@/stores/useAppStore';
import { toast } from 'sonner';

type GoalArea = GrowthGoal['area'];

const areaLabels: Record<GoalArea, string> = {
  mindset: 'Szemlélet',
  habit: 'Szokás',
  skill: 'Készség',
  wellbeing: 'Jóllét',
};

const priorityLabels: Record<GrowthGoal['priority'], string> = {
  low: 'Alacsony',
  medium: 'Közepes',
  high: 'Magas',
};

function goalProgress(goal: GrowthGoal): number {
  if (!goal.milestones || goal.milestones.length === 0) return goal.completed ? 100 : 0;
  const done = goal.milestones.filter((milestone) => milestone.completed).length;
  return Math.round((done / goal.milestones.length) * 100);
}

export default function GrowthGoals() {
  const { growthGoals, addGrowthGoal, updateGrowthGoal, deleteGrowthGoal, toggleGrowthMilestone } = useAppStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GrowthGoal | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [area, setArea] = useState<GoalArea>('habit');
  const [priority, setPriority] = useState<GrowthGoal['priority']>('medium');
  const [milestones, setMilestones] = useState<string[]>(['']);

  const completedGoals = growthGoals.filter((goal) => goal.completed).length;
  const activeGoals = growthGoals.filter((goal) => !goal.completed).length;
  const totalMilestones = growthGoals.reduce((sum, goal) => sum + goal.milestones.length, 0);
  const completedMilestones = growthGoals.reduce(
    (sum, goal) => sum + goal.milestones.filter((milestone) => milestone.completed).length,
    0
  );

  const topPriorityGoal = useMemo(
    () =>
      growthGoals
        .filter((goal) => !goal.completed)
        .sort((a, b) => goalProgress(b) - goalProgress(a))[0] || null,
    [growthGoals]
  );

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTargetDate('');
    setArea('habit');
    setPriority('medium');
    setMilestones(['']);
    setEditingGoal(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (goal: GrowthGoal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description || '');
    setTargetDate(goal.targetDate || '');
    setArea(goal.area);
    setPriority(goal.priority);
    setMilestones(goal.milestones.length > 0 ? goal.milestones.map((milestone) => milestone.title) : ['']);
    setDialogOpen(true);
  };

  const saveGoal = async () => {
    if (!title.trim()) return;
    const cleanedMilestones = milestones
      .map((milestone) => milestone.trim())
      .filter(Boolean)
      .map((milestone, index) => ({ id: `m-${index}`, title: milestone, completed: false }));

    if (editingGoal) {
      const mergedMilestones = cleanedMilestones.map((milestone, index) => {
        const existing = editingGoal.milestones[index];
        return {
          id: existing?.id || `m-${Date.now()}-${index}`,
          title: milestone.title,
          completed: existing?.completed || false,
          completedAt: existing?.completedAt,
        };
      });
      await updateGrowthGoal(editingGoal.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        targetDate: targetDate || undefined,
        area,
        priority,
        milestones: mergedMilestones,
      });
      toast.success('Növekedési cél frissítve.');
    } else {
      await addGrowthGoal({
        title: title.trim(),
        description: description.trim() || undefined,
        targetDate: targetDate || undefined,
        area,
        priority,
        milestones: cleanedMilestones,
      });
      toast.success('Új növekedési cél létrehozva.');
    }

    setDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            Növekedési célok
          </h1>
          <p className="text-text-secondary mt-1">
            Építs inspiráló célokat, bontsd őket mérföldkövekre, és haladj tudatosan.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-surface-0" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Új cél
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass p-4">
          <p className="text-2xl font-bold text-primary">{activeGoals}</p>
          <p className="text-xs text-text-muted">Aktív cél</p>
        </Card>
        <Card className="glass p-4">
          <p className="text-2xl font-bold text-emerald-400">{completedGoals}</p>
          <p className="text-xs text-text-muted">Elért mérföldkő-cél</p>
        </Card>
        <Card className="glass p-4">
          <p className="text-2xl font-bold text-secondary">{totalMilestones}</p>
          <p className="text-xs text-text-muted">Összes mérföldkő</p>
        </Card>
        <Card className="glass p-4">
          <p className="text-2xl font-bold text-warning">{completedMilestones}</p>
          <p className="text-xs text-text-muted">Teljesített mérföldkő</p>
        </Card>
      </div>

      {topPriorityGoal && (
        <Card className="glass p-4 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-text-primary">Kiemelt fókusz most</p>
          </div>
          <p className="text-sm text-text-secondary">
            A legjobb következő lépésed lehet: <span className="text-text-primary font-medium">{topPriorityGoal.title}</span>.
            Haladás: {goalProgress(topPriorityGoal)}%.
          </p>
        </Card>
      )}

      {growthGoals.length === 0 ? (
        <Card className="glass p-10 text-center">
          <Target className="h-14 w-14 text-text-disabled mx-auto mb-4" />
          <h3 className="text-lg font-heading font-semibold text-text-primary mb-2">Indítsd el az első növekedési célod</h3>
          <p className="text-text-muted mb-5">
            Egy jó cél akkor működik, ha mérhető és kisebb mérföldkövekre van bontva.
          </p>
          <Button className="bg-primary hover:bg-primary/90 text-surface-0" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Cél létrehozása
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {growthGoals.map((goal, index) => (
            <motion.div key={goal.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <Card className="glass p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-heading font-semibold text-text-primary">{goal.title}</h3>
                    {goal.description && <p className="text-sm text-text-secondary mt-1">{goal.description}</p>}
                  </div>
                  <Badge variant="outline" className="border-white/20 text-text-muted">
                    {areaLabels[goal.area]}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-primary/15 text-primary border-primary/25">{priorityLabels[goal.priority]}</Badge>
                  {goal.targetDate && (
                    <Badge variant="outline" className="border-white/20 text-text-muted">
                      Cél dátum: {new Date(goal.targetDate + 'T12:00:00').toLocaleDateString('hu-HU')}
                    </Badge>
                  )}
                  {goal.completed && (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                      <Trophy className="h-3 w-3 mr-1" />
                      Elérve
                    </Badge>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs text-text-muted mb-1">
                    <span>Haladás</span>
                    <span>{goalProgress(goal)}%</span>
                  </div>
                  <Progress value={goalProgress(goal)} className="h-2 bg-surface-2" />
                </div>

                <div className="space-y-1.5 mb-4">
                  {goal.milestones.map((milestone) => (
                    <button
                      key={milestone.id}
                      onClick={() => toggleGrowthMilestone(goal.id, milestone.id)}
                      className="w-full flex items-center gap-2 text-left p-2 rounded-md hover:bg-white/5"
                    >
                      {milestone.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-text-muted flex-shrink-0" />
                      )}
                      <span className={milestone.completed ? 'text-sm text-text-muted line-through' : 'text-sm text-text-primary'}>
                        {milestone.title}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button size="sm" variant="outline" className="border-white/20 text-text-primary" onClick={() => openEdit(goal)}>
                    Szerkesztés
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-danger/30 text-danger hover:bg-danger/10"
                    onClick={async () => {
                      await deleteGrowthGoal(goal.id);
                      toast.success('Növekedési cél törölve.');
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-surface-1 border border-white/10 text-text-primary max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">{editingGoal ? 'Növekedési cél szerkesztése' : 'Új növekedési cél'}</DialogTitle>
            <DialogDescription className="text-text-secondary">
              Inspiráló célt alakíthatsz ki, amely mérföldkövekkel követhetővé válik.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cél címe</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Pl. Stabil reggeli rutin kialakítása" className="bg-surface-0/50 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label>Leírás</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Miért fontos ez a cél neked?" className="bg-surface-0/50 border-white/10" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Terület</Label>
                <Select value={area} onValueChange={(value) => setArea(value as GoalArea)}>
                  <SelectTrigger className="bg-surface-0/50 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-surface-1 border-white/10">
                    <SelectItem value="mindset">Szemlélet</SelectItem>
                    <SelectItem value="habit">Szokás</SelectItem>
                    <SelectItem value="skill">Készség</SelectItem>
                    <SelectItem value="wellbeing">Jóllét</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioritás</Label>
                <Select value={priority} onValueChange={(value) => setPriority(value as GrowthGoal['priority'])}>
                  <SelectTrigger className="bg-surface-0/50 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-surface-1 border-white/10">
                    <SelectItem value="low">Alacsony</SelectItem>
                    <SelectItem value="medium">Közepes</SelectItem>
                    <SelectItem value="high">Magas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cél dátum</Label>
                <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="bg-surface-0/50 border-white/10" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mérföldkövek</Label>
              <div className="space-y-2">
                {milestones.map((milestone, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={milestone}
                      onChange={(e) =>
                        setMilestones((prev) => prev.map((item, itemIndex) => (itemIndex === index ? e.target.value : item)))
                      }
                      placeholder={`Mérföldkő ${index + 1}`}
                      className="bg-surface-0/50 border-white/10"
                    />
                    {milestones.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        className="border-white/20"
                        onClick={() => setMilestones((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
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
                className="border-white/20 text-text-primary"
                onClick={() => setMilestones((prev) => [...prev, ''])}
              >
                <Plus className="h-4 w-4 mr-1" />
                Mérföldkő hozzáadása
              </Button>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Mégse</Button>
              <Button className="bg-primary hover:bg-primary/90 text-surface-0" onClick={saveGoal} disabled={!title.trim()}>
                {editingGoal ? 'Mentés' : 'Létrehozás'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
