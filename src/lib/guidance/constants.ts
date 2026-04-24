import type { GuidanceItemKind } from './types';

export const GUIDANCE_FOCUS_LIMIT_BY_LOAD = {
  high: 2,
  balanced: 3,
  low: 3,
} as const;

export const GUIDANCE_ATTENTION_LIMIT_BY_LOAD = {
  high: 3,
  balanced: 2,
  low: 1,
} as const;

export const GUIDANCE_KIND_REASON_LABELS: Record<GuidanceItemKind, string> = {
  focus: 'Mai fo fokusz',
  'quick-win': 'Gyorsan elore viheto lepes',
  maintenance: 'Fenntarto lepes',
  attention: 'Figyelmet kero elem',
  support: 'Tamogato insight',
};
