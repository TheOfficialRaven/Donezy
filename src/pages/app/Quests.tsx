import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Filter, Search, Clock, Zap, CheckCircle, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/stores/useAppStore';
import { usePersonaStore } from '@/stores/usePersonaStore';
import { cn } from '@/lib/utils';
import QuestDialog from '@/components/dialogs/QuestDialog';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import { toast } from 'sonner';

const difficultyColors = {
  easy: 'bg-success/20 text-success border-success/30',
  medium: 'bg-warning/20 text-warning border-warning/30',
  hard: 'bg-danger/20 text-danger border-danger/30',
  epic: 'bg-secondary/20 text-secondary border-secondary/30'
};

const difficultyLabels = {
  easy: 'Könnyű',
  medium: 'Közepes',
  hard: 'Nehéz',
  epic: 'Epikus'
};

export default function Quests() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [questDialogOpen, setQuestDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [questToDelete, setQuestToDelete] = useState<string | null>(null);

  const { quests, completeQuest, addQuest, deleteQuest } = useAppStore();
  const { currentPersona } = usePersonaStore();

  const categories = Array.from(new Set(quests.map(q => q.category))).filter(Boolean);

  const questsToday = quests.filter(q =>
    !q.completed &&
    (!q.dueDate || q.dueDate === new Date().toISOString().split('T')[0])
  );

  const questsWeekly = quests.filter(q =>
    !q.completed &&
    q.dueDate &&
    new Date(q.dueDate) > new Date() &&
    new Date(q.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );

  const questsCompleted = quests.filter(q => q.completed);

  const filteredQuests = (questList: typeof quests) => {
    return questList.filter(quest => {
      const matchesSearch = quest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           quest.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || quest.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const handleCompleteQuest = async (questId: string) => {
    await completeQuest(questId);
    toast.success('Küldetés teljesítve! XP és Essence jóváírva.');
  };

  const handleDeleteQuest = async () => {
    if (questToDelete) {
      await deleteQuest(questToDelete);
      toast.success('Küldetés törölve.');
      setDeleteConfirmOpen(false);
      setQuestToDelete(null);
    }
  };

  const handleAcceptSuggested = async (suggestion: ReturnType<typeof generateSuggestedQuests>[0]) => {
    await addQuest({
      title: suggestion.title,
      description: suggestion.description,
      category: suggestion.category,
      difficulty: suggestion.difficulty,
      estimatedTime: suggestion.estimatedTime,
      xpReward: suggestion.xpReward,
      essenceReward: suggestion.essenceReward,
      completed: false,
      dueDate: new Date().toISOString().split('T')[0],
      tags: suggestion.tags,
      persona: currentPersona.id,
    });
    toast.success('Javasolt küldetés elfogadva!');
  };

  const generateSuggestedQuests = () => {
    const suggestions = currentPersona.questPresets.map((preset, index) => ({
      id: `suggested-${index}`,
      title: getSuggestedQuestTitle(preset),
      description: getSuggestedQuestDescription(preset),
      category: 'Javasolt',
      difficulty: 'medium' as const,
      estimatedTime: 45,
      xpReward: 100,
      essenceReward: 20,
      completed: false,
      tags: [preset],
      persona: currentPersona.id
    }));
    return suggestions.slice(0, 3);
  };

  const getSuggestedQuestTitle = (preset: string) => {
    const titles: Record<string, string> = {
      'study-session': 'Tanulási blokk teljesítése',
      'exam-prep': 'Vizsga felkészülés',
      'daily-focus': 'Napi fókusz célok',
      'meeting-prep': 'Meeting előkészítése',
      'habit-building': 'Új szokás kialakítása',
      'reading-goal': 'Olvasási cél',
      'client-outreach': 'Ügyfél kapcsolattartás',
      'project-delivery': 'Projekt leadás',
      'household-task': 'Háztartási feladat',
      'budget-review': 'Költségvetés áttekintése',
      'project-milestone': 'Projekt mérföldkő',
      'skill-learning': 'Készségfejlesztés',
      'network-building': 'Networking',
      'meditation': 'Meditáció',
      'journaling': 'Napló írás',
      'skill-upgrade': 'Képzés',
      'invoice-chase': 'Számla kezelés',
      'family-activity': 'Családi tevékenység',
      'decluttering': 'Rendrakás',
    };
    return titles[preset] || 'Egyéni küldetés';
  };

  const getSuggestedQuestDescription = (preset: string) => {
    const descriptions: Record<string, string> = {
      'study-session': 'Koncentrált tanulás megszakítások nélkül',
      'exam-prep': 'Felkészülés a közelgő vizsgára',
      'daily-focus': '3 legfontosabb feladat elvégzése',
      'meeting-prep': 'Agenda és anyagok előkészítése',
      'habit-building': 'Új pozitív szokás gyakorlása',
      'reading-goal': 'Tervezett olvasmány folytatása',
      'client-outreach': 'Kapcsolatfelvétel potenciális ügyfelekkel',
      'project-delivery': 'Projekt befejezése és átadása',
      'household-task': 'Otthoni teendők elvégzése',
      'budget-review': 'Havi kiadások és bevételek elemzése',
      'project-milestone': 'Következő projektszakasz elérése',
      'skill-learning': 'Új készség tanulása',
      'network-building': 'Kapcsolatok építése',
      'meditation': '10 perc meditáció',
      'journaling': 'Napi gondolatok leírása',
      'skill-upgrade': 'Képzés vagy kurzus elvégzése',
      'invoice-chase': 'Kintlévőségek kezelése',
      'family-activity': 'Közös családi program',
      'decluttering': 'Felesleges tárgyak selejtezése',
    };
    return descriptions[preset] || 'Személyre szabott küldetés leírása';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary">Küldetések</h1>
          <p className="text-text-secondary">Alakítsd át feladataidat izgalmas küldetésekké</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-surface-0" onClick={() => setQuestDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Új küldetés
        </Button>
      </div>

      {/* Search and Filter */}
      <Card className="glass p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              placeholder="Küldetések keresése..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-surface-1/50 border-white/10"
            />
          </div>
          <Button variant="outline" className="border-white/20" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Szűrők
          </Button>
        </div>

        {showFilters && categories.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-white/10">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className={selectedCategory === 'all' ? 'bg-primary text-surface-0' : 'border-white/20'}
            >
              Összes
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory === cat ? 'bg-primary text-surface-0' : 'border-white/20'}
              >
                {cat}
              </Button>
            ))}
          </div>
        )}
      </Card>

      {/* Quest Tabs */}
      <Tabs defaultValue="today" className="space-y-4">
        <TabsList className="bg-surface-1/50 border border-white/10">
          <TabsTrigger value="today" className="data-[state=active]:bg-primary data-[state=active]:text-surface-0">
            Napi ({questsToday.length})
          </TabsTrigger>
          <TabsTrigger value="weekly" className="data-[state=active]:bg-primary data-[state=active]:text-surface-0">
            Heti ({questsWeekly.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-primary data-[state=active]:text-surface-0">
            Teljesített ({questsCompleted.length})
          </TabsTrigger>
          <TabsTrigger value="suggested" className="data-[state=active]:bg-primary data-[state=active]:text-surface-0">
            Javaslatok
          </TabsTrigger>
        </TabsList>

        {/* Today */}
        <TabsContent value="today" className="space-y-4">
          <div className="grid gap-4">
            {filteredQuests(questsToday).map((quest, index) => (
              <motion.div key={quest.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <Card className="glass p-6 hover-lift">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <button onClick={() => handleCompleteQuest(quest.id)} className="mt-1 text-text-muted hover:text-primary transition-colors">
                        <Circle className="h-5 w-5" />
                      </button>
                      <div className="flex-1">
                        <h3 className="font-heading font-semibold text-text-primary mb-2">{quest.title}</h3>
                        <p className="text-text-secondary mb-3">{quest.description}</p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge className={cn('text-xs', difficultyColors[quest.difficulty])}>{difficultyLabels[quest.difficulty]}</Badge>
                          <div className="flex items-center gap-1 text-sm text-text-muted"><Clock className="h-4 w-4" />{quest.estimatedTime} perc</div>
                          <div className="flex items-center gap-1 text-sm text-primary"><Zap className="h-4 w-4" />+{quest.xpReward} XP</div>
                          <Badge variant="outline" className="text-xs border-white/20">{quest.category}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleCompleteQuest(quest.id)} className="bg-success hover:bg-success/90 text-surface-0">
                        Teljesítés
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
            {filteredQuests(questsToday).length === 0 && (
              <Card className="glass p-12 text-center">
                <Zap className="h-16 w-16 text-text-disabled mx-auto mb-4" />
                <h3 className="text-lg font-heading font-semibold text-text-primary mb-2">Nincsenek mai küldetések</h3>
                <p className="text-text-muted mb-4">Hozz létre új küldetéseket a nap kezdéshez!</p>
                <Button className="bg-primary hover:bg-primary/90 text-surface-0" onClick={() => setQuestDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Első küldetés létrehozása
                </Button>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Weekly */}
        <TabsContent value="weekly" className="space-y-4">
          <div className="grid gap-4">
            {filteredQuests(questsWeekly).map((quest, index) => (
              <motion.div key={quest.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <Card className="glass p-6 hover-lift">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Circle className="h-5 w-5 mt-1 text-text-muted" />
                      <div className="flex-1">
                        <h3 className="font-heading font-semibold text-text-primary mb-2">{quest.title}</h3>
                        <p className="text-text-secondary mb-3">{quest.description}</p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge className={cn('text-xs', difficultyColors[quest.difficulty])}>{difficultyLabels[quest.difficulty]}</Badge>
                          <div className="flex items-center gap-1 text-sm text-text-muted"><Clock className="h-4 w-4" />{quest.estimatedTime} perc</div>
                          <div className="flex items-center gap-1 text-sm text-primary"><Zap className="h-4 w-4" />+{quest.xpReward} XP</div>
                          {quest.dueDate && <Badge variant="outline" className="text-xs border-warning text-warning">{new Date(quest.dueDate).toLocaleDateString('hu-HU')}</Badge>}
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => handleCompleteQuest(quest.id)} variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                      Elkezdés
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Completed */}
        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4">
            {filteredQuests(questsCompleted).map((quest, index) => (
              <motion.div key={quest.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <Card className="glass p-6 opacity-75">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="h-5 w-5 mt-1 text-success" />
                    <div className="flex-1">
                      <h3 className="font-heading font-semibold text-text-primary mb-2 line-through">{quest.title}</h3>
                      <p className="text-text-secondary mb-3">{quest.description}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge className="text-xs bg-success/20 text-success border-success/30">Teljesítve</Badge>
                        <div className="flex items-center gap-1 text-sm text-success"><Zap className="h-4 w-4" />+{quest.xpReward} XP megszerzve</div>
                        {quest.completedAt && <span className="text-xs text-text-muted">{new Date(quest.completedAt).toLocaleDateString('hu-HU')}</span>}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Suggested */}
        <TabsContent value="suggested" className="space-y-4">
          <Card className="glass p-6 border border-primary/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-text-primary">{currentPersona.label} küldetések</h3>
                <p className="text-sm text-text-secondary">Személyre szabott javaslatok a típusodra</p>
              </div>
            </div>
            <div className="grid gap-4">
              {generateSuggestedQuests().map((quest, index) => (
                <motion.div key={quest.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                  <Card className="bg-surface-1/30 p-4 hover-lift border border-primary/20">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-text-primary mb-2">{quest.title}</h4>
                        <p className="text-sm text-text-secondary mb-3">{quest.description}</p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-sm text-text-muted"><Clock className="h-4 w-4" />{quest.estimatedTime} perc</div>
                          <div className="flex items-center gap-1 text-sm text-primary"><Zap className="h-4 w-4" />+{quest.xpReward} XP</div>
                        </div>
                      </div>
                      <Button size="sm" className="bg-primary hover:bg-primary/90 text-surface-0" onClick={() => handleAcceptSuggested(quest)}>
                        Elfogadás
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <QuestDialog open={questDialogOpen} onOpenChange={setQuestDialogOpen} />
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Küldetés törlése"
        description="Biztosan törölni szeretnéd ezt a küldetést? Ez a művelet nem vonható vissza."
        confirmLabel="Törlés"
        onConfirm={handleDeleteQuest}
        destructive
      />
    </div>
  );
}
