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
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  xpAwarded?: boolean;
  subtasks?: Task[];
}

export interface TodoList {
  id: string;
  name: string;
  color: string;
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
  dataLoaded: boolean;
  _unsubscribers: (() => void)[];

  // Initialization
  initializeForUser: (uid: string) => void;
  cleanup: () => void;

  // Quest actions
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
};

export const useAppStore = create<AppState>()((set, get) => {
  // ============ INTERNAL HELPERS ============

  let _dailyChecked = false;
  let _achievementsSeeded = false;
  let _questGenerationInProgress = false;
  let _dailyActivityDate = ''; // Tracks if daily activity was already recorded this session
  let _prefsLoaded = false; // Tracks whether the preferences subscription has delivered data

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
          await dbService.addQuest(uid, quest);
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
          await dbService.addQuest(uid, quest);
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
          set({ quests });
        })
      );

      // Subscribe to lists
      unsubscribers.push(
        dbService.subscribeToLists(uid, (lists) => {
          set({ lists });
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
          set({ events });
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
        dataLoaded: false,
        _unsubscribers: [],
      });
    },

    // ============ QUEST ACTIONS ============

    completeQuest: async (questId: string) => {
      const { uid, quests, userStats } = get();
      if (!uid) return;

      const quest = quests.find((q) => q.id === questId);
      if (!quest || quest.completed) return;

      // Mark quest as completed in Firebase (use local date prefix for correct day filtering)
      await dbService.updateQuest(uid, questId, {
        completed: true,
        completedAt: getLocalDateString() + 'T' + new Date().toTimeString().slice(0, 8),
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
      await dbService.addList(uid, list);
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
      const { uid } = get();
      if (!uid) return;
      await dbService.addTask(uid, listId, task);
    },

    updateTask: async (listId, taskId, updates) => {
      const { uid, lists, userStats } = get();
      if (!uid) return;

      // Detect if a task is being newly completed → award XP (only once)
      if (updates.completed === true) {
        const list = lists.find((l) => l.id === listId);
        const task = list?.tasks.find((t) => t.id === taskId);
        if (task && !task.completed && !task.xpAwarded) {
          await dbService.updateTask(uid, listId, taskId, {
            ...updates,
            xpAwarded: true,
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
            }).catch(() => {});
          }

          await updateWeeklyQuestProgress('tasks_completed');
          return;
        }
      }

      await dbService.updateTask(uid, listId, taskId, updates);
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
      await dbService.addEvent(uid, event);
    },

    updateEvent: async (eventId, updates) => {
      const { uid } = get();
      if (!uid) return;
      await dbService.updateEvent(uid, eventId, updates);
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

      if (isFinished) {
        toast.success(`"${book.title}" elolvasva! 🎉`, { duration: 4000 });
      }
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
