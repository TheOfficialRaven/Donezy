import type { CalendarEvent } from '@/stores/useAppStore';
import type { DashboardBlock } from './types';
import type { Mission } from '@/lib/missions/types';
import type { ReflectionEntry } from '@/lib/reflection/types';
import type { Book } from '@/lib/reading/types';
import type { Note } from '@/lib/notes/types';
import type { Goal } from '@/lib/goals/types';
import type { Habit } from '@/lib/habits/types';
import { getFocusCandidateItems, getHighPriorityOpenItemsCount, getTotalOpenItems } from '@/lib/lists/selectors';
import type { ListEntity } from '@/lib/lists/types';
import { getHabitsNeedingAttention } from '@/lib/habits/selectors';
import type { HabitCompletion } from '@/lib/habits/types';
import { getGoalsNeedingAttention, getFocusGoalCandidates } from '@/lib/goals/selectors';
import { getMissionFocusCandidates } from '@/lib/missions/selectors';
import type { DashboardBehaviorProfile } from './preferencesAdapter';

export function listToDashboardCandidates(lists: ListEntity[]): DashboardBlock[] {
  const open = getTotalOpenItems(lists);
  const high = getHighPriorityOpenItemsCount(lists);
  const focus = getFocusCandidateItems(lists).slice(0, 2);
  const blocks: DashboardBlock[] = [];
  if (high > 0) {
    blocks.push({
      id: 'lists-attention',
      type: 'attention',
      title: `${high} magas prioritasu listaelem var`,
      subtitle: open > 0 ? `${open} nyitott elem osszesen` : undefined,
      priorityScore: 96,
      sourceModule: 'lists',
      actionable: true,
      actionLabel: 'Listak megnyitasa',
      actionTarget: '/app/lists',
      payload: { open, high },
    });
  }
  for (const item of focus) {
    blocks.push({
      id: `list-focus-${item.itemId}`,
      type: 'focus',
      title: item.itemTitle,
      subtitle: `${item.listTitle} • ${item.priority}`,
      priorityScore: item.priority === 'high' ? 92 : 78,
      sourceModule: 'lists',
      actionable: true,
      actionLabel: 'Lista',
      actionTarget: '/app/lists',
      payload: { item },
    });
  }
  return blocks;
}

export function goalsToDashboardCandidates(goals: Goal[]): DashboardBlock[] {
  const attention = getGoalsNeedingAttention(goals);
  const focus = getFocusGoalCandidates(goals, 2);
  return [
    ...attention.map((goal) => ({
      id: `goal-att-${goal.id}`,
      type: 'attention' as const,
      title: `Figyelmet ker: ${goal.title}`,
      subtitle: 'Erdemes ujrainditani a kovetkezo lepest',
      priorityScore: 88,
      sourceModule: 'goals' as const,
      actionable: true,
      actionLabel: 'Cel megnyitasa',
      actionTarget: '/app/growth',
    })),
    ...focus.map((goal) => ({
      id: `goal-focus-${goal.id}`,
      type: 'focus' as const,
      title: goal.title,
      subtitle: 'Aktiv cel kovetkezo lepessel',
      priorityScore: 84,
      sourceModule: 'goals' as const,
      actionable: true,
      actionLabel: 'Celok',
      actionTarget: '/app/growth',
    })),
  ];
}

export function habitsToDashboardCandidates(habits: Habit[], completions: HabitCompletion[]): DashboardBlock[] {
  const attention = getHabitsNeedingAttention(habits, completions);
  return attention.slice(0, 2).map((habit) => ({
    id: `habit-att-${habit.id}`,
    type: 'habits',
    title: `Szokas figyelmet ker: ${habit.title}`,
    subtitle: 'Kis fenntarto lepes is eleg lehet',
    priorityScore: 66,
    sourceModule: 'habits',
    actionable: true,
    actionLabel: 'Szokasok',
    actionTarget: '/app/habits',
  }));
}

export function calendarToDashboardCandidates(events: CalendarEvent[], now = new Date()): DashboardBlock[] {
  const upcoming = events
    .filter((event) => new Date(event.startTime).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  if (!upcoming.length) return [];
  return [{
    id: 'calendar-today',
    type: 'calendar',
    title: `${upcoming.length} kozelgo esemeny`,
    subtitle: `${new Date(upcoming[0].startTime).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })} • ${upcoming[0].title}`,
    priorityScore: upcoming.length >= 4 ? 94 : 82,
    sourceModule: 'calendar',
    actionable: true,
    actionLabel: 'Naptar',
    actionTarget: '/app/calendar',
    payload: { upcomingCount: upcoming.length },
  }];
}

export function missionsToDashboardCandidates(missions: Mission[]): DashboardBlock[] {
  const focus = getMissionFocusCandidates(missions).slice(0, 3);
  return focus.map((mission, idx) => ({
    id: `mission-focus-${mission.id}`,
    type: 'missions',
    title: mission.title,
    subtitle: `${mission.estimatedMinutes} perc • ${mission.priority}`,
    priorityScore: mission.priority === 'high' ? 46 : mission.estimatedMinutes <= 20 ? 38 : 32,
    sourceModule: 'missions',
    actionable: true,
    actionLabel: 'Kuldetesek',
    actionTarget: '/app/quests',
  }));
}

export function reflectionToDashboardCandidates(entries: ReflectionEntry[]): DashboardBlock[] {
  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = entries.find((entry) => entry.date === today);
  if (todayEntry) {
    return [{
      id: 'reflection-today',
      type: 'reflection',
      title: 'Mai reflexio megvan',
      subtitle: todayEntry.content ? 'Rovid visszatekintes rogzitve' : 'A mai allapot rogzitve',
      priorityScore: 24,
      sourceModule: 'reflection',
      actionable: true,
      actionLabel: 'Reflexio',
      actionTarget: '/app/reflection',
    }];
  }
  return [{
    id: 'reflection-missing',
    type: 'attention',
    title: 'Ma meg nincs reflexio',
    subtitle: '1-2 mondat is eleg a mentalis lezarashoz',
    priorityScore: 36,
    sourceModule: 'reflection',
    actionable: true,
    actionLabel: 'Gyors reflexio',
    actionTarget: '/app/reflection',
  }];
}

export function readingToDashboardCandidates(books: Book[]): DashboardBlock[] {
  const reading = books.filter((book) => book.status === 'reading');
  if (!reading.length) return [];
  const top = reading[0];
  const percent = top.totalPages > 0 ? Math.round((top.currentPage / top.totalPages) * 100) : 0;
  return [{
    id: 'reading-active',
    type: 'reading',
    title: `Olvasas folyamatban: ${top.title}`,
    subtitle: `${percent}% • ${top.currentPage}/${top.totalPages} oldal`,
    priorityScore: 58,
    sourceModule: 'reading',
    actionable: true,
    actionLabel: 'Olvasasi naplo',
    actionTarget: '/app/reading',
  }];
}

export function notesToDashboardCandidates(notes: Note[]): DashboardBlock[] {
  const recent = notes
    .filter((note) => !note.archived)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 1);
  if (!recent.length) return [];
  return [{
    id: 'notes-recent',
    type: 'notes',
    title: 'Legutobbi jegyzet',
    subtitle: recent[0].title || recent[0].preview,
    priorityScore: 30,
    sourceModule: 'notes',
    actionable: true,
    actionLabel: 'Jegyzetek',
    actionTarget: '/app/notes',
  }];
}

export function applyDashboardPreferenceWeights(
  blocks: DashboardBlock[],
  behavior: DashboardBehaviorProfile
): DashboardBlock[] {
  return blocks.map((block) => {
    const baseScore = block.priorityScore || 0;
    const moduleWeight = behavior.weights.moduleWeights[block.sourceModule as keyof typeof behavior.weights.moduleWeights] || 1;
    const weighted = Math.round(baseScore * moduleWeight);
    const missionAdjusted =
      block.sourceModule === 'missions'
        ? Math.max(0, weighted + behavior.weights.missionPriorityOffset)
        : weighted;
    return { ...block, priorityScore: missionAdjusted };
  });
}
