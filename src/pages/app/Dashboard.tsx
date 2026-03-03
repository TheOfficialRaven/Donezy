import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Clock, Target, BookOpen, Calendar as CalendarIcon, Zap, Check, Circle, ChevronRight,
  Activity, Flame, PenLine, Shield, Smile, Frown, Meh, CloudRain, Sun,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { usePersonaStore } from '@/stores/usePersonaStore';
import { useAppStore, type Quest, type TodoList, type Task } from '@/stores/useAppStore';
import { INTEREST_GROUPS } from '@/lib/questGenerator';
import { cn } from '@/lib/utils';
import { getLocalDateString } from '@/lib/dateUtils';
import { analyzeHabits } from '@/lib/habitAnalyzer';
import { scoreCandidates, type ScoreCandidate } from '@/lib/rules/scoring';
import { detectOverload, supportiveLoadMessage, nonUrgentSuggestionTitle } from '@/lib/rules/stress';
import { selectTodayFocus } from '@/lib/dashboard/focusSelector';
import { buildPatternInsight } from '@/lib/rules/patterns';
import { FOCUS_AREA_LABELS } from '@/lib/focusAreas';

export default function Dashboard() {
  const { currentPersona } = usePersonaStore();
  const { userStats, userPreferences, quests, lists, events, journalEntries, completeQuest, updateTask } = useAppStore();
  const navigate = useNavigate();

  const PersonaIcon = LucideIcons[currentPersona.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
  const today = getLocalDateString();
  const isShoppingList = (list: TodoList) =>
    list.type === 'shopping' || list.name.toLowerCase().includes('bevásárl');
  const isTaskHandled = (list: TodoList, task: Task) =>
    isShoppingList(list)
      ? task.shoppingStatus === 'purchased' || task.shoppingStatus === 'not_available'
      : task.completed;
  const isTodayQuest = (q: Quest) => (q.questType === 'daily' || !q.questType) && (!q.dueDate || q.dueDate === today);
  // Filter quests by current persona (non-generated quests are always shown)
  const myQuests = quests.filter(q => !q.persona || q.persona === currentPersona.id);
  const todayPersona = myQuests.filter(q => !q.completed && isTodayQuest(q) && q.questSource !== 'preference').slice(0, 3);
  const todayPreference = myQuests.filter(q => !q.completed && isTodayQuest(q) && q.questSource === 'preference');
  const todayQuests = [...todayPersona, ...todayPreference];
  const completedToday = myQuests.filter(q => q.completed && q.completedAt?.startsWith(today)).length;

  // Group preference quests by interest for dashboard display
  const prefByGroup = new Map<string, Quest[]>();
  for (const q of todayPreference) {
    const g = q.preferenceGroup || 'other';
    if (!prefByGroup.has(g)) prefByGroup.set(g, []);
    prefByGroup.get(g)!.push(q);
  }
  const orderedPrefGroups: { group: string; meta: typeof INTEREST_GROUPS[string]; quests: Quest[] }[] = [];
  for (const [key, meta] of Object.entries(INTEREST_GROUPS)) {
    if (prefByGroup.has(key)) {
      orderedPrefGroups.push({ group: key, meta, quests: prefByGroup.get(key)! });
    }
  }

  // Upcoming events (from now onwards, sorted by start time, max 4)
  const now = new Date();
  const upcomingEvents = events
    .filter(e => new Date(e.startTime) >= new Date(now.getTime() - 30 * 60 * 1000)) // include events started up to 30 min ago
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 4);

  const formatEventTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });

  const formatEventDate = (dateString: string) => {
    const eventDate = new Date(dateString);
    const todayDate = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (eventDate.toDateString() === todayDate.toDateString()) return 'Ma';
    if (eventDate.toDateString() === tomorrow.toDateString()) return 'Holnap';
    return eventDate.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
  };

  const isEventSoon = (startTime: string) => {
    const diff = new Date(startTime).getTime() - now.getTime();
    return diff > 0 && diff < 60 * 60 * 1000; // within 1 hour
  };

  // Lists with incomplete tasks for dashboard
  const listsWithTasks = lists
    .map((list) => ({
      ...list,
      incompleteTasks: list.tasks.filter((task) => !isTaskHandled(list, task)),
      completedCount: list.tasks.filter((task) => isTaskHandled(list, task)).length,
    }))
    .filter((list) => list.tasks.length > 0);

  const dailyQuests = myQuests.filter((q) => !q.completed && isTodayQuest(q));
  const taskCandidates = lists.flatMap((list) =>
    list.tasks
      .filter((task) => !isTaskHandled(list, task))
      .map(
        (task): ScoreCandidate => ({
          id: `task:${list.id}:${task.id}`,
          title: task.title,
          kind: 'task',
          focusArea: task.focusArea || 'munka_tanulas',
          priority: task.priority,
          dueDate: task.dueDate,
          createdAt: task.createdAt,
          lastInteractedAt: task.lastInteractedAt,
          postponedCount: task.postponedCount,
          manualPriority: task.manualPriority,
        })
      )
  );
  const questCandidates = dailyQuests.map(
    (quest): ScoreCandidate => ({
      id: `quest:${quest.id}`,
      title: quest.title,
      kind: 'quest',
      focusArea: quest.focusArea || 'munka_tanulas',
      difficulty: quest.difficulty,
      dueDate: quest.dueDate,
      createdAt: quest.createdAt,
      lastInteractedAt: quest.lastInteractedAt,
      postponedCount: quest.postponedCount,
      estimatedTime: quest.estimatedTime,
      manualPriority: quest.manualPriority,
    })
  );
  const eventCandidates = upcomingEvents.map(
    (event): ScoreCandidate => ({
      id: `event:${event.id}`,
      title: event.title,
      kind: 'event',
      focusArea: event.focusArea || 'munka_tanulas',
      dueDate: event.startTime,
      createdAt: event.createdAt,
      lastInteractedAt: event.lastInteractedAt,
      estimatedTime: Math.max(5, Math.round((new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / 60000)),
    })
  );

  const reflectionLast7 = journalEntries.filter((entry) => {
    const diff = (new Date(today).getTime() - new Date(entry.date).getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });
  const lowMoodStreakDays = reflectionLast7.filter((entry) => entry.mood <= 2).length;
  const positiveReflectionDays = reflectionLast7.filter((entry) => entry.mood >= 4).length;
  const postponeCountLast3Days = lists
    .flatMap((list) => list.tasks)
    .filter((task) => (task.postponedCount || 0) > 0)
    .reduce((sum, task) => sum + (task.postponedCount || 0), 0);
  const taskPool = lists.flatMap((list) => list.tasks);

  const scoredCandidates = scoreCandidates([...taskCandidates, ...questCandidates, ...eventCandidates], {
    persona: currentPersona.id,
    calendarLoad: upcomingEvents.length,
    last7dCompletions: completedToday + Math.max(0, userStats.tasksCompleted || 0),
    streak: userStats.streak || 0,
    positiveReflectionDays,
  });

  const candidateDueHours = scoredCandidates
    .map((candidate) => (candidate.dueDate ? (new Date(candidate.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60) : null))
    .filter((hours): hours is number => hours !== null);
  const overdueItemsCount = candidateDueHours.filter((hours) => hours < 0).length;
  const dueSoonItemsCount = candidateDueHours.filter((hours) => hours >= 0 && hours <= 48).length;
  const highPriorityOpenTasks = lists.flatMap((list) =>
    list.tasks.filter((task) => !isTaskHandled(list, task) && task.priority === 'high')
  ).length;

  const recentCompletedQuestHours = myQuests
    .filter((quest) => quest.completed && quest.completedAt)
    .map((quest) => new Date(quest.completedAt as string))
    .filter((date) => !Number.isNaN(date.getTime()))
    .filter((date) => (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24) <= 14)
    .map((date) => date.getHours());

  const parseCompletedDay = (value?: string) => {
    if (!value) return null;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
    const fallback = new Date(`${value}T12:00:00`);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  };
  const completionDates = [
    ...taskPool
      .filter((task) => task.completed && task.completedAt)
      .map((task) => parseCompletedDay(task.completedAt))
      .filter((date): date is Date => Boolean(date)),
    ...myQuests
      .filter((quest) => quest.completed && quest.completedAt)
      .map((quest) => parseCompletedDay(quest.completedAt))
      .filter((date): date is Date => Boolean(date)),
  ];
  const completedItems7d = completionDates.filter((date) => (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24) <= 7).length;
  const byDay = Array.from({ length: 7 }, (_, offset) => {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - offset));
    const dayKey = day.toISOString().slice(0, 10);
    return completionDates.filter((date) => date.toISOString().slice(0, 10) === dayKey).length;
  });
  const firstHalf = byDay.slice(0, 3).reduce((sum, value) => sum + value, 0);
  const secondHalf = byDay.slice(4, 7).reduce((sum, value) => sum + value, 0);
  const completionTrend =
    secondHalf - firstHalf >= 2 ? 'up' : firstHalf - secondHalf >= 2 ? 'down' : 'stable';

  const focusAreaOrder = userPreferences.focusAreasOrder || ['tudat', 'test', 'munka_tanulas', 'otthon', 'kapcsolatok'];
  const prioritizedCandidates = scoredCandidates.map((candidate) => {
    const rank = focusAreaOrder.indexOf(candidate.focusArea);
    const bonus = rank === 0 ? 12 : rank === 1 ? 8 : rank === 2 ? 4 : 0;
    return { ...candidate, importance: Math.min(100, candidate.importance + bonus) };
  });
  const focusPack = selectTodayFocus(prioritizedCandidates, userPreferences.maxActiveItems || 5, now);
  const overload = detectOverload({
    calendarLoad: upcomingEvents.length,
    lowMoodStreakDays,
    postponeCountLast3Days,
  });
  const hasEventSoonNow = upcomingEvents.some((event) => isEventSoon(event.startTime));

  const patternInsight = buildPatternInsight({
    focusAreaCounts: {
      tudat: prioritizedCandidates.filter((item) => item.focusArea === 'tudat').length,
      test: prioritizedCandidates.filter((item) => item.focusArea === 'test').length,
      munka_tanulas: prioritizedCandidates.filter((item) => item.focusArea === 'munka_tanulas').length,
      otthon: prioritizedCandidates.filter((item) => item.focusArea === 'otthon').length,
      kapcsolatok: prioritizedCandidates.filter((item) => item.focusArea === 'kapcsolatok').length,
    },
    reflectionSignals: reflectionLast7.map((entry) => ({ date: entry.date, mood: entry.mood })),
    completionHours: recentCompletedQuestHours,
    upcomingEventTitles: upcomingEvents.map((event) => `${event.title} ${event.category || ''}`),
    upcomingEventsCount: upcomingEvents.length,
    hasUrgent: Boolean(focusPack.urgent),
    overloaded: overload,
    hasEventSoon: hasEventSoonNow,
    overdueItemsCount,
    dueSoonItemsCount,
    highPriorityOpenTasks,
    completedItems7d,
    completionTrend,
    preferredActiveTime: userPreferences.activeTime,
    userChallenge: userPreferences.challenge,
  });

  const toggleDashboardTask = async (
    listId: string,
    taskId: string,
    completed: boolean,
    shoppingStatus?: 'pending' | 'purchased' | 'not_available'
  ) => {
    const list = lists.find((item) => item.id === listId);
    if (!list) return;
    if (isShoppingList(list)) {
      const current = shoppingStatus || (completed ? 'purchased' : 'pending');
      await updateTask(listId, taskId, { shoppingStatus: current === 'purchased' ? 'pending' : 'purchased' });
      return;
    }
    await updateTask(listId, taskId, { completed: !completed });
  };

  const getPersonaModuleContent = (module: string) => {
    switch (module) {
      // Student modules
      case 'schedule':
        return { title: 'Heti órarend', icon: Clock, content: 'Építsd fel a heti órarendedet, és kapj holnapi felkészülési javaslatokat.', action: 'Órarend megnyitása', link: '/student/timetable' };
      case 'exams':
        return { title: 'Vizsga felkészülés', icon: Target, content: 'Tervezd meg a tanulási blokkjaidat a következő vizsgáidra.', action: 'Felkészülés tervezése', link: '/app/quests' };
      case 'study-quests':
        return { title: 'Tanulási küldetések', icon: Zap, content: 'Teljesítsd a napi tanulási kihívásaidat és szerezz XP-t.', action: 'Küldetések megtekintése', link: '/app/quests' };
      case 'progress':
        return { title: 'Tanulási haladás', icon: Target, content: 'Kövesd nyomon a fejlődésedet és az elért eredményeidet.', action: 'Eredmények megtekintése', link: '/app/achievements' };
      // Worker modules
      case 'daily-focus':
        return { title: 'Napi fókusz', icon: Target, content: 'A 3 legfontosabb feladatod ma – kezdd ezekkel.', action: 'Fókusz beállítása', link: '/app/lists' };
      case 'meetings':
        return { title: 'Mai megbeszélések', icon: CalendarIcon, content: 'Készülj fel a mai meetingekre: agenda, célok, kérdések.', action: 'Meeting előkészítése', link: '/app/calendar' };
      case 'pomodoro':
        return { title: 'Pomodoro időzítő', icon: Clock, content: 'Dolgozz 25 perces fókusz blokkokban a maximális hatékonyságért.', action: 'Időzítő indítása', link: '/app/quests' };
      case 'break-reminder':
        return { title: 'Szünet emlékeztető', icon: Zap, content: 'Ne feledd a szüneteket – a pihenés növeli a produktivitást.', action: 'Szünetek tervezése', link: '/app/calendar' };
      case 'goals':
        return { title: 'Karrier célok', icon: Target, content: 'Kövesd nyomon a hosszú távú karrier céljaid felé haladásodat.', action: 'Célok áttekintése', link: '/app/achievements' };
      // Selfdev modules
      case 'habits':
        return { title: 'Szokás Tracker', icon: Activity, content: 'Figyeld meg, mely rutinok támogatnak most a legjobban.', action: 'Szokások megtekintése', link: '/app/habits' };
      case 'daily-challenge':
        return { title: 'Napi kihívás', icon: Zap, content: 'Lépj ki a komfortzónádból egy napi mikro-kihívással.', action: 'Kihívás teljesítése', link: '/app/quests' };
      case 'reading':
        return { title: 'Olvasási napló', icon: BookOpen, content: 'Kövesd az olvasási célod – hány oldalt vagy fejezetet olvastál.', action: 'Olvasás naplózása', link: '/app/reading' };
      case 'reflection':
        return { title: 'Napi reflexió', icon: PenLine, content: 'Írj pár sort a napodról: tanulságok, érzések, felismerések.', action: 'Napló megnyitása', link: '/app/reflection' };
      case 'growth':
        return { title: 'Növekedési célok', icon: Target, content: 'Tekintsd meg a fejlődési céljaidat és az elért mérföldköveket.', action: 'Célok megtekintése', link: '/app/growth' };
      // Freelancer modules
      case 'clients':
        return { title: 'Aktív projektek', icon: Target, content: 'Az ügyfeleid és projektjeid állapota egy helyen.', action: 'Projektek kezelése', link: '/app/lists' };
      case 'deadlines':
        return { title: 'Közeli határidők', icon: Clock, content: 'A legközelebb lejáró projekt határidők és teendők.', action: 'Határidők rendezése', link: '/app/calendar' };
      case 'invoicing':
        return { title: 'Számlázás', icon: Target, content: 'Függő számlák és kintlévőségek áttekintése.', action: 'Számlák kezelése', link: '/app/lists' };
      case 'pipeline':
        return { title: 'Ügyfél pipeline', icon: Target, content: 'Potenciális ügyfelek és ajánlatok nyomon követése.', action: 'Pipeline kezelése', link: '/app/lists' };
      case 'income':
        return { title: 'Bevétel tracker', icon: Target, content: 'Havi bevételeid és kiadásaid áttekintése.', action: 'Pénzügyek megtekintése', link: '/app/notes' };
      // Organizer modules
      case 'household':
        return { title: 'Háztartási rutin', icon: Target, content: 'A mai háztartási feladatok – tartsd rendben az otthonod.', action: 'Feladatok megtekintése', link: '/app/lists' };
      case 'finances':
        return { title: 'Családi pénzügyek', icon: Target, content: 'Költségvetés, számlák és megtakarítások egy helyen.', action: 'Pénzügyek áttekintése', link: '/app/lists' };
      case 'shopping':
        return { title: 'Bevásárlólista', icon: Target, content: 'Az aktuális bevásárlólista – soha ne felejtsd el amit kell.', action: 'Lista megtekintése', link: '/app/lists' };
      case 'family':
        return { title: 'Családi program', icon: CalendarIcon, content: 'A család heti programja és közös tevékenységek.', action: 'Családi naptár', link: '/app/calendar' };
      case 'projects':
        return { title: 'Otthoni projektek', icon: Target, content: 'Folyamatban lévő otthoni fejlesztések és javítások.', action: 'Projektek megtekintése', link: '/app/lists' };
      // Shared modules
      case 'notes':
        return { title: 'Jegyzetek', icon: BookOpen, content: 'A legutóbbi jegyzeteid és gondolataid.', action: 'Jegyzetek megnyitása', link: '/app/notes' };
      default:
        return { title: 'Gyors jegyzet', icon: BookOpen, content: 'Rögzítsd gondolataidat és ötleteidet azonnal.', action: 'Jegyzet írása', link: '/app/notes' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-text-primary mb-2">
          {currentPersona.heroTitle}
        </h1>
        <p className="text-lg text-text-secondary">
          {currentPersona.heroSubtitle}
        </p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { value: userStats.level, label: 'Szint', color: 'text-primary', delay: 0.1 },
          { value: userStats.streak, label: 'Aktív napok', color: 'text-secondary', delay: 0.2 },
          { value: completedToday, label: 'Ma teljesítve', color: 'text-success', delay: 0.3 },
          { value: userStats.essence, label: 'Essence', color: 'text-warning', delay: 0.4 },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: stat.delay }}
          >
            <Card className="glass p-4 text-center">
              <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
              <div className="text-sm text-text-muted">{stat.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Guided daily focus */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <Card className="glass p-4 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-heading font-semibold text-text-primary">Ma erre erdemes figyelned</h2>
            <Badge variant="outline" className="border-white/20 text-text-muted w-fit text-[11px] sm:text-xs">
              max {userPreferences.maxActiveItems || 5} aktiv elem
            </Badge>
          </div>

          <div className="space-y-2.5 sm:space-y-2">
            {[
              ...(focusPack.urgent ? [{ label: 'Surgos', icon: '🔴', item: focusPack.urgent }] : []),
              { label: 'Fontos', icon: '⭐', item: focusPack.important },
              { label: 'Lendulet', icon: '🔥', item: focusPack.momentum },
            ].map((entry) => (
              <div key={entry.label} className="p-3 rounded-lg bg-surface-1/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span>{entry.icon}</span>
                      <span className="text-[11px] sm:text-xs uppercase tracking-wide text-text-muted">{entry.label}</span>
                    </div>
                    <span className="text-sm text-text-primary block break-words leading-relaxed">
                      {entry.item?.title || 'Nincs kiemelt elem'}
                    </span>
                  </div>
                  {entry.item && (
                    <Badge variant="outline" className="border-white/20 text-text-secondary text-[10px] sm:text-xs shrink-0 mt-0.5">
                      {FOCUS_AREA_LABELS[entry.item.focusArea]}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {!focusPack.urgent && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-sm text-emerald-300">
                  Ma nem latszik igazan surgos teendo. Ez teljesen rendben van.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-text-secondary">{supportiveLoadMessage(overload)}</p>
          </div>

          {focusPack.nonUrgent && (
            <div className="mt-3 p-3 rounded-lg bg-surface-1/50 border border-white/10">
              <p className="text-sm text-text-secondary">{nonUrgentSuggestionTitle()}</p>
              <p className="text-sm text-text-primary mt-1">{focusPack.nonUrgent.title}</p>
            </div>
          )}

          <div className="mt-4 grid gap-2.5 sm:gap-3 md:grid-cols-2">
            <div className="p-3 rounded-lg bg-surface-1/40">
              <p className="text-[11px] sm:text-xs text-text-muted mb-1">Mai insight</p>
              <p className="text-sm text-text-secondary leading-relaxed">{patternInsight.daily}</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-1/40">
              <p className="text-[11px] sm:text-xs text-text-muted mb-1">Heti insight</p>
              <p className="text-sm text-text-secondary leading-relaxed">{patternInsight.weekly}</p>
            </div>
          </div>
          <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-[11px] sm:text-xs text-text-muted mb-1">Általános insight</p>
            <p className="text-sm text-text-secondary leading-relaxed">{patternInsight.coach}</p>
          </div>
        </Card>
      </motion.div>

      {/* Today's Quests */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="glass p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold text-text-primary">
              Mai küldetések
            </h2>
            <Button
              size="sm"
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => navigate('/app/quests')}
            >
              Összes küldetés
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="space-y-4">
            {todayQuests.length > 0 ? (
              <>
                {/* Persona quests group */}
                {todayPersona.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 pb-1">
                      <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
                        <PersonaIcon className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{currentPersona.label}</span>
                    </div>
                    {todayPersona.map((quest, index) => (
                      <motion.div
                        key={quest.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-surface-1/50 hover:bg-surface-1/70 transition-colors"
                      >
                        <button
                          onClick={() => completeQuest(quest.id)}
                          className="w-2 h-2 rounded-full bg-primary hover:ring-2 hover:ring-primary/50 transition-all mt-2 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-text-primary text-sm sm:text-base">{quest.title}</h3>
                          <p className="text-xs sm:text-sm text-text-muted line-clamp-2">{quest.description}</p>
                          <div className="flex items-center gap-3 mt-1.5 sm:hidden">
                            <div className="flex items-center gap-1 text-xs text-text-muted"><Clock className="h-3 w-3" />{quest.estimatedTime}p</div>
                            <div className="text-xs text-primary font-medium">+{quest.xpReward} XP</div>
                          </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 text-sm text-text-muted flex-shrink-0"><Clock className="h-4 w-4" />{quest.estimatedTime}p</div>
                        <div className="hidden sm:block text-sm text-primary font-medium flex-shrink-0">+{quest.xpReward} XP</div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Preference quests grouped by interest */}
                {orderedPrefGroups.map(({ group, meta, quests: groupQuests }) => {
                  const GIcon = LucideIcons[meta.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
                  return (
                    <div key={group} className="space-y-2">
                      <div className="flex items-center gap-2 pb-1">
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center"
                          style={{ background: meta.color.replace(')', ' / 0.2)'), color: meta.color }}
                        >
                          {GIcon && <GIcon className="h-3 w-3" />}
                        </div>
                        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{meta.label}</span>
                      </div>
                      {groupQuests.map((quest, index) => (
                        <motion.div
                          key={quest.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + index * 0.1 }}
                          className="flex items-start gap-3 p-3 rounded-lg bg-surface-1/50 hover:bg-surface-1/70 transition-colors border-l-2"
                          style={{ borderColor: meta.color.replace(')', ' / 0.4)') }}
                        >
                          <button
                            onClick={() => completeQuest(quest.id)}
                            className="w-2 h-2 rounded-full hover:ring-2 transition-all mt-2 flex-shrink-0"
                            style={{ background: meta.color, boxShadow: `0 0 0 0px ${meta.color}` }}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-text-primary text-sm sm:text-base">{quest.title}</h3>
                            <p className="text-xs sm:text-sm text-text-muted line-clamp-2">{quest.description}</p>
                            <div className="flex items-center gap-3 mt-1.5 sm:hidden">
                              <div className="flex items-center gap-1 text-xs text-text-muted"><Clock className="h-3 w-3" />{quest.estimatedTime}p</div>
                              <div className="text-xs font-medium" style={{ color: meta.color }}>+{quest.xpReward} XP</div>
                            </div>
                          </div>
                          <div className="hidden sm:flex items-center gap-2 text-sm text-text-muted flex-shrink-0"><Clock className="h-4 w-4" />{quest.estimatedTime}p</div>
                          <div className="hidden sm:block text-sm font-medium flex-shrink-0" style={{ color: meta.color }}>+{quest.xpReward} XP</div>
                        </motion.div>
                      ))}
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="text-center py-8 text-text-muted">
                <Zap className="h-12 w-12 mx-auto mb-3 text-text-disabled" />
                <p>Nincsenek mai küldetések</p>
                <p className="text-sm">Hozz létre egyet a kezdéshez!</p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Daily Tasks by List */}
      {listsWithTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Card className="glass p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading font-semibold text-text-primary">
                Feladatok
              </h2>
              <Button
                size="sm"
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => navigate('/app/lists')}
              >
                Összes lista
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="space-y-5">
              {listsWithTasks.map((list) => (
                <div key={list.id}>
                  {/* List header */}
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: list.color }}
                    />
                    <h3 className="font-medium text-text-primary text-sm">{list.name}</h3>
                    <Badge
                      variant="outline"
                      className="text-xs border-white/15 text-text-muted ml-auto"
                    >
                      {list.completedCount}/{list.tasks.length}
                    </Badge>
                  </div>

                  {/* Progress bar */}
                  {list.tasks.length > 0 && (
                    <div className="w-full bg-surface-2 rounded-full h-1.5 mb-3">
                      <div
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: list.color,
                          width: `${(list.completedCount / list.tasks.length) * 100}%`,
                        }}
                      />
                    </div>
                  )}

                  {/* Tasks */}
                  <div className="space-y-1.5">
                    {list.incompleteTasks.slice(0, 4).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-1/30 hover:bg-surface-1/50 transition-colors group"
                      >
                        <button
                          onClick={() => toggleDashboardTask(list.id, task.id, task.completed, task.shoppingStatus)}
                          className="text-text-muted hover:text-primary transition-colors flex-shrink-0"
                        >
                          <Circle className="h-4 w-4" />
                        </button>
                        <span className="text-sm text-text-primary flex-1 truncate">
                          {task.title}
                        </span>
                        <Badge
                          className={cn(
                            'text-xs',
                            task.priority === 'low' && 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                            task.priority === 'medium' && 'bg-warning/20 text-warning border-warning/30',
                            task.priority === 'high' && 'bg-danger/20 text-danger border-danger/30',
                          )}
                        >
                          {task.priority === 'low' ? 'A' : task.priority === 'medium' ? 'K' : 'M'}
                        </Badge>
                      </div>
                    ))}
                    {list.incompleteTasks.length > 4 && (
                      <button
                        onClick={() => navigate('/app/lists')}
                        className="text-xs text-text-muted hover:text-primary transition-colors pl-10"
                      >
                        +{list.incompleteTasks.length - 4} további feladat...
                      </button>
                    )}
                    {list.incompleteTasks.length === 0 && (
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-success">
                        <Check className="h-4 w-4" />
                        Minden feladat kész!
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="glass p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading font-semibold text-text-primary">
                Közelgő események
              </h2>
              <Button
                size="sm"
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => navigate('/app/calendar')}
              >
                Naptár
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="space-y-2">
              {upcomingEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer",
                    isEventSoon(event.startTime)
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-surface-1/50 hover:bg-surface-1/70"
                  )}
                  onClick={() => navigate('/app/calendar')}
                >
                  <div
                    className="w-1 h-10 rounded-full flex-shrink-0"
                    style={{ backgroundColor: event.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-text-primary text-sm sm:text-base truncate">
                        {event.title}
                      </h3>
                      {isEventSoon(event.startTime) && (
                        <Badge className="text-xs bg-primary/20 text-primary border-primary/30 flex-shrink-0">
                          Hamarosan
                        </Badge>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-xs text-text-muted truncate">{event.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0 text-right">
                    <span className="text-xs font-medium text-text-secondary">
                      {formatEventDate(event.startTime)}
                    </span>
                    <span className="text-xs text-text-muted">
                      {formatEventTime(event.startTime)} – {formatEventTime(event.endTime)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Persona-specific modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentPersona.dashboardModules.slice(0, 6).map((module, index) => {
          // Live widgets for selfdev persona
          if (module === 'habits') {
            return <HabitSummaryWidget key={module} index={index} />;
          }
          if (module === 'reading') {
            return <ReadingSummaryWidget key={module} index={index} />;
          }
          if (module === 'reflection') {
            return <ReflectionSummaryWidget key={module} index={index} />;
          }

          const moduleContent = getPersonaModuleContent(module);

          return (
            <motion.div
              key={module}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
            >
              <Card
                className="glass p-4 hover-lift cursor-pointer"
                onClick={() => navigate(moduleContent.link)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <moduleContent.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-medium text-text-primary">{moduleContent.title}</h3>
                </div>
                <p className="text-text-secondary mb-3">{moduleContent.content}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full text-primary hover:bg-primary/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(moduleContent.link);
                  }}
                >
                  {moduleContent.action}
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* XP Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <Card className="glass p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold text-text-primary">
              Szint előrehaladás
            </h2>
            <div className="text-sm text-text-muted">
              {userStats.xp} / {userStats.xpToNextLevel} XP
            </div>
          </div>

          <Progress
            value={(userStats.xp / userStats.xpToNextLevel) * 100}
            className="h-3 bg-surface-2"
          />

          <div className="flex justify-between mt-2 text-sm text-text-muted">
            <span>Szint {userStats.level}</span>
            <span>Szint {userStats.level + 1}</span>
          </div>
        </Card>
      </motion.div>

    </div>
  );
}

function HabitSummaryWidget({ index }: { index: number }) {
  const navigate = useNavigate();
  const { habitEntries } = useAppStore();
  const habits = useMemo(() => analyzeHabits(habitEntries, 14), [habitEntries]);
  const topHabits = habits.slice(0, 3);
  const activeStreaks = habits.filter((h) => h.currentStreak > 0).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 + index * 0.1 }}
    >
      <Card className="glass p-4 hover-lift cursor-pointer" onClick={() => navigate('/app/habits')}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-medium text-text-primary">Szokás Tracker</h3>
          </div>
          {activeStreaks > 0 && (
            <Badge className="text-xs bg-orange-500/20 text-orange-400 border-orange-500/30">
              <Flame className="h-3 w-3 mr-1" />
              {activeStreaks} aktív
            </Badge>
          )}
        </div>

        {topHabits.length > 0 ? (
          <div className="space-y-2 mb-3">
            {topHabits.map((h) => (
              <div key={h.key} className="flex items-center justify-between text-sm">
                <span className="text-text-secondary truncate pr-2">{h.displayName}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {h.currentStreak > 0 && (
                    <span className="text-xs text-orange-400 flex items-center gap-0.5">
                      <Flame className="h-3 w-3" />{h.currentStreak}
                    </span>
                  )}
                  <span className="text-xs text-text-muted">{h.totalCount}×</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-secondary text-sm mb-3">
            Teljesíts feladatokat, hogy a rendszer felismerje a szokásaid!
          </p>
        )}

        <Button
          size="sm"
          variant="ghost"
          className="w-full text-primary hover:bg-primary/10"
          onClick={(e) => { e.stopPropagation(); navigate('/app/habits'); }}
        >
          Szokások megtekintése
        </Button>
      </Card>
    </motion.div>
  );
}

function ReadingSummaryWidget({ index }: { index: number }) {
  const navigate = useNavigate();
  const { books } = useAppStore();
  const reading = books.filter((b) => b.status === 'reading');
  const completed = books.filter((b) => b.status === 'completed');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 + index * 0.1 }}
    >
      <Card className="glass p-4 hover-lift cursor-pointer" onClick={() => navigate('/app/reading')}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-medium text-text-primary">Olvasási napló</h3>
          </div>
          {completed.length > 0 && (
            <Badge className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              {completed.length} kész
            </Badge>
          )}
        </div>

        {reading.length > 0 ? (
          <div className="space-y-2 mb-3">
            {reading.slice(0, 2).map((b) => {
              const pct = b.totalPages > 0 ? Math.round((b.currentPage / b.totalPages) * 100) : 0;
              return (
                <div key={b.id} className="flex items-center gap-2">
                  <div className="w-3 h-5 rounded-sm flex-shrink-0" style={{ backgroundColor: b.coverColor }} />
                  <span className="text-sm text-text-secondary truncate flex-1">{b.title}</span>
                  <span className="text-xs text-text-muted flex-shrink-0">{pct}%</span>
                </div>
              );
            })}
            {reading.length > 2 && (
              <p className="text-xs text-text-muted">+{reading.length - 2} további könyv</p>
            )}
          </div>
        ) : (
          <p className="text-text-secondary text-sm mb-3">
            {books.length > 0 ? 'Nincs aktívan olvasott könyved.' : 'Adj hozzá könyveket a polcodhoz!'}
          </p>
        )}

        <Button
          size="sm"
          variant="ghost"
          className="w-full text-primary hover:bg-primary/10"
          onClick={(e) => { e.stopPropagation(); navigate('/app/reading'); }}
        >
          Olvasási napló megnyitása
        </Button>
      </Card>
    </motion.div>
  );
}

const MOOD_ICONS: Record<number, { icon: typeof Smile; color: string }> = {
  1: { icon: Frown, color: 'text-red-400' },
  2: { icon: CloudRain, color: 'text-orange-400' },
  3: { icon: Meh, color: 'text-yellow-400' },
  4: { icon: Smile, color: 'text-emerald-400' },
  5: { icon: Sun, color: 'text-amber-300' },
};

function ReflectionSummaryWidget({ index }: { index: number }) {
  const navigate = useNavigate();
  const { journalEntries } = useAppStore();
  const today = getLocalDateString();
  const todaysEntry = journalEntries.find((e) => e.date === today);

  const streak = useMemo(() => {
    const dates = new Set(journalEntries.map((e) => e.date));
    let s = 0;
    const d = new Date();
    while (dates.has(d.toISOString().slice(0, 10))) {
      s++;
      d.setDate(d.getDate() - 1);
    }
    return s;
  }, [journalEntries]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 + index * 0.1 }}
    >
      <Card className="glass p-4 hover-lift cursor-pointer" onClick={() => navigate('/app/reflection')}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <PenLine className="h-4 w-4 text-purple-400" />
            </div>
            <h3 className="font-medium text-text-primary">Napi reflexió</h3>
          </div>
          {streak > 0 && (
            <Badge className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">
              <Flame className="h-3 w-3 mr-1" />
              {streak} nap
            </Badge>
          )}
        </div>

        {todaysEntry ? (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              {(() => {
                const m = MOOD_ICONS[todaysEntry.mood];
                return m ? <m.icon className={cn('h-4 w-4', m.color)} /> : null;
              })()}
              <span className="text-xs text-text-muted">Mai hangulat rögzítve</span>
            </div>
            {(todaysEntry.gratitude || todaysEntry.freeWrite) && (
              <p className="text-sm text-text-secondary italic line-clamp-2">
                "{todaysEntry.gratitude || todaysEntry.freeWrite}"
              </p>
            )}
          </div>
        ) : (
          <div className="mb-3 flex items-start gap-2">
            <Shield className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-text-secondary text-sm">
              Szánj pár percet a mai reflexióra — gondold át napod tanulságait.
            </p>
          </div>
        )}

        <Button
          size="sm"
          variant="ghost"
          className="w-full text-primary hover:bg-primary/10"
          onClick={(e) => { e.stopPropagation(); navigate('/app/reflection'); }}
        >
          {todaysEntry ? 'Reflexió megtekintése' : 'Napló megnyitása'}
        </Button>
      </Card>
    </motion.div>
  );
}
