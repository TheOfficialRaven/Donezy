import { getActiveGoals } from '@/lib/goals/selectors';
import { getActiveMissions } from '@/lib/missions/selectors';
import { getActiveHabits } from '@/lib/habits/selectors';
import { getTotalOpenItems } from '@/lib/lists/selectors';
import type { DashboardBlock, DashboardTodaySummary } from './types';
import { getDashboardLoadIndicator, prioritizeDashboardBlocks, prioritizeDashboardBlocksWithPreferences } from './prioritization';
import {
  preferencesToDashboardBehavior,
  preferencesToDashboardTone,
  preferencesToDashboardWeights,
  type DashboardBehaviorProfile,
} from './preferencesAdapter';
import type { UserProfilePreferences } from '@/lib/preferences/types';
import type { DayModeKey } from '@/lib/dayModes/types';
import { dayModeToQuickActionAdjustment } from '@/lib/dayModes/adapters';
import { getTargetGroupQuickActions } from './targetGroupAdapter';
import type { OnboardingQuickActionsProfile } from '@/lib/onboarding';

export function getDashboardTodaySummary(input: {
  openTasks: number;
  activeMissions: number;
  upcomingEvents: number;
  habitsAttention: number;
  moodLabel: string;
}): DashboardTodaySummary {
  return input;
}

export function getDashboardWeeklySummary(input: { completedMissions: number; habitCompletionRate: number; reflectionCount: number }) {
  return input;
}

export function getDashboardFocusBlocks(blocks: DashboardBlock[], loadInput: Parameters<typeof getDashboardLoadIndicator>[0]) {
  const load = getDashboardLoadIndicator(loadInput);
  return prioritizeDashboardBlocks(blocks, load).focus;
}

export function getDashboardAttentionBlocks(blocks: DashboardBlock[], loadInput: Parameters<typeof getDashboardLoadIndicator>[0]) {
  const load = getDashboardLoadIndicator(loadInput);
  return prioritizeDashboardBlocks(blocks, load).attention;
}

export function getDashboardSecondaryBlocks(blocks: DashboardBlock[], loadInput: Parameters<typeof getDashboardLoadIndicator>[0]) {
  const load = getDashboardLoadIndicator(loadInput);
  return prioritizeDashboardBlocks(blocks, load).secondary;
}

export function getDashboardMissionSupportBlocks(blocks: DashboardBlock[]) {
  return blocks
    .filter((block) => block.sourceModule === 'missions')
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
    .slice(0, 3);
}

export function getDashboardRecommendations(blocks: DashboardBlock[], loadInput: Parameters<typeof getDashboardLoadIndicator>[0]) {
  const load = getDashboardLoadIndicator(loadInput);
  return prioritizeDashboardBlocks(blocks, load).visible;
}

export function getDashboardQuickActions(
  preferences?: UserProfilePreferences | null,
  dayMode?: DayModeKey,
  targetGroup?: UserProfilePreferences['targetGroup'],
  guidanceBoostActionIds: string[] = [],
  onboardingQuickActionsProfile?: OnboardingQuickActionsProfile
) {
  const actions = [
    { id: 'quick-list', label: 'Gyors listaelem', target: '/app/lists' },
    { id: 'quick-note', label: 'Mai jegyzet', target: '/app/notes' },
    { id: 'quick-reflection', label: 'Gyors reflexio', target: '/app/reflection' },
    { id: 'quick-reading', label: 'Olvasasi frissites', target: '/app/reading' },
    { id: 'quick-event', label: 'Uj esemeny', target: '/app/calendar' },
  ];
  const behavior = preferencesToDashboardBehavior(preferences);
  const quickAdjustment = dayMode ? dayModeToQuickActionAdjustment(dayMode) : { boostedActionIds: [], demotedActionIds: [] as string[] };
  const boosted = actions.map((action) => {
    let score = 0;
    if (behavior.timeHorizon === 'today' && action.id === 'quick-event') score += 2;
    if (behavior.timeHorizon === 'this-week' && action.id === 'quick-list') score += 2;
    if (behavior.weights.moduleWeights.notes >= 1.1 && action.id === 'quick-note') score += 2;
    if (behavior.weights.moduleWeights.reflection >= 1.1 && action.id === 'quick-reflection') score += 1;
    if (quickAdjustment.boostedActionIds.includes(action.id)) score += 3;
    if (quickAdjustment.demotedActionIds.includes(action.id)) score -= 2;
    if (guidanceBoostActionIds.includes(action.id)) score += 4;
    if (onboardingQuickActionsProfile?.boostedActionIds.includes(action.id)) score += 2;
    if (onboardingQuickActionsProfile?.demotedActionIds.includes(action.id)) score -= 1;
    return { ...action, score };
  });
  const base = boosted.sort((a, b) => b.score - a.score).map(({ score: _score, ...rest }) => rest);
  if (!targetGroup) return base;
  return getTargetGroupQuickActions(base, targetGroup);
}

export function getDashboardBlockLayout(blocks: DashboardBlock[], loadInput: Parameters<typeof getDashboardLoadIndicator>[0]) {
  const load = getDashboardLoadIndicator(loadInput);
  return prioritizeDashboardBlocks(blocks, load);
}

export function getDashboardBlockCountByDensity(behavior: DashboardBehaviorProfile) {
  return {
    focus: behavior.layout.focusLimit,
    attention: behavior.layout.attentionLimit,
    secondary: behavior.layout.secondaryLimit,
    missions: behavior.layout.missionLimit,
  };
}

export function getDashboardWeightsFromPreferences(preferences: UserProfilePreferences | null | undefined) {
  return preferencesToDashboardWeights(preferences);
}

export function getDashboardToneProfile(preferences: UserProfilePreferences | null | undefined) {
  return preferencesToDashboardTone(preferences);
}

export function getDashboardTimeHorizonProfile(preferences: UserProfilePreferences | null | undefined) {
  return preferencesToDashboardBehavior(preferences).timeHorizon;
}

export function getPreferenceAwareDashboardFocusBlocks(
  blocks: DashboardBlock[],
  loadInput: Parameters<typeof getDashboardLoadIndicator>[0],
  preferences: UserProfilePreferences | null | undefined
) {
  const load = getDashboardLoadIndicator(loadInput);
  const behavior = preferencesToDashboardBehavior(preferences);
  return prioritizeDashboardBlocksWithPreferences(blocks, load, behavior).focus;
}

export function getPreferenceAwareAttentionBlocks(
  blocks: DashboardBlock[],
  loadInput: Parameters<typeof getDashboardLoadIndicator>[0],
  preferences: UserProfilePreferences | null | undefined
) {
  const load = getDashboardLoadIndicator(loadInput);
  const behavior = preferencesToDashboardBehavior(preferences);
  return prioritizeDashboardBlocksWithPreferences(blocks, load, behavior).attention;
}

export function getPreferenceAwareSecondaryBlocks(
  blocks: DashboardBlock[],
  loadInput: Parameters<typeof getDashboardLoadIndicator>[0],
  preferences: UserProfilePreferences | null | undefined
) {
  const load = getDashboardLoadIndicator(loadInput);
  const behavior = preferencesToDashboardBehavior(preferences);
  return prioritizeDashboardBlocksWithPreferences(blocks, load, behavior).secondary;
}

export function getPreferenceAwareDashboardLayout(
  blocks: DashboardBlock[],
  loadInput: Parameters<typeof getDashboardLoadIndicator>[0],
  preferences: UserProfilePreferences | null | undefined
) {
  const load = getDashboardLoadIndicator(loadInput);
  const behavior = preferencesToDashboardBehavior(preferences);
  return prioritizeDashboardBlocksWithPreferences(blocks, load, behavior);
}

export function getDashboardLayoutFromBehavior(
  blocks: DashboardBlock[],
  loadInput: Parameters<typeof getDashboardLoadIndicator>[0],
  behavior: DashboardBehaviorProfile
) {
  const load = getDashboardLoadIndicator(loadInput);
  return prioritizeDashboardBlocksWithPreferences(blocks, load, behavior);
}

export function buildDashboardLoadInput(data: {
  listsOpenItems: number;
  eventsCount: number;
  goalsCount: number;
  missionsCount: number;
  attentionBlocksCount: number;
}) {
  return {
    openTasks: data.listsOpenItems,
    upcomingEvents: data.eventsCount,
    activeGoals: data.goalsCount,
    activeMissions: data.missionsCount,
    attentionCount: data.attentionBlocksCount,
  };
}

export function deriveCountsForLoad(data: {
  lists: any[];
  events: any[];
  goals: any[];
  missions: any[];
  habits: any[];
}) {
  return {
    listsOpenItems: getTotalOpenItems(data.lists as any),
    eventsCount: data.events.length,
    goalsCount: getActiveGoals(data.goals as any).length,
    missionsCount: getActiveMissions(data.missions as any).length,
    habitsActive: getActiveHabits(data.habits as any).length,
  };
}
