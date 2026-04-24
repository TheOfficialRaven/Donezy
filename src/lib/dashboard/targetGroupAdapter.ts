import type { PreferenceTargetGroup } from '@/lib/preferences/types';
import type { DashboardBehaviorProfile } from './preferencesAdapter';
import type { DashboardBlock } from './types';

type DashboardModuleKey = 'lists' | 'goals' | 'habits' | 'calendar' | 'missions' | 'reflection' | 'reading' | 'notes';
type DashboardSourceModule = DashboardModuleKey | 'dashboard';
type QuickActionId = 'quick-list' | 'quick-note' | 'quick-reflection' | 'quick-reading' | 'quick-event';

export interface TargetGroupDashboardLabels {
  priorities: string;
  loadOverview: string;
  nextBest: string;
  attention: string;
  secondary: string;
  missions: string;
  quickActions: string;
}

export interface TargetGroupDashboardProfile {
  targetGroup: PreferenceTargetGroup;
  weightMultiplier: Record<DashboardModuleKey, number>;
  quickActionBoost: QuickActionId[];
  quickActionDemote: QuickActionId[];
  secondaryHiddenModules: DashboardModuleKey[];
  toneNuance: string;
  labels: TargetGroupDashboardLabels;
}

const DEFAULT_LABELS: TargetGroupDashboardLabels = {
  priorities: 'Mai prioritasok',
  loadOverview: 'Mai terheles / idoattekintes',
  nextBest: 'Kovetkezo legjobb lepesek',
  attention: 'Figyelmet ker',
  secondary: 'Masodlagos attekintes',
  missions: 'Kuldetesek (tamogato)',
  quickActions: 'Gyors lepesek',
};

export function getTargetGroupDashboardProfile(targetGroup: PreferenceTargetGroup): TargetGroupDashboardProfile {
  if (targetGroup === 'self-development') {
    return {
      targetGroup,
      weightMultiplier: { lists: 0.95, goals: 1.15, habits: 1.22, calendar: 0.92, missions: 0.88, reflection: 1.25, reading: 1.22, notes: 1.05 },
      quickActionBoost: ['quick-reflection', 'quick-note', 'quick-reading'],
      quickActionDemote: ['quick-event'],
      secondaryHiddenModules: [],
      toneNuance: 'A mai fejlodesi iranyokra es rutinokra helyezzuk a hangsulyt.',
      labels: {
        ...DEFAULT_LABELS,
        priorities: 'Mai fejlodesi fokusz',
        nextBest: 'Kovetkezo ertelmes lepesek',
      },
    };
  }
  if (targetGroup === 'student') {
    return {
      targetGroup,
      weightMultiplier: { lists: 1.1, goals: 1.05, habits: 0.9, calendar: 1.25, missions: 0.82, reflection: 0.88, reading: 0.95, notes: 1.02 },
      quickActionBoost: ['quick-list', 'quick-event', 'quick-note'],
      quickActionDemote: ['quick-reading'],
      secondaryHiddenModules: ['missions'],
      toneNuance: 'A mai tanulasi idostrukturara es hataridokre fokuszalunk.',
      labels: {
        ...DEFAULT_LABELS,
        priorities: 'Mai tanulasi fokusz',
        loadOverview: 'Orarend / hataridok',
        nextBest: 'Mit erdemes ma elore venni',
      },
    };
  }
  if (targetGroup === 'young-professional') {
    return {
      targetGroup,
      weightMultiplier: { lists: 1.2, goals: 1.02, habits: 0.9, calendar: 1.2, missions: 0.85, reflection: 0.86, reading: 0.82, notes: 1.05 },
      quickActionBoost: ['quick-list', 'quick-event', 'quick-note'],
      quickActionDemote: ['quick-reading'],
      secondaryHiddenModules: ['reading'],
      toneNuance: 'A napi terheles es a gyorsan lezarhato, gyakorlati lepesek kerulnek elore.',
      labels: {
        ...DEFAULT_LABELS,
        priorities: 'Mai fontos feladatok',
        nextBest: 'Lezarhato kovetkezo lepesek',
      },
    };
  }
  if (targetGroup === 'freelancer') {
    return {
      targetGroup,
      weightMultiplier: { lists: 1.12, goals: 1.25, habits: 0.92, calendar: 1.1, missions: 1.02, reflection: 0.9, reading: 0.82, notes: 1.12 },
      quickActionBoost: ['quick-list', 'quick-note', 'quick-event'],
      quickActionDemote: ['quick-reflection'],
      secondaryHiddenModules: [],
      toneNuance: 'A projekteket elore mozdito lepeseket emeltuk ki.',
      labels: {
        ...DEFAULT_LABELS,
        priorities: 'Mai fo projektlepesek',
        nextBest: 'Kovetkezo projektfokusz',
      },
    };
  }
  if (targetGroup === 'organizer') {
    return {
      targetGroup,
      weightMultiplier: { lists: 1.28, goals: 0.95, habits: 0.92, calendar: 1.06, missions: 0.8, reflection: 0.8, reading: 0.75, notes: 1.22 },
      quickActionBoost: ['quick-list', 'quick-note', 'quick-event'],
      quickActionDemote: ['quick-reading', 'quick-reflection'],
      secondaryHiddenModules: ['reading', 'reflection'],
      toneNuance: 'A mai dashboard a rendszerezest es attekinthetoseget tamogatja.',
      labels: {
        ...DEFAULT_LABELS,
        priorities: 'Mai legfontosabb teendok',
        secondary: 'Rendezesi attekintes',
      },
    };
  }
  return {
    targetGroup: 'other',
    weightMultiplier: { lists: 1, goals: 1, habits: 1, calendar: 1, missions: 0.9, reflection: 1, reading: 1, notes: 1 },
    quickActionBoost: ['quick-list', 'quick-note'],
    quickActionDemote: [],
    secondaryHiddenModules: [],
    toneNuance: 'A dashboard kiegyensulyozott, altalanos napi attekintest ad.',
    labels: DEFAULT_LABELS,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function applyTargetGroupToDashboardBehavior(
  behavior: DashboardBehaviorProfile,
  targetGroup: PreferenceTargetGroup
): DashboardBehaviorProfile {
  const profile = getTargetGroupDashboardProfile(targetGroup);
  return {
    ...behavior,
    weights: {
      ...behavior.weights,
      moduleWeights: {
        lists: clamp(behavior.weights.moduleWeights.lists * profile.weightMultiplier.lists, 0.7, 1.8),
        goals: clamp(behavior.weights.moduleWeights.goals * profile.weightMultiplier.goals, 0.7, 1.8),
        habits: clamp(behavior.weights.moduleWeights.habits * profile.weightMultiplier.habits, 0.7, 1.8),
        calendar: clamp(behavior.weights.moduleWeights.calendar * profile.weightMultiplier.calendar, 0.7, 1.8),
        missions: clamp(behavior.weights.moduleWeights.missions * profile.weightMultiplier.missions, 0.55, 1.2),
        reflection: clamp(behavior.weights.moduleWeights.reflection * profile.weightMultiplier.reflection, 0.65, 1.8),
        reading: clamp(behavior.weights.moduleWeights.reading * profile.weightMultiplier.reading, 0.6, 1.8),
        notes: clamp(behavior.weights.moduleWeights.notes * profile.weightMultiplier.notes, 0.7, 1.8),
      },
      missionPriorityOffset:
        targetGroup === 'freelancer'
          ? clamp(behavior.weights.missionPriorityOffset + 2, -16, 12)
          : behavior.weights.missionPriorityOffset,
    },
    tone: {
      ...behavior.tone,
      intro: `${behavior.tone.intro} ${profile.toneNuance}`,
    },
  };
}

export function getTargetGroupAdjustedBlocks(
  blocks: DashboardBlock[],
  targetGroup: PreferenceTargetGroup
): DashboardBlock[] {
  const profile = getTargetGroupDashboardProfile(targetGroup);
  return blocks.map((block) => {
    const base = block.priorityScore || 0;
    const moduleWeight = profile.weightMultiplier[block.sourceModule] || 1;
    return { ...block, priorityScore: Math.round(base * moduleWeight) };
  });
}

export function getTargetGroupQuickActions(
  actions: Array<{ id: string; label: string; target: string }>,
  targetGroup: PreferenceTargetGroup
) {
  const profile = getTargetGroupDashboardProfile(targetGroup);
  return actions
    .map((action) => {
      let score = 0;
      if (profile.quickActionBoost.includes(action.id as QuickActionId)) score += 3;
      if (profile.quickActionDemote.includes(action.id as QuickActionId)) score -= 2;
      return { ...action, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ score: _score, ...rest }) => rest);
}

export function getTargetGroupLabels(targetGroup: PreferenceTargetGroup): TargetGroupDashboardLabels {
  return getTargetGroupDashboardProfile(targetGroup).labels;
}

export function getTargetGroupLabelOverrides(targetGroup: PreferenceTargetGroup) {
  return getTargetGroupDashboardProfile(targetGroup).labels;
}

export function getTargetGroupSummaryCopy(targetGroup: PreferenceTargetGroup): string {
  return getTargetGroupDashboardProfile(targetGroup).toneNuance;
}

export function getTargetGroupNarrativeStyle(targetGroup: PreferenceTargetGroup): string {
  return getTargetGroupDashboardProfile(targetGroup).toneNuance;
}

export function shouldShowTargetGroupSecondaryModule(
  sourceModule: DashboardSourceModule,
  targetGroup: PreferenceTargetGroup
): boolean {
  if (sourceModule === 'dashboard') return true;
  const profile = getTargetGroupDashboardProfile(targetGroup);
  return !profile.secondaryHiddenModules.includes(sourceModule as DashboardModuleKey);
}
