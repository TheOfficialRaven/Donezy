import { DASHBOARD_MAX_BLOCKS_WHEN_OVERLOADED, DASHBOARD_PRIMARY_FOCUS_LIMIT, DASHBOARD_SECONDARY_LIMIT, DASHBOARD_MESSAGES } from './constants';
import type { DashboardBlock, DashboardLoadIndicator } from './types';
import type { DashboardBehaviorProfile } from './preferencesAdapter';

export function getDashboardLoadIndicator(input: {
  openTasks: number;
  upcomingEvents: number;
  activeGoals: number;
  activeMissions: number;
  attentionCount: number;
}): DashboardLoadIndicator {
  const loadScore =
    (input.openTasks >= 12 ? 2 : input.openTasks >= 6 ? 1 : 0) +
    (input.upcomingEvents >= 5 ? 2 : input.upcomingEvents >= 3 ? 1 : 0) +
    (input.activeGoals >= 6 ? 1 : 0) +
    (input.activeMissions >= 8 ? 1 : 0) +
    (input.attentionCount >= 4 ? 2 : input.attentionCount >= 2 ? 1 : 0);
  if (loadScore >= 6) return { level: 'high', message: DASHBOARD_MESSAGES.high };
  if (loadScore >= 3) return { level: 'balanced', message: DASHBOARD_MESSAGES.balanced };
  return { level: 'low', message: DASHBOARD_MESSAGES.low };
}

export function prioritizeDashboardBlocks(blocks: DashboardBlock[], load: DashboardLoadIndicator) {
  const ordered = blocks
    .slice()
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
    .map((block) =>
      block.sourceModule === 'missions'
        ? { ...block, priorityScore: Math.max(0, (block.priorityScore || 0) - 18) }
        : block
    )
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
  const focus = ordered
    .filter((b) => b.type === 'focus' && b.sourceModule !== 'missions')
    .slice(0, DASHBOARD_PRIMARY_FOCUS_LIMIT);
  const attention = ordered.filter((b) => b.type === 'attention').slice(0, load.level === 'high' ? 2 : 3);
  const secondaryPool = ordered.filter((b) => !focus.includes(b) && !attention.includes(b));
  const secondary = secondaryPool.slice(0, load.level === 'high' ? Math.min(3, DASHBOARD_SECONDARY_LIMIT) : DASHBOARD_SECONDARY_LIMIT);

  const visible = [...focus, ...attention, ...secondary];
  const trimmed = load.level === 'high' ? visible.slice(0, DASHBOARD_MAX_BLOCKS_WHEN_OVERLOADED) : visible;
  return { focus, attention, secondary, visible: trimmed };
}

export function prioritizeDashboardBlocksWithPreferences(
  blocks: DashboardBlock[],
  load: DashboardLoadIndicator,
  behavior: DashboardBehaviorProfile
) {
  const ordered = blocks
    .slice()
    .map((block) => {
      const base = block.priorityScore || 0;
      const moduleWeight = behavior.weights.moduleWeights[block.sourceModule as keyof typeof behavior.weights.moduleWeights] || 1;
      let nextScore = Math.round(base * moduleWeight);
      if (block.sourceModule === 'missions') {
        nextScore = Math.max(0, nextScore + behavior.weights.missionPriorityOffset);
      }
      if (behavior.timeHorizon === 'today' && block.sourceModule === 'calendar') {
        nextScore += 8;
      } else if (behavior.timeHorizon === 'this-week' && (block.sourceModule === 'goals' || block.sourceModule === 'lists')) {
        nextScore += 6;
      }
      return { ...block, priorityScore: nextScore };
    })
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

  const focus = ordered
    .filter((b) => b.type === 'focus' && (b.sourceModule !== 'missions' || behavior.weights.missionPriorityOffset > 0))
    .slice(0, behavior.layout.focusLimit || DASHBOARD_PRIMARY_FOCUS_LIMIT);

  const attentionBaseLimit = behavior.overloadProtection && load.level === 'high' ? 2 : behavior.layout.attentionLimit;
  const attention = ordered.filter((b) => b.type === 'attention').slice(0, attentionBaseLimit);

  const secondaryPool = ordered.filter((b) => !focus.includes(b) && !attention.includes(b));
  const secondaryRaw = secondaryPool.slice(0, behavior.layout.secondaryLimit || DASHBOARD_SECONDARY_LIMIT);
  const secondary =
    behavior.overloadProtection && load.level === 'high'
      ? secondaryRaw.slice(0, Math.min(3, behavior.layout.secondaryLimit))
      : secondaryRaw;

  const visible = [...focus, ...attention, ...secondary];
  const maxVisible =
    behavior.overloadProtection && load.level === 'high'
      ? Math.min(DASHBOARD_MAX_BLOCKS_WHEN_OVERLOADED, behavior.layout.focusLimit + behavior.layout.attentionLimit + 2)
      : visible.length;

  return { focus, attention, secondary, visible: visible.slice(0, maxVisible) };
}
