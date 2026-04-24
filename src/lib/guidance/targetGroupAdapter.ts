import type { PreferenceTargetGroup } from '@/lib/preferences/types';
import type { GuidanceItem } from './types';

type GuidanceModuleKey = 'lists' | 'goals' | 'habits' | 'calendar' | 'missions' | 'reflection' | 'reading' | 'notes' | 'dashboard';

export interface TargetGroupGuidanceProfile {
  key: PreferenceTargetGroup;
  emphasisWeights: Record<GuidanceModuleKey, number>;
  focusBias: GuidanceModuleKey[];
  attentionBias: GuidanceModuleKey[];
  quickActionBias: string[];
  labelOverrides: {
    priorities?: string;
    nextBest?: string;
    attention?: string;
  };
  guidanceSummaryStyle: string;
  supportiveInsightStyle: 'growth' | 'practical' | 'structured' | 'balanced';
  secondaryVisibility: {
    showReading: boolean;
    showReflection: boolean;
    showMissions: boolean;
  };
  enabled: boolean;
}

const BASE_PROFILE: TargetGroupGuidanceProfile = {
  key: 'other',
  emphasisWeights: {
    lists: 1,
    goals: 1,
    habits: 1,
    calendar: 1,
    missions: 0.9,
    reflection: 1,
    reading: 1,
    notes: 1,
    dashboard: 1,
  },
  focusBias: ['lists', 'goals', 'calendar'],
  attentionBias: ['lists', 'calendar', 'goals'],
  quickActionBias: ['quick-list', 'quick-note'],
  labelOverrides: {},
  guidanceSummaryStyle: 'kiegyensulyozott napi attekintes',
  supportiveInsightStyle: 'balanced',
  secondaryVisibility: { showReading: true, showReflection: true, showMissions: true },
  enabled: true,
};

export function getTargetGroupGuidanceProfile(targetGroup: PreferenceTargetGroup): TargetGroupGuidanceProfile {
  if (targetGroup === 'self-development') {
    return {
      ...BASE_PROFILE,
      key: targetGroup,
      emphasisWeights: { ...BASE_PROFILE.emphasisWeights, habits: 1.3, goals: 1.2, reflection: 1.35, reading: 1.3, calendar: 0.9, missions: 0.8 },
      focusBias: ['habits', 'goals', 'reading', 'reflection', 'lists'],
      attentionBias: ['habits', 'goals', 'reflection', 'lists'],
      quickActionBias: ['quick-reflection', 'quick-reading', 'quick-note'],
      labelOverrides: {
        priorities: 'Mai fejlodesi fokusz',
        nextBest: 'Ami most formalodik',
        attention: 'Ami tamogatja a haladasod',
      },
      guidanceSummaryStyle: 'nyugodt fejlodesi iranytu',
      supportiveInsightStyle: 'growth',
      secondaryVisibility: { showReading: true, showReflection: true, showMissions: false },
    };
  }
  if (targetGroup === 'student') {
    return {
      ...BASE_PROFILE,
      key: targetGroup,
      emphasisWeights: { ...BASE_PROFILE.emphasisWeights, calendar: 1.35, lists: 1.2, goals: 1.1, habits: 0.85, reflection: 0.85, missions: 0.75 },
      focusBias: ['calendar', 'lists', 'goals', 'notes'],
      attentionBias: ['calendar', 'lists', 'goals'],
      quickActionBias: ['quick-list', 'quick-event', 'quick-note'],
      labelOverrides: {
        priorities: 'Mai tanulasi fokusz',
        nextBest: 'Kozelgo hataridok es lepesek',
        attention: 'Amire ma erdemes figyelni',
      },
      guidanceSummaryStyle: 'praktikus tanulasi irany',
      supportiveInsightStyle: 'practical',
      secondaryVisibility: { showReading: true, showReflection: false, showMissions: false },
    };
  }
  if (targetGroup === 'young-professional') {
    return {
      ...BASE_PROFILE,
      key: targetGroup,
      emphasisWeights: { ...BASE_PROFILE.emphasisWeights, lists: 1.25, calendar: 1.22, notes: 1.1, habits: 0.85, reading: 0.8, missions: 0.8 },
      focusBias: ['lists', 'calendar', 'notes', 'goals'],
      attentionBias: ['lists', 'calendar', 'goals'],
      quickActionBias: ['quick-list', 'quick-event', 'quick-note'],
      labelOverrides: {
        priorities: 'Mai fo teendok',
        nextBest: 'Ami ma szamit',
        attention: 'Figyelmet ker',
      },
      guidanceSummaryStyle: 'gyors, tiszta napi dontesek',
      supportiveInsightStyle: 'practical',
      secondaryVisibility: { showReading: false, showReflection: false, showMissions: false },
    };
  }
  if (targetGroup === 'freelancer') {
    return {
      ...BASE_PROFILE,
      key: targetGroup,
      emphasisWeights: { ...BASE_PROFILE.emphasisWeights, goals: 1.35, lists: 1.2, notes: 1.15, calendar: 1.1, missions: 1.05, reading: 0.8 },
      focusBias: ['goals', 'lists', 'calendar', 'notes', 'missions'],
      attentionBias: ['goals', 'lists', 'calendar'],
      quickActionBias: ['quick-list', 'quick-note', 'quick-event'],
      labelOverrides: {
        priorities: 'Mai projektfokusz',
        nextBest: 'A kovetkezo lepes',
        attention: 'Ami elorevisz',
      },
      guidanceSummaryStyle: 'projektkozpontu napi irany',
      supportiveInsightStyle: 'practical',
      secondaryVisibility: { showReading: false, showReflection: true, showMissions: true },
    };
  }
  if (targetGroup === 'organizer') {
    return {
      ...BASE_PROFILE,
      key: targetGroup,
      emphasisWeights: { ...BASE_PROFILE.emphasisWeights, lists: 1.35, notes: 1.2, calendar: 1.1, goals: 0.95, reflection: 0.75, reading: 0.7, missions: 0.7 },
      focusBias: ['lists', 'notes', 'calendar'],
      attentionBias: ['lists', 'notes', 'calendar'],
      quickActionBias: ['quick-list', 'quick-note', 'quick-event'],
      labelOverrides: {
        priorities: 'Mai legfontosabb teendok',
        nextBest: 'Nyitott dolgok',
        attention: 'Ami rendet hoz a napba',
      },
      guidanceSummaryStyle: 'rendezett, tiszta napi attekintes',
      supportiveInsightStyle: 'structured',
      secondaryVisibility: { showReading: false, showReflection: false, showMissions: false },
    };
  }
  return BASE_PROFILE;
}

export function getTargetGroupAdjustedGuidance(items: GuidanceItem[], targetGroup: PreferenceTargetGroup): GuidanceItem[] {
  const profile = getTargetGroupGuidanceProfile(targetGroup);
  return [...items]
    .map((item) => {
      const weight = profile.emphasisWeights[item.sourceModule] || 1;
      const bias = profile.focusBias.includes(item.sourceModule) ? 1.1 : 1;
      return { ...item, priorityScore: Math.round(item.priorityScore * weight * bias) };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

export function getTargetGroupLabelOverrides(targetGroup: PreferenceTargetGroup) {
  return getTargetGroupGuidanceProfile(targetGroup).labelOverrides;
}

export function getTargetGroupNarrativeStyle(targetGroup: PreferenceTargetGroup): string {
  return getTargetGroupGuidanceProfile(targetGroup).guidanceSummaryStyle;
}
