// ============ XP REWARD CONSTANTS ============

export const TASK_XP: Record<string, number> = {
  low: 5,
  medium: 10,
  high: 20,
};

export const NOTE_CREATE_XP = 5;
export const DAILY_LOGIN_BASE_XP = 10;
export const DAILY_LOGIN_STREAK_BONUS = 2; // per streak day
export const DAILY_LOGIN_MAX_BONUS = 20; // cap for streak bonus

// ============ LEVEL-UP ESSENCE BONUS ============

export function levelUpEssenceBonus(newLevel: number): number {
  return newLevel * 25;
}

// ============ ACHIEVEMENT ESSENCE REWARDS ============

export const ACHIEVEMENT_ESSENCE: Record<string, number> = {
  common: 25,
  rare: 50,
  epic: 100,
  legendary: 200,
};

// ============ ACHIEVEMENT DEFINITIONS ============

export interface AchievementStats {
  level: number;
  totalQuestsCompleted: number;
  tasksCompleted: number;
  notesCreated: number;
  streak: number;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  maxProgress: number;
  condition: (s: AchievementStats) => number;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // ─── Common (25 Essence) ───
  {
    id: 'first_quest',
    title: 'Első Küldetés',
    description: 'Teljesítsd az első küldetésedet',
    icon: 'Zap',
    rarity: 'common',
    maxProgress: 1,
    condition: (s) => Math.min(s.totalQuestsCompleted, 1),
  },
  {
    id: 'first_task',
    title: 'Első Feladat',
    description: 'Teljesítsd az első feladatodat',
    icon: 'CheckSquare',
    rarity: 'common',
    maxProgress: 1,
    condition: (s) => Math.min(s.tasksCompleted, 1),
  },
  {
    id: 'first_note',
    title: 'Első Jegyzet',
    description: 'Készítsd el az első jegyzetedet',
    icon: 'FileText',
    rarity: 'common',
    maxProgress: 1,
    condition: (s) => Math.min(s.notesCreated, 1),
  },

  // ─── Rare (50 Essence) ───
  {
    id: 'quest_5',
    title: 'Küldetésvadász',
    description: 'Teljesíts 5 küldetést',
    icon: 'Target',
    rarity: 'rare',
    maxProgress: 5,
    condition: (s) => Math.min(s.totalQuestsCompleted, 5),
  },
  {
    id: 'quest_10',
    title: 'Tapasztalt Kalandor',
    description: 'Teljesíts 10 küldetést',
    icon: 'Swords',
    rarity: 'rare',
    maxProgress: 10,
    condition: (s) => Math.min(s.totalQuestsCompleted, 10),
  },
  {
    id: 'tasks_10',
    title: 'Feladatmester',
    description: 'Teljesíts 10 feladatot',
    icon: 'ListChecks',
    rarity: 'rare',
    maxProgress: 10,
    condition: (s) => Math.min(s.tasksCompleted, 10),
  },
  {
    id: 'tasks_50',
    title: 'Produktivitás Guru',
    description: 'Teljesíts 50 feladatot',
    icon: 'Award',
    rarity: 'rare',
    maxProgress: 50,
    condition: (s) => Math.min(s.tasksCompleted, 50),
  },
  {
    id: 'notes_5',
    title: 'Jegyzetelő',
    description: 'Készíts 5 jegyzetet',
    icon: 'BookOpen',
    rarity: 'rare',
    maxProgress: 5,
    condition: (s) => Math.min(s.notesCreated, 5),
  },
  {
    id: 'level_5',
    title: 'Szintemelkedő',
    description: 'Érj el 5. szintet',
    icon: 'TrendingUp',
    rarity: 'rare',
    maxProgress: 5,
    condition: (s) => Math.min(s.level, 5),
  },
  {
    id: 'streak_3',
    title: 'Kitartó',
    description: 'Érj el 3 napos sorozatot',
    icon: 'Flame',
    rarity: 'rare',
    maxProgress: 3,
    condition: (s) => Math.min(s.streak, 3),
  },

  // ─── Epic (100 Essence) ───
  {
    id: 'quest_25',
    title: 'Veterán Harcos',
    description: 'Teljesíts 25 küldetést',
    icon: 'Shield',
    rarity: 'epic',
    maxProgress: 25,
    condition: (s) => Math.min(s.totalQuestsCompleted, 25),
  },
  {
    id: 'tasks_100',
    title: 'Feladatok Királya',
    description: 'Teljesíts 100 feladatot',
    icon: 'Crown',
    rarity: 'epic',
    maxProgress: 100,
    condition: (s) => Math.min(s.tasksCompleted, 100),
  },
  {
    id: 'notes_15',
    title: 'Tudásgyűjtő',
    description: 'Készíts 15 jegyzetet',
    icon: 'BookOpen',
    rarity: 'epic',
    maxProgress: 15,
    condition: (s) => Math.min(s.notesCreated, 15),
  },
  {
    id: 'level_10',
    title: 'Mester',
    description: 'Érj el 10. szintet',
    icon: 'Star',
    rarity: 'epic',
    maxProgress: 10,
    condition: (s) => Math.min(s.level, 10),
  },
  {
    id: 'streak_7',
    title: 'Hét Nap Bajnoka',
    description: 'Érj el 7 napos sorozatot',
    icon: 'Flame',
    rarity: 'epic',
    maxProgress: 7,
    condition: (s) => Math.min(s.streak, 7),
  },
  {
    id: 'streak_14',
    title: 'Két Hét Hőse',
    description: 'Érj el 14 napos sorozatot',
    icon: 'Flame',
    rarity: 'epic',
    maxProgress: 14,
    condition: (s) => Math.min(s.streak, 14),
  },

  // ─── Legendary (200 Essence) ───
  {
    id: 'quest_50',
    title: 'Legendás Hős',
    description: 'Teljesíts 50 küldetést',
    icon: 'Trophy',
    rarity: 'legendary',
    maxProgress: 50,
    condition: (s) => Math.min(s.totalQuestsCompleted, 50),
  },
  {
    id: 'quest_100',
    title: 'Mitikus Bajnok',
    description: 'Teljesíts 100 küldetést',
    icon: 'Gem',
    rarity: 'legendary',
    maxProgress: 100,
    condition: (s) => Math.min(s.totalQuestsCompleted, 100),
  },
  {
    id: 'tasks_500',
    title: 'Feladatok Istene',
    description: 'Teljesíts 500 feladatot',
    icon: 'Sparkles',
    rarity: 'legendary',
    maxProgress: 500,
    condition: (s) => Math.min(s.tasksCompleted, 500),
  },
  {
    id: 'level_25',
    title: 'Nagymester',
    description: 'Érj el 25. szintet',
    icon: 'Crown',
    rarity: 'legendary',
    maxProgress: 25,
    condition: (s) => Math.min(s.level, 25),
  },
  {
    id: 'streak_30',
    title: 'Megállíthatatlan',
    description: 'Érj el 30 napos sorozatot',
    icon: 'Flame',
    rarity: 'legendary',
    maxProgress: 30,
    condition: (s) => Math.min(s.streak, 30),
  },
];
