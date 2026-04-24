import { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, CheckCircle2, Clock3, Lightbulb, Plus, Target, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';
import {
  listToDashboardCandidates,
  goalsToDashboardCandidates,
  habitsToDashboardCandidates,
  calendarToDashboardCandidates,
  missionsToDashboardCandidates,
  reflectionToDashboardCandidates,
  readingToDashboardCandidates,
  notesToDashboardCandidates,
  getDashboardLayoutFromBehavior,
  getDashboardQuickActions,
  getDashboardLoadIndicator,
  getDashboardTodaySummary,
  getDashboardMissionSupportBlocks,
  buildDashboardLoadInput,
  deriveCountsForLoad,
  preferencesToDashboardBehavior,
  applyDashboardPreferenceWeights,
  applyTargetGroupToDashboardBehavior,
  getTargetGroupAdjustedBlocks,
  getTargetGroupLabels,
  shouldShowTargetGroupSecondaryModule,
  type DashboardBlock,
} from '@/lib/dashboard';
import { applyDayModeToDashboardBehavior } from '@/lib/dayModes/adapters';
import { getDayModeSummary, getEffectiveDayModeWithSuggestion, shouldShowDayModeSuggestion } from '@/lib/dayModes/selectors';
import { DayModeSwitcher } from '@/components/dashboard/DayModeSwitcher';
import { getHabitsNeedingAttention } from '@/lib/habits/selectors';
import { getReflectionMoodTrend } from '@/lib/reflection/selectors';
import { getMissionProductivityMetrics } from '@/lib/missions/selectors';
import { getLocalDateString } from '@/lib/dateUtils';
import { getOverdueItemsCount, getHighPriorityOpenItemsCount } from '@/lib/lists/selectors';
import { getGoalsNeedingAttention } from '@/lib/goals/selectors';
import { getCaptureProductivityMetrics } from '@/lib/capture/selectors';
import { getDashboardRoutingHints } from '@/lib/routing';
import RoutingCandidatePanel from '@/components/routing/RoutingCandidatePanel';
import RoutingReviewPanel from '@/components/routing/RoutingReviewPanel';
import {
  getDailyGuidanceProfile,
  getGuidanceAttentionItems,
  getGuidanceMaintenanceItem,
  getGuidanceNarrativeSummary,
  getGuidanceQuickActions,
  getGuidanceQuickWin,
  getGuidanceSupportiveInsights,
  getGuidanceTopFocusItems,
  normalizeGuidanceInputs,
} from '@/lib/guidance';
import { getTargetGroupGuidanceProfile } from '@/lib/guidance/targetGroupAdapter';

export default function Dashboard() {
  const {
    lists,
    events,
    growthGoals,
    habits,
    habitCompletions,
    missions,
    reflections,
    books,
    readingEntries,
    notes,
    quickCaptureItems,
    routingCandidates,
    routingReviewFilter,
    routingPanelOpen,
    onboardingResultProfile,
    userStats,
    userPreferences,
    currentDayMode,
    dayModeOverride,
    dayModeAutoSuggestion,
    setDayMode,
    refreshDayModeSuggestion,
    acceptSuggestedDayMode,
    dismissDayModeSuggestion,
    generateRoutingCandidates,
    acceptRoutingCandidate,
    dismissRoutingCandidate,
    setRoutingReviewFilter,
    setRoutingPanelOpen,
  } = useAppStore();
  const navigate = useNavigate();
  const today = getLocalDateString();
  const habitAttention = useMemo(() => getHabitsNeedingAttention(habits, habitCompletions).length, [habits, habitCompletions]);
  const moodTrend = useMemo(() => getReflectionMoodTrend(reflections, 7), [reflections]);
  const moodLabel = moodTrend.length ? `Atlag hangulat: ${(moodTrend.reduce((s, m) => s + m.mood, 0) / moodTrend.length).toFixed(1)}` : 'Nincs eleg hangulat adat';
  const missionMetrics = useMemo(() => getMissionProductivityMetrics(missions), [missions]);
  const overdueItemsCount = useMemo(() => getOverdueItemsCount(lists as any), [lists]);
  const highPriorityOpenItemsCount = useMemo(() => getHighPriorityOpenItemsCount(lists as any), [lists]);
  const goalsAttentionCount = useMemo(() => getGoalsNeedingAttention(growthGoals as any).length, [growthGoals]);
  const captureMetrics = useMemo(() => getCaptureProductivityMetrics(quickCaptureItems as any), [quickCaptureItems]);
  const routingHints = useMemo(() => getDashboardRoutingHints(routingCandidates || []), [routingCandidates]);
  const activeDayMode = useMemo(
    () =>
      getEffectiveDayModeWithSuggestion({
        currentDayMode,
        dayModeOverride,
        suggestion: dayModeAutoSuggestion,
      }).key,
    [currentDayMode, dayModeOverride, dayModeAutoSuggestion]
  );
  const showSuggestion = useMemo(
    () => shouldShowDayModeSuggestion(dayModeAutoSuggestion) && dayModeAutoSuggestion?.suggestedMode !== activeDayMode,
    [dayModeAutoSuggestion, activeDayMode]
  );
  const dayModeSummary = useMemo(() => getDayModeSummary(activeDayMode), [activeDayMode]);
  const targetGroupLabels = useMemo(() => getTargetGroupLabels(userPreferences.targetGroup), [userPreferences.targetGroup]);
  const baseBehavior = useMemo(() => preferencesToDashboardBehavior(userPreferences), [userPreferences]);
  const dayModeBehavior = useMemo(() => applyDayModeToDashboardBehavior(baseBehavior, activeDayMode), [baseBehavior, activeDayMode]);
  const behavior = useMemo(
    () => applyTargetGroupToDashboardBehavior(dayModeBehavior, userPreferences.targetGroup),
    [dayModeBehavior, userPreferences.targetGroup]
  );

  const blocks = useMemo(() => {
    const listBlocks = listToDashboardCandidates(lists as any);
    const goalBlocks = goalsToDashboardCandidates(growthGoals as any);
    const habitBlocks = habitsToDashboardCandidates(habits as any, habitCompletions as any);
    const calendarBlocks = calendarToDashboardCandidates(events as any);
    const missionBlocks = missionsToDashboardCandidates(missions as any);
    const reflectionBlocks = reflectionToDashboardCandidates(reflections as any);
    const readingBlocks = readingToDashboardCandidates(books as any);
    const noteBlocks = notesToDashboardCandidates(notes as any);
    return [...listBlocks, ...goalBlocks, ...habitBlocks, ...calendarBlocks, ...missionBlocks, ...reflectionBlocks, ...readingBlocks, ...noteBlocks];
  }, [lists, growthGoals, habits, habitCompletions, events, missions, reflections, books, notes]);

  const loadCounts = useMemo(() => deriveCountsForLoad({ lists: lists as any, events: events as any, goals: growthGoals as any, missions: missions as any, habits: habits as any }), [lists, events, growthGoals, missions, habits]);
  const loadInput = useMemo(() => buildDashboardLoadInput({ ...loadCounts, attentionBlocksCount: blocks.filter((b) => b.type === 'attention').length }), [loadCounts, blocks]);
  const loadIndicator = useMemo(() => getDashboardLoadIndicator(loadInput), [loadInput]);
  const tunedBlocks = useMemo(() => applyDashboardPreferenceWeights(blocks, behavior), [blocks, behavior]);
  const targetGroupAdjustedBlocks = useMemo(
    () => getTargetGroupAdjustedBlocks(tunedBlocks, userPreferences.targetGroup),
    [tunedBlocks, userPreferences.targetGroup]
  );
  const layout = useMemo(
    () => getDashboardLayoutFromBehavior(targetGroupAdjustedBlocks, loadInput, behavior),
    [targetGroupAdjustedBlocks, loadInput, behavior]
  );
  const missionSupportBlocks = useMemo(() => getDashboardMissionSupportBlocks(tunedBlocks), [tunedBlocks]);
  const nonMissionSecondary = useMemo(
    () => layout.secondary.filter((block) => block.sourceModule !== 'missions'),
    [layout.secondary]
  );
  const dedupedSections = useMemo(() => {
    const used = new Set<string>();
    const takeUnique = (input: DashboardBlock[], limit?: number) => {
      const out: DashboardBlock[] = [];
      for (const block of input) {
        const key = getDashboardBlockEntityKey(block);
        if (used.has(key)) continue;
        used.add(key);
        out.push(block);
        if (limit && out.length >= limit) break;
      }
      return out;
    };

    const priorities = takeUnique(layout.focus, behavior.layout.focusLimit);
    const loadOverview = takeUnique(
      nonMissionSecondary
        .filter((block) => block.sourceModule === 'calendar' || block.sourceModule === 'lists')
        .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0)),
      behavior.layout.focusLimit
    );
    const nextBest = takeUnique(
      [...layout.focus, ...nonMissionSecondary]
        .filter((block) => ['lists', 'goals', 'habits'].includes(block.sourceModule))
        .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0)),
      behavior.layout.focusLimit
    );
    const attention = takeUnique(layout.attention, behavior.layout.attentionLimit);
    const visibilityFilteredSecondary = nonMissionSecondary.filter((block) => {
      if (!shouldShowTargetGroupSecondaryModule(block.sourceModule, userPreferences.targetGroup)) return false;
      if (block.sourceModule === 'reading' && behavior.weights.moduleWeights.reading < 0.9) return false;
      if (block.sourceModule === 'reflection' && behavior.weights.moduleWeights.reflection < 0.9) return false;
      if (block.sourceModule === 'notes' && behavior.weights.moduleWeights.notes < 0.9) return false;
      return true;
    });
    const secondary = takeUnique(
      visibilityFilteredSecondary.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0)),
      behavior.layout.secondaryLimit
    );
    const missions = takeUnique(
      missionSupportBlocks,
      behavior.layout.missionLimit
    );
    return { priorities, loadOverview, nextBest, attention, secondary, missions };
  }, [
    layout.focus,
    layout.attention,
    nonMissionSecondary,
    missionSupportBlocks,
    behavior,
    userPreferences.targetGroup,
  ]);
  const todaySummary = useMemo(
    () =>
      getDashboardTodaySummary({
        openTasks: loadCounts.listsOpenItems,
        activeMissions: missionMetrics.activeMissions,
        upcomingEvents: loadCounts.eventsCount,
        habitsAttention: habitAttention,
        moodLabel,
      }),
    [loadCounts, missionMetrics.activeMissions, habitAttention, moodLabel]
  );

  useEffect(() => {
    refreshDayModeSuggestion();
  }, [refreshDayModeSuggestion, lists, events, growthGoals, habits, habitCompletions, missions, userPreferences]);
  useEffect(() => {
    void generateRoutingCandidates();
  }, [generateRoutingCandidates, quickCaptureItems, notes, growthGoals, reflections, readingEntries, lists, habits, events]);

  const guidanceProfile = useMemo(() => {
    const input = normalizeGuidanceInputs({
      date: today,
      targetGroup: userPreferences.targetGroup,
      effectiveDayMode: activeDayMode,
      effectiveTone: userPreferences.preferredTone,
      loadIndicator,
      blocks: targetGroupAdjustedBlocks,
      signals: {
        openTasksCount: loadCounts.listsOpenItems,
        overdueItemsCount,
        highPriorityOpenItemsCount,
        todayEventsCount: events.filter((event) => event.date === today).length,
        upcomingEventsCount: loadCounts.eventsCount,
        goalsNeedingAttentionCount: goalsAttentionCount,
        habitsNeedingAttentionCount: habitAttention,
        missionActiveCount: missionMetrics.activeMissions,
        quickCaptureUnprocessedCount: captureMetrics.unprocessed,
        readingActiveCount: books.filter((book) => book.status === 'reading').length,
        reflectionMissingToday: !reflections.some((entry) => entry.dateKey === today),
        routingPendingCount: routingCandidates.filter((candidate) => candidate.status === 'pending').length,
        routingHighConfidenceCount: routingCandidates.filter(
          (candidate) => candidate.status === 'pending' && (candidate.confidence || 0) >= 0.8
        ).length,
      },
      preferences: {
        dashboardDensity: userPreferences.dashboardDensity,
        overloadProtection: userPreferences.overloadProtection,
        missionVisibility: userPreferences.missionVisibility,
        defaultTimeHorizon: userPreferences.defaultTimeHorizon,
        notesInboxBehavior: userPreferences.notesInboxBehavior,
      },
    });
    return getDailyGuidanceProfile(input);
  }, [
    today,
    userPreferences,
    activeDayMode,
    loadIndicator,
    targetGroupAdjustedBlocks,
    loadCounts.listsOpenItems,
    overdueItemsCount,
    highPriorityOpenItemsCount,
    events,
    loadCounts.eventsCount,
    goalsAttentionCount,
    habitAttention,
    missionMetrics.activeMissions,
    captureMetrics.unprocessed,
    routingCandidates,
    books,
    reflections,
  ]);

  const guidanceTopFocus = useMemo(() => getGuidanceTopFocusItems(guidanceProfile), [guidanceProfile]);
  const guidanceQuickWin = useMemo(() => getGuidanceQuickWin(guidanceProfile), [guidanceProfile]);
  const guidanceMaintenance = useMemo(() => getGuidanceMaintenanceItem(guidanceProfile), [guidanceProfile]);
  const guidanceAttention = useMemo(() => getGuidanceAttentionItems(guidanceProfile), [guidanceProfile]);
  const guidanceInsights = useMemo(() => getGuidanceSupportiveInsights(guidanceProfile), [guidanceProfile]);
  const guidanceSummary = useMemo(() => getGuidanceNarrativeSummary(guidanceProfile), [guidanceProfile]);
  const guidanceQuickActionIds = useMemo(() => getGuidanceQuickActions(guidanceProfile), [guidanceProfile]);
  const guidanceTargetProfile = useMemo(() => getTargetGroupGuidanceProfile(userPreferences.targetGroup), [userPreferences.targetGroup]);
  const quickActions = useMemo(
    () =>
      getDashboardQuickActions(
        userPreferences,
        activeDayMode,
        userPreferences.targetGroup,
        guidanceQuickActionIds,
        onboardingResultProfile?.suggestedQuickActionsProfile
      ),
    [userPreferences, activeDayMode, guidanceQuickActionIds, onboardingResultProfile]
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <h1 className="text-3xl font-heading font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary">
          {guidanceSummary || behavior.tone.intro}
        </p>
      </motion.div>

      <DayModeSwitcher
        currentMode={activeDayMode}
        onChange={(mode) => setDayMode(mode)}
        summary={dayModeSummary}
        suggestion={showSuggestion ? dayModeAutoSuggestion : undefined}
        onAcceptSuggestion={acceptSuggestedDayMode}
        onDismissSuggestion={dismissDayModeSuggestion}
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="glass p-3"><p className="text-2xl font-bold text-primary">{todaySummary.openTasks}</p><p className="text-xs text-text-muted">Nyitott feladat</p></Card>
        <Card className="glass p-3"><p className="text-2xl font-bold text-emerald-400">{layout.focus.length}</p><p className="text-xs text-text-muted">Mai prioritás</p></Card>
        <Card className="glass p-3"><p className="text-2xl font-bold text-blue-400">{todaySummary.upcomingEvents}</p><p className="text-xs text-text-muted">Kozelgo esemeny</p></Card>
        <Card className="glass p-3"><p className="text-2xl font-bold text-amber-400">{todaySummary.habitsAttention}</p><p className="text-xs text-text-muted">Szokas figyelmet ker</p></Card>
        <Card className="glass p-3"><p className="text-sm font-medium text-purple-300">{todaySummary.moodLabel}</p><p className="text-xs text-text-muted">Reflexios kep</p></Card>
      </div>

      <Card className={cn('glass p-4 border', loadIndicator.level === 'high' ? 'border-amber-500/30' : 'border-white/10')}>
        <div className="flex items-start gap-2">
          {loadIndicator.level === 'high' ? <TriangleAlert className="h-4 w-4 text-amber-400 mt-0.5" /> : <Lightbulb className="h-4 w-4 text-primary mt-0.5" />}
          <p className="text-sm text-text-secondary">
            {!behavior.overloadProtection
              ? behavior.tone.overloadOffMessage
              : loadIndicator.message}
          </p>
        </div>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-heading font-semibold text-text-primary">{targetGroupLabels.priorities}</h2>
        {guidanceTopFocus.length === 0 ? (
          <Card className="glass p-8 text-center text-text-muted">{behavior.tone.emptyFocus}</Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {guidanceTopFocus.map((item) => (
              <Card key={item.id} className="glass p-4 border-primary/30">
                <div className="flex items-start justify-between mb-2">
                  <Badge className="bg-primary/20 text-primary border-primary/30">Fokusz</Badge>
                  <span className="text-xs text-text-muted">{Math.round(item.priorityScore)}</span>
                </div>
                <h3 className="text-base font-semibold text-text-primary">{item.title}</h3>
                {item.subtitle && <p className="text-sm text-text-secondary mt-1">{item.subtitle}</p>}
                <p className="text-xs text-text-muted mt-2">{item.reason}</p>
                {item.actionTarget && (
                  <Button className="mt-3 w-full bg-primary hover:bg-primary/90 text-surface-0" size="sm" onClick={() => navigate(item.actionTarget!)}>
                    Megnyitas <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {(guidanceQuickWin || guidanceMaintenance) && (
        <section className="space-y-3">
          <h2 className="text-lg font-heading font-semibold text-text-primary">
            {guidanceTargetProfile.labelOverrides.nextBest || 'Napi guidance'}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {guidanceQuickWin && (
              <Card className="glass p-4 border-primary/20">
                <p className="text-xs text-text-muted">Quick win</p>
                <p className="text-sm font-semibold text-text-primary mt-1">{guidanceQuickWin.title}</p>
                <p className="text-xs text-text-muted mt-1">{guidanceQuickWin.reason}</p>
              </Card>
            )}
            {guidanceMaintenance && (
              <Card className="glass p-4 border-white/10">
                <p className="text-xs text-text-muted">Fenntarto lepes</p>
                <p className="text-sm font-semibold text-text-primary mt-1">{guidanceMaintenance.title}</p>
                <p className="text-xs text-text-muted mt-1">{guidanceMaintenance.reason}</p>
              </Card>
            )}
          </div>
          {guidanceInsights.length > 0 && (
            <Card className="glass p-3 border-white/10">
              <ul className="space-y-1">
                {guidanceInsights.map((insight) => (
                  <li key={insight} className="text-xs text-text-secondary">• {insight}</li>
                ))}
                {routingHints.length > 0 && (
                  <li className="text-xs text-text-secondary">• Van {routingHints.length} elem, amit erdemes lehet masik modulba tovabbvinni.</li>
                )}
              </ul>
            </Card>
          )}
        </section>
      )}

      <RoutingCandidatePanel
        candidates={routingHints}
        onAccept={(id) => void acceptRoutingCandidate(id)}
        onDismiss={(id) => void dismissRoutingCandidate(id)}
      />
      {routingHints.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            className="text-xs text-text-secondary hover:text-text-primary transition-colors"
            onClick={() => setRoutingPanelOpen(!routingPanelOpen)}
          >
            {routingPanelOpen ? 'Routing review bezarasa' : 'Routing review megnyitasa'}
          </button>
        </div>
      )}
      {routingPanelOpen ? (
        <RoutingReviewPanel
          candidates={routingCandidates}
          filter={routingReviewFilter}
          onFilterChange={setRoutingReviewFilter}
          onAccept={(id) => void acceptRoutingCandidate(id)}
          onDismiss={(id) => void dismissRoutingCandidate(id)}
        />
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-heading font-semibold text-text-primary">{targetGroupLabels.loadOverview}</h2>
        {dedupedSections.loadOverview.length === 0 ? (
          <Card className="glass p-6 text-center text-text-muted">A napi terhelés most kiegyensúlyozottnak tűnik.</Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {dedupedSections.loadOverview.map((block) => (
              <DashboardSecondaryCard key={block.id} block={block} onNavigate={navigate} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-heading font-semibold text-text-primary">{targetGroupLabels.nextBest}</h2>
        {dedupedSections.nextBest.length === 0 ? (
          <Card className="glass p-6 text-center text-text-muted">Most egyetlen rövid, fontos lépéssel érdemes indulni.</Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {dedupedSections.nextBest.map((block) => (
              <DashboardFocusCard key={`next-${block.id}`} block={block} onNavigate={navigate} />
            ))}
          </div>
        )}
      </section>

      {(dedupedSections.attention.length > 0 || guidanceAttention.length > 0) && (
        <section className="space-y-3">
          <h2 className="text-lg font-heading font-semibold text-text-primary">{targetGroupLabels.attention}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {(guidanceAttention.length > 0 ? guidanceAttention : dedupedSections.attention).map((block) => (
              'reason' in block ? (
                <Card key={block.id} className="glass p-4 border-amber-500/25">
                  <div className="flex items-center gap-2 mb-2">
                    <TriangleAlert className="h-4 w-4 text-amber-400" />
                    <h3 className="text-base font-semibold text-text-primary">{block.title}</h3>
                  </div>
                  {block.subtitle && <p className="text-sm text-text-secondary">{block.subtitle}</p>}
                  <p className="text-xs text-text-muted mt-2">{block.reason}</p>
                  {block.actionTarget && (
                    <Button className="mt-3 w-full" variant="outline" onClick={() => navigate(block.actionTarget)}>
                      Megnyitas
                    </Button>
                  )}
                </Card>
              ) : (
              <DashboardAttentionCard key={block.id} block={block} onNavigate={navigate} />
              )
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-heading font-semibold text-text-primary">{targetGroupLabels.secondary}</h2>
        {dedupedSections.secondary.length === 0 ? (
          <Card className="glass p-8 text-center text-text-muted">Nincs tovabbi lenyeges blokk most.</Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {dedupedSections.secondary.map((block) => (
              <DashboardSecondaryCard key={block.id} block={block} onNavigate={navigate} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-heading font-semibold text-text-primary">{targetGroupLabels.missions}</h2>
        {dedupedSections.missions.length === 0 ? (
          <Card className="glass p-6 text-center text-text-muted">Most nincs kulon kiemelt tamogato kuldetes.</Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {dedupedSections.missions.map((block) => (
              <DashboardSecondaryCard key={`mission-${block.id}`} block={block} onNavigate={navigate} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-heading font-semibold text-text-primary">{targetGroupLabels.quickActions}</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {quickActions.map((action) => (
            <Button key={action.id} variant="outline" className="justify-between border-white/20" onClick={() => navigate(action.target)}>
              <span>{action.label}</span>
              <Plus className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </section>

      <Card className="glass p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-muted">Szint haladas</p>
            <p className="text-xl font-bold text-text-primary">Szint {userStats.level}</p>
          </div>
          <Badge className="bg-primary/20 text-primary border-primary/30">{userStats.xp}/{userStats.xpToNextLevel} XP</Badge>
        </div>
      </Card>
    </div>
  );
}

function getDashboardBlockEntityKey(block: DashboardBlock): string {
  const payload = (block.payload || {}) as Record<string, unknown>;
  const entityId =
    (payload.item && typeof payload.item === 'object' && (payload.item as { itemId?: string }).itemId) ||
    (payload.goal && typeof payload.goal === 'object' && (payload.goal as { id?: string }).id) ||
    (payload.event && typeof payload.event === 'object' && (payload.event as { id?: string }).id) ||
    (payload.note && typeof payload.note === 'object' && (payload.note as { id?: string }).id);
  if (entityId) return `${block.sourceModule}:${entityId}`;
  return `${block.sourceModule}:${block.title.trim().toLowerCase()}`;
}

function DashboardFocusCard({ block, onNavigate }: { block: DashboardBlock; onNavigate: (path: string) => void }) {
  return (
    <Card className="glass p-4 border-primary/30">
      <div className="flex items-start justify-between mb-2">
        <Badge className="bg-primary/20 text-primary border-primary/30">Fokusz</Badge>
        {block.priorityScore && <span className="text-xs text-text-muted">{Math.round(block.priorityScore)}</span>}
      </div>
      <h3 className="text-base font-semibold text-text-primary">{block.title}</h3>
      {block.subtitle && <p className="text-sm text-text-secondary mt-1">{block.subtitle}</p>}
      {block.actionable && block.actionTarget && (
        <Button className="mt-3 w-full bg-primary hover:bg-primary/90 text-surface-0" size="sm" onClick={() => onNavigate(block.actionTarget!)}>
          {block.actionLabel || 'Megnyitas'} <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </Card>
  );
}

function DashboardAttentionCard({ block, onNavigate }: { block: DashboardBlock; onNavigate: (path: string) => void }) {
  return (
    <Card className="glass p-4 border-amber-500/25">
      <div className="flex items-center gap-2 mb-2">
        <TriangleAlert className="h-4 w-4 text-amber-400" />
        <h3 className="text-base font-semibold text-text-primary">{block.title}</h3>
      </div>
      {block.subtitle && <p className="text-sm text-text-secondary">{block.subtitle}</p>}
      {block.actionable && block.actionTarget && (
        <Button className="mt-3 w-full" variant="outline" onClick={() => onNavigate(block.actionTarget!)}>
          {block.actionLabel || 'Megnyitas'}
        </Button>
      )}
    </Card>
  );
}

function DashboardSecondaryCard({ block, onNavigate }: { block: DashboardBlock; onNavigate: (path: string) => void }) {
  return (
    <Card className="glass p-4">
      <div className="flex items-center gap-2 mb-1">
        {block.type === 'calendar' && <Calendar className="h-4 w-4 text-blue-400" />}
        {block.type === 'habits' && <Target className="h-4 w-4 text-emerald-400" />}
        {block.type === 'goals' && <CheckCircle2 className="h-4 w-4 text-purple-400" />}
        {block.type === 'missions' && <Clock3 className="h-4 w-4 text-primary" />}
        {!['calendar', 'habits', 'goals', 'missions'].includes(block.type) && <Lightbulb className="h-4 w-4 text-text-muted" />}
        <h3 className="text-sm font-semibold text-text-primary">{block.title}</h3>
      </div>
      {block.subtitle && <p className="text-xs text-text-muted">{block.subtitle}</p>}
      {block.actionable && block.actionTarget && (
        <Button size="sm" variant="ghost" className="mt-2 px-0 text-primary" onClick={() => onNavigate(block.actionTarget!)}>
          {block.actionLabel || 'Megnyitas'}
        </Button>
      )}
    </Card>
  );
}
