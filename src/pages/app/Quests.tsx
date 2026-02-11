import { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, Search, Clock, Zap, CheckCircle, Circle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';
import { getLocalDateString } from '@/lib/dateUtils';
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [questToDelete, setQuestToDelete] = useState<string | null>(null);

  const { quests, completeQuest, deleteQuest } = useAppStore();

  const today = getLocalDateString();

  const categories = Array.from(new Set(quests.map(q => q.category))).filter(Boolean);

  // Daily: incomplete quests with today's date (or no date)
  const questsToday = quests.filter(q =>
    !q.completed &&
    (!q.dueDate || q.dueDate === today) &&
    q.questType !== 'weekly'
  );

  // Weekly: incomplete quests with future due date within this week
  const questsWeekly = quests.filter(q =>
    !q.completed &&
    q.dueDate &&
    q.dueDate > today &&
    new Date(q.dueDate) <= new Date(Date.now() + 7 * 86400000)
  );

  // Completed: only today's completions
  const questsCompleted = quests.filter(q =>
    q.completed &&
    q.completedAt?.startsWith(today)
  );

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-text-primary">Küldetések</h1>
        <p className="text-text-secondary">A küldetések automatikusan generálódnak a célcsoportod alapján</p>
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
        </TabsList>

        {/* Today */}
        <TabsContent value="today" className="space-y-4">
          <div className="grid gap-4">
            {filteredQuests(questsToday).map((quest, index) => (
              <motion.div key={quest.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <Card className="glass p-4 sm:p-6 hover-lift">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <button onClick={() => handleCompleteQuest(quest.id)} className="mt-1 text-text-muted hover:text-primary transition-colors flex-shrink-0">
                      <Circle className="h-5 w-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-heading font-semibold text-text-primary text-sm sm:text-base">{quest.title}</h3>
                        {quest.generated && (
                          <Badge className="text-xs bg-primary/15 text-primary border-primary/30">
                            <Sparkles className="h-3 w-3 mr-1" />Auto
                          </Badge>
                        )}
                      </div>
                      <p className="text-text-secondary text-sm mb-3">{quest.description}</p>
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <Badge className={cn('text-xs', difficultyColors[quest.difficulty])}>{difficultyLabels[quest.difficulty]}</Badge>
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-text-muted"><Clock className="h-3 w-3 sm:h-4 sm:w-4" />{quest.estimatedTime}p</div>
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-primary"><Zap className="h-3 w-3 sm:h-4 sm:w-4" />+{quest.xpReward} XP</div>
                        <Badge variant="outline" className="text-xs border-white/20">{quest.category}</Badge>
                      </div>
                      <Button onClick={() => handleCompleteQuest(quest.id)} className="bg-success hover:bg-success/90 text-surface-0 mt-3 sm:hidden w-full" size="sm">
                        Teljesítés
                      </Button>
                    </div>
                    <Button onClick={() => handleCompleteQuest(quest.id)} className="bg-success hover:bg-success/90 text-surface-0 hidden sm:inline-flex flex-shrink-0">
                      Teljesítés
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
            {filteredQuests(questsToday).length === 0 && (
              <Card className="glass p-12 text-center">
                <Zap className="h-16 w-16 text-text-disabled mx-auto mb-4" />
                <h3 className="text-lg font-heading font-semibold text-text-primary mb-2">Nincsenek mai küldetések</h3>
                <p className="text-text-muted">A küldetések automatikusan generálódnak minden nap a célcsoportod alapján.</p>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Weekly */}
        <TabsContent value="weekly" className="space-y-4">
          <div className="grid gap-4">
            {filteredQuests(questsWeekly).map((quest, index) => (
              <motion.div key={quest.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <Card className="glass p-4 sm:p-6 hover-lift">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <button onClick={() => handleCompleteQuest(quest.id)} className="mt-1 text-text-muted hover:text-primary transition-colors flex-shrink-0">
                      <Circle className="h-5 w-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-heading font-semibold text-text-primary text-sm sm:text-base">{quest.title}</h3>
                        {quest.generated && (
                          <Badge className="text-xs bg-primary/15 text-primary border-primary/30">
                            <Sparkles className="h-3 w-3 mr-1" />Auto
                          </Badge>
                        )}
                      </div>
                      <p className="text-text-secondary text-sm mb-3">{quest.description}</p>
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <Badge className={cn('text-xs', difficultyColors[quest.difficulty])}>{difficultyLabels[quest.difficulty]}</Badge>
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-text-muted"><Clock className="h-3 w-3 sm:h-4 sm:w-4" />{quest.estimatedTime}p</div>
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-primary"><Zap className="h-3 w-3 sm:h-4 sm:w-4" />+{quest.xpReward} XP</div>
                        {quest.dueDate && <Badge variant="outline" className="text-xs border-warning text-warning">Határidő: {new Date(quest.dueDate).toLocaleDateString('hu-HU')}</Badge>}
                      </div>
                      <Button onClick={() => handleCompleteQuest(quest.id)} className="bg-success hover:bg-success/90 text-surface-0 mt-3 sm:hidden w-full" size="sm">
                        Teljesítés
                      </Button>
                    </div>
                    <Button onClick={() => handleCompleteQuest(quest.id)} className="bg-success hover:bg-success/90 text-surface-0 hidden sm:inline-flex flex-shrink-0">
                      Teljesítés
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
            {filteredQuests(questsWeekly).length === 0 && (
              <Card className="glass p-12 text-center">
                <Zap className="h-16 w-16 text-text-disabled mx-auto mb-4" />
                <h3 className="text-lg font-heading font-semibold text-text-primary mb-2">Nincsenek heti küldetések</h3>
                <p className="text-text-muted">A heti küldetések automatikusan generálódnak minden hétfőn.</p>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Completed (today only) */}
        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4">
            {filteredQuests(questsCompleted).map((quest, index) => (
              <motion.div key={quest.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <Card className="glass p-6 opacity-75">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="h-5 w-5 mt-1 text-success" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-heading font-semibold text-text-primary line-through">{quest.title}</h3>
                        {quest.generated && (
                          <Badge className="text-xs bg-primary/15 text-primary border-primary/30">
                            <Sparkles className="h-3 w-3 mr-1" />Auto
                          </Badge>
                        )}
                      </div>
                      <p className="text-text-secondary mb-3">{quest.description}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge className="text-xs bg-success/20 text-success border-success/30">Teljesítve</Badge>
                        <div className="flex items-center gap-1 text-sm text-success"><Zap className="h-4 w-4" />+{quest.xpReward} XP megszerzve</div>
                        {quest.completedAt && <span className="text-xs text-text-muted">{new Date(quest.completedAt).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}</span>}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
            {filteredQuests(questsCompleted).length === 0 && (
              <Card className="glass p-12 text-center">
                <CheckCircle className="h-16 w-16 text-text-disabled mx-auto mb-4" />
                <h3 className="text-lg font-heading font-semibold text-text-primary mb-2">Még nincs mai teljesítés</h3>
                <p className="text-text-muted">Teljesíts küldetéseket a Napi vagy Heti fülön!</p>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

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
