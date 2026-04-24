import { getLocalDateString } from '@/lib/dateUtils';
import { HABIT_ACTIVE_OVERLOAD_THRESHOLD } from './constants';
import { detectHabitCandidates, isPromotableCandidate } from './detection';
import {
  getHabitChartSeries,
  getHabitCompletionTrend,
  getHabitConsistencyIndicators,
  getHabitCurrentStreak,
  getActivityDensitySeries,
  getConsistencySeries,
  getHabitLongestStreak,
  getHabitMonthlyCompletionRate,
  getHabitWeeklyCompletionRate,
} from './stats';
import type {
  Habit,
  HabitActivitySignal,
  HabitCandidate,
  HabitCompletion,
  HabitProductivityMetrics,
  HabitTrackingMode,
  UserFacingHabit,
  UserFacingHabitMetrics,
  HabitsStatusFilter,
  HabitsViewFilter,
  HabitTimeRangeFilter,
} from './types';

export { getHabitCurrentStreak, getHabitLongestStreak, getHabitWeeklyCompletionRate, getHabitMonthlyCompletionRate } from './stats';
export { getHabitCompletionTrend, getHabitConsistencyIndicators, getHabitChartSeries } from './stats';
export { getActivityDensitySeries, getConsistencySeries } from './stats';
export { detectHabitCandidates, isPromotableCandidate } from './detection';

export type HabitsCategoryFilter = 'all' | string;
export type HabitsTrackingModeFilter = 'all' | HabitTrackingMode;

function safeArray<T>(input: T[] | undefined): T[] {
  return Array.isArray(input) ? input : [];
}

export function getActiveHabits(habits?: Habit[]): Habit[] {
  return safeArray(habits).filter((h) => h.active && !h.archived);
}

export function getArchivedHabits(habits?: Habit[]): Habit[] {
  return safeArray(habits).filter((h) => h.archived);
}

export function getAutoTrackedHabits(habits?: Habit[]): Habit[] {
  return safeArray(habits).filter((h) => h.trackingMode === 'auto');
}

export function getManualHabits(habits?: Habit[]): Habit[] {
  return safeArray(habits).filter((h) => h.trackingMode === 'manual');
}

export function getHybridHabits(habits?: Habit[]): Habit[] {
  return safeArray(habits).filter((h) => h.trackingMode === 'hybrid');
}

export function getRecentActivitySignals(signals?: HabitActivitySignal[], days = 14, today = getLocalDateString()): HabitActivitySignal[] {
  const from = new Date(`${today}T12:00:00`);
  from.setDate(from.getDate() - days + 1);
  const fromKey = getLocalDateString(from);
  return safeArray(signals).filter((s) => s.dateKey >= fromKey && s.dateKey <= today);
}

export function getHabitCandidates(signals?: HabitActivitySignal[]): HabitCandidate[] {
  return detectHabitCandidates(signals || []);
}

export function getPromotableHabitCandidates(candidates: HabitCandidate[]): HabitCandidate[] {
  return candidates.filter(isPromotableCandidate);
}

export function getHabitCompletionsForDay(completions: HabitCompletion[] | undefined, dateKey: string): HabitCompletion[] {
  return safeArray(completions).filter((c) => c.completionDateKey === dateKey);
}

export function getHabitCompletionsForRange(completions: HabitCompletion[] | undefined, fromDateKey: string, toDateKey: string): HabitCompletion[] {
  return safeArray(completions).filter((c) => c.completionDateKey >= fromDateKey && c.completionDateKey <= toDateKey);
}

function getHabitsNeedingAttentionInternal(habits: Habit[] | undefined, completions: HabitCompletion[] | undefined): Habit[] {
  const safeHabits = safeArray(habits);
  const safeCompletions = safeArray(completions);
  return safeHabits.filter((habit) => {
    if (!habit.active || habit.archived) return false;
    const own = safeCompletions.filter((c) => c.habitId === habit.id);
    const state = getHabitConsistencyIndicators(habit, own).state;
    return state === 'wobbling' || state === 'neglected';
  });
}

export const getHabitsNeedingAttention = (habits: Habit[] | undefined, completions: HabitCompletion[] | undefined): Habit[] =>
  getHabitsNeedingAttentionInternal(habits, completions);

export function getHabitMaintenanceCandidates(habits: Habit[] | undefined, completions: HabitCompletion[] | undefined): Habit[] {
  const safeHabits = safeArray(habits);
  const safeCompletions = safeArray(completions);
  return safeHabits.filter((habit) => {
    if (habit.archived || !habit.active) return false;
    const own = safeCompletions.filter((c) => c.habitId === habit.id);
    const weekly = getHabitWeeklyCompletionRate(habit, own);
    return weekly >= 50 && weekly <= 95;
  });
}

export function getHabitsForToday(habits: Habit[] | undefined, completions: HabitCompletion[] | undefined, today = getLocalDateString()): Habit[] {
  const safeHabits = safeArray(habits);
  const safeCompletions = safeArray(completions);
  return safeHabits.filter((habit) => {
    if (!habit.active || habit.archived) return false;
    const ownToday = safeCompletions.some((c) => c.habitId === habit.id && c.completionDateKey === today);
    if (ownToday) return true;
    if (habit.frequencyType === 'daily') return true;
    if (habit.frequencyType === 'weekly') {
      if (habit.preferredDays.length === 0) return true;
      const day = new Date(`${today}T12:00:00`).getDay() || 7;
      return habit.preferredDays.includes(day);
    }
    return true;
  });
}

export function getHabitsForCurrentWeek(habits: Habit[] | undefined, completions: HabitCompletion[] | undefined, today = getLocalDateString()) {
  const safeHabits = safeArray(habits);
  const safeCompletions = safeArray(completions);
  const base = new Date(`${today}T12:00:00`);
  const monday = new Date(base);
  monday.setDate(monday.getDate() - ((monday.getDay() || 7) - 1));
  const from = getLocalDateString(monday);
  return safeHabits.map((habit) => {
    const own = safeCompletions.filter((c) => c.habitId === habit.id && c.completionDateKey >= from && c.completionDateKey <= today);
    return { habit, completions: own, weeklyRate: getHabitWeeklyCompletionRate(habit, own) };
  });
}

export function getHabitsProductivityMetrics(
  habits: Habit[] | undefined,
  completions: HabitCompletion[] | undefined,
  candidates: HabitCandidate[] | undefined,
  today = getLocalDateString()
): HabitProductivityMetrics {
  const safeHabits = safeArray(habits);
  const safeCompletions = safeArray(completions);
  const safeCandidates = safeArray(candidates);
  const activeHabits = getActiveHabits(safeHabits);
  const todayCompletions = safeCompletions.filter((c) => c.completionDateKey === today).length;
  const weeklyRates = activeHabits.map((habit) => getHabitWeeklyCompletionRate(habit, safeCompletions.filter((c) => c.habitId === habit.id)));
  const weeklyCompletionRate = weeklyRates.length ? Math.round(weeklyRates.reduce((a, b) => a + b, 0) / weeklyRates.length) : 0;
  const needing = getHabitsNeedingAttention(safeHabits, safeCompletions).length;
  return {
    totalHabits: safeHabits.length,
    activeHabits: activeHabits.length,
    archivedHabits: getArchivedHabits(safeHabits).length,
    autoTrackedHabits: getAutoTrackedHabits(safeHabits).length,
    manualHabits: getManualHabits(safeHabits).length,
    hybridHabits: getHybridHabits(safeHabits).length,
    todayCompletions,
    weeklyCompletionRate,
    habitsNeedingAttention: needing,
    candidateCount: safeCandidates.length,
    promotableCandidateCount: getPromotableHabitCandidates(safeCandidates).length,
    overloadedActiveHabits: activeHabits.length >= HABIT_ACTIVE_OVERLOAD_THRESHOLD,
  };
}

export function filterHabitsForView(
  habits: Habit[] | undefined,
  view: HabitsViewFilter,
  options?: {
    search?: string;
    categoryFilter?: HabitsCategoryFilter;
    statusFilter?: HabitsStatusFilter;
    trackingModeFilter?: HabitsTrackingModeFilter;
    completions?: HabitCompletion[];
    today?: string;
  }
): Habit[] {
  const { search, categoryFilter, statusFilter, trackingModeFilter, completions = [], today = getLocalDateString() } = options || {};

  /** Trends nézetben nincs kártyalista — csak grafikonok és összesítő analitika. */
  if (view === 'trends') return [];

  let out = safeArray(habits).slice();
  if (view === 'active') out = out.filter((h) => h.active && !h.archived);
  if (view === 'archived') out = out.filter((h) => h.archived);
  if (view === 'today') out = getHabitsForToday(out, completions, today);
  if (view === 'auto') out = out.filter((h) => h.trackingMode === 'auto');
  if (view === 'manual') out = out.filter((h) => h.trackingMode === 'manual');
  if (view === 'hybrid') out = out.filter((h) => h.trackingMode === 'hybrid');

  if (statusFilter && statusFilter !== 'all') {
    out = out.filter((h) => {
      if (statusFilter === 'archived') return h.archived;
      if (statusFilter === 'active') return h.active && !h.archived;
      if (statusFilter === 'inactive') return !h.active && !h.archived;
      if (statusFilter === 'paused') return !h.active && !h.archived;
      return true;
    });
  }

  if (trackingModeFilter && trackingModeFilter !== 'all') out = out.filter((h) => h.trackingMode === trackingModeFilter);
  if (categoryFilter && categoryFilter !== 'all') out = out.filter((h) => h.category === categoryFilter);

  const q = (search || '').trim().toLowerCase();
  if (q) {
    out = out.filter((h) =>
      h.title.toLowerCase().includes(q) ||
      h.description.toLowerCase().includes(q) ||
      h.category.toLowerCase().includes(q) ||
      h.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return out;
}

export function getHabitChartSeriesBundle(
  habits: Habit[],
  completions: HabitCompletion[],
  signals: HabitActivitySignal[],
  range: HabitTimeRangeFilter
) {
  const byHabit = habits.map((habit) => ({
    habitId: habit.id,
    title: habit.title,
    completionSeries: getHabitChartSeries(habit, completions.filter((c) => c.habitId === habit.id), range),
  }));

  const days = range === '7d' ? 7 : range === '14d' ? 14 : range === '30d' ? 30 : 90;
  const from = new Date();
  from.setDate(from.getDate() - days + 1);
  const fromKey = getLocalDateString(from);
  const map = new Map<string, number>();
  for (const signal of signals) {
    if (signal.dateKey < fromKey) continue;
    map.set(signal.dateKey, (map.get(signal.dateKey) || 0) + 1);
  }
  const signalSeries = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([dateKey, count]) => ({ dateKey, count }));

  return { byHabit, signalSeries };
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalToken(token: string): string {
  const raw = normalizeText(token);
  if (!raw) return '';
  const synonymMap: Record<string, string> = {
    takarit: 'takaritas',
    takaritas: 'takaritas',
    takaritasi: 'takaritas',
    mosogat: 'mosogatas',
    mosogatas: 'mosogatas',
    mosas: 'mosas',
    porszivo: 'porszivozas',
    porszivozas: 'porszivozas',
    rendrakas: 'rendrakas',
    mozgas: 'mozgas',
    sport: 'mozgas',
    edzes: 'mozgas',
    seta: 'mozgas',
    futas: 'mozgas',
    olvas: 'olvasas',
    olvasas: 'olvasas',
    jegyzet: 'jegyzeteles',
    jegyzeteles: 'jegyzeteles',
    reflekcio: 'reflexio',
    reflexio: 'reflexio',
    tervezes: 'tervezes',
    terv: 'tervezes',
    bevasarlas: 'bevasarlas',
    bevasar: 'bevasarlas',
    bolt: 'bevasarlas',
  };
  if (synonymMap[raw]) return synonymMap[raw];

  const suffixes = ['ok', 'ek', 'ak', 'as', 'es', 'os', 'ot', 'et', 'at', 'ban', 'ben', 'val', 'vel', 'ra', 're', 'ba', 'be'];
  for (const suffix of suffixes) {
    if (raw.length > suffix.length + 3 && raw.endsWith(suffix)) {
      const stem = raw.slice(0, -suffix.length);
      if (synonymMap[stem]) return synonymMap[stem];
      return stem;
    }
  }
  return raw;
}

function normalizedTitleTokens(value: string): string[] {
  const stopWords = new Set([
    'uj',
    'new',
    'rutin',
    'routine',
    'habit',
    'szokas',
    'daily',
    'napi',
    'heti',
    'weekly',
    'the',
    'a',
    'az',
    'egy',
    'mai',
  ]);
  return normalizeText(value)
    .split(' ')
    .map((token) => canonicalToken(token))
    .filter((token) => token.length > 2 && !stopWords.has(token));
}

function titleKey(value: string): string {
  return normalizedTitleTokens(value).sort().join(' ');
}

function toDisplayTitle(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function cleanHabitText(value: string): string {
  if (!value) return '';
  let out = value.trim();
  out = out.replace(/legacy/gi, '');
  out = out.replace(/auto-?tracked/gi, '');
  out = out.replace(/migr[a-z]*/gi, '');
  out = out.replace(/korabbi aktivitasokbol?/gi, '');
  out = out.replace(/\s+/g, ' ').trim();
  return out;
}

function jaccardSimilarity(a: string, b: string): number {
  const aSet = new Set(a.split(' ').filter(Boolean));
  const bSet = new Set(b.split(' ').filter(Boolean));
  if (aSet.size === 0 || bSet.size === 0) return 0;
  let intersection = 0;
  for (const token of aSet) {
    if (bSet.has(token)) intersection += 1;
  }
  const union = aSet.size + bSet.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function areTitleKeysSimilar(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  return jaccardSimilarity(a, b) >= 0.67;
}

function dominantSemanticGroupKey(groupHabits: Habit[]): string {
  const counts = new Map<string, number>();
  for (const habit of groupHabits) {
    const key = getHabitGroupKey(habit);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const ordered = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return ordered[0]?.[0] || 'general-routine';
}

export function getHabitGroupKeyFromSignalEventType(eventType?: string): string {
  const e = normalizeText(eventType || '');
  if (e.includes('reflection')) return 'reflection';
  if (e.includes('reading') || e.includes('quote')) return 'reading';
  if (e.includes('note')) return 'thought-capture';
  if (e.includes('list_item') || e.includes('task')) return 'task-follow-through';
  if (e.includes('goal')) return 'goal-progress';
  if (e.includes('calendar')) return 'schedule-consistency';
  return 'general-routine';
}

export function getHabitGroupKey(habit: Habit): string {
  const title = normalizeText(habit.title);
  const category = normalizeText(habit.category || '');
  const events = (habit.sourceEventTypes || []).map((e) => getHabitGroupKeyFromSignalEventType(e));
  const fromEvent = events[0];
  if (fromEvent) return fromEvent;
  if (title.includes('reflex') || category.includes('tudat')) return 'reflection';
  if (title.includes('olvas') || title.includes('read')) return 'reading';
  if (title.includes('note') || title.includes('jegyzet') || title.includes('idea')) return 'thought-capture';
  if (title.includes('task') || title.includes('feladat') || category.includes('munka')) return 'task-follow-through';
  if (title.includes('goal') || title.includes('cel')) return 'goal-progress';
  if (
    title.includes('schedule') ||
    title.includes('naptar') ||
    title.includes('idobeoszt') ||
    title.includes('blok') ||
    title.includes('ritmus')
  ) {
    return 'schedule-consistency';
  }
  return 'general-routine';
}

function friendlyGroupMeta(groupKey: string): { title: string; description: string } {
  switch (groupKey) {
    case 'reflection':
      return { title: 'Napi reflexio', description: 'Rendszeresen visszanezel a napodra es levonod a tanulsagokat.' };
    case 'reading':
      return { title: 'Olvasasi rutin', description: 'Az olvasas egyre stabilabban visszatero szokassa valik.' };
    case 'thought-capture':
      return { title: 'Gondolatrogzites', description: 'Gyakran lemented az otleteidet es fontos gondolataidat.' };
    case 'task-follow-through':
      return { title: 'Feladatvegigvitel', description: 'A vallalt feladatokat jo ritmusban viszed vegig.' };
    case 'goal-progress':
      return { title: 'Celhaladas', description: 'A fontos celok fele kovetkezetesen haladsz.' };
    case 'schedule-consistency':
      return { title: 'Napi ritmus', description: 'Egyre jobban latszik az idobeosztasi rutinod.' };
    default:
      return { title: 'Visszatero rutin', description: 'Egy uj, rendszeresen visszatero minta kezd kialakulni.' };
  }
}

function deriveHumanTitleAndDescription(groupHabits: Habit[], fallback: { title: string; description: string }) {
  const candidateTitles = groupHabits
    .map((habit) => cleanHabitText(habit.title))
    .filter((title) => {
      const n = normalizeText(title);
      return n.length >= 3 && !n.includes('uj blokk') && !n.includes('daily routine') && !n.includes('schedule rhythm');
    });
  const candidateDescriptions = groupHabits
    .map((habit) => cleanHabitText(habit.description || ''))
    .filter((desc) => {
      const n = normalizeText(desc);
      return n.length >= 12 && !n.includes('legacy') && !n.includes('auto-tracked');
    });

  const bestTitleRaw = candidateTitles[0];
  const bestTitle = bestTitleRaw ? toDisplayTitle(bestTitleRaw) : fallback.title;
  const bestDescription = candidateDescriptions[0] || fallback.description;
  return { title: bestTitle, description: bestDescription };
}

export function getGroupedHabits(habits: Habit[] | undefined, completions: HabitCompletion[] | undefined): UserFacingHabit[] {
  const safeHabits = getActiveHabits(habits);
  const safeCompletions = safeArray(completions);
  const grouped = new Map<string, Habit[]>();
  const existingTitleKeys: string[] = [];
  for (const habit of safeHabits) {
    const semanticKey = getHabitGroupKey(habit);
    const mergedTitleKey = titleKey(cleanHabitText(habit.title));
    let key: string;

    if (mergedTitleKey) {
      const similarExisting = existingTitleKeys.find((existing) => areTitleKeysSimilar(existing, mergedTitleKey));
      const chosenTitleKey = similarExisting || mergedTitleKey;
      key = `title:${chosenTitleKey}`;
      if (!similarExisting) existingTitleKeys.push(chosenTitleKey);
    } else {
      key = `semantic:${semanticKey}`;
    }

    grouped.set(key, [...(grouped.get(key) || []), habit]);
  }

  const rows: UserFacingHabit[] = [];
  for (const [groupKey, groupHabits] of grouped.entries()) {
    const semanticGroupKey = dominantSemanticGroupKey(groupHabits);
    const relatedCompletions = safeCompletions.filter((completion) => groupHabits.some((habit) => habit.id === completion.habitId));
    const latestHabit = groupHabits.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    const weeklyRates = groupHabits.map((habit) =>
      getHabitWeeklyCompletionRate(habit, relatedCompletions.filter((completion) => completion.habitId === habit.id))
    );
    const streaks = groupHabits.map((habit) =>
      getHabitCurrentStreak(habit, relatedCompletions.filter((completion) => completion.habitId === habit.id))
    );
    const mergedState =
      groupHabits.some((habit) => getHabitConsistencyIndicators(habit, relatedCompletions.filter((completion) => completion.habitId === habit.id)).state === 'neglected')
        ? 'neglected'
        : groupHabits.some((habit) => getHabitConsistencyIndicators(habit, relatedCompletions.filter((completion) => completion.habitId === habit.id)).state === 'wobbling')
          ? 'wobbling'
          : 'on-track';
    const meta = friendlyGroupMeta(semanticGroupKey);
    const human = deriveHumanTitleAndDescription(groupHabits, meta);
    const lastActivityDateKey = relatedCompletions.slice().sort((a, b) => b.completionDateKey.localeCompare(a.completionDateKey))[0]?.completionDateKey;
    const weeklyRate = weeklyRates.length ? Math.round(weeklyRates.reduce((a, b) => a + b, 0) / weeklyRates.length) : 0;
    const streak = streaks.length ? Math.max(...streaks) : 0;
    const signalStrength = Math.min(100, Math.round(weeklyRate * 0.75 + Math.min(12, streak) * 2));
    let insightStatus: UserFacingHabit['insightStatus'] = 'stable';
    if (mergedState === 'neglected') insightStatus = 'needs-attention';
    else if (mergedState === 'wobbling') insightStatus = weeklyRate >= 45 ? 'strengthening' : 'needs-attention';
    else if (weeklyRate < 35) insightStatus = 'emerging';
    else if (weeklyRate < 70) insightStatus = 'strengthening';

    const trendLabel =
      insightStatus === 'stable'
        ? 'Stabilan visszater az elmultipari napokban.'
        : insightStatus === 'strengthening'
          ? 'Jo iranyban alakul, egyre rendszeresebb.'
          : insightStatus === 'emerging'
            ? 'Formolodik, de meg nem allt ossze teljesen.'
            : 'Most gyengult, erdemes ujra visszahozni.';
    const insight =
      insightStatus === 'stable'
        ? 'Megeri tartani ezt a ritmust.'
        : insightStatus === 'strengthening'
          ? 'Egy kis tudatos figyelem stabil szokassa teheti.'
          : insightStatus === 'emerging'
            ? 'Nezd meg, melyik napszakban a legkonnyebb inditani.'
            : 'Egy mini visszateres ma ujra lenduletet adhat.';
    rows.push({
      groupKey: semanticGroupKey,
      title: human.title,
      description: human.description || latestHabit?.description || meta.description,
      trendLabel,
      insight,
      streak,
      weeklyRate,
      lastActivityDateKey,
      state: mergedState,
      insightStatus,
      signalStrength,
      sourceHabitIds: groupHabits.map((habit) => habit.id),
    });
  }
  return rows.sort((a, b) => b.signalStrength - a.signalStrength || b.weeklyRate - a.weeklyRate || b.streak - a.streak);
}

export function getPrimaryHabits(grouped: UserFacingHabit[]): UserFacingHabit[] {
  return grouped.filter((habit) => habit.insightStatus === 'stable' || habit.insightStatus === 'strengthening').slice(0, 4);
}

export function getSecondaryHabits(grouped: UserFacingHabit[]): UserFacingHabit[] {
  return grouped.filter((habit) => habit.insightStatus === 'emerging').slice(0, 6);
}

export function getAttentionHabits(grouped: UserFacingHabit[]): UserFacingHabit[] {
  return grouped.filter((habit) => habit.insightStatus === 'needs-attention').slice(0, 3);
}

export function getStableHabits(grouped: UserFacingHabit[]): UserFacingHabit[] {
  return grouped.filter((habit) => habit.insightStatus === 'stable');
}

export function getEmergingHabits(grouped: UserFacingHabit[]): UserFacingHabit[] {
  return grouped.filter((habit) => habit.insightStatus === 'emerging');
}

export function getUserFacingHabitsNeedingAttention(grouped: UserFacingHabit[]): UserFacingHabit[] {
  return grouped.filter((habit) => habit.insightStatus === 'needs-attention');
}

export function getStrengtheningHabits(grouped: UserFacingHabit[]): UserFacingHabit[] {
  return grouped.filter((habit) => habit.insightStatus === 'strengthening');
}

export function getMergedHabitRepresentations(habits: Habit[] | undefined, completions: HabitCompletion[] | undefined): UserFacingHabit[] {
  return getGroupedHabits(habits, completions);
}

export function getHabitOverviewMetrics(grouped: UserFacingHabit[]): UserFacingHabitMetrics {
  return {
    groupedCount: grouped.length,
    stableCount: getStableHabits(grouped).length,
    strengtheningCount: getStrengtheningHabits(grouped).length,
    needsAttentionCount: getUserFacingHabitsNeedingAttention(grouped).length,
    emergingCount: getEmergingHabits(grouped).length,
  };
}

export function getPrimaryHabitInsights(grouped: UserFacingHabit[]) {
  return {
    stable: getStableHabits(grouped).slice(0, 3),
    strengthening: getStrengtheningHabits(grouped).slice(0, 3),
    needsAttention: getUserFacingHabitsNeedingAttention(grouped).slice(0, 3),
    emerging: getEmergingHabits(grouped).slice(0, 3),
  };
}

export function getHabitNarrativeSummary(grouped: UserFacingHabit[]): string {
  if (grouped.length === 0) {
    return 'Meg nincs eleg ismetlodo aktivitas ahhoz, hogy biztos rutinmintakat mutassunk.';
  }
  const metrics = getHabitOverviewMetrics(grouped);
  if (metrics.needsAttentionCount === 0 && metrics.strengtheningCount === 0) {
    return `${metrics.stableCount} stabil rutin latszik, jo ritmust tartasz.`;
  }
  return `${metrics.stableCount} stabil, ${metrics.strengtheningCount} erosodo es ${metrics.needsAttentionCount} figyelmet kero rutinmintat latunk.`;
}

export function getFriendlyHabitSummary(grouped: UserFacingHabit[]): string {
  return getHabitNarrativeSummary(grouped);
}

export function getHabitClusterChartSeries(grouped: UserFacingHabit[]) {
  return grouped.map((habit) => ({
    key: habit.groupKey,
    label: habit.title,
    weeklyRate: habit.weeklyRate,
    streak: habit.streak,
  }));
}

export function getUserFacingHabitMetrics(grouped: UserFacingHabit[]): UserFacingHabitMetrics {
  return getHabitOverviewMetrics(grouped);
}
