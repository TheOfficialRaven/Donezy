import type { UserProfilePreferences } from '@/lib/preferences/types';
import { getDefaultUserPreferences } from '@/lib/preferences/normalize';

type DashboardModuleKey = 'lists' | 'goals' | 'habits' | 'calendar' | 'missions' | 'reflection' | 'reading' | 'notes';

export interface DashboardWeightsProfile {
  moduleWeights: Record<DashboardModuleKey, number>;
  missionPriorityOffset: number;
}

export interface DashboardLayoutProfile {
  focusLimit: number;
  attentionLimit: number;
  secondaryLimit: number;
  missionLimit: number;
  showSecondary: boolean;
}

export interface DashboardToneProfile {
  tone: 'supportive' | 'neutral' | 'direct';
  intro: string;
  overloadOffMessage: string;
  emptyFocus: string;
}

export interface DashboardGuidanceBehavior {
  preferredTone: UserProfilePreferences['preferredTone'];
  reminderSensitivity: UserProfilePreferences['reminderSensitivity'];
  dayPlanningStyle: UserProfilePreferences['dayPlanningStyle'];
}

export interface DashboardBehaviorProfile {
  weights: DashboardWeightsProfile;
  layout: DashboardLayoutProfile;
  tone: DashboardToneProfile;
  guidance: DashboardGuidanceBehavior;
  density: UserProfilePreferences['dashboardDensity'];
  timeHorizon: UserProfilePreferences['defaultTimeHorizon'];
  overloadProtection: boolean;
}

function safePreferences(preferences: UserProfilePreferences | null | undefined): UserProfilePreferences {
  return preferences || getDefaultUserPreferences();
}

export function preferencesToDashboardWeights(preferences: UserProfilePreferences | null | undefined): DashboardWeightsProfile {
  const p = safePreferences(preferences);
  const base: Record<DashboardModuleKey, number> = {
    lists: 1,
    goals: 1,
    habits: 1,
    calendar: 1,
    missions: 1,
    reflection: 1,
    reading: 1,
    notes: 1,
  };

  if (p.readingVisibility === 'low') base.reading -= 0.2;
  if (p.readingVisibility === 'high') base.reading += 0.25;
  if (p.reflectionStyle === 'quick') base.reflection -= 0.1;
  if (p.reflectionStyle === 'deep') base.reflection += 0.2;
  if (p.notesInboxBehavior === 'simple') base.notes -= 0.05;
  if (p.notesInboxBehavior === 'structured') base.notes += 0.2;

  if (p.productivityMode === 'focus') {
    base.goals += 0.2;
    base.lists += 0.15;
  } else if (p.productivityMode === 'light') {
    base.calendar += 0.05;
    base.reflection += 0.1;
  } else if (p.productivityMode === 'recovery') {
    base.reflection += 0.2;
    base.habits += 0.1;
    base.missions -= 0.2;
  }

  if (p.targetGroup === 'self-development') {
    base.habits += 0.18;
    base.reading += 0.12;
    base.reflection += 0.12;
  } else if (p.targetGroup === 'student') {
    base.calendar += 0.2;
    base.goals += 0.1;
  } else if (p.targetGroup === 'young-professional') {
    base.lists += 0.15;
    base.calendar += 0.1;
  } else if (p.targetGroup === 'freelancer') {
    base.goals += 0.16;
    base.lists += 0.1;
  } else if (p.targetGroup === 'organizer') {
    base.lists += 0.2;
    base.calendar += 0.1;
    base.notes += 0.1;
  }

  const missionPriorityOffset =
    p.missionVisibility === 'strong'
      ? 10
      : p.missionVisibility === 'balanced'
        ? 0
        : -12;

  return { moduleWeights: base, missionPriorityOffset };
}

export function preferencesToDashboardLayout(preferences: UserProfilePreferences | null | undefined): DashboardLayoutProfile {
  const p = safePreferences(preferences);
  if (p.dashboardDensity === 'minimal') {
    return { focusLimit: 2, attentionLimit: 2, secondaryLimit: 3, missionLimit: p.missionVisibility === 'strong' ? 2 : 1, showSecondary: true };
  }
  if (p.dashboardDensity === 'detailed') {
    return { focusLimit: 4, attentionLimit: 5, secondaryLimit: 8, missionLimit: p.missionVisibility === 'strong' ? 4 : 3, showSecondary: true };
  }
  return { focusLimit: 3, attentionLimit: 4, secondaryLimit: 6, missionLimit: p.missionVisibility === 'strong' ? 3 : 2, showSecondary: true };
}

export function preferencesToDashboardTone(preferences: UserProfilePreferences | null | undefined): DashboardToneProfile {
  const p = safePreferences(preferences);
  if (p.preferredTone === 'direct') {
    return {
      tone: 'direct',
      intro: 'A mai legfontosabb blokkok, roviden es egyertelmuen.',
      overloadOffMessage: 'Terhelesvedelem kikapcsolva, teljes nezet aktiv.',
      emptyFocus: 'Nincs kiemelt fokusz. Valassz 1 konkret lepest.',
    };
  }
  if (p.preferredTone === 'neutral') {
    return {
      tone: 'neutral',
      intro: 'A mai prioritasok rendezett attekintese.',
      overloadOffMessage: 'A terhelesvedelem jelenleg ki van kapcsolva.',
      emptyFocus: 'Most nincs kiemelt fokusz blokk.',
    };
  }
  return {
    tone: 'supportive',
    intro: 'Ma mi a fontos? Egy helyen rendezve, hogy nyugodtabban tudj priorizalni.',
    overloadOffMessage: 'A terhelesvedelem most ki van kapcsolva, igy a teljes kepet latod.',
    emptyFocus: 'Most nincs kiemelt fokusz, egy rovid vallalhato lepessel erdemes kezdeni.',
  };
}

export function preferencesToGuidanceBehavior(preferences: UserProfilePreferences | null | undefined): DashboardGuidanceBehavior {
  const p = safePreferences(preferences);
  return {
    preferredTone: p.preferredTone,
    reminderSensitivity: p.reminderSensitivity,
    dayPlanningStyle: p.dayPlanningStyle,
  };
}

export function preferencesToDashboardBehavior(preferences: UserProfilePreferences | null | undefined): DashboardBehaviorProfile {
  const p = safePreferences(preferences);
  return {
    weights: preferencesToDashboardWeights(p),
    layout: preferencesToDashboardLayout(p),
    tone: preferencesToDashboardTone(p),
    guidance: preferencesToGuidanceBehavior(p),
    density: p.dashboardDensity,
    timeHorizon: p.defaultTimeHorizon,
    overloadProtection: p.overloadProtection === 'on',
  };
}
