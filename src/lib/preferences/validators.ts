import type {
  DashboardDensity,
  DayPlanningStyle,
  DefaultTimeHorizon,
  HabitTrackingPreference,
  MissionVisibility,
  NotesInboxBehavior,
  OverloadProtection,
  PreferredTone,
  ProductivityMode,
  ReadingVisibility,
  ReflectionStyle,
  ReminderSensitivity,
  ThemePreference,
  UserProfilePreferencesRaw,
  PreferenceTargetGroup,
} from './types';

const targetGroups: PreferenceTargetGroup[] = ['self-development', 'student', 'young-professional', 'freelancer', 'organizer', 'other'];
const productivityModes: ProductivityMode[] = ['balanced', 'focus', 'light', 'recovery'];
const tones: PreferredTone[] = ['supportive', 'neutral', 'direct'];
const densities: DashboardDensity[] = ['minimal', 'balanced', 'detailed'];
const planningStyles: DayPlanningStyle[] = ['strict', 'flexible', 'mixed'];
const timeHorizons: DefaultTimeHorizon[] = ['today', 'this-week', 'mixed'];
const reminderLevels: ReminderSensitivity[] = ['low', 'medium', 'high'];
const trackingPrefs: HabitTrackingPreference[] = ['auto-first', 'hybrid', 'manual-light'];
const missionVisibilities: MissionVisibility[] = ['secondary', 'balanced', 'strong'];
const reflectionStyles: ReflectionStyle[] = ['quick', 'mixed', 'deep'];
const readingVisibility: ReadingVisibility[] = ['low', 'medium', 'high'];
const notesBehavior: NotesInboxBehavior[] = ['simple', 'structured'];
const overloadModes: OverloadProtection[] = ['on', 'off'];
const themeModes: ThemePreference[] = ['system', 'dark', 'light'];

function isOneOf<T extends string>(value: unknown, allowed: T[]): value is T {
  return typeof value === 'string' && allowed.includes(value as T);
}

export function validateUserPreferences(raw: UserProfilePreferencesRaw): string[] {
  const issues: string[] = [];
  if (raw.targetGroup !== undefined && !isOneOf(raw.targetGroup, targetGroups)) issues.push('invalid-targetGroup');
  if (raw.productivityMode !== undefined && !isOneOf(raw.productivityMode, productivityModes)) issues.push('invalid-productivityMode');
  if (raw.preferredTone !== undefined && !isOneOf(raw.preferredTone, tones)) issues.push('invalid-preferredTone');
  if (raw.dashboardDensity !== undefined && !isOneOf(raw.dashboardDensity, densities)) issues.push('invalid-dashboardDensity');
  if (raw.dayPlanningStyle !== undefined && !isOneOf(raw.dayPlanningStyle, planningStyles)) issues.push('invalid-dayPlanningStyle');
  if (raw.defaultTimeHorizon !== undefined && !isOneOf(raw.defaultTimeHorizon, timeHorizons)) issues.push('invalid-defaultTimeHorizon');
  if (raw.reminderSensitivity !== undefined && !isOneOf(raw.reminderSensitivity, reminderLevels)) issues.push('invalid-reminderSensitivity');
  if (raw.habitTrackingPreference !== undefined && !isOneOf(raw.habitTrackingPreference, trackingPrefs)) issues.push('invalid-habitTrackingPreference');
  if (raw.missionVisibility !== undefined && !isOneOf(raw.missionVisibility, missionVisibilities)) issues.push('invalid-missionVisibility');
  if (raw.reflectionStyle !== undefined && !isOneOf(raw.reflectionStyle, reflectionStyles)) issues.push('invalid-reflectionStyle');
  if (raw.readingVisibility !== undefined && !isOneOf(raw.readingVisibility, readingVisibility)) issues.push('invalid-readingVisibility');
  if (raw.notesInboxBehavior !== undefined && !isOneOf(raw.notesInboxBehavior, notesBehavior)) issues.push('invalid-notesInboxBehavior');
  if (raw.overloadProtection !== undefined && !isOneOf(raw.overloadProtection, overloadModes)) issues.push('invalid-overloadProtection');
  if (raw.themePreference !== undefined && !isOneOf(raw.themePreference, themeModes)) issues.push('invalid-themePreference');
  if (raw.showAdvancedFilters !== undefined && typeof raw.showAdvancedFilters !== 'boolean') issues.push('invalid-showAdvancedFilters');
  if (raw.schemaVersion !== undefined && typeof raw.schemaVersion !== 'number') issues.push('invalid-schemaVersion');
  return issues;
}
