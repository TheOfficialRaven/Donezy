import { ref, set, get, push, remove, update, onValue, type Unsubscribe } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { Quest, Note, CalendarEvent, Achievement, UserStats, TodoList } from '@/stores/useAppStore';

// Helper to get user-specific path
function userPath(uid: string, path: string) {
  return `users/${uid}/${path}`;
}

// ============ USER STATS ============

export function subscribeToStats(uid: string, callback: (stats: UserStats | null) => void): Unsubscribe {
  const statsRef = ref(db, userPath(uid, 'stats'));
  return onValue(statsRef, (snapshot) => {
    callback(snapshot.val());
  });
}

export async function updateStats(uid: string, updates: Partial<UserStats>) {
  const statsRef = ref(db, userPath(uid, 'stats'));
  await update(statsRef, updates);
}

// ============ QUESTS ============

export function subscribeToQuests(uid: string, callback: (quests: Quest[]) => void): Unsubscribe {
  const questsRef = ref(db, userPath(uid, 'quests'));
  return onValue(questsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const quests = Object.entries(data).map(([id, quest]) => ({
      ...(quest as Quest),
      id,
    }));
    callback(quests);
  });
}

export async function addQuest(uid: string, quest: Omit<Quest, 'id'>) {
  const questsRef = ref(db, userPath(uid, 'quests'));
  const newRef = push(questsRef);
  await set(newRef, quest);
  return newRef.key!;
}

export async function updateQuest(uid: string, questId: string, updates: Partial<Quest>) {
  const questRef = ref(db, userPath(uid, `quests/${questId}`));
  await update(questRef, updates);
}

export async function deleteQuest(uid: string, questId: string) {
  const questRef = ref(db, userPath(uid, `quests/${questId}`));
  await remove(questRef);
}

// ============ LISTS ============

export function subscribeToLists(uid: string, callback: (lists: TodoList[]) => void): Unsubscribe {
  const listsRef = ref(db, userPath(uid, 'lists'));
  return onValue(listsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const lists = Object.entries(data).map(([id, list]) => {
      const listData = list as any;
      const tasks = listData.tasks
        ? Object.entries(listData.tasks).map(([taskId, task]) => ({
            ...(task as any),
            id: taskId,
          }))
        : [];
      return { ...listData, id, tasks };
    });
    callback(lists);
  });
}

export async function addList(uid: string, list: Omit<TodoList, 'id' | 'tasks'>) {
  const listsRef = ref(db, userPath(uid, 'lists'));
  const newRef = push(listsRef);
  await set(newRef, { ...list, tasks: {} });
  return newRef.key!;
}

export async function updateList(uid: string, listId: string, updates: Partial<TodoList>) {
  const listRef = ref(db, userPath(uid, `lists/${listId}`));
  await update(listRef, updates);
}

export async function deleteList(uid: string, listId: string) {
  const listRef = ref(db, userPath(uid, `lists/${listId}`));
  await remove(listRef);
}

export async function addTask(uid: string, listId: string, task: Omit<import('@/stores/useAppStore').Task, 'id'>) {
  const tasksRef = ref(db, userPath(uid, `lists/${listId}/tasks`));
  const newRef = push(tasksRef);
  await set(newRef, task);
  return newRef.key!;
}

export async function updateTask(uid: string, listId: string, taskId: string, updates: Partial<import('@/stores/useAppStore').Task>) {
  const taskRef = ref(db, userPath(uid, `lists/${listId}/tasks/${taskId}`));
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) clean[key] = value;
  }
  await update(taskRef, clean);
}

export async function deleteTask(uid: string, listId: string, taskId: string) {
  const taskRef = ref(db, userPath(uid, `lists/${listId}/tasks/${taskId}`));
  await remove(taskRef);
}

// ============ NOTES ============

export function subscribeToNotes(uid: string, callback: (notes: Note[]) => void): Unsubscribe {
  const notesRef = ref(db, userPath(uid, 'notes'));
  return onValue(notesRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const notes = Object.entries(data).map(([id, note]) => ({
      ...(note as Note),
      id,
    }));
    callback(notes);
  });
}

export async function addNote(uid: string, note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) {
  const notesRef = ref(db, userPath(uid, 'notes'));
  const newRef = push(notesRef);
  const now = new Date().toISOString();
  await set(newRef, { ...note, createdAt: now, updatedAt: now });
  return newRef.key!;
}

export async function updateNote(uid: string, noteId: string, updates: Partial<Note>) {
  const noteRef = ref(db, userPath(uid, `notes/${noteId}`));
  await update(noteRef, { ...updates, updatedAt: new Date().toISOString() });
}

export async function deleteNote(uid: string, noteId: string) {
  const noteRef = ref(db, userPath(uid, `notes/${noteId}`));
  await remove(noteRef);
}

// ============ EVENTS ============

export function subscribeToEvents(uid: string, callback: (events: CalendarEvent[]) => void): Unsubscribe {
  const eventsRef = ref(db, userPath(uid, 'events'));
  return onValue(eventsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const events = Object.entries(data).map(([id, event]) => ({
      ...(event as CalendarEvent),
      id,
    }));
    callback(events);
  });
}

export async function addEvent(uid: string, event: Omit<CalendarEvent, 'id'>) {
  const eventsRef = ref(db, userPath(uid, 'events'));
  const newRef = push(eventsRef);
  await set(newRef, event);
  return newRef.key!;
}

export async function updateEvent(uid: string, eventId: string, updates: Partial<CalendarEvent>) {
  const eventRef = ref(db, userPath(uid, `events/${eventId}`));
  await update(eventRef, updates);
}

export async function deleteEvent(uid: string, eventId: string) {
  const eventRef = ref(db, userPath(uid, `events/${eventId}`));
  await remove(eventRef);
}

// ============ ACHIEVEMENTS ============

export function subscribeToAchievements(uid: string, callback: (achievements: Achievement[]) => void): Unsubscribe {
  const achievementsRef = ref(db, userPath(uid, 'achievements'));
  return onValue(achievementsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const achievements = Object.entries(data).map(([id, achievement]) => ({
      ...(achievement as Achievement),
      id,
    }));
    callback(achievements);
  });
}

export async function unlockAchievement(uid: string, achievementId: string) {
  const achievementRef = ref(db, userPath(uid, `achievements/${achievementId}`));
  await update(achievementRef, { unlockedAt: new Date().toISOString() });
}

export async function updateAchievementData(uid: string, achievementId: string, data: Partial<Achievement>) {
  const achievementRef = ref(db, userPath(uid, `achievements/${achievementId}`));
  await update(achievementRef, data);
}

export async function seedAchievements(uid: string, definitions: Array<{
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: string;
  maxProgress: number;
}>) {
  const achievementsRef = ref(db, userPath(uid, 'achievements'));
  const data: Record<string, any> = {};
  for (const def of definitions) {
    data[def.id] = {
      title: def.title,
      description: def.description,
      icon: def.icon,
      rarity: def.rarity,
      progress: 0,
      maxProgress: def.maxProgress,
    };
  }
  await set(achievementsRef, data);
}

// ============ USER PREFERENCES ============

export function subscribeToPreferences(uid: string, callback: (prefs: Record<string, any> | null) => void): Unsubscribe {
  const prefsRef = ref(db, userPath(uid, 'preferences'));
  return onValue(prefsRef, (snapshot) => {
    callback(snapshot.val());
  });
}

export async function updatePreferences(uid: string, prefs: Record<string, any>) {
  const prefsRef = ref(db, userPath(uid, 'preferences'));
  await update(prefsRef, prefs);
}

// ============ PERSONA ============

export async function savePersona(uid: string, personaId: string) {
  const profileRef = ref(db, userPath(uid, 'profile/persona'));
  await set(profileRef, personaId);
}

export async function getPersona(uid: string): Promise<string | null> {
  const profileRef = ref(db, userPath(uid, 'profile/persona'));
  const snapshot = await get(profileRef);
  return snapshot.val();
}

// ============ BOOKS (Reading Journal) ============

export interface BookData {
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

export interface ReadingLogData {
  bookId: string;
  date: string; // YYYY-MM-DD
  pagesRead: number;
  note?: string;
}

export interface GrowthMilestoneData {
  id?: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface GrowthGoalData {
  title: string;
  description?: string;
  area: 'mindset' | 'habit' | 'skill' | 'wellbeing';
  targetDate?: string;
  priority: 'low' | 'medium' | 'high';
  milestones: GrowthMilestoneData[];
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export function subscribeToBooks(uid: string, callback: (books: Array<BookData & { id: string }>) => void): Unsubscribe {
  const booksRef = ref(db, userPath(uid, 'books'));
  return onValue(booksRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) { callback([]); return; }
    const books = Object.entries(data).map(([id, book]) => ({
      ...(book as BookData),
      id,
    }));
    callback(books);
  });
}

export async function addBook(uid: string, book: BookData) {
  const booksRef = ref(db, userPath(uid, 'books'));
  const newRef = push(booksRef);
  await set(newRef, book);
  return newRef.key!;
}

export async function updateBook(uid: string, bookId: string, updates: Partial<BookData>) {
  const bookRef = ref(db, userPath(uid, `books/${bookId}`));
  await update(bookRef, updates);
}

export async function deleteBook(uid: string, bookId: string) {
  const bookRef = ref(db, userPath(uid, `books/${bookId}`));
  await remove(bookRef);
}

export function subscribeToReadingLogs(uid: string, callback: (logs: Array<ReadingLogData & { id: string }>) => void): Unsubscribe {
  const logsRef = ref(db, userPath(uid, 'readingLogs'));
  return onValue(logsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) { callback([]); return; }
    const logs = Object.entries(data).map(([id, log]) => ({
      ...(log as ReadingLogData),
      id,
    }));
    callback(logs);
  });
}

export async function addReadingLog(uid: string, log: ReadingLogData) {
  const logsRef = ref(db, userPath(uid, 'readingLogs'));
  const newRef = push(logsRef);
  await set(newRef, log);
  return newRef.key!;
}

// ============ GROWTH GOALS ============

export function subscribeToGrowthGoals(uid: string, callback: (goals: Array<GrowthGoalData & { id: string }>) => void): Unsubscribe {
  const goalsRef = ref(db, userPath(uid, 'growthGoals'));
  return onValue(goalsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) { callback([]); return; }
    const goals = Object.entries(data).map(([id, goal]) => ({
      ...(goal as GrowthGoalData),
      id,
    }));
    callback(goals);
  });
}

function sanitizeGrowthMilestones(milestones: GrowthMilestoneData[] | undefined): GrowthMilestoneData[] {
  if (!milestones || milestones.length === 0) return [];
  return milestones.map((milestone) => {
    const clean: GrowthMilestoneData = {
      id: milestone.id,
      title: milestone.title,
      completed: Boolean(milestone.completed),
    };
    if (milestone.completedAt) clean.completedAt = milestone.completedAt;
    return clean;
  });
}

function sanitizeGrowthGoalData(goal: GrowthGoalData): GrowthGoalData {
  const clean: GrowthGoalData = {
    title: goal.title,
    area: goal.area,
    priority: goal.priority,
    milestones: sanitizeGrowthMilestones(goal.milestones),
    completed: Boolean(goal.completed),
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
  };
  if (goal.description) clean.description = goal.description;
  if (goal.targetDate) clean.targetDate = goal.targetDate;
  return clean;
}

function sanitizeGrowthGoalUpdates(updates: Partial<GrowthGoalData>): Partial<GrowthGoalData> {
  const clean: Partial<GrowthGoalData> = {};
  if (updates.title !== undefined) clean.title = updates.title;
  if (updates.description !== undefined) {
    if (updates.description) clean.description = updates.description;
  }
  if (updates.area !== undefined) clean.area = updates.area;
  if (updates.targetDate !== undefined) {
    if (updates.targetDate) clean.targetDate = updates.targetDate;
  }
  if (updates.priority !== undefined) clean.priority = updates.priority;
  if (updates.milestones !== undefined) clean.milestones = sanitizeGrowthMilestones(updates.milestones);
  if (updates.completed !== undefined) clean.completed = Boolean(updates.completed);
  if (updates.createdAt !== undefined) clean.createdAt = updates.createdAt;
  if (updates.updatedAt !== undefined) clean.updatedAt = updates.updatedAt;
  return clean;
}

export async function addGrowthGoal(uid: string, goal: GrowthGoalData) {
  const goalsRef = ref(db, userPath(uid, 'growthGoals'));
  const newRef = push(goalsRef);
  await set(newRef, sanitizeGrowthGoalData(goal));
  return newRef.key!;
}

export async function updateGrowthGoal(uid: string, goalId: string, updates: Partial<GrowthGoalData>) {
  const goalRef = ref(db, userPath(uid, `growthGoals/${goalId}`));
  await update(goalRef, { ...sanitizeGrowthGoalUpdates(updates), updatedAt: new Date().toISOString() });
}

export async function deleteGrowthGoal(uid: string, goalId: string) {
  const goalRef = ref(db, userPath(uid, `growthGoals/${goalId}`));
  await remove(goalRef);
}

// ============ HABIT ENTRIES ============

export interface HabitEntryData {
  title: string;
  normalizedTitle: string;
  source: 'task' | 'quest' | 'event' | 'reading';
  completedAt: string; // YYYY-MM-DD
  category?: string;
  focusArea?: import('@/lib/focusAreas').FocusArea;
}

export function subscribeToHabitEntries(uid: string, callback: (entries: Array<HabitEntryData & { id: string }>) => void): Unsubscribe {
  const habitsRef = ref(db, userPath(uid, 'habitEntries'));
  return onValue(habitsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const entries = Object.entries(data).map(([id, entry]) => ({
      ...(entry as HabitEntryData),
      id,
    }));
    callback(entries);
  });
}

export async function addHabitEntry(uid: string, entry: HabitEntryData) {
  const habitsRef = ref(db, userPath(uid, 'habitEntries'));
  const newRef = push(habitsRef);
  const data: Record<string, unknown> = {
    title: entry.title,
    normalizedTitle: entry.normalizedTitle,
    source: entry.source,
    completedAt: entry.completedAt,
  };
  if (entry.category) data.category = entry.category;
  if (entry.focusArea) data.focusArea = entry.focusArea;
  await set(newRef, data);
  return newRef.key!;
}

// ============ JOURNAL ENTRIES (Daily Reflection) ============

export interface JournalEntryData {
  date: string; // YYYY-MM-DD
  mood: number; // 1-5
  gratitude?: string;
  lessons?: string;
  feelings?: string;
  growth?: string;
  freeWrite?: string;
  tags?: string[];
  focusArea?: import('@/lib/focusAreas').FocusArea;
  focusAreaSource?: import('@/lib/focusAreas').FocusAreaSource;
  createdAt: string;
  updatedAt: string;
}

export function subscribeToJournalEntries(uid: string, callback: (entries: Array<JournalEntryData & { id: string }>) => void): Unsubscribe {
  const journalRef = ref(db, userPath(uid, 'journalEntries'));
  return onValue(journalRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) { callback([]); return; }
    const entries = Object.entries(data).map(([id, entry]) => ({
      ...(entry as JournalEntryData),
      id,
    }));
    callback(entries);
  });
}

export async function addJournalEntry(uid: string, entry: JournalEntryData) {
  const journalRef = ref(db, userPath(uid, 'journalEntries'));
  const newRef = push(journalRef);
  const clean: Record<string, any> = { date: entry.date, mood: entry.mood, createdAt: entry.createdAt, updatedAt: entry.updatedAt };
  if (entry.gratitude) clean.gratitude = entry.gratitude;
  if (entry.lessons) clean.lessons = entry.lessons;
  if (entry.feelings) clean.feelings = entry.feelings;
  if (entry.growth) clean.growth = entry.growth;
  if (entry.freeWrite) clean.freeWrite = entry.freeWrite;
  if (entry.tags && entry.tags.length > 0) clean.tags = entry.tags;
  if (entry.focusArea) clean.focusArea = entry.focusArea;
  if (entry.focusAreaSource) clean.focusAreaSource = entry.focusAreaSource;
  await set(newRef, clean);
  return newRef.key!;
}

export async function updateJournalEntry(uid: string, entryId: string, updates: Partial<JournalEntryData>) {
  const entryRef = ref(db, userPath(uid, `journalEntries/${entryId}`));
  const clean: Record<string, any> = { updatedAt: new Date().toISOString() };
  for (const [key, value] of Object.entries(updates)) {
    if (key === 'updatedAt') continue;
    if (value !== undefined && value !== null) clean[key] = value;
  }
  await update(entryRef, clean);
}

export async function deleteJournalEntry(uid: string, entryId: string) {
  const entryRef = ref(db, userPath(uid, `journalEntries/${entryId}`));
  await remove(entryRef);
}

// ============ DELETE ALL USER DATA ============

export async function deleteAllUserData(uid: string) {
  const userRef = ref(db, `users/${uid}`);
  await remove(userRef);
}
