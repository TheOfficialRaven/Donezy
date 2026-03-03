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

// ============ TYPES ============

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

export interface Note {
  id: string;
  title: string;
  content: string;
  folder: string;
  createdAt: string;
  updatedAt: string;
  isLocked: boolean;
  tags: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  category: string;
  color: string;
  reminder?: number;
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

export interface UserPreferences {
  onboardingCompleted: boolean;
  interests: string[];
  challenge: string;
  questFrequency: 'low' | 'medium' | 'high';
  activeTime: 'morning' | 'afternoon' | 'evening';
  livingWith: string[];
  focusAreasOrder: FocusArea[];
  focusAreasEnabled: FocusArea[];
  wellbeingMode: boolean;
  maxActiveItems: number;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  shoppingStatus?: 'pending' | 'purchased' | 'not_available';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
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
  name: string;
  color: string;
  type?: 'default' | 'shopping';
  tasks: Task[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  status: 'reading' | 'completed' | 'want-to-read';
  coverColor: string;
  genre: string;
  startedAt?: string;
  completedAt?: string;
  summary?: string;
  rating?: number;
  favoriteQuotes?: string[];
  keyLessons?: string[];
}

export interface ReadingLog {
  id: string;
  bookId: string;
  date: string;
  pagesRead: number;
  note?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  mood: number;
  gratitude?: string;
  lessons?: string;
  feelings?: string;
  growth?: string;
  freeWrite?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  focusArea?: FocusArea;
  focusAreaSource?: FocusAreaSource;
}

export interface GrowthMilestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface GrowthGoal {
  id: string;
  title: string;
  description?: string;
  area: 'mindset' | 'habit' | 'skill' | 'wellbeing';
  targetDate?: string;
  priority: 'low' | 'medium' | 'high';
  milestones: GrowthMilestone[];
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============ STORE ============

interface AppState {
  uid: string | null;
  userStats: UserStats;
  userPreferences: UserPreferences;
  quests: Quest[];
  notes: Note[];
  events: CalendarEvent[];
  achievements: Achievement[];
  lists: TodoList[];
  habitEntries: HabitEntry[];
  books: Book[];
  readingLogs: ReadingLog[];
  journalEntries: JournalEntry[];
  growthGoals: GrowthGoal[];
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

  // List actions
  addList: (list: Omit<TodoList, 'id' | 'tasks'>) => Promise<void>;
  updateList: (listId: string, updates: Partial<TodoList>) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  addTask: (listId: string, task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (listId: string, taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (listId: string, taskId: string) => Promise<void>;

  // Note actions
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNote: (noteId: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;

  // Event actions
  addEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;

  // Achievement actions
  unlockAchievement: (achievementId: string) => Promise<void>;

  // Stats actions
  updateStats: (updates: Partial<UserStats>) => Promise<void>;

  // Book actions
  addBook: (book: Omit<Book, 'id'>) => Promise<void>;
  updateBook: (bookId: string, updates: Partial<Book>) => Promise<void>;
  deleteBook: (bookId: string) => Promise<void>;
  logReading: (bookId: string, pagesRead: number, note?: string) => Promise<void>;

  // Journal actions
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateJournalEntry: (entryId: string, updates: Partial<JournalEntry>) => Promise<void>;
  deleteJournalEntry: (entryId: string) => Promise<void>;

  // Growth goals actions
  addGrowthGoal: (goal: Omit<GrowthGoal, 'id' | 'createdAt' | 'updatedAt' | 'completed'>) => Promise<void>;
  updateGrowthGoal: (goalId: string, updates: Partial<GrowthGoal>) => Promise<void>;
  deleteGrowthGoal: (goalId: string) => Promise<void>;
  toggleGrowthMilestone: (goalId: string, milestoneId: string) => Promise<void>;

  // Persona actions
  triggerQuestGeneration: (forceRegenerate?: boolean) => Promise<void>;
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

const defaultPreferences: UserPreferences = {
  onboardingCompleted: true, // Default true so existing users without prefs aren't redirected
  interests: [],
  challenge: '',
  questFrequency: 'medium',
  activeTime: 'morning',
  livingWith: [],
  focusAreasOrder: ['tudat', 'test', 'munka_tanulas', 'otthon', 'kapcsolatok'],
  focusAreasEnabled: ['tudat', 'test', 'munka_tanulas', 'otthon', 'kapcsolatok'],
  wellbeingMode: true,
  maxActiveItems: 5,
};

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
    quests: [],
    notes: [],
    events: [],
    achievements: [],
    lists: [],
    habitEntries: [],
    books: [],
    readingLogs: [],
    journalEntries: [],
    growthGoals: [],
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
          set({ quests: patched });
        })
      );

      // Subscribe to lists (with daily cleanup of completed tasks)
      unsubscribers.push(
        dbService.subscribeToLists(uid, (lists) => {
          const patchedLists = lists.map((list) => ({
            ...list,
            type: list.type || (list.name.toLowerCase().includes('bevásárl') ? 'shopping' : 'default'),
            tasks: list.tasks.map((task) =>
              ({
                ...coalesceFocusArea(
                  task,
                  inferFocusArea({
                    title: task.title,
                    category: list.name,
                  })
                ),
                shoppingStatus:
                  (list.type === 'shopping' || list.name.toLowerCase().includes('bevásárl'))
                    ? (task.shoppingStatus || (task.completed ? 'purchased' : 'pending'))
                    : task.shoppingStatus,
              })
            ),
          }));
          set({ lists: patchedLists });
          if (
            !_shoppingListEnsuring &&
            !patchedLists.some((list) => list.type === 'shopping' || list.name.toLowerCase().includes('bevásárl'))
          ) {
            _shoppingListEnsuring = true;
            dbService
              .addList(uid, { name: 'Bevásárlás', color: '#34D399', type: 'shopping' })
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

      // Subscribe to events
      unsubscribers.push(
        dbService.subscribeToEvents(uid, (events) => {
          const patched = events.map((event) =>
            coalesceFocusArea(
              event,
              inferFocusArea({
                title: event.title,
                description: event.description,
                category: event.category,
              })
            )
          );
          set({ events: patched });
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

      // Subscribe to reading logs
      unsubscribers.push(
        dbService.subscribeToReadingLogs(uid, (logs) => {
          set({ readingLogs: logs });
        })
      );

      // Subscribe to journal entries (daily reflection)
      unsubscribers.push(
        dbService.subscribeToJournalEntries(uid, (entries) => {
          const patched = entries.map((entry) =>
            coalesceFocusArea(
              entry,
              inferFocusArea({
                title: entry.gratitude || entry.freeWrite || entry.feelings,
                category: 'reflexio',
              })
            )
          );
          set({ journalEntries: patched });
        })
      );

      // Subscribe to growth goals (self-development milestones)
      unsubscribers.push(
        dbService.subscribeToGrowthGoals(uid, (goals) => {
          const patched = goals.map((goal) => ({
            ...goal,
            milestones: (goal.milestones || []).map((milestone, index) => ({
              id: milestone.id || `${goal.id}-m${index}`,
              title: milestone.title,
              completed: Boolean(milestone.completed),
              completedAt: milestone.completedAt,
            })),
            completed:
              goal.milestones && goal.milestones.length > 0
                ? goal.milestones.every((milestone) => milestone.completed)
                : goal.completed,
          })) as GrowthGoal[];
          set({ growthGoals: patched });
        })
      );

      // Subscribe to user preferences (onboarding, interests, etc.)
      unsubscribers.push(
        dbService.subscribeToPreferences(uid, (prefs) => {
          _prefsLoaded = true;
          if (prefs) {
            set({ userPreferences: { ...defaultPreferences, ...prefs } as UserPreferences });
          } else {
            // No preferences saved yet — existing user, use defaults (onboardingCompleted: true)
            set({ userPreferences: defaultPreferences });
          }
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
        quests: [],
        notes: [],
        events: [],
        achievements: [],
        lists: [],
        habitEntries: [],
        books: [],
        readingLogs: [],
        journalEntries: [],
        growthGoals: [],
        dataLoaded: false,
        _unsubscribers: [],
      });
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
      }

      await updateWeeklyQuestProgress('quests_completed');
    },

    deleteQuest: async (questId) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.deleteQuest(uid, questId);
    },

    // ============ LIST ACTIONS ============

    addList: async (list) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.addList(uid, { ...list, type: list.type || 'default' });
    },

    updateList: async (listId, updates) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.updateList(uid, listId, updates);
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
      await dbService.addTask(uid, listId, {
        ...coalesceFocusArea(
          {
            ...task,
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

    // ============ NOTE ACTIONS ============

    addNote: async (note) => {
      const { uid, userStats } = get();
      if (!uid) return;
      await dbService.addNote(uid, note);

      // Award XP for creating a note
      await processAction(NOTE_CREATE_XP, {
        statUpdates: {
          notesCreated: (userStats.notesCreated || 0) + 1,
        },
      });

      // Update progress on weekly quests that track note creation
      await updateWeeklyQuestProgress('notes_created');
    },

    updateNote: async (noteId, updates) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.updateNote(uid, noteId, updates);
    },

    deleteNote: async (noteId) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.deleteNote(uid, noteId);
    },

    // ============ EVENT ACTIONS ============

    addEvent: async (event) => {
      const { uid } = get();
      if (!uid) return;
      const now = new Date().toISOString();
      await dbService.addEvent(uid, {
        ...coalesceFocusArea(
          event,
          inferFocusArea({
            title: event.title,
            description: event.description,
            category: event.category,
          })
        ),
        createdAt: event.createdAt || now,
        updatedAt: now,
        lastInteractedAt: now,
      });

      const normalized = normalizeTitle(event.title);
      if (normalized) {
        const eventDate = event.startTime
          ? new Date(event.startTime).toISOString().slice(0, 10)
          : getLocalDateString();
        dbService.addHabitEntry(uid, {
          title: event.title,
          normalizedTitle: normalized,
          source: 'event',
          completedAt: eventDate,
          category: event.category || undefined,
          focusArea: event.focusArea,
        }).catch(() => {});
      }
    },

    updateEvent: async (eventId, updates) => {
      const { uid, events } = get();
      if (!uid) return;
      const current = events.find((event) => event.id === eventId);
      await dbService.updateEvent(uid, eventId, {
        ...updates,
        focusArea:
          updates.focusArea ||
          current?.focusArea ||
          inferFocusArea({
            title: updates.title || current?.title,
            description: updates.description || current?.description,
            category: updates.category || current?.category,
          }),
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
      await dbService.addBook(uid, book);
    },

    updateBook: async (bookId, updates) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.updateBook(uid, bookId, updates);
    },

    deleteBook: async (bookId) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.deleteBook(uid, bookId);
    },

    logReading: async (bookId, pagesRead, note) => {
      const { uid, books } = get();
      if (!uid) return;

      const book = books.find((b) => b.id === bookId);
      if (!book) return;

      const today = getLocalDateString();
      const logEntry: import('@/services/databaseService').ReadingLogData = { bookId, date: today, pagesRead };
      if (note) logEntry.note = note;
      await dbService.addReadingLog(uid, logEntry);

      const newCurrentPage = Math.min(book.currentPage + pagesRead, book.totalPages);
      const isFinished = newCurrentPage >= book.totalPages;

      await dbService.updateBook(uid, bookId, {
        currentPage: newCurrentPage,
        status: isFinished ? 'completed' : 'reading',
        startedAt: book.startedAt || today,
        ...(isFinished ? { completedAt: today } : {}),
      });

      // Track reading as habit
      const readingTitle = `Olvasás: ${book.title}`;
      const normalized = normalizeTitle(readingTitle);
      if (normalized) {
        dbService.addHabitEntry(uid, {
          title: readingTitle,
          normalizedTitle: normalized,
          source: 'reading',
          completedAt: today,
          category: book.genre || undefined,
          focusArea: inferFocusArea({ title: readingTitle, category: 'olvasas' }),
        }).catch(() => {});
      }

      if (isFinished) {
        toast.success(`"${book.title}" elolvasva! 🎉`, { duration: 4000 });
      }
    },

    // ============ JOURNAL ACTIONS ============

    addJournalEntry: async (entry) => {
      const { uid } = get();
      if (!uid) return;
      const now = new Date().toISOString();
      await dbService.addJournalEntry(uid, {
        ...coalesceFocusArea(
          entry,
          inferFocusArea({
            title: entry.gratitude || entry.freeWrite || entry.feelings,
            category: 'reflexio',
          })
        ),
        createdAt: now,
        updatedAt: now,
      });
    },

    updateJournalEntry: async (entryId, updates) => {
      const { uid, journalEntries } = get();
      if (!uid) return;
      const current = journalEntries.find((entry) => entry.id === entryId);
      await dbService.updateJournalEntry(uid, entryId, {
        ...updates,
        focusArea:
          updates.focusArea ||
          current?.focusArea ||
          inferFocusArea({
            title: updates.gratitude || updates.freeWrite || updates.feelings || current?.gratitude || current?.freeWrite || current?.feelings,
            category: 'reflexio',
          }),
        focusAreaSource: updates.focusAreaSource || current?.focusAreaSource || 'auto',
      });
    },

    deleteJournalEntry: async (entryId) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.deleteJournalEntry(uid, entryId);
    },

    // ============ GROWTH GOALS ACTIONS ============

    addGrowthGoal: async (goal) => {
      const { uid } = get();
      if (!uid) return;
      const now = new Date().toISOString();
      const milestones = (goal.milestones || []).map((milestone, index) => ({
        id: milestone.id || `m-${now}-${index}`,
        title: milestone.title,
        completed: Boolean(milestone.completed),
        completedAt: milestone.completedAt,
      }));
      await dbService.addGrowthGoal(uid, {
        ...goal,
        milestones,
        completed: milestones.length > 0 ? milestones.every((milestone) => milestone.completed) : false,
        createdAt: now,
        updatedAt: now,
      });
    },

    updateGrowthGoal: async (goalId, updates) => {
      const { uid, growthGoals } = get();
      if (!uid) return;
      const current = growthGoals.find((goal) => goal.id === goalId);
      if (!current) return;
      const milestones = (updates.milestones || current.milestones || []).map((milestone, index) => ({
        id: milestone.id || `${goalId}-m${index}`,
        title: milestone.title,
        completed: Boolean(milestone.completed),
        completedAt: milestone.completedAt,
      }));
      const completed = milestones.length > 0 ? milestones.every((milestone) => milestone.completed) : false;
      await dbService.updateGrowthGoal(uid, goalId, {
        ...updates,
        milestones,
        completed,
      });
    },

    deleteGrowthGoal: async (goalId) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.deleteGrowthGoal(uid, goalId);
    },

    toggleGrowthMilestone: async (goalId, milestoneId) => {
      const { uid, growthGoals } = get();
      if (!uid) return;
      const goal = growthGoals.find((item) => item.id === goalId);
      if (!goal) return;
      const milestones = (goal.milestones || []).map((milestone) => {
        if (milestone.id !== milestoneId) return milestone;
        const nextCompleted = !milestone.completed;
        return {
          ...milestone,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined,
        };
      });
      await dbService.updateGrowthGoal(uid, goalId, {
        milestones,
        completed: milestones.length > 0 ? milestones.every((milestone) => milestone.completed) : false,
      });
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
