import type { DayModeKey, DayModeProfile, DayModeSuggestionConfidence, DayModeSuggestionReasonCode } from './types';

export const DEFAULT_DAY_MODE: DayModeKey = 'normal';

export const DAY_MODE_ORDER: DayModeKey[] = ['normal', 'focus', 'light', 'recovery', 'busy'];

export const DAY_MODE_PROFILES: Record<DayModeKey, DayModeProfile> = {
  normal: {
    key: 'normal',
    label: 'Normal',
    description: 'Kiegyensulyozott napi kep a stabil haladashoz.',
    emphasisProfile: { planning: 1, execution: 1, maintenance: 1, recovery: 1 },
    blockDensityDelta: 0,
    overloadSensitivityDelta: 0,
    priorityBias: { strictness: 1, deepWorkBoost: 0, quickWinBoost: 0, urgentBoost: 0 },
    toneBias: {
      preferredToneShift: 'none',
      label: 'Kiegyensulyozott',
      summary: 'Ma kiegyensulyozott napi kepet kapsz.',
    },
    quickActionBias: { boostedActionIds: [], demotedActionIds: [] },
    enabled: true,
  },
  focus: {
    key: 'focus',
    label: 'Focus',
    description: 'Szukitett fokusz a legfontosabb, melyebb feladatokra.',
    emphasisProfile: { planning: 0.95, execution: 1.2, maintenance: 0.85, recovery: 0.75 },
    blockDensityDelta: -1,
    overloadSensitivityDelta: 0.35,
    priorityBias: { strictness: 1.2, deepWorkBoost: 0.2, quickWinBoost: -0.05, urgentBoost: 0.1 },
    toneBias: {
      preferredToneShift: 'direct',
      label: 'Szukitett fokusz',
      summary: 'Ma a legfontosabb dolgokra szukitettuk a fokuszt.',
    },
    quickActionBias: {
      boostedActionIds: ['quick-list', 'quick-event'],
      demotedActionIds: ['quick-reading'],
    },
    enabled: true,
  },
  light: {
    key: 'light',
    label: 'Light',
    description: 'Konnyebb napkep rovidebb, gyorsabban teljesitheto lepesekkel.',
    emphasisProfile: { planning: 0.9, execution: 0.9, maintenance: 1.05, recovery: 1.1 },
    blockDensityDelta: -1,
    overloadSensitivityDelta: 0.2,
    priorityBias: { strictness: 0.85, deepWorkBoost: -0.05, quickWinBoost: 0.25, urgentBoost: 0.05 },
    toneBias: {
      preferredToneShift: 'supportive',
      label: 'Konnyitett',
      summary: 'Ma kisebb, konnyebben megfoghato lepesek kerulnek eloterbe.',
    },
    quickActionBias: {
      boostedActionIds: ['quick-note', 'quick-list', 'quick-reflection'],
      demotedActionIds: ['quick-reading'],
    },
    enabled: true,
  },
  recovery: {
    key: 'recovery',
    label: 'Recovery',
    description: 'Kimelo, minimalis elvarasokra epito napi uzemmod.',
    emphasisProfile: { planning: 0.8, execution: 0.75, maintenance: 1.2, recovery: 1.3 },
    blockDensityDelta: -2,
    overloadSensitivityDelta: 0.6,
    priorityBias: { strictness: 0.7, deepWorkBoost: -0.1, quickWinBoost: 0.3, urgentBoost: 0 },
    toneBias: {
      preferredToneShift: 'supportive',
      label: 'Kimelo',
      summary: 'Ma kimelobb, egyszerubb napi kepet mutatunk.',
    },
    quickActionBias: {
      boostedActionIds: ['quick-reflection', 'quick-note', 'quick-list'],
      demotedActionIds: ['quick-reading'],
    },
    enabled: true,
  },
  busy: {
    key: 'busy',
    label: 'Busy',
    description: 'Suru napra szabott, ido-es hatarido-kozpontu priorizalas.',
    emphasisProfile: { planning: 1.15, execution: 1.05, maintenance: 0.85, recovery: 0.7 },
    blockDensityDelta: 0,
    overloadSensitivityDelta: 0.45,
    priorityBias: { strictness: 1.15, deepWorkBoost: 0.05, quickWinBoost: 0.1, urgentBoost: 0.3 },
    toneBias: {
      preferredToneShift: 'direct',
      label: 'Praktikus',
      summary: 'Ma a fix dolgok es a surgos elemek kerulnek elore.',
    },
    quickActionBias: {
      boostedActionIds: ['quick-event', 'quick-list'],
      demotedActionIds: ['quick-reading'],
    },
    enabled: true,
  },
};

export const DAY_MODE_SUGGESTION_MIN_CONFIDENCE_TO_SHOW: DayModeSuggestionConfidence = 'medium';

export const DAY_MODE_SUGGESTION_REASON_MESSAGES: Record<DayModeSuggestionReasonCode, string> = {
  'high-load-and-calendar-pressure': 'Ma tobb fix esemeny es magasabb terheles latszik.',
  'high-load-with-overload-protection': 'A terhelesvedelem miatt most kimelobb mod lehet hasznos.',
  'many-overdue-or-urgent-items': 'Tobb surgos vagy lejart nyitott elem kerult eloterbe.',
  'few-clear-focus-points': 'Ma keves, de jol azonosithato fokuszpont latszik.',
  'light-day-low-pressure': 'A napi terheles most alacsonyabb, konnyebb ritmus is eleg lehet.',
  'balanced-day': 'A mai nap kiegyensulyozottnak tunik.',
  'insufficient-signal': 'Most nincs eleg adat megbizhato javaslathoz.',
};
