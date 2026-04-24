import { create } from 'zustand';
import { toast } from 'sonner';
import * as dbService from '@/services/databaseService';
import {
  TASK_XP,
  NOTE_CREATE_XP,
  DAILY_LOGIN_BASE_XP,
  DAILY_LOGIN_STREAK_BONUS,
  DAILY_LOGIN_MAX_BONUS,
  ACHIEVEMENTS,
  ACHIEVEMENT_ESSENCE,
  levelUpEssenceBonus,
  type AchievementStats,
} from '@/lib/xpSystem';
import {
  generateDailyQuests,
  generateWeeklyQuests,
} from '@/lib/questGenerator';
import {
  getLocalDateString,
  getLocalYesterday,
  getLocalMondayOfWeek,
  getLocalSundayOfWeek,
} from '@/lib/dateUtils';
import { normalizeTitle, type HabitEntry } from '@/lib/habitAnalyzer';
import { coalesceFocusArea, inferFocusArea, type FocusArea, type FocusAreaSource } from '@/lib/focusAreas';
import { DEFAULT_LIST_ICON, LISTS_SCHEMA_VERSION } from '@/lib/lists/constants';
import { getHighPriorityOpenItemsCount, getOverdueItemsCount, getTotalOpenItems } from '@/lib/lists/selectors';
import { validateListEntity, validateListItemEntity } from '@/lib/lists/validators';
import type { ListItemsFilter, ListItemsSort, ListViewFilter } from '@/lib/lists/types';
import type {
  CalendarEventPriority,
  CalendarEventStatus,
  CalendarEventType,
  CalendarSourceType,
  CalendarView,
  ReminderSettings,
} from '@/lib/calendar/types';
import { normalizeCalendarEvent } from '@/lib/calendar/normalize';
import { validateCalendarEventInput } from '@/lib/calendar/validators';
import { toLocalDateKey } from '@/lib/calendar/dateKey';
import { GOALS_SCHEMA_VERSION } from '@/lib/goals/constants';
import type { Goal, Milestone, GoalsViewFilter, SelectedGoalView } from '@/lib/goals/types';
import { getActiveGoals, getGoalsNeedingAttention } from '@/lib/goals/selectors';
import type { GoalsPriorityFilter, GoalsStatusFilter, GoalsTypeFilter } from '@/lib/goals/selectors';
import { computeMilestoneDerivedProgress } from '@/lib/goals/progress';
import type { GrowthGoalData, GrowthMilestoneData } from '@/services/databaseService';
import { HABITS_SCHEMA_VERSION } from '@/lib/habits/constants';
import { detectHabitCandidates } from '@/lib/habits/detection';
import {
  normalizeHabit,
  normalizeHabitActivitySignal,
  normalizeHabitCandidate,
  normalizeHabitCompletion,
} from '@/lib/habits/normalize';
import {
  validateActivitySignal,
  validateCandidatePromotion,
  validateCompletion,
  validateHabitFrequency,
  validateHabitTitle,
  validateHabitTrackingMode,
} from '@/lib/habits/validators';
import type {
  Habit,
  HabitActivitySignal,
  HabitCandidate,
  HabitCompletion,
  HabitSelectedView,
  HabitTimeRangeFilter,
  HabitsStatusFilter,
  HabitsViewFilter,
  HabitTrackingModeFilter,
} from '@/lib/habits/types';
import { getHabitsNeedingAttention } from '@/lib/habits/selectors';
import { buildNotePreview, defaultNewNoteFields } from '@/lib/notes/normalize';
import {
  validateFolderCreateInput,
  validateFolderPatch,
  validateNoteCreateInput,
  validateNotePatch,
} from '@/lib/notes/validators';
import { getNoteFolderLabel } from '@/lib/notes/selectors';
import type {
  Note,
  NoteFolder,
  NoteSelectedView,
  NotesArchivedFilter,
  NotesLayoutMode,
  NotesTypeFilter,
  NotesViewFilter,
} from '@/lib/notes/types';
import { READING_SCHEMA_VERSION } from '@/lib/reading/constants';
import { normalizeBook, normalizeReadingEntry } from '@/lib/reading/normalize';
import { validateBookInput, validateReadingEntry } from '@/lib/reading/validators';
import type {
  Book,
  ReadingEntry,
  ReadingLayoutMode,
  ReadingSelectedView,
  ReadingViewFilter,
} from '@/lib/reading/types';
import { REFLECTION_SCHEMA_VERSION } from '@/lib/reflection/constants';
import { normalizeReflectionEntry } from '@/lib/reflection/normalize';
import { validateReflectionEntry } from '@/lib/reflection/validators';
import type {
  ReflectionEntry,
  ReflectionSelectedView,
  ReflectionType,
  ReflectionViewFilter,
} from '@/lib/reflection/types';
import { normalizeMission } from '@/lib/missions/normalize';
import { validateMissionInput } from '@/lib/missions/validators';
import type {
  Mission,
  MissionSelectedView,
  MissionStatus,
  MissionType,
  MissionViewFilter,
} from '@/lib/missions/types';
import { getActiveMissions } from '@/lib/missions/selectors';
import { normalizeQuickCaptureItem } from '@/lib/capture/normalize';
import { suggestQuickCaptureRouting } from '@/lib/capture/routing';
import { validateQuickCaptureItem } from '@/lib/capture/validators';
import type {
  QuickCaptureItem,
  QuickCaptureStatus,
  QuickCaptureSuggestedType,
  QuickCaptureTargetModule,
} from '@/lib/capture/types';
import {
  normalizeUserPreferences,
  getDefaultUserPreferences,
  type PreferencesViewSection,
  type UserProfilePreferences,
} from '@/lib/preferences';
import {
  getDayModeSuggestion,
  getDefaultDayMode,
  normalizeDayModeKey,
  shouldShowDayModeSuggestion,
  type DayModeKey,
  type DayModeSuggestion,
} from '@/lib/dayModes';
import { getDashboardLoadIndicator } from '@/lib/dashboard';
import {
  generateRoutingCandidatesFromModules,
  getDashboardRoutingHints,
  normalizeRoutingCandidate,
  ROUTING_EXPIRE_DAYS,
  type RoutingCandidate,
  type RoutingReviewFilter,
} from '@/lib/routing';
import {
  ONBOARDING_TOTAL_STEPS,
  buildOnboardingResultProfile,
  normalizeOnboardingAnswers,
  type OnboardingAnswerSet,
  type OnboardingResultProfile,
} from '@/lib/onboarding';

// ============ TYPES ============

export type {
  Note,
  NoteFolder,
  NoteSelectedView,
  NotesArchivedFilter,
  NotesLayoutMode,
  NotesTypeFilter,
  NotesViewFilter,
} from '@/lib/notes/types';

/** @deprecated use `Goal` from `@/lib/goals/types` */
export type GrowthGoal = Goal;
/** @deprecated use `Milestone` from `@/lib/goals/types` */
export type GrowthMilestone = Milestone;

/** Minimal + optional fields for `addGoal` — store fills defaults and milestone ids. */
export type GoalCreatePayload = Pick<Goal, 'title'> &
  Partial<Omit<Goal, 'id' | 'milestones' | 'createdAt' | 'updatedAt' | 'schemaVersion'>> & {
    milestones?: Array<Pick<Milestone, 'title'> & Partial<Omit<Milestone, 'id' | 'goalId' | 'createdAt' | 'updatedAt'>>>;
  };

export type HabitCreatePayload = Pick<Habit, 'title'> &
  Partial<Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'schemaVersion'>>;

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'epic';
  estimatedTime: number;
  xpReward: number;
  essenceReward: number;
  completed: boolean;
  completedAt?: string;
  dueDate?: string;
  tags: string[];
  persona?: string;
  generated?: boolean;
  questType?: 'daily' | 'weekly';
  // Identifies which pool generated this quest
  questSource?: 'persona' | 'preference';
  // Which interest group this preference quest belongs to (e.g. 'health', 'finance')
  preferenceGroup?: string;
  // Progress-based quest fields (for weekly quests like "Complete X tasks this week")
  targetCount?: number;
  currentProgress?: number;
  trackingType?: 'tasks_completed' | 'quests_completed' | 'notes_created';
  focusArea?: FocusArea;
  focusAreaSource?: FocusAreaSource;
  manualPriority?: number;
  createdAt?: string;
  updatedAt?: string;
  lastInteractedAt?: string;
  postponedCount?: number;
}

export type NoteCreatePayload = Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'title' | 'content'>> & {
  title?: string;
  content?: string;
  /** @deprecated v1 — ha nincs folderId, string mappa névként mentődik (legacyFolder). */
  folder?: string;
};

export interface CalendarEvent {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  date?: string;
  startTime: string;
  endTime: string;
  allDay?: boolean;
  type?: CalendarEventType;
  priority?: CalendarEventPriority;
  category: string;
  color: string;
  notes?: string;
  location?: string;
  reminder?: number;
  reminderSettings?: ReminderSettings;
  status?: CalendarEventStatus;
  sourceType?: CalendarSourceType;
  futureOriginReference?: {
    module: 'lists' | 'goals' | 'quests' | 'habits' | 'dashboard' | 'calendar' | 'unknown';
    id?: string;
    note?: string;
  };
  futureLinkTargets?: {
    dailyGuidanceCandidate?: boolean;
    dashboardHighlightCandidate?: boolean;
    focusBlockCandidate?: boolean;
    loadAnalyzerCandidate?: boolean;
  };
  schemaVersion?: number;
  focusArea?: FocusArea;
  focusAreaSource?: FocusAreaSource;
  createdAt?: string;
  updatedAt?: string;
  lastInteractedAt?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

export interface UserStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  essence: number;
  streak: number;
  questsCompleted: number;
  totalQuestsCompleted: number;
  tasksCompleted: number;
  notesCreated: number;
  lastActiveDate: string;
  lastQuestGenDate?: string;
  lastWeeklyGenDate?: string;
}

export type UserPreferences = UserProfilePreferences;

export interface Task {
  id: string;
  listId?: string;
  title: string;
  description?: string;
  completed: boolean;
  shoppingStatus?: 'pending' | 'purchased' | 'not_available';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  estimatedMinutes?: number;
  tags?: string[];
  notes?: string;
  sortOrder?: number;
  sourceType?: 'manual' | 'quick-add' | 'imported' | 'suggested';
  workflowStatus?: 'active' | 'today' | 'later' | 'someday';
  futureLinkTargets?: {
    dailyFocusCandidate?: boolean;
    questCandidate?: boolean;
    calendarCandidate?: boolean;
    habitCandidate?: boolean;
    goalCandidate?: boolean;
  };
  xpAwarded?: boolean;
  completedAt?: string;
  subtasks?: Task[];
  focusArea?: FocusArea;
  focusAreaSource?: FocusAreaSource;
  manualPriority?: number;
  createdAt?: string;
  updatedAt?: string;
  lastInteractedAt?: string;
  postponedCount?: number;
}

export interface TodoList {
  id: string;
  userId?: string;
  title?: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  type?: 'general' | 'todo' | 'shopping' | 'project' | 'ideas' | 'routine' | 'self-development' | 'default';
  archived?: boolean;
  pinned?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  targetGroupVisibility?: string[];
  tags?: string[];
  schemaVersion?: number;
  tasks: Task[];
}

export type { Book, ReadingEntry } from '@/lib/reading/types';

export type JournalEntry = ReflectionEntry;
export type { ReflectionEntry };

// ============ STORE ============

interface AppState {
  uid: string | null;
  userStats: UserStats;
  userPreferences: UserPreferences;
  preferencesLoaded: boolean;
  currentDayMode: DayModeKey;
  dayModeOverride?: DayModeKey;
  dayModeAutoSuggestion?: DayModeSuggestion;
  dayModeSuggestionDismissedAt?: string;
  dayModeLastChangedAt?: string;
  preferencesViewSection: PreferencesViewSection;
  preferencesDraft?: Partial<UserPreferences>;
  quests: Quest[];
  missions: Mission[];
  notes: Note[];
  noteFolders: NoteFolder[];
  achievements: Achievement[];
  lists: TodoList[];
  habitEntries: HabitEntry[];
  books: Book[];
  readingEntries: ReadingEntry[];
  readingViewFilter: ReadingViewFilter;
  readingSearchQuery: string;
  readingStatusFilter: 'all' | Book['status'];
  readingCategoryFilter: string;
  selectedBookId?: string;
  selectedReadingView?: ReadingSelectedView;
  readingLayoutMode?: ReadingLayoutMode;
  reflections: ReflectionEntry[];
  journalEntries: JournalEntry[];
  reflectionViewFilter: ReflectionViewFilter;
  reflectionTypeFilter: 'all' | ReflectionType;
  reflectionMoodFilter: 'all' | 1 | 2 | 3 | 4 | 5;
  selectedReflectionId?: string;
  selectedReflectionDate?: string;
  selectedReflectionView?: ReflectionSelectedView;
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  habitActivitySignals: HabitActivitySignal[];
  habitCandidates: HabitCandidate[];
  growthGoals: Goal[];
  habitsViewFilter: HabitsViewFilter;
  habitsSearchQuery: string;
  habitsCategoryFilter: string;
  habitsStatusFilter: HabitsStatusFilter;
  habitsTrackingModeFilter: HabitTrackingModeFilter;
  habitsTimeRangeFilter: HabitTimeRangeFilter;
  selectedHabitId?: string;
  selectedHabitView?: HabitSelectedView;
  habitsLayoutMode?: 'compact' | 'comfortable';
  goalsViewFilter: GoalsViewFilter;
  goalsSearchQuery: string;
  goalsTypeFilter: GoalsTypeFilter;
  goalsStatusFilter: GoalsStatusFilter;
  goalsPriorityFilter: GoalsPriorityFilter;
  selectedGoalId?: string;
  selectedGoalView?: SelectedGoalView;
  notesViewFilter: NotesViewFilter;
  notesSearchQuery: string;
  notesTypeFilter: NotesTypeFilter;
  notesFolderFilter: string;
  notesArchivedFilter: NotesArchivedFilter;
  selectedNoteId?: string;
  selectedNoteView?: NoteSelectedView;
  notesLayoutMode: NotesLayoutMode;
  listViewFilter: ListViewFilter;
  listSearchQuery: string;
  listItemsFilter: ListItemsFilter;
  listItemsSort: ListItemsSort;
  events: CalendarEvent[];
  currentCalendarView: CalendarView;
  selectedCalendarDate: string;
  calendarSearchQuery: string;
  calendarFilterType: 'all' | CalendarEventType;
  calendarFilterStatus: 'all' | CalendarEventStatus;
  calendarFilterCategory: string;
  selectedEventId?: string;
  missionViewFilter: MissionViewFilter;
  missionTypeFilter: 'all' | MissionType;
  missionStatusFilter: 'all' | MissionStatus;
  missionCategoryFilter: string;
  missionSearchQuery: string;
  selectedMissionId?: string;
  selectedMissionView?: MissionSelectedView;
  quickCaptureItems: QuickCaptureItem[];
  quickCaptureSearchQuery: string;
  quickCaptureStatusFilter: 'all' | QuickCaptureStatus;
  selectedQuickCaptureId?: string;
  quickCapturePanelOpen?: boolean;
  routingCandidates: RoutingCandidate[];
  routingReviewFilter: RoutingReviewFilter;
  selectedRoutingCandidateId?: string;
  routingPanelOpen?: boolean;
  onboardingStep: number;
  onboardingAnswers: OnboardingAnswerSet;
  onboardingCompleted: boolean;
  onboardingInProgress: boolean;
  onboardingResultProfile?: OnboardingResultProfile;
  dataLoaded: boolean;
  _unsubscribers: (() => void)[];

  // Initialization
  initializeForUser: (uid: string) => void;
  cleanup: () => void;

  // Quest actions
  addQuest: (quest: Omit<Quest, 'id'>) => Promise<void>;
  updateQuest: (questId: string, updates: Partial<Quest>) => Promise<void>;
  completeQuest: (questId: string) => Promise<void>;
  deleteQuest: (questId: string) => Promise<void>;
  addMission: (mission: Omit<Mission, 'id' | 'createdAt' | 'updatedAt' | 'schemaVersion'>) => Promise<void>;
  updateMission: (missionId: string, updates: Partial<Mission>) => Promise<void>;
  deleteMission: (missionId: string) => Promise<void>;
  completeMission: (missionId: string) => Promise<void>;
  skipMission: (missionId: string) => Promise<void>;
  archiveMission: (missionId: string) => Promise<void>;
  setMissionViewFilter: (view: MissionViewFilter) => void;
  setMissionTypeFilter: (type: 'all' | MissionType) => void;
  setMissionStatusFilter: (status: 'all' | MissionStatus) => void;
  setMissionCategoryFilter: (category: string) => void;
  setMissionSearchQuery: (query: string) => void;
  setSelectedMissionId: (missionId?: string) => void;
  setSelectedMissionView: (view?: MissionSelectedView) => void;
  addQuickCaptureItem: (payload: {
    rawInput: string;
    sourceType?: QuickCaptureItem['sourceType'];
    sourceContext?: string;
  }) => Promise<void>;
  updateQuickCaptureItem: (captureId: string, updates: Partial<QuickCaptureItem>) => Promise<void>;
  deleteQuickCaptureItem: (captureId: string) => Promise<void>;
  archiveQuickCaptureItem: (captureId: string) => Promise<void>;
  discardQuickCaptureItem: (captureId: string) => Promise<void>;
  setQuickCaptureSearchQuery: (query: string) => void;
  setQuickCaptureStatusFilter: (status: 'all' | QuickCaptureStatus) => void;
  setSelectedQuickCaptureId: (captureId?: string) => void;
  setQuickCapturePanelOpen: (open: boolean) => void;
  suggestQuickCaptureRouting: (rawInput: string) => {
    suggestedType?: QuickCaptureSuggestedType;
    suggestedTargetModule?: QuickCaptureTargetModule;
    confidence: number;
    reason: string;
  };
  confirmQuickCaptureRouting: (captureId: string, target: QuickCaptureTargetModule) => Promise<void>;
  generateRoutingCandidates: () => Promise<void>;
  addRoutingCandidate: (candidate: Omit<RoutingCandidate, 'id'>) => Promise<void>;
  dismissRoutingCandidate: (candidateId: string) => Promise<void>;
  acceptRoutingCandidate: (candidateId: string) => Promise<void>;
  expireRoutingCandidate: (candidateId: string) => Promise<void>;
  setRoutingReviewFilter: (filter: RoutingReviewFilter) => void;
  setSelectedRoutingCandidateId: (candidateId?: string) => void;
  setRoutingPanelOpen: (open: boolean) => void;

  // List actions
  addList: (list: Omit<TodoList, 'id' | 'tasks'>) => Promise<void>;
  updateList: (listId: string, updates: Partial<TodoList>) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  addTask: (listId: string, task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (listId: string, taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (listId: string, taskId: string) => Promise<void>;
  archiveList: (listId: string, archived?: boolean) => Promise<void>;
  pinList: (listId: string, pinned?: boolean) => Promise<void>;
  reorderLists: (orderedListIds: string[]) => Promise<void>;
  reorderListItems: (listId: string, orderedTaskIds: string[]) => Promise<void>;
  setListViewFilter: (view: ListViewFilter) => void;
  setListSearchQuery: (query: string) => void;
  setListItemsFilter: (filter: ListItemsFilter) => void;
  setListItemsSort: (sort: ListItemsSort) => void;

  // Note actions (domain: @/lib/notes)
  addNote: (note: NoteCreatePayload) => Promise<void>;
  updateNote: (noteId: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  archiveNote: (noteId: string, archived?: boolean) => Promise<void>;
  pinNote: (noteId: string, pinned?: boolean) => Promise<void>;
  addFolder: (folder: Omit<NoteFolder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateFolder: (folderId: string, updates: Partial<NoteFolder>) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  setNotesViewFilter: (view: NotesViewFilter) => void;
  setNotesSearchQuery: (query: string) => void;
  setNotesTypeFilter: (filter: NotesTypeFilter) => void;
  setNotesFolderFilter: (filter: string) => void;
  setNotesArchivedFilter: (filter: NotesArchivedFilter) => void;
  setSelectedNoteId: (noteId?: string) => void;
  setSelectedNoteView: (view?: NoteSelectedView) => void;
  setNotesLayoutMode: (mode: NotesLayoutMode) => void;
  touchNoteOpened: (noteId: string) => Promise<void>;

  // Event actions
  addEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  setEventStatus: (eventId: string, status: CalendarEventStatus) => Promise<void>;
  setSelectedCalendarDate: (date: string) => void;
  setCalendarView: (view: CalendarView) => void;
  setCalendarSearchQuery: (query: string) => void;
  setCalendarFilterType: (type: 'all' | CalendarEventType) => void;
  setCalendarFilterStatus: (status: 'all' | CalendarEventStatus) => void;
  setCalendarFilterCategory: (category: string) => void;
  setSelectedEventId: (eventId?: string) => void;

  // Achievement actions
  unlockAchievement: (achievementId: string) => Promise<void>;

  // Stats actions
  updateStats: (updates: Partial<UserStats>) => Promise<void>;

  // Book actions
  addBook: (book: Omit<Book, 'id'>) => Promise<void>;
  updateBook: (bookId: string, updates: Partial<Book>) => Promise<void>;
  deleteBook: (bookId: string) => Promise<void>;
  addReadingEntry: (entry: Omit<ReadingEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateReadingEntry: (entryId: string, updates: Partial<ReadingEntry>) => Promise<void>;
  deleteReadingEntry: (entryId: string) => Promise<void>;
  setBookStatus: (bookId: string, status: Book['status']) => Promise<void>;
  setReadingViewFilter: (view: ReadingViewFilter) => void;
  setReadingSearchQuery: (query: string) => void;
  setReadingStatusFilter: (status: 'all' | Book['status']) => void;
  setReadingCategoryFilter: (category: string) => void;
  setSelectedBookId: (bookId?: string) => void;
  setReadingLayoutMode: (layout: ReadingLayoutMode) => void;
  // legacy helper kept for compatibility with old UI
  logReading: (bookId: string, pagesRead: number, note?: string) => Promise<void>;

  // Journal actions
  addReflection: (entry: Omit<ReflectionEntry, 'id' | 'createdAt' | 'updatedAt' | 'schemaVersion'>) => Promise<void>;
  updateReflection: (entryId: string, updates: Partial<ReflectionEntry>) => Promise<void>;
  deleteReflection: (entryId: string) => Promise<void>;
  setReflectionViewFilter: (view: ReflectionViewFilter) => void;
  setReflectionTypeFilter: (filter: 'all' | ReflectionType) => void;
  setReflectionMoodFilter: (filter: 'all' | 1 | 2 | 3 | 4 | 5) => void;
  setSelectedReflectionId: (entryId?: string) => void;
  setSelectedReflectionDate: (date?: string) => void;
  setSelectedReflectionView: (view?: ReflectionSelectedView) => void;
  // legacy reflection aliases
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateJournalEntry: (entryId: string, updates: Partial<JournalEntry>) => Promise<void>;
  deleteJournalEntry: (entryId: string) => Promise<void>;

  // Habits actions (auto-first)
  addHabit: (habit: HabitCreatePayload) => Promise<void>;
  updateHabit: (habitId: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  archiveHabit: (habitId: string, archived?: boolean) => Promise<void>;
  setHabitActiveState: (habitId: string, active: boolean) => Promise<void>;
  addHabitCompletion: (completion: Omit<HabitCompletion, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateHabitCompletion: (completionId: string, updates: Partial<HabitCompletion>) => Promise<void>;
  deleteHabitCompletion: (completionId: string) => Promise<void>;
  toggleHabitCompletionForDate: (habitId: string, dateKey: string) => Promise<void>;
  ingestHabitActivitySignal: (signal: Omit<HabitActivitySignal, 'id'>) => Promise<void>;
  evaluateHabitCandidates: () => Promise<void>;
  promoteHabitCandidate: (candidateId: string) => Promise<void>;
  rebuildHabitCompletionsFromSignals: () => Promise<void>;
  setHabitsViewFilter: (view: HabitsViewFilter) => void;
  setHabitsSearchQuery: (query: string) => void;
  setHabitsCategoryFilter: (category: string) => void;
  setHabitsStatusFilter: (status: HabitsStatusFilter) => void;
  setHabitsTrackingModeFilter: (mode: HabitTrackingModeFilter) => void;
  setHabitsTimeRangeFilter: (range: HabitTimeRangeFilter) => void;
  setSelectedHabitId: (habitId?: string) => void;
  setSelectedHabitView: (view?: HabitSelectedView) => void;
  setHabitsLayoutMode: (layout: 'compact' | 'comfortable') => void;

  // Growth goals (domain: @/lib/goals)
  addGoal: (goal: GoalCreatePayload) => Promise<void>;
  updateGoal: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  archiveGoal: (goalId: string, archived?: boolean) => Promise<void>;
  setGoalStatus: (goalId: string, status: Goal['status']) => Promise<void>;
  addMilestone: (goalId: string, milestone: Pick<Milestone, 'title'> & Partial<Milestone>) => Promise<void>;
  updateMilestone: (goalId: string, milestoneId: string, updates: Partial<Milestone>) => Promise<void>;
  deleteMilestone: (goalId: string, milestoneId: string) => Promise<void>;
  reorderMilestones: (goalId: string, orderedMilestoneIds: string[]) => Promise<void>;
  toggleGrowthMilestone: (goalId: string, milestoneId: string) => Promise<void>;
  setGoalsViewFilter: (view: GoalsViewFilter) => void;
  setGoalsSearchQuery: (query: string) => void;
  setGoalsTypeFilter: (filter: GoalsTypeFilter) => void;
  setGoalsStatusFilter: (filter: GoalsStatusFilter) => void;
  setGoalsPriorityFilter: (filter: GoalsPriorityFilter) => void;
  setSelectedGoalId: (goalId?: string) => void;
  setSelectedGoalView: (view?: SelectedGoalView) => void;

  // Persona actions
  triggerQuestGeneration: (forceRegenerate?: boolean) => Promise<void>;
  loadUserPreferences: () => Promise<void>;
  updateUserPreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  setOnboardingAnswer: (updates: Partial<OnboardingAnswerSet>) => void;
  goToNextOnboardingStep: () => void;
  goToPreviousOnboardingStep: () => void;
  applyOnboardingProfile: (result: OnboardingResultProfile) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
  resetUserPreferencesSection: (section: PreferencesViewSection) => void;
  setPreferencesViewSection: (section: PreferencesViewSection) => void;
  savePreferencesDraft: (draft: Partial<UserPreferences>) => void;
  setDayMode: (mode: DayModeKey, options?: { override?: boolean }) => void;
  clearDayModeOverride: () => void;
  setSuggestedDayMode: (suggestion?: DayModeSuggestion) => void;
  computeDayModeSuggestion: () => DayModeSuggestion | undefined;
  refreshDayModeSuggestion: () => DayModeSuggestion | undefined;
  acceptSuggestedDayMode: () => void;
  dismissDayModeSuggestion: () => void;
  applyDayModeToDashboard: () => { mode: DayModeKey; changedAt?: string; override?: boolean };
}

const defaultStats: UserStats = {
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  essence: 50,
  streak: 0,
  questsCompleted: 0,
  totalQuestsCompleted: 0,
  tasksCompleted: 0,
  notesCreated: 0,
  lastActiveDate: '',
};

const defaultPreferences: UserPreferences = getDefaultUserPreferences();
const defaultDayMode: DayModeKey = getDefaultDayMode();

export const useAppStore = create<AppState>()((set, get) => {
  // ============ INTERNAL HELPERS ============

  let _dailyChecked = false;
  let _achievementsSeeded = false;
  let _questGenerationInProgress = false;
  let _dailyActivityDate = '';
  let _prefsLoaded = false;
  let _completedTasksCleanedUp = false;
  let _shoppingListEnsuring = false;

  /**
   * Removes completed tasks from all lists if they were completed before today.
   * Runs once per session on initialization after lists data arrives.
   */
  const cleanupCompletedTasks = async (uid: string, lists: import('@/stores/useAppStore').TodoList[]) => {
    const today = getLocalDateString();

    for (const list of lists) {
      const tasksToDelete = list.tasks.filter(
        (t) => t.completed && t.completedAt && t.completedAt < today
      );
      for (const task of tasksToDelete) {
        await dbService.deleteTask(uid, list.id, task.id);
      }
    }
  };

  /**
   * Reads the current persona ID from localStorage (zustand persist).
   */
  const getCurrentPersonaId = (): string => {
    try {
      const stored = localStorage.getItem('donezy-persona');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.state?.currentPersona?.id || 'student';
      }
    } catch { /* ignore */ }
    return 'student';
  };

  const getCalendarSignalCounts = (events: Array<{ date?: string; status?: string }>, today: string) => {
    let todayEventsCount = 0;
    let upcomingEventsCount = 0;
    for (const event of events) {
      if (!event?.date || event.status === 'cancelled') continue;
      if (event.date === today) todayEventsCount += 1;
      if (event.date >= today) upcomingEventsCount += 1;
    }
    return { todayEventsCount, upcomingEventsCount };
  };

  const computeDayModeSuggestionFromState = (): DayModeSuggestion | undefined => {
    const state = get();
    if (state.dayModeOverride) return undefined;

    const today = getLocalDateString();
    const lists = state.lists || [];
    const events = state.events || [];
    const goals = state.growthGoals || [];
    const habits = state.habits || [];
    const habitCompletions = state.habitCompletions || [];
    const missions = state.missions || [];

    const openTasksCount = getTotalOpenItems(lists as any);
    const highPriorityOpenItemsCount = getHighPriorityOpenItemsCount(lists as any);
    const overdueItemsCount = getOverdueItemsCount(lists as any);
    const activeGoalsCount = getActiveGoals(goals as any).length;
    const goalsNeedingAttentionCount = getGoalsNeedingAttention(goals as any).length;
    const habitsNeedingAttentionCount = getHabitsNeedingAttention(habits as any, habitCompletions as any).length;
    const activeMissionsCount = getActiveMissions(missions as any).length;
    const { todayEventsCount, upcomingEventsCount } = getCalendarSignalCounts(events as any, today);

    const loadIndicator = getDashboardLoadIndicator({
      openTasks: openTasksCount,
      upcomingEvents: upcomingEventsCount,
      activeGoals: activeGoalsCount,
      activeMissions: activeMissionsCount,
      attentionCount: goalsNeedingAttentionCount + habitsNeedingAttentionCount,
    });

    const suggestion = getDayModeSuggestion({
      loadLevel: loadIndicator.level,
      openTasksCount,
      highPriorityOpenItemsCount,
      overdueItemsCount,
      todayEventsCount,
      upcomingEventsCount,
      activeGoalsCount,
      goalsNeedingAttentionCount,
      habitsNeedingAttentionCount,
      activeMissionsCount,
      preferences: {
        productivityMode: state.userPreferences.productivityMode,
        overloadProtection: state.userPreferences.overloadProtection,
        defaultTimeHorizon: state.userPreferences.defaultTimeHorizon,
        missionVisibility: state.userPreferences.missionVisibility,
        targetGroup: state.userPreferences.targetGroup,
      },
    });

    if (!shouldShowDayModeSuggestion(suggestion)) return undefined;
    if (state.dayModeSuggestionDismissedAt === today) return undefined;
    return suggestion;
  };

  const normalizeCaptureText = (value: string): string =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim();

  const hasAnyCaptureKeyword = (text: string, keywords: string[]) => keywords.some((k) => text.includes(k));

  const inferPreferredList = (lists: TodoList[], rawInput: string): TodoList | undefined => {
    const text = normalizeCaptureText(rawInput);
    const shoppingWords = ['bevasar', 'bolt', 'venni', 'tej', 'kenyer', 'zoldseg', 'gyumolcs', 'kosar'];
    const homeWords = ['otthon', 'haz', 'takarit', 'mosas', 'mosogat', 'furdoszoba', 'konyha', 'pakolas'];
    const workWords = ['munka', 'projekt', 'hatarido', 'meeting', 'email', 'ugyfel'];
    const studyWords = ['tanulas', 'vizsga', 'hazi', 'jegyzet', 'ora', 'beadando'];

    const activeLists = lists.filter((list) => !list.archived);
    if (activeLists.length === 0) return undefined;

    let best: { list: TodoList; score: number } | undefined;
    for (const list of activeLists) {
      const name = normalizeCaptureText(list.title || list.name || '');
      let score = list.pinned ? 2 : 0;
      if (list.type === 'shopping' && hasAnyCaptureKeyword(text, shoppingWords)) score += 12;
      if (hasAnyCaptureKeyword(text, homeWords) && (name.includes('otthon') || name.includes('haz'))) score += 10;
      if (hasAnyCaptureKeyword(text, workWords) && (name.includes('munka') || name.includes('work') || name.includes('projekt'))) score += 8;
      if (hasAnyCaptureKeyword(text, studyWords) && (name.includes('tanul') || name.includes('study') || name.includes('iskola'))) score += 8;
      if (name && text.includes(name)) score += 10;
      if (score > (best?.score ?? -1)) best = { list, score };
    }
    return best?.score && best.score > 0 ? best.list : activeLists[0];
  };

  const suggestQuickCaptureRoutingSmart = (
    rawInput: string,
    ctx: {
      lists: TodoList[];
      goals: Goal[];
      habits: Habit[];
      missions: Mission[];
      notesCount: number;
      notesInboxBehavior: UserPreferences['notesInboxBehavior'];
      defaultTimeHorizon: UserPreferences['defaultTimeHorizon'];
    }
  ) => {
    const base = suggestQuickCaptureRouting(rawInput);
    const text = normalizeCaptureText(rawInput);
    const sentenceBreaks = (rawInput.match(/[.!?]/g) || []).length;
    const commaCount = (rawInput.match(/[,;]/g) || []).length;
    const wordCount = rawInput.trim().split(/\s+/).filter(Boolean).length;
    const isVeryShort = wordCount >= 1 && wordCount <= 3;
    const isLong =
      rawInput.trim().length >= 70 ||
      wordCount >= 14 ||
      rawInput.includes('\n') ||
      sentenceBreaks >= 2 ||
      commaCount >= 3;
    const noteIntentWords = [
      'otlet',
      'gondolat',
      'jegyzet',
      'osszefoglal',
      'reszletes',
      'miert',
      'tanulsag',
      'elgondolas',
      'naplo',
    ];
    const hasNoteIntent = hasAnyCaptureKeyword(text, noteIntentWords);
    const hasTimeIntent = hasAnyCaptureKeyword(text, [
      'holnap',
      'ma',
      'hetfo',
      'kedd',
      'szerda',
      'csutortok',
      'pentek',
      'szombat',
      'vasarnap',
      'ora',
      ':',
    ]);
    const listContextWords = ['bevasar', 'venni', 'teendo', 'feladat', 'otthon', 'haz', 'munka', 'tanulas', 'lista', 'todo'];
    const hasStrongListIntent = hasAnyCaptureKeyword(text, listContextWords);
    const prefersSimpleInbox = ctx.notesInboxBehavior === 'simple';
    const prefersStructuredInbox = ctx.notesInboxBehavior === 'structured';

    if (isLong || hasNoteIntent) {
      return {
        ...base,
        suggestedType: 'note' as QuickCaptureSuggestedType,
        suggestedTargetModule: 'notes' as QuickCaptureTargetModule,
        confidence: isLong ? 0.93 : 0.84,
        reason: isLong ? 'long-freeform-text' : 'note-intent-keywords',
      };
    }

    if (hasTimeIntent || (ctx.defaultTimeHorizon === 'today' && hasAnyCaptureKeyword(text, ['ma', 'holnap', 'delutan', 'este']))) {
      return {
        ...base,
        suggestedType: 'event_seed' as QuickCaptureSuggestedType,
        suggestedTargetModule: 'calendar' as QuickCaptureTargetModule,
        confidence: 0.85,
        reason: 'time-intent-detected',
      };
    }

    for (const goal of ctx.goals.filter((g) => !g.archived && g.status !== 'completed')) {
      const title = normalizeCaptureText(goal.title);
      if (title && text.includes(title)) {
        return {
          ...base,
          suggestedType: 'goal_seed' as QuickCaptureSuggestedType,
          suggestedTargetModule: 'goals' as QuickCaptureTargetModule,
          confidence: 0.86,
          reason: `goal-context:${goal.title}`,
          extractedMetadata: {
            matchedEntityType: 'goal',
            matchedEntityId: goal.id,
            matchedEntityName: goal.title,
          },
        };
      }
    }

    for (const habit of ctx.habits.filter((h) => h.active && !h.archived)) {
      const title = normalizeCaptureText(habit.title);
      if (title && text.includes(title)) {
        return {
          ...base,
          suggestedType: 'habit_seed' as QuickCaptureSuggestedType,
          suggestedTargetModule: 'habits' as QuickCaptureTargetModule,
          confidence: 0.82,
          reason: `habit-context:${habit.title}`,
          extractedMetadata: {
            matchedEntityType: 'habit',
            matchedEntityId: habit.id,
            matchedEntityName: habit.title,
          },
        };
      }
    }

    for (const mission of ctx.missions.filter((m) => m.status !== 'completed' && !m.archived)) {
      const title = normalizeCaptureText(mission.title);
      if (title && text.includes(title)) {
        return {
          ...base,
          suggestedType: 'mission_seed' as QuickCaptureSuggestedType,
          suggestedTargetModule: 'missions' as QuickCaptureTargetModule,
          confidence: 0.8,
          reason: `mission-context:${mission.title}`,
          extractedMetadata: {
            matchedEntityType: 'mission',
            matchedEntityId: mission.id,
            matchedEntityName: mission.title,
          },
        };
      }
    }

    const preferredList = inferPreferredList(ctx.lists, rawInput);
    if (isVeryShort && preferredList && !hasTimeIntent && !hasNoteIntent && prefersStructuredInbox) {
      return {
        ...base,
        suggestedType: 'list_item' as QuickCaptureSuggestedType,
        suggestedTargetModule: 'lists' as QuickCaptureTargetModule,
        confidence: Math.max(base.confidence, 0.82),
        reason: `short-input-list-default:${preferredList.title || preferredList.name}`,
        extractedMetadata: {
          ...(base.extractedMetadata || {}),
          suggestedListId: preferredList.id,
          suggestedListName: preferredList.title || preferredList.name,
        },
      };
    }

    if (preferredList && hasStrongListIntent) {
      return {
        ...base,
        suggestedType: 'list_item' as QuickCaptureSuggestedType,
        suggestedTargetModule: 'lists' as QuickCaptureTargetModule,
        confidence: Math.max(base.confidence, 0.78),
        reason: `list-context:${preferredList.title || preferredList.name}`,
        extractedMetadata: {
          ...(base.extractedMetadata || {}),
          suggestedListId: preferredList.id,
          suggestedListName: preferredList.title || preferredList.name,
        },
      };
    }

    // If no strong intent matched, avoid forcing lists.
    return {
      ...base,
      suggestedType: 'note',
      suggestedTargetModule: 'notes',
      confidence: Math.max(prefersSimpleInbox ? 0.7 : 0.58, base.confidence),
      reason: prefersSimpleInbox ? 'default-to-notes-simple-inbox' : 'default-to-notes-when-unclear',
    };
  };

  /**
   * Core XP processing: awards XP, handles level-ups (with essence bonus),
   * updates stats in Firebase, and checks achievements.
   * Also handles daily activity tracking — the streak only updates
   * when the user performs a real action (not just a page visit).
   */
  const processAction = async (
    xpGained: number,
    options: {
      essenceGained?: number;
      statUpdates?: Partial<UserStats>;
    } = {}
  ) => {
    const { uid, userStats } = get();
    if (!uid) return;

    // --- Daily activity check (first real action of the day updates streak) ---
    let dailyBonusXp = 0;
    let dailyStatUpdates: Partial<UserStats> = {};
    const today = getLocalDateString();

    if (_dailyActivityDate !== today && userStats.lastActiveDate !== today) {
      _dailyActivityDate = today;

      const yesterday = getLocalYesterday();
      const newStreak =
        userStats.lastActiveDate === yesterday
          ? userStats.streak + 1
          : 1;

      const streakBonus = Math.min(
        newStreak * DAILY_LOGIN_STREAK_BONUS,
        DAILY_LOGIN_MAX_BONUS
      );
      dailyBonusXp = DAILY_LOGIN_BASE_XP + streakBonus;
      dailyStatUpdates = {
        lastActiveDate: today,
        streak: newStreak,
      };

      // Notify daily activity
      if (newStreak > 1) {
        toast.success(
          `Napi aktivitás! ${newStreak} napos sorozat! +${dailyBonusXp} XP`,
          { duration: 4000 }
        );
      } else {
        toast.success(`Napi aktivitás! +${dailyBonusXp} XP`, { duration: 3000 });
      }
    }

    // Calculate new XP and handle level-ups
    let xp = userStats.xp + xpGained + dailyBonusXp;
    let level = userStats.level;
    let xpToNextLevel = userStats.xpToNextLevel;
    let lvlUpEssence = 0;

    while (xp >= xpToNextLevel) {
      xp -= xpToNextLevel;
      level++;
      xpToNextLevel = Math.floor(xpToNextLevel * 1.2);
      lvlUpEssence += levelUpEssenceBonus(level);
    }

    const totalNewEssence =
      userStats.essence + (options.essenceGained || 0) + lvlUpEssence;

    // Build unified stats update
    const statsUpdate: Partial<UserStats> = {
      xp,
      level,
      xpToNextLevel,
      essence: totalNewEssence,
      ...dailyStatUpdates,
      ...(options.statUpdates || {}),
    };

    // Write to Firebase
    await dbService.updateStats(uid, statsUpdate);

    // Notify level-up
    if (level > userStats.level) {
      toast.success(
        `Szintlépés! Elérted a ${level}. szintet! +${lvlUpEssence} Essence`,
        { duration: 5000 }
      );
    }

    // Check achievements with computed new stats
    const newStats: UserStats = { ...userStats, ...statsUpdate };
    await checkAchievements(newStats);
  };

  /**
   * Checks all achievement definitions against current stats.
   * Unlocks newly completed achievements and awards essence.
   * Updates progress on in-progress achievements.
   */
  const checkAchievements = async (newStats: UserStats) => {
    const { uid, achievements } = get();
    if (!uid || achievements.length === 0) return;

    const statsForCheck: AchievementStats = {
      level: newStats.level,
      totalQuestsCompleted: newStats.totalQuestsCompleted || 0,
      tasksCompleted: newStats.tasksCompleted || 0,
      notesCreated: newStats.notesCreated || 0,
      streak: newStats.streak || 0,
    };

    let totalEssenceEarned = 0;

    for (const def of ACHIEVEMENTS) {
      const existing = achievements.find((a) => a.id === def.id);
      if (!existing || existing.unlockedAt) continue; // Skip if not seeded or already unlocked

      const progress = def.condition(statsForCheck);

      if (progress >= def.maxProgress) {
        // Unlock achievement
        const essenceReward = ACHIEVEMENT_ESSENCE[def.rarity] || 0;
        await dbService.updateAchievementData(uid, def.id, {
          progress: def.maxProgress,
          unlockedAt: new Date().toISOString(),
        });
        totalEssenceEarned += essenceReward;

        toast.success(`Eredmény feloldva: ${def.title}! +${essenceReward} Essence`, {
          duration: 5000,
        });
      } else if ((existing.progress || 0) < progress) {
        // Update progress
        await dbService.updateAchievementData(uid, def.id, { progress });
      }
    }

    // Award essence from achievements
    if (totalEssenceEarned > 0) {
      const currentEssence = newStats.essence;
      await dbService.updateStats(uid, {
        essence: currentEssence + totalEssenceEarned,
      });
    }
  };

  /**
   * Updates progress on active weekly progress-based quests for a given tracking type.
   * Auto-completes the quest and awards rewards when the target is reached.
   */
  const updateWeeklyQuestProgress = async (trackingType: 'tasks_completed' | 'quests_completed' | 'notes_created') => {
    const { uid, quests, userStats } = get();
    if (!uid) return;

    const persona = getCurrentPersonaId();
    const activeProgressQuests = quests.filter(
      (q) => q.generated && q.questType === 'weekly' && !q.completed &&
        q.trackingType === trackingType && q.targetCount &&
        (!q.persona || q.persona === persona)
    );

    for (const quest of activeProgressQuests) {
      const newProgress = (quest.currentProgress || 0) + 1;

      if (newProgress >= quest.targetCount!) {
        // Target reached → auto-complete the quest!
        await dbService.updateQuest(uid, quest.id, {
          currentProgress: quest.targetCount,
          completed: true,
          completedAt: getLocalDateString() + 'T' + new Date().toTimeString().slice(0, 8),
        });

        // Award XP + essence
        await processAction(quest.xpReward, {
          essenceGained: quest.essenceReward,
          statUpdates: {
            questsCompleted: userStats.questsCompleted + 1,
            totalQuestsCompleted: userStats.totalQuestsCompleted + 1,
          },
        });

        toast.success(`Heti küldetés teljesítve: ${quest.title}! 🎉`, { duration: 4000 });
      } else {
        // Just update progress
        await dbService.updateQuest(uid, quest.id, {
          currentProgress: newProgress,
        });
      }
    }
  };

  /**
   * Generates daily and/or weekly quests if not already generated for the
   * current persona + day/week. Quests are cached per persona — switching
   * persona preserves previously generated quests so users cannot exploit
   * repeated switching to get fresh quests.
   */
  const generateQuestsIfNeeded = async (stats: UserStats) => {
    // Prevent concurrent generation calls
    if (_questGenerationInProgress) return;
    _questGenerationInProgress = true;

    try {
      const { uid, lists } = get();
      if (!uid) return;

      const today = getLocalDateString();
      const persona = getCurrentPersonaId();
      const interests = get().userPreferences.interests || [];
      const prefFrequency = get().userPreferences.questFrequency || 'medium';

      // Re-read quests from store (they may have loaded since the timeout was scheduled)
      const quests = get().quests;
      const genOptions = { persona, level: stats.level, quests, lists, uid, date: today, interests, questFrequency: prefFrequency };

      // --- Cleanup: old completed quests + old uncompleted dailies + old weeklies ---
      const mondayOfWeek = getLocalMondayOfWeek(today);
      const sundayOfWeek = getLocalSundayOfWeek(today);

      const oldCompletedQuests = quests.filter(
        (q) => q.completed && q.completedAt && !q.completedAt.startsWith(today)
      );
      const oldUncompletedDaily = quests.filter(
        (q) => q.generated && q.questType === 'daily' && q.dueDate && q.dueDate !== today && !q.completed
      );
      const oldUncompletedWeekly = quests.filter(
        (q) => q.generated && q.questType === 'weekly' && q.dueDate && q.dueDate < mondayOfWeek && !q.completed
      );

      for (const q of [...oldCompletedQuests, ...oldUncompletedDaily, ...oldUncompletedWeekly]) {
        await dbService.deleteQuest(uid, q.id);
      }

      // --- Daily Quests ---
      // Check persona and preference quests independently so missing ones get generated
      const dailyForToday = quests.filter(
        (q) => q.generated && q.questType === 'daily' && q.dueDate === today && q.persona === persona
      );
      const hasPersonaDaily = dailyForToday.some((q) => q.questSource !== 'preference');
      const existingDailyPrefGroups = new Set(
        dailyForToday.filter((q) => q.questSource === 'preference').map((q) => q.preferenceGroup)
      );
      const missingDailyInterests = interests.filter((i) => !existingDailyPrefGroups.has(i));

      if (!hasPersonaDaily || missingDailyInterests.length > 0) {
        // Generate quests only for what's missing (persona if needed, preference for missing interests)
        const dailyQuests = generateDailyQuests({
          ...genOptions,
          interests: missingDailyInterests,
        });
        // Filter: keep persona quests only if persona daily didn't exist yet
        const questsToSave = dailyQuests.filter((q) => {
          if (q.questSource !== 'preference') return !hasPersonaDaily;
          return true; // all preference quests for missingDailyInterests are needed
        });
        for (const quest of questsToSave) {
          const now = new Date().toISOString();
          await dbService.addQuest(uid, {
            ...coalesceFocusArea(
              quest,
              inferFocusArea({
                title: quest.title,
                description: quest.description,
                category: quest.category,
                persona: quest.persona,
              })
            ),
            createdAt: now,
            updatedAt: now,
            lastInteractedAt: now,
            postponedCount: quest.postponedCount || 0,
          });
        }
        if (questsToSave.length > 0) {
          toast.success(`${questsToSave.length} új napi küldetés generálva!`, { duration: 3000 });
        }
      }

      // --- Weekly Quests ---
      const weeklyThisWeek = quests.filter(
        (q) => q.generated && q.questType === 'weekly' &&
          q.dueDate && q.dueDate >= mondayOfWeek && q.dueDate <= sundayOfWeek &&
          q.persona === persona
      );
      const hasPersonaWeekly = weeklyThisWeek.some((q) => q.questSource !== 'preference');
      const existingWeeklyPrefGroups = new Set(
        weeklyThisWeek.filter((q) => q.questSource === 'preference').map((q) => q.preferenceGroup)
      );
      const missingWeeklyInterests = interests.filter((i) => !existingWeeklyPrefGroups.has(i));

      if (!hasPersonaWeekly || missingWeeklyInterests.length > 0) {
        const weeklyQuests = generateWeeklyQuests({
          ...genOptions,
          interests: missingWeeklyInterests,
        });
        const weeklyToSave = weeklyQuests.filter((q) => {
          if (q.questSource !== 'preference') return !hasPersonaWeekly;
          return true;
        });
        for (const quest of weeklyToSave) {
          const now = new Date().toISOString();
          await dbService.addQuest(uid, {
            ...coalesceFocusArea(
              quest,
              inferFocusArea({
                title: quest.title,
                description: quest.description,
                category: quest.category,
                persona: quest.persona,
              })
            ),
            createdAt: now,
            updatedAt: now,
            lastInteractedAt: now,
            postponedCount: quest.postponedCount || 0,
          });
        }
        if (weeklyToSave.length > 0) {
          toast.success(`${weeklyToSave.length} új heti küldetés generálva!`, { duration: 3000 });
        }
      }
    } finally {
      _questGenerationInProgress = false;
    }
  };

  // ============ STORE DEFINITION ============

  return {
    uid: null,
    userStats: defaultStats,
    userPreferences: defaultPreferences,
    preferencesLoaded: false,
    currentDayMode: defaultDayMode,
    dayModeOverride: undefined,
    dayModeAutoSuggestion: undefined,
    dayModeSuggestionDismissedAt: undefined,
    dayModeLastChangedAt: undefined,
    preferencesViewSection: 'profile-target-group',
    preferencesDraft: undefined,
    quests: [],
    missions: [],
    notes: [],
    noteFolders: [],
    achievements: [],
    lists: [],
    habitEntries: [],
    books: [],
    readingEntries: [],
    readingViewFilter: 'bookshelf',
    readingSearchQuery: '',
    readingStatusFilter: 'all',
    readingCategoryFilter: 'all',
    selectedBookId: undefined,
    selectedReadingView: 'bookshelf',
    readingLayoutMode: 'bookshelf',
    reflections: [],
    journalEntries: [],
    reflectionViewFilter: 'all',
    reflectionTypeFilter: 'all',
    reflectionMoodFilter: 'all',
    selectedReflectionId: undefined,
    selectedReflectionDate: undefined,
    selectedReflectionView: 'list',
    habits: [],
    habitCompletions: [],
    habitActivitySignals: [],
    habitCandidates: [],
    growthGoals: [],
    habitsViewFilter: 'active',
    habitsSearchQuery: '',
    habitsCategoryFilter: 'all',
    habitsStatusFilter: 'all',
    habitsTrackingModeFilter: 'all',
    habitsTimeRangeFilter: '30d',
    selectedHabitId: undefined,
    selectedHabitView: 'list',
    habitsLayoutMode: 'comfortable',
    goalsViewFilter: 'active',
    goalsSearchQuery: '',
    goalsTypeFilter: 'all',
    goalsStatusFilter: 'all',
    goalsPriorityFilter: 'all',
    selectedGoalId: undefined,
    selectedGoalView: 'list',
    notesViewFilter: 'all',
    notesSearchQuery: '',
    notesTypeFilter: 'all',
    notesFolderFilter: 'all',
    notesArchivedFilter: 'active',
    selectedNoteId: undefined,
    selectedNoteView: 'list',
    notesLayoutMode: 'comfortable',
    listViewFilter: 'all',
    listSearchQuery: '',
    listItemsFilter: 'all',
    listItemsSort: 'manual',
    events: [],
    currentCalendarView: 'month',
    selectedCalendarDate: getLocalDateString(),
    calendarSearchQuery: '',
    calendarFilterType: 'all',
    calendarFilterStatus: 'all',
    calendarFilterCategory: 'all',
    selectedEventId: undefined,
    missionViewFilter: 'focus',
    missionTypeFilter: 'all',
    missionStatusFilter: 'all',
    missionCategoryFilter: 'all',
    missionSearchQuery: '',
    selectedMissionId: undefined,
    selectedMissionView: 'list',
    quickCaptureItems: [],
    quickCaptureSearchQuery: '',
    quickCaptureStatusFilter: 'all',
    selectedQuickCaptureId: undefined,
    quickCapturePanelOpen: false,
    routingCandidates: [],
    routingReviewFilter: 'all',
    selectedRoutingCandidateId: undefined,
    routingPanelOpen: false,
    onboardingStep: 0,
    onboardingAnswers: normalizeOnboardingAnswers(undefined),
    onboardingCompleted: defaultPreferences.onboardingCompleted,
    onboardingInProgress: !defaultPreferences.onboardingCompleted,
    onboardingResultProfile: undefined,
    dataLoaded: false,
    _unsubscribers: [],

    // ============ INITIALIZATION ============

    initializeForUser: (uid: string) => {
      // Clean up any existing subscriptions
      get()._unsubscribers.forEach((unsub) => unsub());
      _dailyChecked = false;
      _achievementsSeeded = false;
      _questGenerationInProgress = false;
      _dailyActivityDate = '';
      _completedTasksCleanedUp = false;
      _shoppingListEnsuring = false;

      const unsubscribers: (() => void)[] = [];

      // Subscribe to stats (with daily login check on first load)
      unsubscribers.push(
        dbService.subscribeToStats(uid, (stats) => {
          const mergedStats = stats
            ? { ...defaultStats, ...stats }
            : defaultStats;
          set({ userStats: mergedStats });

          // Generate quests once after first data load
          if (!_dailyChecked) {
            _dailyChecked = true;

            // Schedule quest generation independently (wait for other data to load)
            setTimeout(() => {
              // Don't auto-generate if preferences haven't loaded or onboarding isn't done.
              // Onboarding will call triggerQuestGeneration() after completion.
              if (!_prefsLoaded || !get().userPreferences.onboardingCompleted) return;
              const currentStats = get().userStats;
              generateQuestsIfNeeded(currentStats);
            }, 3000);
          }
        })
      );

      // Subscribe to quests
      unsubscribers.push(
        dbService.subscribeToQuests(uid, (quests) => {
          const patched = quests.map((quest) =>
            coalesceFocusArea(
              quest,
              inferFocusArea({
                title: quest.title,
                description: quest.description,
                category: quest.category,
                persona: quest.persona,
              })
            )
          );
          const missions = patched.map((quest) =>
            normalizeMission(
              {
                id: quest.id,
                userId: uid,
                title: quest.title,
                description: quest.description,
                type: quest.questType === 'weekly' ? 'weekly' : 'daily',
                difficulty: quest.difficulty === 'hard' ? 'hard' : quest.difficulty === 'easy' ? 'easy' : 'medium',
                category: quest.category,
                estimatedMinutes: quest.estimatedTime || 0,
                rewardXp: quest.xpReward,
                priority: quest.manualPriority && quest.manualPriority >= 80 ? 'high' : quest.manualPriority && quest.manualPriority <= 30 ? 'low' : 'medium',
                status: quest.completed ? 'completed' : 'active',
                createdAt: quest.createdAt,
                updatedAt: quest.updatedAt,
                completedAt: quest.completedAt,
                sourceType: quest.sourceType === 'manual' ? 'manual' : 'generated',
                futureOriginReference: quest.futureOriginReference ? {
                  module: quest.futureOriginReference.module as any,
                  entityId: quest.futureOriginReference.id,
                  note: quest.futureOriginReference.note,
                } : undefined,
                futureLinkTargets: {
                  dashboardFocusCandidate: quest.futureLinkTargets?.dashboardCandidate,
                  guidanceRankCandidate: quest.futureLinkTargets?.guidanceCandidate,
                },
                schemaVersion: 2,
              },
              uid
            )
          );
          set({ quests: patched, missions });
        })
      );

      // Subscribe to lists (with daily cleanup of completed tasks)
      unsubscribers.push(
        dbService.subscribeToLists(uid, (lists) => {
          const patchedLists = lists.map((list, listIndex) => {
            const resolvedType =
              list.type ||
              (list.name.toLowerCase().includes('bevásárl') ? 'shopping' : 'general');
            const resolvedTitle = list.title || list.name;
            const resolvedName = list.name || list.title || 'Névtelen lista';
            return {
              ...list,
              title: resolvedTitle,
              name: resolvedName,
              description: list.description || '',
              icon: list.icon || DEFAULT_LIST_ICON,
              schemaVersion: LISTS_SCHEMA_VERSION,
              archived: Boolean(list.archived),
              pinned: Boolean(list.pinned),
              sortOrder: Number.isFinite(list.sortOrder) ? list.sortOrder : listIndex,
              tags: Array.isArray(list.tags) ? list.tags : [],
              targetGroupVisibility: Array.isArray(list.targetGroupVisibility) ? list.targetGroupVisibility : ['all'],
              type: resolvedType,
              tasks: list.tasks.map((task, taskIndex) =>
                ({
                  ...coalesceFocusArea(
                    task,
                    inferFocusArea({
                      title: task.title,
                      category: resolvedName,
                    })
                  ),
                  listId: list.id,
                  description: task.description || '',
                  estimatedMinutes: task.estimatedMinutes,
                  tags: Array.isArray(task.tags) ? task.tags : [],
                  notes: task.notes,
                  sortOrder: Number.isFinite(task.sortOrder) ? task.sortOrder : taskIndex,
                  sourceType: task.sourceType || 'manual',
                  workflowStatus: task.workflowStatus || 'active',
                  futureLinkTargets: task.futureLinkTargets || {},
                  shoppingStatus:
                    resolvedType === 'shopping'
                      ? (task.shoppingStatus || (task.completed ? 'purchased' : 'pending'))
                      : task.shoppingStatus,
                })
              ),
            };
          });
          set({ lists: patchedLists });
          if (
            !_shoppingListEnsuring &&
            !patchedLists.some((list) => list.type === 'shopping' || list.name.toLowerCase().includes('bevásárl'))
          ) {
            _shoppingListEnsuring = true;
            dbService
              .addList(uid, {
                title: 'Bevásárlás',
                name: 'Bevásárlás',
                description: '',
                color: '#34D399',
                icon: 'shopping-cart',
                type: 'shopping',
                archived: false,
                pinned: true,
                sortOrder: 0,
                targetGroupVisibility: ['all'],
                tags: ['shopping'],
                schemaVersion: LISTS_SCHEMA_VERSION,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              })
              .finally(() => {
                _shoppingListEnsuring = false;
              });
          }
          if (!_completedTasksCleanedUp) {
            _completedTasksCleanedUp = true;
            cleanupCompletedTasks(uid, patchedLists);
          }
        })
      );

      // Subscribe to notes
      unsubscribers.push(
        dbService.subscribeToNotes(uid, (notes) => {
          set({ notes });
        })
      );

      unsubscribers.push(
        dbService.subscribeToNoteFolders(uid, (noteFolders) => {
          set({ noteFolders });
        })
      );

      // Subscribe to events
      unsubscribers.push(
        dbService.subscribeToEvents(uid, (events) => {
          const patched = events.map((event) =>
            coalesceFocusArea(
              normalizeCalendarEvent(event, uid),
              inferFocusArea({
                title: event.title,
                description: event.description,
                category: event.category,
              })
            ) as CalendarEvent
          );
          set({ events: patched });
        })
      );

      // Subscribe to quick capture inbox
      unsubscribers.push(
        dbService.subscribeToQuickCaptureItems(uid, (quickCaptureItems) => {
          set({ quickCaptureItems });
        })
      );
      unsubscribers.push(
        dbService.subscribeToRoutingCandidates(uid, (routingCandidates) => {
          set({ routingCandidates });
        })
      );

      // Subscribe to achievements (with seeding for new users)
      unsubscribers.push(
        dbService.subscribeToAchievements(uid, (achievements) => {
          if (achievements.length === 0 && !_achievementsSeeded) {
            _achievementsSeeded = true;
            dbService.seedAchievements(uid, ACHIEVEMENTS);
            return; // Subscription will fire again with seeded data
          }
          set({ achievements });
        })
      );

      // Subscribe to habit entries (automatic habit tracking)
      unsubscribers.push(
        dbService.subscribeToHabitEntries(uid, (entries) => {
          set({ habitEntries: entries });
        })
      );

      // Subscribe to books (reading journal)
      unsubscribers.push(
        dbService.subscribeToBooks(uid, (books) => {
          set({ books });
        })
      );

      // Subscribe to reading entries
      unsubscribers.push(
        dbService.subscribeToReadingLogs(uid, (logs) => {
          set({ readingEntries: logs.map((row) => normalizeReadingEntry(row as any)) });
        })
      );

      // Subscribe to journal entries (daily reflection)
      unsubscribers.push(
        dbService.subscribeToJournalEntries(uid, (entries) => {
          const patched = entries.map((entry) => normalizeReflectionEntry(entry as any, uid));
          set({ journalEntries: patched, reflections: patched });
        })
      );

      // Subscribe to habits v2 entities
      unsubscribers.push(
        dbService.subscribeToHabits(uid, (habits) => {
          set({ habits });
        })
      );
      unsubscribers.push(
        dbService.subscribeToHabitCompletions(uid, (habitCompletions) => {
          set({ habitCompletions });
        })
      );
      unsubscribers.push(
        dbService.subscribeToHabitActivitySignals(uid, (habitActivitySignals) => {
          set({ habitActivitySignals });
        })
      );
      unsubscribers.push(
        dbService.subscribeToHabitCandidates(uid, (habitCandidates) => {
          set({ habitCandidates });
        })
      );

      // Legacy fallback stream: previous app versions stored daily habit-like entries.
      unsubscribers.push(
        dbService.subscribeToHabitEntries(uid, (entries) => {
          const mapped = entries.map((entry) =>
            normalizeHabitActivitySignal(
              {
                id: `legacy-${entry.id}`,
                eventType:
                  entry.source === 'reading'
                    ? 'reading_log_added'
                    : entry.source === 'event'
                      ? 'calendar_event_completed'
                      : entry.source === 'task'
                        ? 'list_item_completed'
                        : 'planning_activity',
                sourceModule: entry.source,
                referenceId: entry.id,
                occurredAt: `${entry.completedAt}T12:00:00.000Z`,
                dateKey: entry.completedAt,
                metadata: { title: entry.title, category: entry.category, legacy: true },
              },
              uid
            )
          );
          const current = get().habitActivitySignals || [];
          const merged = [...current.filter((s) => !String(s.id).startsWith('legacy-')), ...mapped];
          set({ habitActivitySignals: merged });
        })
      );

      // Subscribe to growth goals (self-development milestones)
      unsubscribers.push(
        dbService.subscribeToGrowthGoals(uid, (goals) => {
          set({ growthGoals: goals });
        })
      );

      // Subscribe to user preferences (onboarding, interests, etc.)
      unsubscribers.push(
        dbService.subscribeToPreferences(uid, (prefs) => {
          _prefsLoaded = true;
          const normalized = normalizeUserPreferences((prefs || undefined) as UserProfilePreferences | undefined, uid);
          set({
            userPreferences: normalized,
            preferencesLoaded: true,
            onboardingCompleted: normalized.onboardingCompleted,
            onboardingInProgress: !normalized.onboardingCompleted,
          });
        })
      );

      set({ uid, _unsubscribers: unsubscribers, dataLoaded: true });
    },

    cleanup: () => {
      get()._unsubscribers.forEach((unsub) => unsub());
      _dailyChecked = false;
      _achievementsSeeded = false;
      _questGenerationInProgress = false;
      _dailyActivityDate = '';
      _prefsLoaded = false;
      _completedTasksCleanedUp = false;
      _shoppingListEnsuring = false;
      set({
        uid: null,
        userStats: defaultStats,
        userPreferences: defaultPreferences,
        preferencesLoaded: false,
        currentDayMode: defaultDayMode,
        dayModeOverride: undefined,
        dayModeAutoSuggestion: undefined,
        dayModeSuggestionDismissedAt: undefined,
        dayModeLastChangedAt: undefined,
        preferencesViewSection: 'profile-target-group',
        preferencesDraft: undefined,
        quests: [],
        missions: [],
        notes: [],
        noteFolders: [],
        achievements: [],
        lists: [],
        habitEntries: [],
        books: [],
        readingEntries: [],
        readingViewFilter: 'bookshelf',
        readingSearchQuery: '',
        readingStatusFilter: 'all',
        readingCategoryFilter: 'all',
        selectedBookId: undefined,
        selectedReadingView: 'bookshelf',
        readingLayoutMode: 'bookshelf',
        reflections: [],
        journalEntries: [],
        reflectionViewFilter: 'all',
        reflectionTypeFilter: 'all',
        reflectionMoodFilter: 'all',
        selectedReflectionId: undefined,
        selectedReflectionDate: undefined,
        selectedReflectionView: 'list',
        habits: [],
        habitCompletions: [],
        habitActivitySignals: [],
        habitCandidates: [],
        growthGoals: [],
        habitsViewFilter: 'active',
        habitsSearchQuery: '',
        habitsCategoryFilter: 'all',
        habitsStatusFilter: 'all',
        habitsTrackingModeFilter: 'all',
        habitsTimeRangeFilter: '30d',
        selectedHabitId: undefined,
        selectedHabitView: 'list',
        habitsLayoutMode: 'comfortable',
        goalsViewFilter: 'active',
        goalsSearchQuery: '',
        goalsTypeFilter: 'all',
        goalsStatusFilter: 'all',
        goalsPriorityFilter: 'all',
        selectedGoalId: undefined,
        selectedGoalView: 'list',
        notesViewFilter: 'all',
        notesSearchQuery: '',
        notesTypeFilter: 'all',
        notesFolderFilter: 'all',
        notesArchivedFilter: 'active',
        selectedNoteId: undefined,
        selectedNoteView: 'list',
        notesLayoutMode: 'comfortable',
        listViewFilter: 'all',
        listSearchQuery: '',
        listItemsFilter: 'all',
        listItemsSort: 'manual',
        events: [],
        currentCalendarView: 'month',
        selectedCalendarDate: getLocalDateString(),
        calendarSearchQuery: '',
        calendarFilterType: 'all',
        calendarFilterStatus: 'all',
        calendarFilterCategory: 'all',
        selectedEventId: undefined,
        missionViewFilter: 'focus',
        missionTypeFilter: 'all',
        missionStatusFilter: 'all',
        missionCategoryFilter: 'all',
        missionSearchQuery: '',
        selectedMissionId: undefined,
        selectedMissionView: 'list',
        quickCaptureItems: [],
        quickCaptureSearchQuery: '',
        quickCaptureStatusFilter: 'all',
        selectedQuickCaptureId: undefined,
        quickCapturePanelOpen: false,
        routingCandidates: [],
        routingReviewFilter: 'all',
        selectedRoutingCandidateId: undefined,
        routingPanelOpen: false,
        onboardingStep: 0,
        onboardingAnswers: normalizeOnboardingAnswers(undefined),
        onboardingCompleted: defaultPreferences.onboardingCompleted,
        onboardingInProgress: !defaultPreferences.onboardingCompleted,
        onboardingResultProfile: undefined,
        dataLoaded: false,
        _unsubscribers: [],
      });
    },

    loadUserPreferences: async () => {
      const { uid } = get();
      if (!uid) return;
      const prefs = await dbService.getPreferences(uid);
      const normalized = normalizeUserPreferences(prefs as UserProfilePreferences | null, uid);
      set({ userPreferences: normalized, preferencesLoaded: true });
    },

    updateUserPreferences: async (updates) => {
      const { uid, userPreferences } = get();
      if (!uid) throw new Error('No authenticated user for preferences update.');
      const merged = normalizeUserPreferences({ ...userPreferences, ...updates }, uid);
      // Optimistic update so settings feel immediate.
      set({ userPreferences: merged, preferencesDraft: undefined });
      try {
        await dbService.updatePreferences(uid, merged);
      } catch (error) {
        // Keep local preference selection even when backend is temporarily unavailable
        // (e.g. 503). This avoids jarring UI rollback while the server recovers.
        throw error;
      }
    },
    setOnboardingAnswer: (updates) => {
      const current = get().onboardingAnswers;
      set({ onboardingAnswers: normalizeOnboardingAnswers({ ...current, ...updates }) });
    },
    goToNextOnboardingStep: () =>
      set((state) => ({ onboardingStep: Math.min(ONBOARDING_TOTAL_STEPS - 1, state.onboardingStep + 1) })),
    goToPreviousOnboardingStep: () =>
      set((state) => ({ onboardingStep: Math.max(0, state.onboardingStep - 1) })),
    applyOnboardingProfile: async (result) => {
      const patch = result.derivedPreferencesPatch;
      const mode = result.suggestedInitialDayMode;
      await get().updateUserPreferences({
        ...patch,
        onboardingCompleted: true,
      });
      if (mode) {
        get().setDayMode(mode, { override: true });
      }
      set({
        onboardingCompleted: true,
        onboardingInProgress: false,
        onboardingStep: ONBOARDING_TOTAL_STEPS - 1,
        onboardingResultProfile: result,
      });
    },
    completeOnboarding: async () => {
      const state = get();
      const result = buildOnboardingResultProfile(state.onboardingAnswers, state.userPreferences);
      await state.applyOnboardingProfile(result);
    },
    skipOnboarding: async () => {
      const state = get();
      const result = buildOnboardingResultProfile(
        normalizeOnboardingAnswers({
          goalPrimary: 'daily-organization',
          targetGroupChoice: state.userPreferences.targetGroup,
          tonePreference: state.userPreferences.preferredTone,
          dashboardDensityPreference: state.userPreferences.dashboardDensity,
          overwhelmPreference: state.userPreferences.overloadProtection === 'on' ? 'medium' : 'low',
          dashboardEmphasis: 'tasks-events',
        }),
        state.userPreferences
      );
      await state.applyOnboardingProfile(result);
    },

    resetUserPreferencesSection: (section) => {
      const defaults = getDefaultUserPreferences(get().uid || undefined);
      const current = get().userPreferences;
      if (section === 'profile-target-group') {
        set({
          userPreferences: {
            ...current,
            targetGroup: defaults.targetGroup,
            productivityMode: defaults.productivityMode,
            preferredTone: defaults.preferredTone,
          },
        });
      } else if (section === 'productivity-style') {
        set({
          userPreferences: {
            ...current,
            dayPlanningStyle: defaults.dayPlanningStyle,
            defaultTimeHorizon: defaults.defaultTimeHorizon,
            reminderSensitivity: defaults.reminderSensitivity,
            overloadProtection: defaults.overloadProtection,
          },
        });
      } else if (section === 'dashboard-focus') {
        set({
          userPreferences: {
            ...current,
            dashboardDensity: defaults.dashboardDensity,
            missionVisibility: defaults.missionVisibility,
          },
        });
      } else if (section === 'habits-missions') {
        set({
          userPreferences: {
            ...current,
            habitTrackingPreference: defaults.habitTrackingPreference,
            missionVisibility: defaults.missionVisibility,
          },
        });
      } else if (section === 'reflection-reading') {
        set({
          userPreferences: {
            ...current,
            reflectionStyle: defaults.reflectionStyle,
            readingVisibility: defaults.readingVisibility,
            notesInboxBehavior: defaults.notesInboxBehavior,
          },
        });
      } else {
        set({
          userPreferences: {
            ...current,
            showAdvancedFilters: defaults.showAdvancedFilters,
            themePreference: defaults.themePreference,
            languagePreference: defaults.languagePreference,
          },
        });
      }
    },

    setPreferencesViewSection: (section) => set({ preferencesViewSection: section }),
    savePreferencesDraft: (draft) => set({ preferencesDraft: { ...(get().preferencesDraft || {}), ...draft } }),
    setDayMode: (mode, options) => {
      const safeMode = normalizeDayModeKey(mode);
      const now = new Date().toISOString();
      if (options?.override) {
        set({ dayModeOverride: safeMode, dayModeLastChangedAt: now, dayModeAutoSuggestion: undefined });
        return;
      }
      set({ currentDayMode: safeMode, dayModeLastChangedAt: now, dayModeAutoSuggestion: undefined });
    },
    clearDayModeOverride: () => set({ dayModeOverride: undefined }),
    setSuggestedDayMode: (suggestion) => set({ dayModeAutoSuggestion: suggestion }),
    computeDayModeSuggestion: () => {
      const suggestion = computeDayModeSuggestionFromState();
      if (suggestion) {
        set({ dayModeAutoSuggestion: suggestion });
      }
      return suggestion;
    },
    refreshDayModeSuggestion: () => {
      const suggestion = computeDayModeSuggestionFromState();
      set({ dayModeAutoSuggestion: suggestion });
      return suggestion;
    },
    acceptSuggestedDayMode: () => {
      const state = get();
      const suggestion = state.dayModeAutoSuggestion;
      if (!suggestion) return;
      set({
        currentDayMode: suggestion.suggestedMode,
        dayModeAutoSuggestion: undefined,
        dayModeLastChangedAt: new Date().toISOString(),
      });
    },
    dismissDayModeSuggestion: () =>
      set({
        dayModeAutoSuggestion: undefined,
        dayModeSuggestionDismissedAt: getLocalDateString(),
      }),
    applyDayModeToDashboard: () => {
      const state = get();
      const effectiveMode = normalizeDayModeKey(state.dayModeOverride || state.currentDayMode);
      return {
        mode: effectiveMode,
        changedAt: state.dayModeLastChangedAt,
        override: Boolean(state.dayModeOverride),
      };
    },

    // ============ QUEST ACTIONS ============

    addQuest: async (quest) => {
      const { uid } = get();
      if (!uid) return;
      const now = new Date().toISOString();
      await dbService.addQuest(uid, {
        ...coalesceFocusArea(
          quest,
          inferFocusArea({
            title: quest.title,
            description: quest.description,
            category: quest.category,
            persona: quest.persona,
          })
        ),
        createdAt: quest.createdAt || now,
        updatedAt: now,
        lastInteractedAt: now,
      });
    },

    updateQuest: async (questId, updates) => {
      const { uid, quests } = get();
      if (!uid) return;
      const current = quests.find((q) => q.id === questId);
      const focusArea =
        updates.focusArea ||
        current?.focusArea ||
        inferFocusArea({
          title: updates.title || current?.title,
          description: updates.description || current?.description,
          category: updates.category || current?.category,
          persona: updates.persona || current?.persona,
        });
      await dbService.updateQuest(uid, questId, {
        ...updates,
        focusArea,
        focusAreaSource: updates.focusAreaSource || current?.focusAreaSource || 'auto',
        updatedAt: new Date().toISOString(),
        lastInteractedAt: new Date().toISOString(),
      });
    },

    completeQuest: async (questId: string) => {
      const { uid, quests, userStats } = get();
      if (!uid) return;

      const quest = quests.find((q) => q.id === questId);
      if (!quest || quest.completed) return;

      // Mark quest as completed in Firebase (use local date prefix for correct day filtering)
      await dbService.updateQuest(uid, questId, {
        completed: true,
        completedAt: getLocalDateString() + 'T' + new Date().toTimeString().slice(0, 8),
        lastInteractedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Award XP + essence via unified processing
      await processAction(quest.xpReward, {
        essenceGained: quest.essenceReward,
        statUpdates: {
          questsCompleted: userStats.questsCompleted + 1,
          totalQuestsCompleted: userStats.totalQuestsCompleted + 1,
        },
      });

      // Record habit entry for automatic habit tracking
      const normalized = normalizeTitle(quest.title);
      if (normalized) {
        dbService.addHabitEntry(uid, {
          title: quest.title,
          normalizedTitle: normalized,
          source: 'quest',
          completedAt: getLocalDateString(),
          focusArea: quest.focusArea,
        }).catch(() => {});
        dbService.addHabitActivitySignal(uid, {
          eventType: 'planning_activity',
          sourceModule: 'quests',
          referenceId: questId,
          occurredAt: new Date().toISOString(),
          dateKey: getLocalDateString(),
          metadata: { title: quest.title, category: quest.category },
        }).catch(() => {});
      }

      await updateWeeklyQuestProgress('quests_completed');
    },

    deleteQuest: async (questId) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.deleteQuest(uid, questId);
    },

    // ============ MISSION ACTIONS (quest-backed for now) ============
    setMissionViewFilter: (view) => set({ missionViewFilter: view }),
    setMissionTypeFilter: (type) => set({ missionTypeFilter: type }),
    setMissionStatusFilter: (status) => set({ missionStatusFilter: status }),
    setMissionCategoryFilter: (category) => set({ missionCategoryFilter: category }),
    setMissionSearchQuery: (query) => set({ missionSearchQuery: query }),
    setSelectedMissionId: (missionId) => set({ selectedMissionId: missionId }),
    setSelectedMissionView: (view) => set({ selectedMissionView: view }),

    addMission: async (mission) => {
      const normalized = normalizeMission({ ...mission, id: `m-${Date.now()}` } as any);
      const errors = validateMissionInput(normalized);
      if (errors.length) {
        toast.error(errors[0].message);
        return;
      }
      await get().addQuest({
        title: normalized.title,
        description: normalized.description,
        category: normalized.category,
        difficulty: normalized.difficulty as any,
        estimatedTime: normalized.estimatedMinutes,
        xpReward: normalized.rewardXp || 15,
        essenceReward: 0,
        completed: false,
        tags: [],
        generated: normalized.sourceType !== 'manual',
        questType: normalized.type === 'weekly' ? 'weekly' : 'daily',
      });
    },

    updateMission: async (missionId, updates) => {
      const { missions } = get();
      const current = missions.find((m) => m.id === missionId);
      if (!current) return;
      const normalized = normalizeMission({ ...current, ...updates, id: missionId });
      const errors = validateMissionInput(normalized);
      if (errors.length) {
        toast.error(errors[0].message);
        return;
      }
      await get().updateQuest(missionId, {
        title: normalized.title,
        description: normalized.description,
        category: normalized.category,
        difficulty: normalized.difficulty as any,
        estimatedTime: normalized.estimatedMinutes,
        xpReward: normalized.rewardXp || 15,
        completed: normalized.status === 'completed',
        completedAt: normalized.status === 'completed' ? normalized.completedAt || new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      } as any);
    },

    deleteMission: async (missionId) => {
      await get().deleteQuest(missionId);
    },
    completeMission: async (missionId) => {
      await get().completeQuest(missionId);
    },
    skipMission: async (missionId) => {
      await get().updateQuest(missionId, { completed: false, updatedAt: new Date().toISOString() } as any);
    },
    archiveMission: async (missionId) => {
      await get().updateQuest(missionId, { generated: true, updatedAt: new Date().toISOString() } as any);
    },

    // ============ LIST ACTIONS ============

    addList: async (list) => {
      const { uid } = get();
      if (!uid) return;
      const errors = validateListEntity({ title: list.title || list.name });
      if (errors.length > 0) {
        toast.error(errors[0]);
        return;
      }
      const now = new Date().toISOString();
      await dbService.addList(uid, {
        ...list,
        title: (list.title || list.name || '').trim(),
        name: (list.title || list.name || '').trim(),
        description: list.description || '',
        type: list.type || 'general',
        icon: list.icon || DEFAULT_LIST_ICON,
        archived: false,
        pinned: Boolean(list.pinned),
        sortOrder: list.sortOrder || Date.now(),
        targetGroupVisibility: list.targetGroupVisibility || ['all'],
        tags: list.tags || [],
        schemaVersion: LISTS_SCHEMA_VERSION,
        createdAt: now,
        updatedAt: now,
      });
    },

    updateList: async (listId, updates) => {
      const { uid } = get();
      if (!uid) return;
      const mergedTitle = updates.title || updates.name;
      const errors = validateListEntity(mergedTitle ? { title: mergedTitle } : {});
      if (errors.length > 0) {
        toast.error(errors[0]);
        return;
      }
      const safeUpdates: Partial<TodoList> = {
        ...updates,
        ...(mergedTitle ? { title: mergedTitle.trim(), name: mergedTitle.trim() } : {}),
        updatedAt: new Date().toISOString() as any,
      };
      await dbService.updateList(uid, listId, safeUpdates);
    },

    deleteList: async (listId) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.deleteList(uid, listId);
    },

    addTask: async (listId, task) => {
      const { uid, lists } = get();
      if (!uid) return;
      const list = lists.find((l) => l.id === listId);
      const now = new Date().toISOString();
      const isShoppingList = list?.type === 'shopping';
      const errors = validateListItemEntity({ title: task.title, estimatedMinutes: task.estimatedMinutes });
      if (errors.length > 0) {
        toast.error(errors[0]);
        return;
      }
      await dbService.addTask(uid, listId, {
        ...coalesceFocusArea(
          {
            ...task,
            listId,
            description: task.description || '',
            estimatedMinutes: task.estimatedMinutes,
            tags: task.tags || [],
            notes: task.notes,
            sortOrder: task.sortOrder || Date.now(),
            sourceType: task.sourceType || 'manual',
            workflowStatus: task.workflowStatus || 'active',
            futureLinkTargets: task.futureLinkTargets || {},
            ...(isShoppingList
              ? { shoppingStatus: task.shoppingStatus || (task.completed ? 'purchased' : 'pending') }
              : {}),
          },
          inferFocusArea({
            title: task.title,
            category: list?.name,
          })
        ),
        createdAt: task.createdAt || now,
        updatedAt: now,
        lastInteractedAt: now,
        postponedCount: task.postponedCount || 0,
      });
    },

    updateTask: async (listId, taskId, updates) => {
      const { uid, lists, userStats } = get();
      if (!uid) return;
      const list = lists.find((l) => l.id === listId);
      const task = list?.tasks.find((t) => t.id === taskId);
      const isShoppingList = list?.type === 'shopping';
      const normalizedUpdates: Partial<Task> = { ...updates };
      const errors = validateListItemEntity({
        ...(normalizedUpdates.title !== undefined ? { title: normalizedUpdates.title } : {}),
        ...(normalizedUpdates.estimatedMinutes !== undefined ? { estimatedMinutes: normalizedUpdates.estimatedMinutes } : {}),
      });
      if (errors.length > 0) {
        toast.error(errors[0]);
        return;
      }
      if (isShoppingList && updates.shoppingStatus) {
        normalizedUpdates.completed = updates.shoppingStatus === 'purchased';
      } else if (isShoppingList && updates.completed !== undefined) {
        normalizedUpdates.shoppingStatus = updates.completed ? 'purchased' : 'pending';
      }
      const nextPostponedCount =
        normalizedUpdates.dueDate && task?.dueDate && normalizedUpdates.dueDate > task.dueDate
          ? (task.postponedCount || 0) + 1
          : task?.postponedCount;

      // Detect if a task is being newly completed → award XP (only once)
      if (normalizedUpdates.completed === true) {
        if (task && !task.completed && !task.xpAwarded) {
          await dbService.updateTask(uid, listId, taskId, {
            ...normalizedUpdates,
            xpAwarded: true,
            completedAt: getLocalDateString(),
            updatedAt: new Date().toISOString(),
            lastInteractedAt: new Date().toISOString(),
            postponedCount: nextPostponedCount,
          });

          const xp = TASK_XP[task.priority] || 10;
          await processAction(xp, {
            statUpdates: {
              tasksCompleted: (userStats.tasksCompleted || 0) + 1,
            },
          });

          // Record habit entry for automatic habit tracking
          const normalized = normalizeTitle(task.title);
          if (normalized) {
            dbService.addHabitEntry(uid, {
              title: task.title,
              normalizedTitle: normalized,
              source: 'task',
              completedAt: getLocalDateString(),
              focusArea: task.focusArea,
            }).catch(() => {});
            dbService.addHabitActivitySignal(uid, {
              eventType: 'list_item_completed',
              sourceModule: 'lists',
              referenceId: taskId,
              occurredAt: new Date().toISOString(),
              dateKey: getLocalDateString(),
              metadata: { title: task.title, listId },
            }).catch(() => {});
          }

          await updateWeeklyQuestProgress('tasks_completed');
          return;
        }
      }

      await dbService.updateTask(uid, listId, taskId, {
        ...normalizedUpdates,
        focusArea:
          normalizedUpdates.focusArea ||
          task?.focusArea ||
          inferFocusArea({
            title: normalizedUpdates.title || task?.title,
            category: list?.name,
          }),
        focusAreaSource: normalizedUpdates.focusAreaSource || task?.focusAreaSource || 'auto',
        updatedAt: new Date().toISOString(),
        lastInteractedAt: new Date().toISOString(),
        postponedCount: nextPostponedCount,
      });
    },

    deleteTask: async (listId, taskId) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.deleteTask(uid, listId, taskId);
    },

    archiveList: async (listId, archived = true) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.setListArchived(uid, listId, archived);
    },

    pinList: async (listId, pinned = true) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.setListPinned(uid, listId, pinned);
    },

    reorderLists: async (orderedListIds) => {
      const { uid } = get();
      if (!uid) return;
      await Promise.all(
        orderedListIds.map((id, index) =>
          dbService.updateListSortOrder(uid, id, index)
        )
      );
    },

    reorderListItems: async (listId, orderedTaskIds) => {
      const { uid } = get();
      if (!uid) return;
      await Promise.all(
        orderedTaskIds.map((id, index) =>
          dbService.updateTaskSortOrder(uid, listId, id, index)
        )
      );
    },

    setListViewFilter: (view) => set({ listViewFilter: view }),
    setListSearchQuery: (query) => set({ listSearchQuery: query }),
    setListItemsFilter: (filter) => set({ listItemsFilter: filter }),
    setListItemsSort: (sort) => set({ listItemsSort: sort }),

    // ============ NOTE ACTIONS ============

    addNote: async (payload) => {
      const { uid, userStats, noteFolders } = get();
      if (!uid) return;

      const title = (payload.title ?? '').trim();
      const content = (payload.content ?? '').trim();
      const errs = validateNoteCreateInput({ title, content, type: payload.type, tags: payload.tags });
      if (errs.length > 0) {
        toast.error(errs[0].message);
        return;
      }

      const base = defaultNewNoteFields(uid);
      let folderId = payload.folderId;
      let legacyFolder = payload.legacyFolder;
      if (!folderId && payload.folder?.trim()) {
        legacyFolder = payload.folder.trim();
      }

      const preview =
        (payload.preview && payload.preview.trim()) || buildNotePreview(content || title);

      const row: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> = {
        ...base,
        title: title || buildNotePreview(content, 80),
        content,
        preview,
        type: payload.type ?? base.type,
        folderId,
        legacyFolder: folderId ? undefined : legacyFolder,
        tags: Array.isArray(payload.tags) ? payload.tags : base.tags,
        pinned: payload.pinned ?? false,
        archived: payload.archived ?? false,
        sourceType: payload.sourceType ?? 'manual',
        futureOriginReference: payload.futureOriginReference,
        futureLinkTargets: payload.futureLinkTargets ?? {},
        schemaVersion: payload.schemaVersion ?? base.schemaVersion,
        locked: payload.locked,
        lastOpenedAt: payload.lastOpenedAt,
      };

      await dbService.addNote(uid, row);

      const folderLabel = getNoteFolderLabel({ ...row, id: 'tmp' } as Note, noteFolders || []);
      dbService
        .addHabitActivitySignal(uid, {
          eventType: 'note_added',
          sourceModule: 'notes',
          occurredAt: new Date().toISOString(),
          dateKey: getLocalDateString(),
          metadata: { title: row.title, folder: folderLabel, type: row.type },
        })
        .catch(() => {});

      await processAction(NOTE_CREATE_XP, {
        statUpdates: {
          notesCreated: (userStats.notesCreated || 0) + 1,
        },
      });

      await updateWeeklyQuestProgress('notes_created');
    },

    updateNote: async (noteId, updates) => {
      const { uid, notes } = get();
      if (!uid) return;
      const prev = (notes || []).find((n) => n.id === noteId);
      const patchErrors = validateNotePatch(updates, {
        title: prev?.title ?? '',
        content: prev?.content ?? '',
      });
      if (patchErrors.length > 0) {
        toast.error(patchErrors[0].message);
        return;
      }

      const mergedContent =
        updates.content !== undefined ? String(updates.content) : (prev?.content ?? '');
      const mergedTitle = updates.title !== undefined ? String(updates.title) : (prev?.title ?? '');

      const out: Partial<Note> = { ...updates };
      if (updates.content !== undefined && updates.preview === undefined) {
        out.preview = buildNotePreview(mergedContent);
      }
      if (updates.preview === undefined && updates.title !== undefined && !mergedContent.trim()) {
        out.preview = buildNotePreview(mergedTitle);
      }

      if (updates.folderId) {
        (out as { legacyFolder?: string | null }).legacyFolder = null;
      }

      await dbService.updateNote(uid, noteId, out);
    },

    deleteNote: async (noteId) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.deleteNote(uid, noteId);
    },

    archiveNote: async (noteId, archived = true) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.updateNote(uid, noteId, { archived });
    },

    pinNote: async (noteId, pinned = true) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.updateNote(uid, noteId, { pinned });
    },

    addFolder: async (folder) => {
      const { uid } = get();
      if (!uid) return;
      const fe = validateFolderCreateInput({ title: folder.title, color: folder.color, icon: folder.icon });
      if (fe.length > 0) {
        toast.error(fe[0].message);
        return;
      }
      await dbService.addNoteFolder(uid, folder);
    },

    updateFolder: async (folderId, updates) => {
      const { uid } = get();
      if (!uid) return;
      const pe = validateFolderPatch(updates);
      if (pe.length > 0) {
        toast.error(pe[0].message);
        return;
      }
      await dbService.updateNoteFolder(uid, folderId, updates);
    },

    deleteFolder: async (folderId) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.deleteNoteFolder(uid, folderId);
    },

    setNotesViewFilter: (view) => set({ notesViewFilter: view }),
    setNotesSearchQuery: (query) => set({ notesSearchQuery: query }),
    setNotesTypeFilter: (filter) => set({ notesTypeFilter: filter }),
    setNotesFolderFilter: (filter) => set({ notesFolderFilter: filter }),
    setNotesArchivedFilter: (filter) => set({ notesArchivedFilter: filter }),
    setSelectedNoteId: (noteId) => set({ selectedNoteId: noteId }),
    setSelectedNoteView: (view) => set({ selectedNoteView: view }),
    setNotesLayoutMode: (mode) => set({ notesLayoutMode: mode }),

    touchNoteOpened: async (noteId) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.updateNote(uid, noteId, { lastOpenedAt: new Date().toISOString() });
    },

    // ============ QUICK CAPTURE ACTIONS ============

    addQuickCaptureItem: async ({ rawInput, sourceType = 'quick-add-dialog', sourceContext }) => {
      const { uid, lists, growthGoals, habits, missions, notes, userPreferences } = get();
      if (!uid) return;
      const now = new Date().toISOString();
      const smartSuggestion = suggestQuickCaptureRoutingSmart(rawInput, {
        lists,
        goals: growthGoals,
        habits,
        missions,
        notesCount: notes.length,
        notesInboxBehavior: userPreferences.notesInboxBehavior,
        defaultTimeHorizon: userPreferences.defaultTimeHorizon,
      });
      const normalized = normalizeQuickCaptureItem(
        {
          id: `capture-${Date.now()}`,
          userId: uid,
          rawInput,
          suggestedType: smartSuggestion.suggestedType,
          suggestedTargetModule: smartSuggestion.suggestedTargetModule,
          extractedMetadata: {
            routingConfidence: smartSuggestion.confidence,
            routingReason: smartSuggestion.reason,
            ...(smartSuggestion.extractedMetadata || {}),
          },
          sourceType,
          sourceContext,
          createdAt: now,
          updatedAt: now,
          status: 'unprocessed',
        },
        uid
      );
      const errors = validateQuickCaptureItem(normalized);
      if (errors.length > 0) {
        toast.error(errors[0]);
        return;
      }
      const { id: _id, ...toSave } = normalized;
      await dbService.addQuickCaptureItem(uid, toSave);
    },

    updateQuickCaptureItem: async (captureId, updates) => {
      const { uid, quickCaptureItems } = get();
      if (!uid) return;
      const current = quickCaptureItems.find((item) => item.id === captureId);
      if (!current) return;
      const merged = normalizeQuickCaptureItem({ ...current, ...updates, id: captureId }, uid);
      const errors = validateQuickCaptureItem(merged);
      if (errors.length > 0) {
        toast.error(errors[0]);
        return;
      }
      const { id: _id, ...toSave } = merged;
      await dbService.updateQuickCaptureItem(uid, captureId, toSave);
    },

    deleteQuickCaptureItem: async (captureId) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.deleteQuickCaptureItem(uid, captureId);
    },

    archiveQuickCaptureItem: async (captureId) => {
      await get().updateQuickCaptureItem(captureId, { status: 'archived' });
    },

    discardQuickCaptureItem: async (captureId) => {
      await get().deleteQuickCaptureItem(captureId);
    },

    setQuickCaptureSearchQuery: (query) => set({ quickCaptureSearchQuery: query }),
    setQuickCaptureStatusFilter: (status) => set({ quickCaptureStatusFilter: status }),
    setSelectedQuickCaptureId: (captureId) => set({ selectedQuickCaptureId: captureId }),
    setQuickCapturePanelOpen: (open) => set({ quickCapturePanelOpen: open }),
    setRoutingReviewFilter: (filter) => set({ routingReviewFilter: filter }),
    setSelectedRoutingCandidateId: (candidateId) => set({ selectedRoutingCandidateId: candidateId }),
    setRoutingPanelOpen: (open) => set({ routingPanelOpen: open }),
    generateRoutingCandidates: async () => {
      const state = get();
      const { uid } = state;
      if (!uid) return;
      const nowTs = Date.now();
      const expireBeforeMs = nowTs - ROUTING_EXPIRE_DAYS * 24 * 60 * 60 * 1000;
      for (const existing of state.routingCandidates) {
        if (existing.status !== 'pending') continue;
        const createdTs = new Date(existing.createdAt).getTime();
        if (!Number.isFinite(createdTs)) continue;
        if (createdTs < expireBeforeMs) {
          await dbService.updateRoutingCandidate(uid, existing.id, { status: 'expired' });
        }
      }
      const generated = generateRoutingCandidatesFromModules({
        quickCaptureItems: state.quickCaptureItems,
        notes: state.notes.map((n) => ({ id: n.id, title: n.title, content: n.content, type: n.type, updatedAt: n.updatedAt })),
        readingEntries: state.readingEntries.map((e) => ({ id: e.id, bookId: e.bookId, note: e.note, quote: e.quote, lesson: e.lesson, date: e.date })),
        goals: state.growthGoals.map((g) => ({ id: g.id, title: g.title, targetDate: g.targetDate, milestones: g.milestones })),
        reflections: state.reflections.map((r) => ({ id: r.id, content: r.content, lessons: r.lessons, date: r.date })),
        lists: state.lists.map((l) => ({ id: l.id, title: l.title || l.name, tasks: l.tasks })),
        habits: state.habits.map((h) => ({ id: h.id, title: h.title, active: h.active, updatedAt: h.updatedAt })),
        events: state.events.map((e) => ({ id: e.id, title: e.title, date: e.date, type: e.type })),
        currentDayMode: state.currentDayMode,
        targetGroup: state.userPreferences.targetGroup,
      });
      const existingIds = new Set(state.routingCandidates.map((c) => c.id));
      for (const candidate of generated) {
        if (existingIds.has(candidate.id)) continue;
        const { id: _id, ...toSave } = normalizeRoutingCandidate(candidate);
        await dbService.upsertRoutingCandidate(uid, candidate.id, toSave);
      }
    },
    addRoutingCandidate: async (candidate) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.upsertRoutingCandidate(uid, candidate.sourceEntityId || `manual-${Date.now()}`, candidate);
    },
    dismissRoutingCandidate: async (candidateId) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.updateRoutingCandidate(uid, candidateId, { status: 'dismissed' });
    },
    expireRoutingCandidate: async (candidateId) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.updateRoutingCandidate(uid, candidateId, { status: 'expired' });
    },
    acceptRoutingCandidate: async (candidateId) => {
      const state = get();
      const { uid } = state;
      if (!uid) return;
      const candidate = state.routingCandidates.find((row) => row.id === candidateId);
      if (!candidate) return;

      const payload = candidate.suggestedPayload || {};
      const title = typeof payload.title === 'string' ? payload.title : candidate.title;
      const description = typeof payload.description === 'string' ? payload.description : candidate.description || '';
      if (candidate.targetModule === 'lists') {
        const firstList = state.lists[0];
        if (firstList) {
          await state.addTask(firstList.id, { title, description, completed: false, priority: 'medium' });
        }
      } else if (candidate.targetModule === 'notes') {
        await state.addNote({ title, content: description || title, type: 'idea', sourceType: 'suggestion' });
      } else if (candidate.targetModule === 'goals') {
        await state.addGoal({ title, description, priority: 'medium', type: 'project', status: 'active', sourceType: 'suggestion' });
      } else if (candidate.targetModule === 'missions') {
        await state.addMission({ title, description, category: 'general', difficulty: 'medium', estimatedMinutes: 25, priority: 'medium', type: 'suggested', status: 'active', sourceType: 'suggestion' });
      } else if (candidate.targetModule === 'calendar') {
        const now = new Date();
        const end = new Date(now.getTime() + 60 * 60 * 1000);
        await state.addEvent({
          title,
          description,
          date: getLocalDateString(now),
          startTime: now.toISOString(),
          endTime: end.toISOString(),
          allDay: false,
          type: 'event',
          priority: 'medium',
          color: '#4F46E5',
          category: 'general',
          reminderSettings: { enabled: true, minutesBefore: 15 },
          status: 'scheduled',
          sourceType: 'suggested',
          futureLinkTargets: {},
          schemaVersion: 2,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
      } else if (candidate.targetModule === 'reflection') {
        await state.addReflection({ date: getLocalDateString(), type: 'normal', mood: 3, title, content: description || title, tags: [], sourceType: 'suggestion' });
      } else if (candidate.targetModule === 'reading') {
        await state.addBook({ title, author: 'Ismeretlen', totalPages: 0, currentPage: 0, status: 'wishlist', category: 'general', tags: [], sourceType: 'suggestion' });
      } else if (candidate.targetModule === 'habits') {
        await state.addHabit({ title, description, trackingMode: 'auto', frequencyType: 'daily', frequencyTarget: 1, sourceType: 'suggestion' });
      }
      await dbService.updateRoutingCandidate(uid, candidateId, { status: 'accepted' });
    },

    suggestQuickCaptureRouting: (rawInput) => {
      const { lists, growthGoals, habits, missions, notes, userPreferences } = get();
      return suggestQuickCaptureRoutingSmart(rawInput, {
        lists,
        goals: growthGoals,
        habits,
        missions,
        notesCount: notes.length,
        notesInboxBehavior: userPreferences.notesInboxBehavior,
        defaultTimeHorizon: userPreferences.defaultTimeHorizon,
      });
    },

    confirmQuickCaptureRouting: async (captureId, target) => {
      const state = get();
      const item = state.quickCaptureItems.find((row) => row.id === captureId);
      if (!item) return;

      const raw = item.rawInput.trim();
      if (!raw) {
        toast.error('Ures capture elem nem rendezheto.');
        return;
      }

      const parseTitleAndDetails = (input: string) => {
        const [first, ...rest] = input.split(':');
        if (rest.length === 0) return { title: input, details: '' };
        return { title: first.trim() || input, details: rest.join(':').trim() };
      };

      const { title, details } = parseTitleAndDetails(raw);
      const now = new Date();
      const nowIso = now.toISOString();
      const relatedEntityType =
        typeof item.extractedMetadata?.matchedEntityType === 'string' ? item.extractedMetadata.matchedEntityType : undefined;
      const relatedEntityId =
        typeof item.extractedMetadata?.matchedEntityId === 'string' ? item.extractedMetadata.matchedEntityId : undefined;
      const relatedEntityName =
        typeof item.extractedMetadata?.matchedEntityName === 'string' ? item.extractedMetadata.matchedEntityName : undefined;

      try {
        switch (target) {
          case 'notes': {
            await state.addNote({
              title,
              content: details || raw,
              type: 'idea',
              sourceType: 'manual',
            });
            break;
          }
          case 'calendar': {
            const end = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
            await state.addEvent({
              title,
              description: details || '',
              startTime: nowIso,
              endTime: end,
              date: getLocalDateString(now),
              allDay: false,
              reminder: 15,
              color: '#4F46E5',
              priority: 'medium',
              type: 'event',
              status: 'scheduled',
              sourceType: 'manual',
              futureLinkTargets: {},
              schemaVersion: 2,
              createdAt: nowIso,
              updatedAt: nowIso,
            });
            break;
          }
          case 'goals': {
            if (relatedEntityType === 'goal' && relatedEntityId) {
              await state.addMilestone(relatedEntityId, {
                title,
                description: details || '',
                priority: 'medium',
                sourceType: 'manual',
              });
              break;
            }
            await state.addGoal({
              title,
              description: details || '',
              priority: 'medium',
              type: 'project',
              status: 'active',
              tags: [],
              milestones: [],
              sourceType: 'manual',
            });
            break;
          }
          case 'missions': {
            await state.addMission({
              title,
              description: details || '',
              category: 'general',
              difficulty: 'medium',
              estimatedMinutes: 25,
              priority: 'medium',
              type: 'suggested',
              status: 'active',
              sourceType: 'manual',
            });
            break;
          }
          case 'habits': {
            if (relatedEntityType === 'habit' && relatedEntityId) {
              await state.addHabitCompletion({
                habitId: relatedEntityId,
                completedAt: nowIso,
                completionDateKey: getLocalDateString(now),
                note: details || raw,
                source: 'manual',
              });
              break;
            }
            await state.addHabit({
              title,
              description: details || '',
              trackingMode: 'auto',
              frequencyType: 'daily',
              frequencyTarget: 1,
              sourceType: 'manual',
            });
            break;
          }
          case 'reflection': {
            await state.addReflection({
              date: getLocalDateString(now),
              type: 'normal',
              mood: 3,
              title,
              content: details || raw,
              tags: [],
              sourceType: 'manual',
            });
            break;
          }
          case 'reading': {
            await state.addBook({
              title,
              author: details || 'Ismeretlen',
              totalPages: 0,
              currentPage: 0,
              status: 'want-to-read',
              sourceType: 'manual',
              schemaVersion: 2,
              futureLinkTargets: {},
            });
            break;
          }
          case 'inbox': {
            await state.addNote({
              title,
              content: details || raw,
              type: 'note',
              sourceType: 'manual',
            });
            break;
          }
          case 'lists':
          default: {
            const suggestedListId =
              typeof item.extractedMetadata?.suggestedListId === 'string' ? item.extractedMetadata.suggestedListId : undefined;
            const activeList =
              state.lists.find((list) => !list.archived && list.id === suggestedListId) ||
              inferPreferredList(state.lists, raw) ||
              state.lists.find((list) => !list.archived);
            if (!activeList) {
              await state.addNote({
                title,
                content: details || raw,
                type: 'idea',
                sourceType: 'manual',
              });
            } else {
              await state.addTask(activeList.id, {
                title,
                description: details || '',
                completed: false,
                priority: 'medium',
                sourceType: 'manual',
                futureLinkTargets: {},
              });
            }
            break;
          }
        }

        await state.updateQuickCaptureItem(captureId, {
          confirmedTargetModule: target,
          status: 'archived',
          extractedMetadata: {
            ...(item.extractedMetadata || {}),
            routedEntityType: relatedEntityType,
            routedEntityId: relatedEntityId,
            routedEntityName: relatedEntityName,
          },
        });
        toast.success('Rendezve es atmozgatva a valasztott modulba.');
      } catch (error) {
        try {
          // Fallback: never lose captured input; keep it as a note.
          await state.addNote({
            title,
            content: details || raw,
            type: 'note',
            sourceType: 'manual',
          });
          await state.updateQuickCaptureItem(captureId, {
            confirmedTargetModule: target,
            status: 'archived',
            extractedMetadata: {
              ...(item.extractedMetadata || {}),
              routingFallback: 'notes',
              routingError: error instanceof Error ? error.message : 'unknown-error',
            },
          });
          const errText = error instanceof Error ? error.message : 'ismeretlen hiba';
          toast.success(`A(z) ${target} modulba nem sikerult (${errText}), de jegyzetkent elmentettem.`);
        } catch {
          toast.error('A rendezes most nem sikerult. Probald ujra.');
        }
      }
    },

    // ============ EVENT ACTIONS ============

    addEvent: async (event) => {
      const { uid } = get();
      if (!uid) return;
      const now = new Date().toISOString();
      const normalized = normalizeCalendarEvent(
        {
          ...event,
          date: event.date || toLocalDateKey(new Date(event.startTime)),
          type: event.type || 'event',
          priority: event.priority || 'medium',
          allDay: Boolean(event.allDay),
          status: event.status || 'scheduled',
          sourceType: event.sourceType || 'manual',
          schemaVersion: 2,
          createdAt: event.createdAt || now,
          updatedAt: now,
          reminderSettings: event.reminderSettings || {
            enabled: event.reminder !== 0,
            minutesBefore: event.reminder ?? 15,
          },
          futureLinkTargets: event.futureLinkTargets || {},
          futureOriginReference: event.futureOriginReference,
        },
        uid
      ) as CalendarEvent;
      const errors = validateCalendarEventInput(normalized as any);
      if (errors.length > 0) {
        toast.error(errors[0]);
        return;
      }
      await dbService.addEvent(
        uid,
        coalesceFocusArea(
          {
            ...normalized,
            lastInteractedAt: now,
          },
          inferFocusArea({
            title: normalized.title,
            description: normalized.description,
            category: normalized.category,
          })
        )
      );

      const normalizedTitle = normalizeTitle(normalized.title);
      if (normalizedTitle) {
        const eventDate = normalized.startTime
          ? toLocalDateKey(new Date(normalized.startTime))
          : getLocalDateString();
        dbService.addHabitEntry(uid, {
          title: normalized.title,
          normalizedTitle: normalizedTitle,
          source: 'event',
          completedAt: eventDate,
          category: normalized.category || undefined,
          focusArea: normalized.focusArea,
        }).catch(() => {});
        dbService.addHabitActivitySignal(uid, {
          eventType: 'calendar_event_completed',
          sourceModule: 'calendar',
          referenceId: normalized.id,
          occurredAt: new Date().toISOString(),
          dateKey: eventDate,
          metadata: { title: normalized.title, category: normalized.category },
        }).catch(() => {});
      }
    },

    updateEvent: async (eventId, updates) => {
      const { uid, events } = get();
      if (!uid) return;
      const current = events.find((event) => event.id === eventId);
      const merged = normalizeCalendarEvent(
        {
          ...current,
          ...updates,
          reminderSettings:
            updates.reminderSettings ||
            (updates.reminder !== undefined
              ? { enabled: updates.reminder !== 0, minutesBefore: updates.reminder }
              : current?.reminderSettings),
        },
        uid
      ) as CalendarEvent;
      const errors = validateCalendarEventInput(merged as any);
      if (errors.length > 0) {
        toast.error(errors[0]);
        return;
      }
      await dbService.updateEvent(uid, eventId, {
        ...coalesceFocusArea(
          merged,
          inferFocusArea({
            title: merged.title,
            description: merged.description,
            category: merged.category,
          })
        ),
        focusAreaSource: updates.focusAreaSource || current?.focusAreaSource || 'auto',
        updatedAt: new Date().toISOString(),
        lastInteractedAt: new Date().toISOString(),
      });
    },

    deleteEvent: async (eventId) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.deleteEvent(uid, eventId);
    },

    setEventStatus: async (eventId, status) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.updateEvent(uid, eventId, { status, updatedAt: new Date().toISOString() } as Partial<CalendarEvent>);
    },

    setSelectedCalendarDate: (date) => set({ selectedCalendarDate: date }),
    setCalendarView: (view) => set({ currentCalendarView: view }),
    setCalendarSearchQuery: (query) => set({ calendarSearchQuery: query }),
    setCalendarFilterType: (type) => set({ calendarFilterType: type }),
    setCalendarFilterStatus: (status) => set({ calendarFilterStatus: status }),
    setCalendarFilterCategory: (category) => set({ calendarFilterCategory: category }),
    setSelectedEventId: (eventId) => set({ selectedEventId: eventId }),

    // ============ ACHIEVEMENT ACTIONS ============

    unlockAchievement: async (achievementId) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.unlockAchievement(uid, achievementId);
    },

    // ============ STATS ACTIONS ============

    updateStats: async (updates) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.updateStats(uid, updates);
    },

    // ============ BOOK ACTIONS ============

    addBook: async (book) => {
      const { uid } = get();
      if (!uid) return;
      const now = new Date().toISOString();
      const normalized = normalizeBook(
        {
          ...book,
          id: `book-${Date.now()}`,
          userId: uid,
          createdAt: book.createdAt || now,
          updatedAt: now,
          schemaVersion: READING_SCHEMA_VERSION,
        } as any,
        uid
      );
      const errors = validateBookInput(normalized);
      if (errors.length > 0) {
        toast.error(errors[0].message);
        return;
      }
      const { id: _id, ...toSave } = normalized;
      await dbService.addBook(uid, toSave as any);
    },

    updateBook: async (bookId, updates) => {
      const { uid, books } = get();
      if (!uid) return;
      const current = books.find((book) => book.id === bookId);
      if (!current) return;
      const normalized = normalizeBook({ ...current, ...updates, id: bookId }, uid);
      const errors = validateBookInput(normalized);
      if (errors.length > 0) {
        toast.error(errors[0].message);
        return;
      }
      await dbService.updateBook(uid, bookId, {
        ...normalized,
        updatedAt: new Date().toISOString(),
      } as any);
    },

    deleteBook: async (bookId) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.deleteBook(uid, bookId);
    },

    setBookStatus: async (bookId, status) => {
      const { uid, books } = get();
      if (!uid) return;
      const book = books.find((item) => item.id === bookId);
      if (!book) return;
      const today = getLocalDateString();
      const patch: Partial<Book> = {
        status,
        updatedAt: new Date().toISOString(),
      };
      if (status === 'reading' && !book.startedAt) patch.startedAt = today;
      if (status === 'finished') patch.finishedAt = today;
      await dbService.updateBook(uid, bookId, patch as any);
    },

    addReadingEntry: async (entry) => {
      const { uid, books } = get();
      if (!uid) return;
      const book = books.find((item) => item.id === entry.bookId);
      if (!book) return;
      const now = new Date().toISOString();
      const normalized = normalizeReadingEntry({
        ...entry,
        id: `entry-${Date.now()}`,
        createdAt: now,
      });
      const errors = validateReadingEntry(normalized);
      if (errors.length > 0) {
        toast.error(errors[0].message);
        return;
      }
      const { id: _id, ...toSave } = normalized;
      await dbService.addReadingLog(uid, toSave as any);

      const nextPage = normalized.pageTo ?? book.currentPage;
      const isFinished = nextPage >= book.totalPages;
      await dbService.updateBook(uid, book.id, {
        currentPage: Math.max(book.currentPage, Math.min(book.totalPages, nextPage)),
        status: isFinished ? 'finished' : (book.status === 'wishlist' ? 'reading' : book.status),
        startedAt: book.startedAt || normalized.date,
        finishedAt: isFinished ? normalized.date : book.finishedAt,
      } as any);
    },

    updateReadingEntry: async (entryId, updates) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.updateReadingLog(uid, entryId, updates as any);
    },

    deleteReadingEntry: async (entryId) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.deleteReadingLog(uid, entryId);
    },

    setReadingViewFilter: (view) => set({ readingViewFilter: view }),
    setReadingSearchQuery: (query) => set({ readingSearchQuery: query }),
    setReadingStatusFilter: (status) => set({ readingStatusFilter: status }),
    setReadingCategoryFilter: (category) => set({ readingCategoryFilter: category }),
    setSelectedBookId: (bookId) => set({ selectedBookId: bookId }),
    setReadingLayoutMode: (layout) => set({ readingLayoutMode: layout }),

    // Backward-compatible quick logger for legacy calls.
    logReading: async (bookId, pagesRead, note) => {
      const { uid, books } = get();
      if (!uid) return;
      const book = books.find((b) => b.id === bookId);
      if (!book) return;
      const today = getLocalDateString();
      const pageFrom = book.currentPage;
      const pageTo = Math.min(book.totalPages, book.currentPage + pagesRead);
      await get().addReadingEntry({ bookId, date: today, note, pageFrom, pageTo });

      // Track reading as habit
      const readingTitle = `Olvasás: ${book.title}`;
      const normalized = normalizeTitle(readingTitle);
      if (normalized) {
        dbService.addHabitEntry(uid, {
          title: readingTitle,
          normalizedTitle: normalized,
          source: 'reading',
          completedAt: today,
          category: book.category || undefined,
          focusArea: inferFocusArea({ title: readingTitle, category: 'olvasas' }),
        }).catch(() => {});
        dbService.addHabitActivitySignal(uid, {
          eventType: 'reading_log_added',
          sourceModule: 'reading',
          referenceId: bookId,
          occurredAt: new Date().toISOString(),
          dateKey: today,
          metadata: { title: readingTitle, pagesRead },
        }).catch(() => {});
      }

      if (pageTo >= book.totalPages) {
        toast.success(`"${book.title}" elolvasva! 🎉`, { duration: 4000 });
      }
    },

    // ============ REFLECTION ACTIONS ============
    setReflectionViewFilter: (view) => set({ reflectionViewFilter: view }),
    setReflectionTypeFilter: (filter) => set({ reflectionTypeFilter: filter }),
    setReflectionMoodFilter: (filter) => set({ reflectionMoodFilter: filter }),
    setSelectedReflectionId: (entryId) => set({ selectedReflectionId: entryId }),
    setSelectedReflectionDate: (date) => set({ selectedReflectionDate: date }),
    setSelectedReflectionView: (view) => set({ selectedReflectionView: view }),

    addReflection: async (entry) => {
      const { uid } = get();
      if (!uid) return;
      const now = new Date().toISOString();
      const normalized = normalizeReflectionEntry(
        {
          ...entry,
          id: `reflection-${Date.now()}`,
          userId: uid,
          createdAt: now,
          updatedAt: now,
          schemaVersion: REFLECTION_SCHEMA_VERSION,
        } as any,
        uid
      );
      const errors = validateReflectionEntry(normalized);
      if (errors.length > 0) {
        toast.error(errors[0].message);
        return;
      }
      const { id: _id, ...toSave } = normalized;
      await dbService.addJournalEntry(uid, toSave as any);
      dbService.addHabitActivitySignal(uid, {
        eventType: 'reflection_completed',
        sourceModule: 'reflection',
        occurredAt: now,
        dateKey: normalized.date,
        metadata: { mood: normalized.mood, type: normalized.type },
      }).catch(() => {});
    },

    updateReflection: async (entryId, updates) => {
      const { uid, reflections } = get();
      if (!uid) return;
      const current = reflections.find((entry) => entry.id === entryId);
      if (!current) return;
      const normalized = normalizeReflectionEntry({ ...current, ...updates, id: entryId }, uid);
      const errors = validateReflectionEntry(normalized);
      if (errors.length > 0) {
        toast.error(errors[0].message);
        return;
      }
      await dbService.updateJournalEntry(uid, entryId, { ...normalized, updatedAt: new Date().toISOString() } as any);
    },

    deleteReflection: async (entryId) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.deleteJournalEntry(uid, entryId);
    },

    // legacy aliases
    addJournalEntry: async (entry) => get().addReflection({ ...(entry as any), type: (entry as any).type || 'normal', content: (entry as any).content || (entry as any).freeWrite || '' }),
    updateJournalEntry: async (entryId, updates) => get().updateReflection(entryId, updates as any),
    deleteJournalEntry: async (entryId) => get().deleteReflection(entryId),

    // ============ HABITS ACTIONS (auto-first) ============

    setHabitsViewFilter: (view) => set({ habitsViewFilter: view }),
    setHabitsSearchQuery: (query) => set({ habitsSearchQuery: query }),
    setHabitsCategoryFilter: (category) => set({ habitsCategoryFilter: category }),
    setHabitsStatusFilter: (status) => set({ habitsStatusFilter: status }),
    setHabitsTrackingModeFilter: (mode) => set({ habitsTrackingModeFilter: mode }),
    setHabitsTimeRangeFilter: (range) => set({ habitsTimeRangeFilter: range }),
    setSelectedHabitId: (habitId) => set({ selectedHabitId: habitId }),
    setSelectedHabitView: (view) => set({ selectedHabitView: view }),
    setHabitsLayoutMode: (layout) => set({ habitsLayoutMode: layout }),

    addHabit: async (input) => {
      const { uid } = get();
      if (!uid) return;
      const titleErr = validateHabitTitle(input.title);
      if (titleErr) {
        toast.error(titleErr.message);
        return;
      }
      const modeErr = validateHabitTrackingMode(input.trackingMode || 'auto');
      if (modeErr) {
        toast.error(modeErr.message);
        return;
      }
      const freqErrs = validateHabitFrequency(input.frequencyType || 'daily', input.frequencyTarget || 1, input.preferredDays);
      if (freqErrs.length) {
        toast.error(freqErrs[0].message);
        return;
      }
      const now = new Date().toISOString();
      const payload = normalizeHabit(
        {
          id: `habit-${Date.now()}`,
          userId: uid,
          title: input.title,
          description: input.description || '',
          category: input.category || '',
          trackingMode: input.trackingMode || 'auto',
          detectionMode: input.detectionMode || 'user-created',
          sourceModule: input.sourceModule,
          sourceEventTypes: input.sourceEventTypes || [],
          frequencyType: input.frequencyType || 'daily',
          frequencyTarget: input.frequencyTarget || 1,
          preferredDays: input.preferredDays || [],
          preferredTimeOfDay: input.preferredTimeOfDay || 'any',
          color: input.color || '#8B5CF6',
          icon: input.icon || 'repeat',
          active: input.active !== false,
          archived: Boolean(input.archived),
          createdAt: now,
          updatedAt: now,
          startDate: input.startDate,
          endDate: input.endDate,
          targetGroupVisibility: input.targetGroupVisibility || ['all'],
          tags: input.tags || [],
          sourceType: input.sourceType || 'manual',
          futureOriginReference: input.futureOriginReference,
          futureLinkTargets: input.futureLinkTargets || {},
          schemaVersion: HABITS_SCHEMA_VERSION,
        },
        uid
      );
      const { id: _id, ...toSave } = payload;
      await dbService.addHabit(uid, toSave);
    },

    updateHabit: async (habitId, updates) => {
      const { uid, habits } = get();
      if (!uid) return;
      const current = habits.find((h) => h.id === habitId);
      if (!current) return;
      if (updates.title !== undefined) {
        const titleErr = validateHabitTitle(updates.title);
        if (titleErr) {
          toast.error(titleErr.message);
          return;
        }
      }
      if (updates.trackingMode !== undefined) {
        const modeErr = validateHabitTrackingMode(updates.trackingMode);
        if (modeErr) {
          toast.error(modeErr.message);
          return;
        }
      }
      const next = normalizeHabit({ ...current, ...updates, id: habitId }, uid);
      const { id: _id, ...toSave } = next;
      await dbService.updateHabit(uid, habitId, toSave);
    },

    deleteHabit: async (habitId) => {
      const { uid, habitCompletions } = get();
      if (!uid) return;
      await dbService.deleteHabit(uid, habitId);
      const related = habitCompletions.filter((c) => c.habitId === habitId);
      for (const row of related) {
        await dbService.deleteHabitCompletion(uid, row.id);
      }
    },

    archiveHabit: async (habitId, archived = true) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.updateHabit(uid, habitId, { archived, active: archived ? false : true });
    },

    setHabitActiveState: async (habitId, active) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.updateHabit(uid, habitId, { active });
    },

    addHabitCompletion: async (completion) => {
      const { uid } = get();
      if (!uid) return;
      const normalized = normalizeHabitCompletion(
        {
          id: `completion-${Date.now()}`,
          ...completion,
          createdAt: completion.createdAt || new Date().toISOString(),
          updatedAt: completion.updatedAt,
        },
        completion.habitId
      );
      const errs = validateCompletion(normalized);
      if (errs.length) {
        toast.error(errs[0].message);
        return;
      }
      const { id: _id, ...toSave } = normalized;
      await dbService.addHabitCompletion(uid, toSave);
    },

    updateHabitCompletion: async (completionId, updates) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.updateHabitCompletion(uid, completionId, updates);
    },

    deleteHabitCompletion: async (completionId) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.deleteHabitCompletion(uid, completionId);
    },

    toggleHabitCompletionForDate: async (habitId, dateKey) => {
      const { uid, habitCompletions, habits } = get();
      if (!uid) return;
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;
      const existing = habitCompletions.find((c) => c.habitId === habitId && c.completionDateKey === dateKey);
      if (existing) {
        await dbService.deleteHabitCompletion(uid, existing.id);
        return;
      }
      await get().addHabitCompletion({
        habitId,
        completedAt: `${dateKey}T12:00:00.000Z`,
        completionDateKey: dateKey,
        note: '',
        source: habit.trackingMode === 'auto' ? 'hybrid' : habit.trackingMode,
      });
    },

    ingestHabitActivitySignal: async (signal) => {
      const { uid } = get();
      if (!uid) return;
      const normalized = normalizeHabitActivitySignal(
        {
          id: `signal-${Date.now()}`,
          ...signal,
          occurredAt: signal.occurredAt || new Date().toISOString(),
          dateKey: signal.dateKey || getLocalDateString(),
        },
        uid
      );
      const errs = validateActivitySignal(normalized);
      if (errs.length) {
        return;
      }
      const { id: _id, ...toSave } = normalized;
      await dbService.addHabitActivitySignal(uid, toSave);
    },

    evaluateHabitCandidates: async () => {
      const { uid, habitActivitySignals, habitCandidates } = get();
      if (!uid) return;
      const detected = detectHabitCandidates(habitActivitySignals, { userId: uid });
      for (const row of detected) {
        const existing = habitCandidates.find((c) => c.id === row.id);
        await dbService.upsertHabitCandidate(uid, row.id, {
          ...row,
          promotedToHabit: existing?.promotedToHabit || false,
          promotedHabitId: existing?.promotedHabitId,
          linkedHabitId: existing?.linkedHabitId,
        });
      }
    },

    promoteHabitCandidate: async (candidateId) => {
      const { uid, habitCandidates } = get();
      if (!uid) return;
      const candidate = habitCandidates.find((c) => c.id === candidateId);
      if (!candidate) return;
      const errs = validateCandidatePromotion(candidate);
      if (errs.length) {
        toast.error(errs[0].message);
        return;
      }
      const now = new Date().toISOString();
      const habitToCreate = normalizeHabit(
        {
          id: `promoted-${Date.now()}`,
          userId: uid,
          title: candidate.titleHint || `${candidate.sourceModule} rutin`,
          description: 'Automatikusan felismert, visszatero aktivitas mintazatbol letrejott szokas.',
          category: candidate.sourceModule,
          trackingMode: 'auto',
          detectionMode: 'promoted-from-pattern',
          sourceModule: candidate.sourceModule,
          sourceEventTypes: [candidate.eventType],
          frequencyType: 'weekly',
          frequencyTarget: 3,
          preferredDays: [],
          preferredTimeOfDay: 'any',
          color: '#8B5CF6',
          icon: 'repeat',
          active: true,
          archived: false,
          createdAt: now,
          updatedAt: now,
          tags: ['auto-detected'],
          sourceType: 'system',
          futureLinkTargets: { dashboardTodayCandidate: true, guidanceSignal: true },
          schemaVersion: HABITS_SCHEMA_VERSION,
        },
        uid
      );
      const { id: _id, ...habitPayload } = habitToCreate;
      const newHabitId = await dbService.addHabit(uid, habitPayload);
      await dbService.updateHabitCandidate(uid, candidateId, {
        promotedToHabit: true,
        promotedHabitId: newHabitId,
        linkedHabitId: newHabitId,
      });
      toast.success('Ismetlodo minta szokaskent felvéve.');
    },

    rebuildHabitCompletionsFromSignals: async () => {
      const { uid, habits, habitActivitySignals } = get();
      if (!uid) return;
      await dbService.clearHabitCompletions(uid);
      for (const habit of habits) {
        if (habit.trackingMode === 'manual') continue;
        const sourceTypes = habit.sourceEventTypes || [];
        const matchingSignals = habitActivitySignals.filter((s) => sourceTypes.includes(s.eventType));
        const byDate = new Map<string, HabitActivitySignal>();
        for (const signal of matchingSignals) {
          if (!byDate.has(signal.dateKey)) byDate.set(signal.dateKey, signal);
        }
        for (const signal of byDate.values()) {
          await dbService.addHabitCompletion(uid, {
            habitId: habit.id,
            completedAt: signal.occurredAt,
            completionDateKey: signal.dateKey,
            note: '',
            source: habit.trackingMode === 'auto' ? 'auto' : 'hybrid',
            sourceEventType: signal.eventType,
            sourceReferenceId: signal.referenceId,
            createdAt: new Date().toISOString(),
          });
        }
      }
    },

    // ============ GROWTH GOALS ACTIONS (domain: @/lib/goals) ============

    setGoalsViewFilter: (view) => set({ goalsViewFilter: view }),
    setGoalsSearchQuery: (query) => set({ goalsSearchQuery: query }),
    setGoalsTypeFilter: (filter) => set({ goalsTypeFilter: filter }),
    setGoalsStatusFilter: (filter) => set({ goalsStatusFilter: filter }),
    setGoalsPriorityFilter: (filter) => set({ goalsPriorityFilter: filter }),
    setSelectedGoalId: (goalId) => set({ selectedGoalId: goalId }),
    setSelectedGoalView: (view) => set({ selectedGoalView: view }),

    addGoal: async (input) => {
      const { uid } = get();
      if (!uid) return;
      const now = new Date().toISOString();
      const status = input.status || 'active';
      const milestonesDraft = input.milestones || [];
      const milestones: GrowthMilestoneData[] = milestonesDraft.map((draft, index) => ({
        id: draft.id || `m-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`,
        title: draft.title.trim(),
        description: draft.description,
        completed: Boolean(draft.completed),
        dueDate: draft.dueDate,
        sortOrder: draft.sortOrder ?? index,
        createdAt: draft.createdAt || now,
        updatedAt: draft.updatedAt || now,
        completionDate: draft.completionDate,
        effortEstimate: draft.effortEstimate,
        priority: draft.priority || 'medium',
        notes: draft.notes,
        sourceType: draft.sourceType || 'manual',
        futureOriginReference: draft.futureOriginReference,
        futureLinkTargets: draft.futureLinkTargets,
      }));
      const progress =
        milestones.length > 0 ? 0 : Math.min(100, Math.max(0, Math.round(Number(input.progress) || 0)));

      const payload: GrowthGoalData = {
        title: input.title.trim(),
        description: input.description,
        type: input.type || 'project',
        status,
        targetDate: input.targetDate,
        startDate: input.startDate,
        reasonWhy: input.reasonWhy,
        category: input.category || '',
        tags: input.tags || [],
        priority: input.priority || 'medium',
        progress,
        milestones,
        archived: Boolean(input.archived),
        createdAt: now,
        updatedAt: now,
        completed: status === 'completed',
        completedAt: status === 'completed' ? now : undefined,
        sourceType: input.sourceType || 'manual',
        futureOriginReference: input.futureOriginReference,
        futureLinkTargets: input.futureLinkTargets || {},
        schemaVersion: GOALS_SCHEMA_VERSION,
        userId: uid,
      };
      await dbService.addGrowthGoal(uid, payload);
    },

    updateGoal: async (goalId, updates) => {
      const { uid, growthGoals } = get();
      if (!uid) return;
      const current = growthGoals.find((goal) => goal.id === goalId);
      if (!current) return;
      const now = new Date().toISOString();
      const merged: Goal = { ...current, ...updates, id: goalId };
      const milestonesSource = updates.milestones ?? current.milestones;
      const milestones: GrowthMilestoneData[] = milestonesSource.map((milestone, index) => ({
        id: milestone.id,
        title: milestone.title,
        description: milestone.description,
        completed: Boolean(milestone.completed),
        dueDate: milestone.dueDate,
        sortOrder: milestone.sortOrder ?? index,
        createdAt: milestone.createdAt,
        updatedAt: milestone.updatedAt || now,
        completionDate: milestone.completionDate,
        effortEstimate: milestone.effortEstimate,
        priority: milestone.priority,
        notes: milestone.notes,
        sourceType: milestone.sourceType,
        futureOriginReference: milestone.futureOriginReference,
        futureLinkTargets: milestone.futureLinkTargets,
      }));
      const status = merged.status;
      const progress =
        status === 'completed'
          ? 100
          : milestones.length > 0
            ? computeMilestoneDerivedProgress(milestonesSource)
            : Math.min(100, Math.max(0, Math.round(Number(merged.progress) || 0)));
      await dbService.updateGrowthGoal(uid, goalId, {
        title: merged.title,
        description: merged.description,
        type: merged.type,
        status,
        targetDate: merged.targetDate,
        startDate: merged.startDate,
        reasonWhy: merged.reasonWhy,
        category: merged.category,
        tags: merged.tags,
        priority: merged.priority,
        progress,
        milestones,
        archived: merged.archived,
        completedAt: status === 'completed' ? merged.completedAt || now : undefined,
        sourceType: merged.sourceType,
        futureOriginReference: merged.futureOriginReference,
        futureLinkTargets: merged.futureLinkTargets,
        schemaVersion: GOALS_SCHEMA_VERSION,
        userId: uid,
        completed: status === 'completed',
      });
    },

    deleteGoal: async (goalId) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.deleteGrowthGoal(uid, goalId);
    },

    archiveGoal: async (goalId, archived = true) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.updateGrowthGoal(uid, goalId, { archived });
    },

    setGoalStatus: async (goalId, status) => {
      const now = new Date().toISOString();
      const extra: Partial<Goal> = {
        status,
        completedAt: status === 'completed' ? now : undefined,
      };
      if (status === 'completed') {
        extra.progress = 100;
      }
      if (status === 'archived') {
        extra.archived = true;
      }
      await get().updateGoal(goalId, extra);
    },

    addMilestone: async (goalId, draft) => {
      const { uid, growthGoals } = get();
      if (!uid) return;
      const current = growthGoals.find((goal) => goal.id === goalId);
      if (!current) return;
      const now = new Date().toISOString();
      const nextOrder = Math.max(-1, ...current.milestones.map((m) => m.sortOrder)) + 1;
      const newMilestone: Milestone = {
        id: draft.id || `m-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        goalId,
        title: draft.title.trim(),
        description: draft.description || '',
        completed: false,
        dueDate: draft.dueDate,
        sortOrder: draft.sortOrder ?? nextOrder,
        createdAt: now,
        updatedAt: now,
        completionDate: undefined,
        effortEstimate: draft.effortEstimate,
        priority: draft.priority || 'medium',
        notes: draft.notes || '',
        sourceType: draft.sourceType || 'manual',
        futureOriginReference: draft.futureOriginReference,
        futureLinkTargets: draft.futureLinkTargets || {},
      };
      const milestones = [...current.milestones, newMilestone];
      await get().updateGoal(goalId, { milestones });
    },

    updateMilestone: async (goalId, milestoneId, updates) => {
      const { growthGoals } = get();
      const current = growthGoals.find((goal) => goal.id === goalId);
      if (!current) return;
      const now = new Date().toISOString();
      const milestones = current.milestones.map((milestone) => {
        if (milestone.id !== milestoneId) return milestone;
        const next = { ...milestone, ...updates, updatedAt: now };
        if (updates.completed === true && !next.completionDate) next.completionDate = now;
        if (updates.completed === false) next.completionDate = undefined;
        return next;
      });
      await get().updateGoal(goalId, { milestones });
    },

    deleteMilestone: async (goalId, milestoneId) => {
      const { growthGoals } = get();
      const current = growthGoals.find((goal) => goal.id === goalId);
      if (!current) return;
      const milestones = current.milestones.filter((milestone) => milestone.id !== milestoneId);
      await get().updateGoal(goalId, { milestones });
    },

    reorderMilestones: async (goalId, orderedMilestoneIds) => {
      const { growthGoals } = get();
      const current = growthGoals.find((goal) => goal.id === goalId);
      if (!current) return;
      const map = new Map(current.milestones.map((milestone) => [milestone.id, milestone]));
      const picked = orderedMilestoneIds
        .map((id) => map.get(id))
        .filter((milestone): milestone is Milestone => Boolean(milestone));
      const rest = current.milestones.filter((milestone) => !orderedMilestoneIds.includes(milestone.id));
      const merged = [...picked, ...rest];
      const milestones = merged.map((milestone, index) => ({ ...milestone, sortOrder: index }));
      await get().updateGoal(goalId, { milestones });
    },

    toggleGrowthMilestone: async (goalId, milestoneId) => {
      const { growthGoals } = get();
      const goal = growthGoals.find((item) => item.id === goalId);
      if (!goal) return;
      const milestone = goal.milestones.find((m) => m.id === milestoneId);
      if (!milestone) return;
      await get().updateMilestone(goalId, milestoneId, { completed: !milestone.completed });
    },

    // ============ PERSONA ACTIONS ============

    triggerQuestGeneration: async (forceRegenerate?: boolean) => {
      if (forceRegenerate) {
        const { uid, quests } = get();
        if (uid) {
          const today = getLocalDateString();
          const mondayOfWeek = getLocalMondayOfWeek(today);
          const sundayOfWeek = getLocalSundayOfWeek(today);
          const persona = getCurrentPersonaId();

          // Delete all generated uncompleted quests for this persona
          // (they were generated before preferences were saved)
          const toDelete = quests.filter(
            (q) =>
              q.generated &&
              q.persona === persona &&
              !q.completed &&
              ((q.questType === 'daily' && q.dueDate === today) ||
                (q.questType === 'weekly' &&
                  q.dueDate &&
                  q.dueDate >= mondayOfWeek &&
                  q.dueDate <= sundayOfWeek))
          );
          for (const q of toDelete) {
            await dbService.deleteQuest(uid, q.id);
          }

          // Wait briefly for Firebase subscription to reflect deletions
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      const currentStats = get().userStats;
      await generateQuestsIfNeeded(currentStats);
    },
  };
});
