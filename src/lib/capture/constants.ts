import type { QuickCaptureStatus, QuickCaptureSuggestedType, QuickCaptureTargetModule } from './types';

export const QUICK_CAPTURE_SCHEMA_VERSION = 1 as const;

export const QUICK_CAPTURE_STATUSES: QuickCaptureStatus[] = ['unprocessed', 'routed', 'archived', 'discarded'];

export const QUICK_CAPTURE_SUGGESTED_TYPES: QuickCaptureSuggestedType[] = [
  'list_item',
  'note',
  'goal_seed',
  'mission_seed',
  'habit_seed',
  'event_seed',
  'reflection_seed',
  'reading_seed',
];

export const QUICK_CAPTURE_TARGET_MODULES: QuickCaptureTargetModule[] = [
  'lists',
  'notes',
  'goals',
  'missions',
  'habits',
  'calendar',
  'reflection',
  'reading',
  'inbox',
];

export const QUICK_CAPTURE_STATUS_LABELS: Record<QuickCaptureStatus, string> = {
  unprocessed: 'Feldolgozásra vár',
  routed: 'Rendezve',
  archived: 'Archivált',
  discarded: 'Elvetett',
};

export const QUICK_CAPTURE_TARGET_LABELS: Record<QuickCaptureTargetModule, string> = {
  lists: 'Listák',
  notes: 'Jegyzetek',
  goals: 'Célok',
  missions: 'Küldetések',
  habits: 'Szokások',
  calendar: 'Naptár',
  reflection: 'Reflexió',
  reading: 'Olvasás',
  inbox: 'Mentális inbox',
};
