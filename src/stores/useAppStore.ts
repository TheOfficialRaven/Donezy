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

// ============ STORE ============

interface AppState {
  uid: string | null;
  userStats: UserStats;
  quests: Quest[];
  notes: Note[];
  events: CalendarEvent[];
  achievements: Achievement[];
  lists: TodoList[];
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

export const useAppStore = create<AppState>()((set, get) => {
  // ============ INTERNAL HELPERS ============

  let _dailyChecked = false;
  let _achievementsSeeded = false;
  let _questGenerationInProgress = false;

  /**
   * Core XP processing: awards XP, handles level-ups (with essence bonus),
   * updates stats in Firebase, and checks achievements.
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

    // Calculate new XP and handle level-ups
    let xp = userStats.xp + xpGained;
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
   * Handles daily login: updates streak, awards daily XP, checks streak achievements.
   */
  const handleDailyLogin = async (currentStats: UserStats) => {
    const { uid } = get();
    if (!uid) return;

    const today = getLocalDateString();
    if (currentStats.lastActiveDate === today) return;

    // Calculate streak (using local dates)
    const yesterday = getLocalYesterday();
    const newStreak =
      currentStats.lastActiveDate === yesterday
        ? currentStats.streak + 1
        : 1;

    // Daily XP: base + streak bonus (capped)
    const streakBonus = Math.min(
      newStreak * DAILY_LOGIN_STREAK_BONUS,
      DAILY_LOGIN_MAX_BONUS
    );
    const dailyXp = DAILY_LOGIN_BASE_XP + streakBonus;

    // Calculate level from daily XP
    let xp = currentStats.xp + dailyXp;
    let level = currentStats.level;
    let xpToNextLevel = currentStats.xpToNextLevel;
    let lvlUpEssence = 0;

    while (xp >= xpToNextLevel) {
      xp -= xpToNextLevel;
      level++;
      xpToNextLevel = Math.floor(xpToNextLevel * 1.2);
      lvlUpEssence += levelUpEssenceBonus(level);
    }

    const statsUpdate: Partial<UserStats> = {
      xp,
      level,
      xpToNextLevel,
      lastActiveDate: today,
      streak: newStreak,
      essence: currentStats.essence + lvlUpEssence,
    };

    await dbService.updateStats(uid, statsUpdate);

    // Notifications
    if (newStreak > 1) {
      toast.success(
        `Napi bejelentkezés! ${newStreak} napos sorozat! +${dailyXp} XP`,
        { duration: 4000 }
      );
    } else {
      toast.success(`Napi bejelentkezés! +${dailyXp} XP`, { duration: 3000 });
    }

    if (level > currentStats.level) {
      toast.success(
        `Szintlépés! Elérted a ${level}. szintet! +${lvlUpEssence} Essence`,
        { duration: 5000 }
      );
    }

    // Check streak-related achievements
    const newStats: UserStats = { ...currentStats, ...statsUpdate };
    await checkAchievements(newStats);
  };

  /**
   * Updates progress on active weekly progress-based quests for a given tracking type.
   * Auto-completes the quest and awards rewards when the target is reached.
   */
  const updateWeeklyQuestProgress = async (trackingType: 'tasks_completed' | 'quests_completed' | 'notes_created') => {
    const { uid, quests, userStats } = get();
    if (!uid) return;

    const activeProgressQuests = quests.filter(
      (q) => q.generated && q.questType === 'weekly' && !q.completed &&
        q.trackingType === trackingType && q.targetCount
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
   * Generates daily and/or weekly quests if not already generated today/this week.
   * Cleans up old uncompleted generated daily quests.
   * Uses a lock + double-check (stats flag + existing quests) to prevent duplicate generation.
   */
  const generateQuestsIfNeeded = async (stats: UserStats) => {
    // Prevent concurrent generation calls
    if (_questGenerationInProgress) return;
    _questGenerationInProgress = true;

    try {
      const { uid, lists } = get();
      if (!uid) return;

      const today = getLocalDateString();
      const persona = (() => {
        try {
          const stored = localStorage.getItem('donezy-persona');
          if (stored) {
            const parsed = JSON.parse(stored);
            return parsed?.state?.currentPersona?.id || 'worker';
          }
        } catch { /* ignore */ }
        return 'worker';
      })();

      // Re-read quests from store (they may have loaded since the timeout was scheduled)
      const quests = get().quests;
      const genOptions = { persona, level: stats.level, quests, lists, uid, date: today };

      // --- Clean up old completed quests (from previous days) ---
      const oldCompletedQuests = quests.filter(
        (q) => q.completed && q.completedAt && !q.completedAt.startsWith(today)
      );
      for (const q of oldCompletedQuests) {
        await dbService.deleteQuest(uid, q.id);
      }
      // Also remove old uncompleted generated daily quests from previous days
      const oldUncompletedDaily = quests.filter(
        (q) => q.generated && q.questType === 'daily' && q.dueDate && q.dueDate !== today && !q.completed
      );
      for (const q of oldUncompletedDaily) {
        await dbService.deleteQuest(uid, q.id);
      }

      // --- Daily Quests ---
      // Check BOTH the stats flag AND existing quests to decide if generation is needed.
      // This double-check prevents regeneration even if one check has a race condition.
      const allDailyForToday = quests.filter(
        (q) => q.generated && q.questType === 'daily' && q.dueDate === today
      );
      const hasCompletedDailyToday = allDailyForToday.some((q) => q.completed);

      // Persona mismatch: only allow swap if NO quests have been completed today
      const dailyPersonaMismatch = !hasCompletedDailyToday &&
        allDailyForToday.length > 0 &&
        allDailyForToday.every((q) => q.persona && q.persona !== persona);

      // Generate daily quests only if:
      // 1. Stats say we haven't generated today AND no daily quests exist for today, OR
      // 2. All existing daily quests have wrong persona and none are completed
      const needsDailyGen =
        (stats.lastQuestGenDate !== today && allDailyForToday.length === 0) ||
        dailyPersonaMismatch;

      if (needsDailyGen) {
        // Clean up mismatched daily quests (if persona swap)
        if (dailyPersonaMismatch) {
          for (const q of allDailyForToday) {
            await dbService.deleteQuest(uid, q.id);
          }
        }

        // Generate new daily quests
        const dailyQuests = generateDailyQuests(genOptions);
        for (const quest of dailyQuests) {
          await dbService.addQuest(uid, quest);
        }

        await dbService.updateStats(uid, { lastQuestGenDate: today });
        toast.success(`${dailyQuests.length} új napi küldetés generálva!`, { duration: 3000 });
      } else if (stats.lastQuestGenDate !== today && allDailyForToday.length > 0) {
        // Quests exist but stats flag is outdated → fix the flag without regenerating
        await dbService.updateStats(uid, { lastQuestGenDate: today });
      }

      // --- Weekly Quests ---
      const mondayOfWeek = getLocalMondayOfWeek(today);
      const sundayOfWeek = getLocalSundayOfWeek(today);

      // Find ALL weekly quests for the current week (completed or not)
      const allWeeklyThisWeek = quests.filter(
        (q) => q.generated && q.questType === 'weekly' &&
          q.dueDate && q.dueDate >= mondayOfWeek && q.dueDate <= sundayOfWeek
      );
      const hasCompletedWeeklyThisWeek = allWeeklyThisWeek.some((q) => q.completed);

      // Persona mismatch: only allow swap if NO weekly quests have been completed this week
      const weeklyPersonaMismatch = !hasCompletedWeeklyThisWeek &&
        allWeeklyThisWeek.length > 0 &&
        allWeeklyThisWeek.every((q) => q.persona && q.persona !== persona);

      // Generate weekly quests only if:
      // 1. Stats say we haven't generated this week AND no weekly quests exist for this week, OR
      // 2. All existing weekly quests have wrong persona and none are completed
      const needsWeeklyGen =
        ((!stats.lastWeeklyGenDate || stats.lastWeeklyGenDate < mondayOfWeek) && allWeeklyThisWeek.length === 0) ||
        weeklyPersonaMismatch;

      if (needsWeeklyGen) {
        // Clean up mismatched weekly quests
        if (weeklyPersonaMismatch) {
          for (const q of allWeeklyThisWeek) {
            await dbService.deleteQuest(uid, q.id);
          }
        }

        const weeklyQuests = generateWeeklyQuests(genOptions);
        for (const quest of weeklyQuests) {
          await dbService.addQuest(uid, quest);
        }

        await dbService.updateStats(uid, { lastWeeklyGenDate: today });
        if (weeklyQuests.length > 0) {
          toast.success(`${weeklyQuests.length} új heti küldetés generálva!`, { duration: 3000 });
        }
      } else if ((!stats.lastWeeklyGenDate || stats.lastWeeklyGenDate < mondayOfWeek) && allWeeklyThisWeek.length > 0) {
        // Weekly quests exist but stats flag is outdated → fix the flag without regenerating
        await dbService.updateStats(uid, { lastWeeklyGenDate: today });
      }
    } finally {
      _questGenerationInProgress = false;
    }
  };

  // ============ STORE DEFINITION ============

  return {
    uid: null,
    userStats: defaultStats,
    quests: [],
    notes: [],
    events: [],
    achievements: [],
    lists: [],
    dataLoaded: false,
    _unsubscribers: [],

    // ============ INITIALIZATION ============

    initializeForUser: (uid: string) => {
      // Clean up any existing subscriptions
      get()._unsubscribers.forEach((unsub) => unsub());
      _dailyChecked = false;
      _achievementsSeeded = false;
      _questGenerationInProgress = false;

      const unsubscribers: (() => void)[] = [];

      // Subscribe to stats (with daily login check on first load)
      unsubscribers.push(
        dbService.subscribeToStats(uid, (stats) => {
          const mergedStats = stats
            ? { ...defaultStats, ...stats }
            : defaultStats;
          set({ userStats: mergedStats });

          // Handle daily login once after first data load
          if (!_dailyChecked) {
            _dailyChecked = true;
            handleDailyLogin(mergedStats);

            // Schedule quest generation independently (wait for other data to load)
            setTimeout(() => {
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

      set({ uid, _unsubscribers: unsubscribers, dataLoaded: true });
    },

    cleanup: () => {
      get()._unsubscribers.forEach((unsub) => unsub());
      _dailyChecked = false;
      _achievementsSeeded = false;
      _questGenerationInProgress = false;
      set({
        uid: null,
        userStats: defaultStats,
        quests: [],
        notes: [],
        events: [],
        achievements: [],
        lists: [],
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

      // Update progress on weekly quests that track quest completions
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
          // Mark task as completed AND flag that XP was awarded
          await dbService.updateTask(uid, listId, taskId, {
            ...updates,
            xpAwarded: true,
          });
          // Award XP based on priority
          const xp = TASK_XP[task.priority] || 10;
          await processAction(xp, {
            statUpdates: {
              tasksCompleted: (userStats.tasksCompleted || 0) + 1,
            },
          });

          // Update progress on weekly quests that track task completions
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
  };
});
