import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, CheckCircle, Circle, Sparkles, Target, Users, Compass } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore, type Quest } from '@/stores/useAppStore';
import { usePersonaStore } from '@/stores/usePersonaStore';
import { INTEREST_GROUPS } from '@/lib/questGenerator';
import { cn } from '@/lib/utils';
import { getLocalDateString, getLocalMondayOfWeek, getLocalSundayOfWeek } from '@/lib/dateUtils';
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

// ============ QUEST CARD ============

function QuestCard({
  quest,
  index,
  onComplete,
  completed = false,
}: {
  quest: Quest;
  index: number;
  onComplete: (id: string) => void;
  completed?: boolean;
}) {
  const isProgressQuest = quest.trackingType && quest.targetCount;
  const progress = quest.currentProgress || 0;
  const target = quest.targetCount || 0;
  const progressPercent = isProgressQuest ? Math.min((progress / target) * 100, 100) : 0;

  const groupMeta = quest.preferenceGroup ? INTEREST_GROUPS[quest.preferenceGroup] : null;
  const GroupIcon = groupMeta ? (LucideIcons[groupMeta.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>) : null;

  if (completed) {
    return (
      <motion.div key={quest.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
        <Card className="glass p-4 sm:p-6 opacity-75">
          <div className="flex items-start gap-3 sm:gap-4">
            <CheckCircle className="h-5 w-5 mt-1 text-success flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="font-heading font-semibold text-text-primary line-through text-sm sm:text-base">{quest.title}</h3>
                {quest.questSource === 'preference' && groupMeta && (
                  <Badge
                    className="text-xs border"
                    style={{ background: `${groupMeta.color.replace(')', ' / 0.15)')}`, color: groupMeta.color, borderColor: `${groupMeta.color.replace(')', ' / 0.3)')}` }}
                  >
                    {GroupIcon && <GroupIcon className="h-3 w-3 mr-1" />}{groupMeta.label}
                  </Badge>
                )}
                {quest.questType === 'weekly' && (
                  <Badge variant="outline" className="text-xs border-accent/30 text-accent">Heti</Badge>
                )}
                {isProgressQuest && (
                  <Badge className="text-xs bg-accent/15 text-accent border-accent/30">
                    <Target className="h-3 w-3 mr-1" />{target}/{target}
                  </Badge>
                )}
              </div>
              <p className="text-text-secondary text-sm mb-3">{quest.description}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="text-xs bg-success/20 text-success border-success/30">Teljesítve</Badge>
                <div className="flex items-center gap-1 text-sm text-success"><Zap className="h-4 w-4" />+{quest.xpReward} XP</div>
                {quest.completedAt && <span className="text-xs text-text-muted">{new Date(quest.completedAt).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}</span>}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div key={quest.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Card className="glass p-4 sm:p-6 hover-lift">
        <div className="flex items-start gap-3 sm:gap-4">
          {!isProgressQuest ? (
            <button onClick={() => onComplete(quest.id)} className="mt-1 text-text-muted hover:text-primary transition-colors flex-shrink-0">
              <Circle className="h-5 w-5" />
            </button>
          ) : (
            <div className="mt-1 text-primary flex-shrink-0">
              <Target className="h-5 w-5" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="font-heading font-semibold text-text-primary text-sm sm:text-base">{quest.title}</h3>
              {quest.questSource === 'preference' && groupMeta && (
                <Badge
                  className="text-xs border"
                  style={{ background: `${groupMeta.color.replace(')', ' / 0.15)')}`, color: groupMeta.color, borderColor: `${groupMeta.color.replace(')', ' / 0.3)')}` }}
                >
                  {GroupIcon && <GroupIcon className="h-3 w-3 mr-1" />}{groupMeta.label}
                </Badge>
              )}
              {isProgressQuest && (
                <Badge className="text-xs bg-accent/15 text-accent border-accent/30">
                  <Target className="h-3 w-3 mr-1" />Haladás
                </Badge>
              )}
            </div>
            <p className="text-text-secondary text-sm mb-3">{quest.description}</p>

            {isProgressQuest && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-text-muted">
                    {quest.trackingType === 'tasks_completed' && 'Elvégzett feladatok'}
                    {quest.trackingType === 'quests_completed' && 'Elvégzett küldetések'}
                    {quest.trackingType === 'notes_created' && 'Létrehozott jegyzetek'}
                  </span>
                  <span className="font-semibold text-primary">{progress} / {target}</span>
                </div>
                <div className="w-full h-2.5 bg-surface-1/50 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <Badge className={cn('text-xs', difficultyColors[quest.difficulty])}>{difficultyLabels[quest.difficulty]}</Badge>
              {quest.estimatedTime > 0 && (
                <div className="flex items-center gap-1 text-xs sm:text-sm text-text-muted"><Clock className="h-3 w-3 sm:h-4 sm:w-4" />{quest.estimatedTime}p</div>
              )}
              <div className="flex items-center gap-1 text-xs sm:text-sm text-primary"><Zap className="h-3 w-3 sm:h-4 sm:w-4" />+{quest.xpReward} XP</div>
              <Badge variant="outline" className="text-xs border-white/20">{quest.category}</Badge>
              {quest.questType === 'weekly' && quest.dueDate && (
                <Badge variant="outline" className="text-xs border-warning text-warning">Határidő: {new Date(quest.dueDate + 'T12:00:00').toLocaleDateString('hu-HU')}</Badge>
              )}
            </div>

            {!isProgressQuest && (
              <Button onClick={() => onComplete(quest.id)} className="bg-success hover:bg-success/90 text-surface-0 mt-3 sm:hidden w-full" size="sm">
                Teljesítés
              </Button>
            )}
          </div>
          {!isProgressQuest && (
            <Button onClick={() => onComplete(quest.id)} className="bg-success hover:bg-success/90 text-surface-0 hidden sm:inline-flex flex-shrink-0">
              Teljesítés
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// ============ SECTION HEADER ============

function SectionHeader({ icon: Icon, label, color, count, colorStyle }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  count: number;
  colorStyle?: React.CSSProperties;
}) {
  return (
    <div className="flex items-center gap-2 pt-2 pb-1">
      <div
        className={cn('w-6 h-6 rounded-md flex items-center justify-center', !colorStyle && color)}
        style={colorStyle}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="text-sm font-semibold text-text-primary">{label}</span>
      <span className="text-xs text-text-muted">({count})</span>
    </div>
  );
}

// ============ HELPERS ============

/** Groups preference quests by their preferenceGroup and returns ordered entries */
function groupByInterest(questList: Quest[]): { group: string; meta: typeof INTEREST_GROUPS[string]; quests: Quest[] }[] {
  const map = new Map<string, Quest[]>();
  for (const q of questList) {
    const g = q.preferenceGroup || 'other';
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(q);
  }
  // Return in the order they appear in INTEREST_GROUPS
  const result: { group: string; meta: typeof INTEREST_GROUPS[string]; quests: Quest[] }[] = [];
  for (const [key, meta] of Object.entries(INTEREST_GROUPS)) {
    if (map.has(key)) {
      result.push({ group: key, meta, quests: map.get(key)! });
    }
  }
  // Any remaining quests without a known group
  if (map.has('other')) {
    result.push({ group: 'other', meta: { label: 'Egyéb', icon: 'Compass', color: 'hsl(220 15% 55%)' }, quests: map.get('other')! });
  }
  return result;
}

/** Renders preference quests grouped by interest with individual headers */
function PreferenceGroups({ questList, onComplete, completed = false }: {
  questList: Quest[];
  onComplete: (id: string) => void;
  completed?: boolean;
}) {
  const groups = groupByInterest(questList);
  if (groups.length === 0) return null;

  return (
    <>
      {groups.map(({ group, meta, quests: groupQuests }) => {
        const GIcon = LucideIcons[meta.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
        return (
          <div key={group} className="space-y-3">
            <SectionHeader
              icon={GIcon}
              label={meta.label}
              color=""
              colorStyle={{
                background: meta.color.replace(')', ' / 0.2)'),
                color: meta.color,
              }}
              count={groupQuests.length}
            />
            {groupQuests.map((quest, i) => (
              <QuestCard key={quest.id} quest={quest} index={i} onComplete={onComplete} completed={completed} />
            ))}
          </div>
        );
      })}
    </>
  );
}

// ============ MAIN COMPONENT ============

export default function Quests() {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [questToDelete, setQuestToDelete] = useState<string | null>(null);

  const { quests, completeQuest, deleteQuest } = useAppStore();
  const { currentPersona } = usePersonaStore();

  const PersonaIcon = LucideIcons[currentPersona.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;

  const today = getLocalDateString();
  const mondayOfWeek = getLocalMondayOfWeek(today);
  const sundayOfWeek = getLocalSundayOfWeek(today);

  // Filter quests to current persona
  const myQuests = quests.filter(q => !q.persona || q.persona === currentPersona.id);

  // Daily quests split by source
  const dailyAll = myQuests.filter(q => !q.completed && q.questType === 'daily' && (!q.dueDate || q.dueDate === today));
  const dailyPersona = dailyAll.filter(q => q.questSource !== 'preference');
  const dailyPreference = dailyAll.filter(q => q.questSource === 'preference');

  // Weekly quests split by source
  const weeklyAll = myQuests.filter(q => !q.completed && q.questType === 'weekly' && q.dueDate && q.dueDate >= mondayOfWeek && q.dueDate <= sundayOfWeek);
  const weeklyPersona = weeklyAll.filter(q => q.questSource !== 'preference');
  const weeklyPreference = weeklyAll.filter(q => q.questSource === 'preference');

  // Completed
  const completedAll = myQuests.filter(q =>
    q.completed && (
      (q.questType === 'daily' && q.completedAt?.startsWith(today)) ||
      (q.questType === 'weekly' && q.dueDate && q.dueDate >= mondayOfWeek && q.dueDate <= sundayOfWeek)
    )
  );
  const completedPersona = completedAll.filter(q => q.questSource !== 'preference');
  const completedPreference = completedAll.filter(q => q.questSource === 'preference');

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

  const hasPreferenceQuests = dailyPreference.length > 0 || weeklyPreference.length > 0 || completedPreference.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-text-primary">Küldetések</h1>
        <p className="text-text-secondary">
          Személyre szabott küldetések — <span className="text-primary font-medium">{currentPersona.label}</span> célcsoport
        </p>
      </div>

      {/* Quest Tabs */}
      <Tabs defaultValue="today" className="space-y-4">
        <TabsList className="bg-surface-1/50 border border-white/10">
          <TabsTrigger value="today" className="data-[state=active]:bg-primary data-[state=active]:text-surface-0">
            Napi ({dailyAll.length})
          </TabsTrigger>
          <TabsTrigger value="weekly" className="data-[state=active]:bg-primary data-[state=active]:text-surface-0">
            Heti ({weeklyAll.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-primary data-[state=active]:text-surface-0">
            Teljesített ({completedAll.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Today ── */}
        <TabsContent value="today" className="space-y-4">
          {dailyAll.length === 0 ? (
            <Card className="glass p-12 text-center">
              <Zap className="h-16 w-16 text-text-disabled mx-auto mb-4" />
              <h3 className="text-lg font-heading font-semibold text-text-primary mb-2">Nincsenek mai küldetések</h3>
              <p className="text-text-muted">A küldetések automatikusan generálódnak minden nap a célcsoportod alapján.</p>
            </Card>
          ) : (
            <>
              {/* Persona quests */}
              {dailyPersona.length > 0 && (
                <div className="space-y-3">
                  <SectionHeader
                    icon={PersonaIcon}
                    label={`${currentPersona.label} küldetések`}
                    color="bg-primary/20 text-primary"
                    count={dailyPersona.length}
                  />
                  {dailyPersona.map((quest, i) => (
                    <QuestCard key={quest.id} quest={quest} index={i} onComplete={handleCompleteQuest} />
                  ))}
                </div>
              )}

              {/* Preference quests grouped by interest */}
              <PreferenceGroups questList={dailyPreference} onComplete={handleCompleteQuest} />
            </>
          )}
        </TabsContent>

        {/* ── Weekly ── */}
        <TabsContent value="weekly" className="space-y-4">
          {weeklyAll.length === 0 ? (
            <Card className="glass p-12 text-center">
              <Zap className="h-16 w-16 text-text-disabled mx-auto mb-4" />
              <h3 className="text-lg font-heading font-semibold text-text-primary mb-2">Nincsenek heti küldetések</h3>
              <p className="text-text-muted">A heti küldetések automatikusan generálódnak minden hétfőn.</p>
            </Card>
          ) : (
            <>
              {weeklyPersona.length > 0 && (
                <div className="space-y-3">
                  <SectionHeader
                    icon={PersonaIcon}
                    label={`${currentPersona.label} küldetések`}
                    color="bg-primary/20 text-primary"
                    count={weeklyPersona.length}
                  />
                  {weeklyPersona.map((quest, i) => (
                    <QuestCard key={quest.id} quest={quest} index={i} onComplete={handleCompleteQuest} />
                  ))}
                </div>
              )}

              {/* Preference quests grouped by interest */}
              <PreferenceGroups questList={weeklyPreference} onComplete={handleCompleteQuest} />
            </>
          )}
        </TabsContent>

        {/* ── Completed ── */}
        <TabsContent value="completed" className="space-y-4">
          {completedAll.length === 0 ? (
            <Card className="glass p-12 text-center">
              <CheckCircle className="h-16 w-16 text-text-disabled mx-auto mb-4" />
              <h3 className="text-lg font-heading font-semibold text-text-primary mb-2">Még nincs mai teljesítés</h3>
              <p className="text-text-muted">Teljesíts küldetéseket a Napi vagy Heti fülön!</p>
            </Card>
          ) : (
            <>
              {completedPersona.length > 0 && (
                <div className="space-y-3">
                  <SectionHeader
                    icon={PersonaIcon}
                    label={`${currentPersona.label} küldetések`}
                    color="bg-primary/20 text-primary"
                    count={completedPersona.length}
                  />
                  {completedPersona.map((quest, i) => (
                    <QuestCard key={quest.id} quest={quest} index={i} onComplete={handleCompleteQuest} completed />
                  ))}
                </div>
              )}

              {/* Preference quests grouped by interest */}
              <PreferenceGroups questList={completedPreference} onComplete={handleCompleteQuest} completed />
            </>
          )}
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
