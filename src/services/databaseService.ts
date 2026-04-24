import { ref, set, get, push, remove, update, onValue, type Unsubscribe } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { Quest, CalendarEvent, Achievement, UserStats, TodoList } from '@/stores/useAppStore';
import { normalizeNote, normalizeNoteFolder } from '@/lib/notes/normalize';
import type { Note, NoteFolder } from '@/lib/notes/types';
import { toLocalDateKey } from '@/lib/calendar/dateKey';
import { normalizeGoal } from '@/lib/goals/normalize';
import type { Goal, GoalRaw, Milestone } from '@/lib/goals/types';
import {
  normalizeHabit,
  normalizeHabitActivitySignal,
  normalizeHabitCandidate,
  normalizeHabitCompletion,
} from '@/lib/habits/normalize';
import { normalizeReflectionEntry } from '@/lib/reflection/normalize';
import { normalizeBook, normalizeReadingEntry } from '@/lib/reading/normalize';
import type {
  Habit,
  HabitActivitySignal,
  HabitActivitySignalRaw,
  HabitCandidate,
  HabitCandidateRaw,
  HabitCompletion,
  HabitCompletionRaw,
  HabitRaw,
} from '@/lib/habits/types';
import type { ReflectionEntryRaw } from '@/lib/reflection/types';
import type { BookRaw, ReadingEntryRaw } from '@/lib/reading/types';
import { normalizeQuickCaptureItem } from '@/lib/capture/normalize';
import type { QuickCaptureItem, QuickCaptureItemRaw } from '@/lib/capture/types';
import type { UserProfilePreferencesRaw } from '@/lib/preferences/types';
import { normalizeRoutingCandidate } from '@/lib/routing/normalize';
import type { RoutingCandidate } from '@/lib/routing/types';

// Helper to get user-specific path
function userPath(uid: string, path: string) {
  return `users/${uid}/${path}`;
}

function cleanUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cleanUndefinedDeep(item)) as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (nested === undefined) continue;
      out[key] = cleanUndefinedDeep(nested);
    }
    return out as T;
  }
  return value;
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
      return {
        ...listData,
        id,
        title: listData.title || listData.name,
        name: listData.name || listData.title,
        schemaVersion: listData.schemaVersion || 1,
        archived: Boolean(listData.archived),
        pinned: Boolean(listData.pinned),
        tasks,
      };
    });
    callback(lists);
  });
}

export async function addList(uid: string, list: Omit<TodoList, 'id' | 'tasks'>) {
  const listsRef = ref(db, userPath(uid, 'lists'));
  const newRef = push(listsRef);
  const now = new Date().toISOString();
  await set(newRef, {
    ...list,
    title: (list.title || list.name || '').trim(),
    name: (list.name || list.title || '').trim(),
    description: list.description || '',
    icon: list.icon || 'list',
    archived: Boolean(list.archived),
    pinned: Boolean(list.pinned),
    sortOrder: Number.isFinite(list.sortOrder) ? list.sortOrder : Date.now(),
    schemaVersion: list.schemaVersion || 2,
    targetGroupVisibility: list.targetGroupVisibility || ['all'],
    tags: list.tags || [],
    createdAt: list.createdAt || now,
    updatedAt: list.updatedAt || now,
    tasks: {},
  });
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
  await set(newRef, cleanUndefinedDeep(task));
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

export async function setListArchived(uid: string, listId: string, archived: boolean) {
  await updateList(uid, listId, { archived, updatedAt: new Date().toISOString() } as Partial<TodoList>);
}

export async function setListPinned(uid: string, listId: string, pinned: boolean) {
  await updateList(uid, listId, { pinned, updatedAt: new Date().toISOString() } as Partial<TodoList>);
}

export async function updateListSortOrder(uid: string, listId: string, sortOrder: number) {
  await updateList(uid, listId, { sortOrder, updatedAt: new Date().toISOString() } as Partial<TodoList>);
}

export async function updateTaskSortOrder(uid: string, listId: string, taskId: string, sortOrder: number) {
  await updateTask(uid, listId, taskId, { sortOrder, updatedAt: new Date().toISOString() } as any);
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
    const notes = Object.entries(data).map(([id, note]) =>
      normalizeNote({ ...(note as Record<string, unknown>), id } as import('@/lib/notes/types').NoteRaw, uid)
    );
    callback(notes);
  });
}

export function subscribeToNoteFolders(uid: string, callback: (folders: NoteFolder[]) => void): Unsubscribe {
  const refPath = ref(db, userPath(uid, 'noteFolders'));
  return onValue(refPath, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const folders = Object.entries(data).map(([id, row]) =>
      normalizeNoteFolder({ ...(row as Record<string, unknown>), id } as import('@/lib/notes/types').NoteFolderRaw, uid)
    );
    callback(folders);
  });
}

export async function addNote(uid: string, note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) {
  const notesRef = ref(db, userPath(uid, 'notes'));
  const newRef = push(notesRef);
  const now = new Date().toISOString();
  const payload = cleanUndefinedDeep({ ...note, createdAt: now, updatedAt: now });
  await set(newRef, payload);
  return newRef.key!;
}

export async function updateNote(uid: string, noteId: string, updates: Partial<Note>) {
  const noteRef = ref(db, userPath(uid, `notes/${noteId}`));
  const payload = cleanUndefinedDeep({ ...updates, updatedAt: new Date().toISOString() });
  await update(noteRef, payload);
}

export async function deleteNote(uid: string, noteId: string) {
  const noteRef = ref(db, userPath(uid, `notes/${noteId}`));
  await remove(noteRef);
}

export async function addNoteFolder(uid: string, folder: Omit<NoteFolder, 'id' | 'createdAt' | 'updatedAt'>) {
  const foldersRef = ref(db, userPath(uid, 'noteFolders'));
  const newRef = push(foldersRef);
  const now = new Date().toISOString();
  await set(newRef, cleanUndefinedDeep({ ...folder, createdAt: now, updatedAt: now }));
  return newRef.key!;
}

export async function updateNoteFolder(uid: string, folderId: string, updates: Partial<NoteFolder>) {
  const folderRef = ref(db, userPath(uid, `noteFolders/${folderId}`));
  await update(folderRef, cleanUndefinedDeep({ ...updates, updatedAt: new Date().toISOString() }));
}

export async function deleteNoteFolder(uid: string, folderId: string) {
  const folderRef = ref(db, userPath(uid, `noteFolders/${folderId}`));
  await remove(folderRef);
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
    const events = Object.entries(data).map(([id, event]) => {
      const e = event as CalendarEvent;
      const start = e.startTime || new Date().toISOString();
      const end = e.endTime || new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString();
      return {
        ...e,
        id,
        date: e.date || toLocalDateKey(new Date(start)),
        allDay: Boolean(e.allDay),
        type: e.type || 'event',
        priority: e.priority || 'medium',
        status: e.status || 'scheduled',
        reminderSettings:
          e.reminderSettings || {
            enabled: e.reminder !== 0,
            minutesBefore: e.reminder ?? 15,
          },
        sourceType: e.sourceType || 'manual',
        futureLinkTargets: e.futureLinkTargets || {},
        schemaVersion: e.schemaVersion || 2,
        startTime: start,
        endTime: end,
      } as CalendarEvent;
    });
    callback(events);
  });
}

export async function addEvent(uid: string, event: Omit<CalendarEvent, 'id'>) {
  const eventsRef = ref(db, userPath(uid, 'events'));
  const newRef = push(eventsRef);
  const now = new Date().toISOString();
  await set(newRef, cleanUndefinedDeep({
    ...event,
    date: event.date || toLocalDateKey(new Date(event.startTime)),
    type: event.type || 'event',
    priority: event.priority || 'medium',
    status: event.status || 'scheduled',
    allDay: Boolean(event.allDay),
    reminderSettings:
      event.reminderSettings || {
        enabled: event.reminder !== 0,
        minutesBefore: event.reminder ?? 15,
      },
    sourceType: event.sourceType || 'manual',
    futureLinkTargets: event.futureLinkTargets || {},
    schemaVersion: event.schemaVersion || 2,
    createdAt: event.createdAt || now,
    updatedAt: now,
  }));
  return newRef.key!;
}

export async function updateEvent(uid: string, eventId: string, updates: Partial<CalendarEvent>) {
  const eventRef = ref(db, userPath(uid, `events/${eventId}`));
  const clean = cleanUndefinedDeep({ ...updates, updatedAt: new Date().toISOString() });
  await update(eventRef, clean as Record<string, unknown>);
}

export async function deleteEvent(uid: string, eventId: string) {
  const eventRef = ref(db, userPath(uid, `events/${eventId}`));
  await remove(eventRef);
}

// ============ QUICK CAPTURE ============

export interface QuickCaptureData extends Omit<QuickCaptureItemRaw, 'id'> {}

export function subscribeToQuickCaptureItems(uid: string, callback: (items: QuickCaptureItem[]) => void): Unsubscribe {
  const captureRef = ref(db, userPath(uid, 'quickCaptureItems'));
  return onValue(captureRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const items = Object.entries(data).map(([id, row]) =>
      normalizeQuickCaptureItem({ ...(row as QuickCaptureItemRaw), id }, uid)
    );
    callback(items);
  });
}

export async function addQuickCaptureItem(uid: string, item: QuickCaptureData) {
  const captureRef = ref(db, userPath(uid, 'quickCaptureItems'));
  const newRef = push(captureRef);
  await set(newRef, cleanUndefinedDeep(item));
  return newRef.key!;
}

export async function updateQuickCaptureItem(uid: string, captureId: string, updates: Partial<QuickCaptureData>) {
  const captureItemRef = ref(db, userPath(uid, `quickCaptureItems/${captureId}`));
  await update(captureItemRef, cleanUndefinedDeep({ ...updates, updatedAt: new Date().toISOString() }));
}

export async function deleteQuickCaptureItem(uid: string, captureId: string) {
  const captureItemRef = ref(db, userPath(uid, `quickCaptureItems/${captureId}`));
  await remove(captureItemRef);
}

// ============ CROSS-MODULE ROUTING ============

export function subscribeToRoutingCandidates(uid: string, callback: (items: RoutingCandidate[]) => void): Unsubscribe {
  const routingRef = ref(db, userPath(uid, 'routingCandidates'));
  return onValue(routingRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const items = Object.entries(data).map(([id, row]) =>
      normalizeRoutingCandidate({ ...(row as Partial<RoutingCandidate>), id })
    );
    callback(items);
  });
}

export async function addRoutingCandidate(uid: string, candidate: Omit<RoutingCandidate, 'id'>) {
  const routingRef = ref(db, userPath(uid, 'routingCandidates'));
  const newRef = push(routingRef);
  await set(newRef, cleanUndefinedDeep(candidate));
  return newRef.key!;
}

export async function upsertRoutingCandidate(uid: string, candidateId: string, candidate: Omit<RoutingCandidate, 'id'>) {
  const candidateRef = ref(db, userPath(uid, `routingCandidates/${candidateId}`));
  await set(candidateRef, cleanUndefinedDeep(candidate));
}

export async function updateRoutingCandidate(uid: string, candidateId: string, updates: Partial<RoutingCandidate>) {
  const candidateRef = ref(db, userPath(uid, `routingCandidates/${candidateId}`));
  await update(candidateRef, cleanUndefinedDeep(updates));
}

export async function deleteRoutingCandidate(uid: string, candidateId: string) {
  const candidateRef = ref(db, userPath(uid, `routingCandidates/${candidateId}`));
  await remove(candidateRef);
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

export function subscribeToPreferences(uid: string, callback: (prefs: UserProfilePreferencesRaw | null) => void): Unsubscribe {
  const prefsRef = ref(db, userPath(uid, 'preferences'));
  return onValue(prefsRef, (snapshot) => {
    callback(snapshot.val());
  });
}

export async function getPreferences(uid: string): Promise<UserProfilePreferencesRaw | null> {
  const prefsRef = ref(db, userPath(uid, 'preferences'));
  const snap = await get(prefsRef);
  return (snap.val() as UserProfilePreferencesRaw | null) || null;
}

export async function updatePreferences(uid: string, prefs: Partial<UserProfilePreferencesRaw>) {
  const prefsRef = ref(db, userPath(uid, 'preferences'));
  await update(prefsRef, cleanUndefinedDeep(prefs));
}

// ============ PERSONA ============

export async function savePersona(uid: string, personaId: string) {
  const profileRef = ref(db, userPath(uid, 'profile/persona'));
  const rootRef = ref(db, userPath(uid, 'persona'));
  await Promise.all([set(profileRef, personaId), set(rootRef, personaId)]);
}

export async function getPersona(uid: string): Promise<string | null> {
  const rootRef = ref(db, userPath(uid, 'persona'));
  const rootSnapshot = await get(rootRef);
  if (rootSnapshot.exists()) return rootSnapshot.val();
  const profileRef = ref(db, userPath(uid, 'profile/persona'));
  const snapshot = await get(profileRef);
  return snapshot.val();
}

// ============ BOOKS (Reading Journal) ============

export interface BookData {
  userId?: string;
  title: string;
  author: string;
  cover?: string;
  totalPages: number;
  currentPage: number;
  status: 'wishlist' | 'reading' | 'finished' | 'paused' | 'completed' | 'want-to-read';
  category?: string;
  tags?: string[];
  coverColor?: string;
  genre?: string;
  startedAt?: string;
  finishedAt?: string;
  completedAt?: string; // legacy
  notesSummary?: string;
  summary?: string; // legacy
  rating?: number;
  sourceType?: 'manual' | 'import' | 'suggestion' | 'system' | 'integration';
  futureOriginReference?: {
    module?: 'notes' | 'habits' | 'goals' | 'dashboard' | 'reflection' | 'reading' | 'unknown';
    entityId?: string;
    note?: string;
  };
  futureLinkTargets?: {
    noteCandidate?: boolean;
    habitSignalCandidate?: boolean;
    goalLinkCandidate?: boolean;
    dashboardHighlightCandidate?: boolean;
    reflectionPromptCandidate?: boolean;
  };
  schemaVersion?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReadingLogData {
  bookId: string;
  date: string; // YYYY-MM-DD
  pageFrom?: number;
  pageTo?: number;
  pagesRead?: number; // legacy quick log payload
  note?: string;
  quote?: string;
  lesson?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Firebase persistence shape for milestones (additive; legacy `completedAt` read in normalize). */
export interface GrowthMilestoneData {
  id?: string;
  goalId?: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  completionDate?: string;
  completedAt?: string;
  effortEstimate?: string;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  sourceType?: string;
  futureOriginReference?: Milestone['futureOriginReference'];
  futureLinkTargets?: Milestone['futureLinkTargets'];
}

/** Firebase persistence for growth goals — additive v2 fields; legacy `area` / `completed` still read by normalize. */
export interface GrowthGoalData {
  title: string;
  description?: string;
  /** @deprecated v1 — migrated to `type` + `category` in domain normalize */
  area?: 'mindset' | 'habit' | 'skill' | 'wellbeing';
  type?: Goal['type'];
  status?: Goal['status'];
  targetDate?: string;
  startDate?: string;
  reasonWhy?: string;
  category?: string;
  tags?: string[];
  priority: 'low' | 'medium' | 'high';
  progress?: number;
  milestones: GrowthMilestoneData[];
  /** @deprecated v1 — derived into `status` */
  completed?: boolean;
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  sourceType?: Goal['sourceType'];
  futureOriginReference?: Goal['futureOriginReference'];
  futureLinkTargets?: Goal['futureLinkTargets'];
  schemaVersion?: number;
  userId?: string;
}

export interface StudentTimetableClassData {
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  note?: string;
  importance?: 'low' | 'normal' | 'high';
  energyDemand?: 'easy' | 'medium' | 'hard';
}

export interface StudentScheduleSettingsData {
  timezone: string;
  dayStart: string;
  dayEnd: string;
  minGapMinutes: number;
  minStudyMinutes: number;
  maxStudyMinutes: number;
  splitLongGapsAboveMinutes: number;
  preferredStudyWindowMinutes: number;
  allowMiniWindows: boolean;
}

export interface StudentPrepItemData {
  subject: string;
  topic?: string;
  note?: string;
  priority?: 'low' | 'normal' | 'high';
  updatedAt: number;
}

export interface StudentStudyWindowData {
  startISO: string;
  endISO: string;
  type: 'mini' | 'normal' | 'deep';
  suggestedMinutes: number;
  source: 'auto-gap';
  status: 'suggested' | 'accepted' | 'dismissed' | 'completed';
  createdAt: number;
  updatedAt: number;
}

export function subscribeToBooks(uid: string, callback: (books: Array<BookData & { id: string }>) => void): Unsubscribe {
  const booksRef = ref(db, userPath(uid, 'books'));
  return onValue(booksRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) { callback([]); return; }
    const books = Object.entries(data).map(([id, book]) => normalizeBook({ ...(book as BookRaw), id }, uid));
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
    const logs = Object.entries(data).map(([id, log]) => {
      const normalized = normalizeReadingEntry({ ...(log as ReadingEntryRaw), id });
      return {
        ...normalized,
        pagesRead: normalized.pageFrom !== undefined && normalized.pageTo !== undefined
          ? Math.max(0, normalized.pageTo - normalized.pageFrom)
          : undefined,
      };
    });
    callback(logs);
  });
}

export async function addReadingLog(uid: string, log: ReadingLogData) {
  const logsRef = ref(db, userPath(uid, 'readingLogs'));
  const newRef = push(logsRef);
  await set(newRef, log);
  return newRef.key!;
}

export async function updateReadingLog(uid: string, logId: string, updates: Partial<ReadingLogData>) {
  const logRef = ref(db, userPath(uid, `readingLogs/${logId}`));
  await update(logRef, cleanUndefinedDeep({ ...updates, updatedAt: new Date().toISOString() }));
}

export async function deleteReadingLog(uid: string, logId: string) {
  const logRef = ref(db, userPath(uid, `readingLogs/${logId}`));
  await remove(logRef);
}

// ============ STUDENT SCHEDULE ============

function cleanUndefined<T extends Record<string, unknown>>(data: T): Partial<T> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) clean[key] = value;
  }
  return clean as Partial<T>;
}

export function subscribeToStudentScheduleSettings(
  uid: string,
  callback: (settings: StudentScheduleSettingsData | null) => void
): Unsubscribe {
  const settingsRef = ref(db, userPath(uid, 'student/schedule/settings'));
  return onValue(settingsRef, (snapshot) => callback(snapshot.val()));
}

export async function updateStudentScheduleSettings(uid: string, updates: Partial<StudentScheduleSettingsData>) {
  const settingsRef = ref(db, userPath(uid, 'student/schedule/settings'));
  await update(settingsRef, cleanUndefined(updates));
}

export function subscribeToStudentTimetable(
  uid: string,
  callback: (timetable: Record<number, Array<StudentTimetableClassData & { id: string }>>) => void
): Unsubscribe {
  const timetableRef = ref(db, userPath(uid, 'student/timetable'));
  return onValue(timetableRef, (snapshot) => {
    const data = snapshot.val() || {};
    const out: Record<number, Array<StudentTimetableClassData & { id: string }>> = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
    };
    for (const day of [1, 2, 3, 4, 5, 6, 7]) {
      const dayData = data[String(day)] || {};
      out[day] = Object.entries(dayData).map(([id, item]) => ({ ...(item as StudentTimetableClassData), id }));
    }
    callback(out);
  });
}

export async function upsertStudentTimetableClass(
  uid: string,
  dayOfWeek: number,
  classData: StudentTimetableClassData,
  classId?: string
) {
  const dayRef = ref(db, userPath(uid, `student/timetable/${dayOfWeek}`));
  if (!classId) {
    const newRef = push(dayRef);
    await set(newRef, cleanUndefined(classData));
    return newRef.key!;
  }
  const classRef = ref(db, userPath(uid, `student/timetable/${dayOfWeek}/${classId}`));
  await update(classRef, cleanUndefined(classData));
  return classId;
}

export async function deleteStudentTimetableClass(uid: string, dayOfWeek: number, classId: string) {
  const classRef = ref(db, userPath(uid, `student/timetable/${dayOfWeek}/${classId}`));
  await remove(classRef);
}

export async function clearStudentTimetable(uid: string) {
  const timetableRef = ref(db, userPath(uid, 'student/timetable'));
  await remove(timetableRef);
}

export function subscribeToStudentPrepByDate(
  uid: string,
  date: string,
  callback: (items: Array<StudentPrepItemData & { id: string }>) => void
): Unsubscribe {
  const prepRef = ref(db, userPath(uid, `student/prepByDate/${date}`));
  return onValue(prepRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    callback(Object.entries(data).map(([id, item]) => ({ ...(item as StudentPrepItemData), id })));
  });
}

export async function upsertStudentPrepByDate(
  uid: string,
  date: string,
  item: Omit<StudentPrepItemData, 'updatedAt'>,
  id?: string
) {
  const payload: StudentPrepItemData = { ...item, updatedAt: Date.now() };
  const dayRef = ref(db, userPath(uid, `student/prepByDate/${date}`));
  if (!id) {
    const newRef = push(dayRef);
    await set(newRef, cleanUndefined(payload));
    return newRef.key!;
  }
  const itemRef = ref(db, userPath(uid, `student/prepByDate/${date}/${id}`));
  await update(itemRef, cleanUndefined(payload));
  return id;
}

export async function deleteStudentPrepByDate(uid: string, date: string, id: string) {
  const itemRef = ref(db, userPath(uid, `student/prepByDate/${date}/${id}`));
  await remove(itemRef);
}

export function subscribeToStudentStudyWindows(
  uid: string,
  date: string,
  callback: (windows: Array<StudentStudyWindowData & { id: string }>) => void
): Unsubscribe {
  const windowsRef = ref(db, userPath(uid, `student/studyWindows/${date}`));
  return onValue(windowsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    callback(Object.entries(data).map(([id, item]) => ({ ...(item as StudentStudyWindowData), id })));
  });
}

export async function addStudentStudyWindow(uid: string, date: string, windowItem: StudentStudyWindowData) {
  const windowsRef = ref(db, userPath(uid, `student/studyWindows/${date}`));
  const newRef = push(windowsRef);
  await set(newRef, cleanUndefined(windowItem));
  return newRef.key!;
}

export async function updateStudentStudyWindow(
  uid: string,
  date: string,
  windowId: string,
  updates: Partial<StudentStudyWindowData>
) {
  const windowRef = ref(db, userPath(uid, `student/studyWindows/${date}/${windowId}`));
  await update(windowRef, cleanUndefined({ ...updates, updatedAt: Date.now() }));
}

// ============ GROWTH GOALS ============

export function subscribeToGrowthGoals(uid: string, callback: (goals: Goal[]) => void): Unsubscribe {
  const goalsRef = ref(db, userPath(uid, 'growthGoals'));
  return onValue(goalsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const goals = Object.entries(data).map(([id, goal]) =>
      normalizeGoal({ ...(goal as GrowthGoalData), id } as GoalRaw, uid)
    );
    callback(goals);
  });
}

function sanitizeGrowthMilestones(milestones: GrowthMilestoneData[] | undefined): GrowthMilestoneData[] {
  if (!milestones || milestones.length === 0) return [];
  return milestones.map((milestone, index) => {
    const clean: GrowthMilestoneData = {
      id: milestone.id,
      title: milestone.title.trim(),
      completed: Boolean(milestone.completed),
      sortOrder: Number.isFinite(milestone.sortOrder) ? milestone.sortOrder : index,
    };
    if (milestone.description) clean.description = milestone.description;
    if (milestone.dueDate) clean.dueDate = milestone.dueDate;
    if (milestone.createdAt) clean.createdAt = milestone.createdAt;
    if (milestone.updatedAt) clean.updatedAt = milestone.updatedAt;
    if (milestone.completionDate) clean.completionDate = milestone.completionDate;
    if (milestone.effortEstimate) clean.effortEstimate = milestone.effortEstimate;
    if (milestone.priority) clean.priority = milestone.priority;
    if (milestone.notes) clean.notes = milestone.notes;
    if (milestone.sourceType) clean.sourceType = milestone.sourceType;
    if (milestone.futureOriginReference) clean.futureOriginReference = milestone.futureOriginReference;
    if (milestone.futureLinkTargets && Object.keys(milestone.futureLinkTargets).length > 0) {
      clean.futureLinkTargets = milestone.futureLinkTargets;
    }
    return clean;
  });
}

function sanitizeGrowthGoalData(goal: GrowthGoalData): Record<string, unknown> {
  const status = goal.status || 'active';
  const clean: GrowthGoalData = {
    title: goal.title.trim(),
    priority: goal.priority,
    milestones: sanitizeGrowthMilestones(goal.milestones),
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
    status,
    /** v1 clients still read `completed` — mirror from lifecycle status. */
    completed: status === 'completed',
  };
  if (goal.description) clean.description = goal.description;
  if (goal.type) clean.type = goal.type;
  if (goal.targetDate) clean.targetDate = goal.targetDate;
  if (goal.startDate) clean.startDate = goal.startDate;
  if (goal.reasonWhy) clean.reasonWhy = goal.reasonWhy;
  if (goal.category) clean.category = goal.category;
  if (goal.tags && goal.tags.length > 0) clean.tags = goal.tags;
  if (goal.progress !== undefined) clean.progress = goal.progress;
  if (goal.archived !== undefined) clean.archived = goal.archived;
  if (goal.completedAt) clean.completedAt = goal.completedAt;
  if (goal.sourceType) clean.sourceType = goal.sourceType;
  if (goal.futureOriginReference) clean.futureOriginReference = goal.futureOriginReference;
  if (goal.futureLinkTargets && Object.keys(goal.futureLinkTargets).length > 0) {
    clean.futureLinkTargets = goal.futureLinkTargets;
  }
  if (goal.schemaVersion !== undefined) clean.schemaVersion = goal.schemaVersion;
  if (goal.userId) clean.userId = goal.userId;
  if (goal.completed !== undefined) clean.completed = Boolean(goal.completed);
  return cleanUndefinedDeep(clean) as Record<string, unknown>;
}

function sanitizeGrowthGoalUpdates(updates: Partial<GrowthGoalData>): Record<string, unknown> {
  const clean: Partial<GrowthGoalData> = {};
  if (updates.title !== undefined) clean.title = updates.title.trim();
  if (updates.description !== undefined) {
    if (updates.description) clean.description = updates.description;
  }
  if (updates.type !== undefined) clean.type = updates.type;
  if (updates.status !== undefined) clean.status = updates.status;
  if (updates.targetDate !== undefined) {
    if (updates.targetDate) clean.targetDate = updates.targetDate;
  }
  if (updates.startDate !== undefined) {
    if (updates.startDate) clean.startDate = updates.startDate;
  }
  if (updates.reasonWhy !== undefined) {
    if (updates.reasonWhy) clean.reasonWhy = updates.reasonWhy;
  }
  if (updates.category !== undefined) clean.category = updates.category;
  if (updates.tags !== undefined) clean.tags = updates.tags;
  if (updates.priority !== undefined) clean.priority = updates.priority;
  if (updates.progress !== undefined) clean.progress = updates.progress;
  if (updates.milestones !== undefined) clean.milestones = sanitizeGrowthMilestones(updates.milestones);
  if (updates.completed !== undefined) clean.completed = Boolean(updates.completed);
  if (updates.archived !== undefined) clean.archived = Boolean(updates.archived);
  if (updates.createdAt !== undefined) clean.createdAt = updates.createdAt;
  if (updates.updatedAt !== undefined) clean.updatedAt = updates.updatedAt;
  if (updates.completedAt !== undefined) {
    if (updates.completedAt) clean.completedAt = updates.completedAt;
  }
  if (updates.sourceType !== undefined) clean.sourceType = updates.sourceType;
  if (updates.futureOriginReference !== undefined) clean.futureOriginReference = updates.futureOriginReference;
  if (updates.futureLinkTargets !== undefined) clean.futureLinkTargets = updates.futureLinkTargets;
  if (updates.schemaVersion !== undefined) clean.schemaVersion = updates.schemaVersion;
  if (updates.userId !== undefined) clean.userId = updates.userId;
  return cleanUndefinedDeep(clean) as Record<string, unknown>;
}

export async function addGrowthGoal(uid: string, goal: GrowthGoalData) {
  const goalsRef = ref(db, userPath(uid, 'growthGoals'));
  const newRef = push(goalsRef);
  await set(newRef, sanitizeGrowthGoalData(goal));
  return newRef.key!;
}

export async function updateGrowthGoal(uid: string, goalId: string, updates: Partial<GrowthGoalData>) {
  const goalRef = ref(db, userPath(uid, `growthGoals/${goalId}`));
  await update(goalRef, {
    ...sanitizeGrowthGoalUpdates(updates),
    updatedAt: new Date().toISOString(),
  });
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

// ============ HABITS V2 ============

export interface HabitData extends Omit<HabitRaw, 'id'> {}
export interface HabitCompletionData extends Omit<HabitCompletionRaw, 'id'> {}
export interface HabitActivitySignalData extends Omit<HabitActivitySignalRaw, 'id'> {}
export interface HabitCandidateData extends Omit<HabitCandidateRaw, 'id'> {}

export function subscribeToHabits(uid: string, callback: (habits: Habit[]) => void): Unsubscribe {
  const habitsRef = ref(db, userPath(uid, 'habits'));
  return onValue(habitsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const habits = Object.entries(data).map(([id, raw]) =>
      normalizeHabit({ ...(raw as HabitRaw), id }, uid)
    );
    callback(habits);
  });
}

export async function addHabit(uid: string, habit: HabitData) {
  const habitsRef = ref(db, userPath(uid, 'habits'));
  const newRef = push(habitsRef);
  await set(newRef, cleanUndefinedDeep(habit));
  return newRef.key!;
}

export async function updateHabit(uid: string, habitId: string, updates: Partial<HabitData>) {
  const habitRef = ref(db, userPath(uid, `habits/${habitId}`));
  await update(habitRef, cleanUndefinedDeep({ ...updates, updatedAt: new Date().toISOString() }));
}

export async function deleteHabit(uid: string, habitId: string) {
  const habitRef = ref(db, userPath(uid, `habits/${habitId}`));
  await remove(habitRef);
}

export function subscribeToHabitCompletions(uid: string, callback: (rows: HabitCompletion[]) => void): Unsubscribe {
  const refPath = ref(db, userPath(uid, 'habitCompletions'));
  return onValue(refPath, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const rows = Object.entries(data).map(([id, raw]) =>
      normalizeHabitCompletion({ ...(raw as HabitCompletionRaw), id })
    );
    callback(rows);
  });
}

export async function addHabitCompletion(uid: string, row: HabitCompletionData) {
  const rowsRef = ref(db, userPath(uid, 'habitCompletions'));
  const newRef = push(rowsRef);
  await set(newRef, cleanUndefinedDeep(row));
  return newRef.key!;
}

export async function updateHabitCompletion(uid: string, completionId: string, updates: Partial<HabitCompletionData>) {
  const rowRef = ref(db, userPath(uid, `habitCompletions/${completionId}`));
  await update(rowRef, cleanUndefinedDeep({ ...updates, updatedAt: new Date().toISOString() }));
}

export async function deleteHabitCompletion(uid: string, completionId: string) {
  const rowRef = ref(db, userPath(uid, `habitCompletions/${completionId}`));
  await remove(rowRef);
}

export async function clearHabitCompletions(uid: string) {
  const rowsRef = ref(db, userPath(uid, 'habitCompletions'));
  await remove(rowsRef);
}

export function subscribeToHabitActivitySignals(uid: string, callback: (rows: HabitActivitySignal[]) => void): Unsubscribe {
  const refPath = ref(db, userPath(uid, 'habitActivitySignals'));
  return onValue(refPath, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const rows = Object.entries(data).map(([id, raw]) =>
      normalizeHabitActivitySignal({ ...(raw as HabitActivitySignalRaw), id }, uid)
    );
    callback(rows);
  });
}

export async function addHabitActivitySignal(uid: string, row: HabitActivitySignalData) {
  const rowsRef = ref(db, userPath(uid, 'habitActivitySignals'));
  const newRef = push(rowsRef);
  await set(newRef, cleanUndefinedDeep(row));
  return newRef.key!;
}

export function subscribeToHabitCandidates(uid: string, callback: (rows: HabitCandidate[]) => void): Unsubscribe {
  const refPath = ref(db, userPath(uid, 'habitCandidates'));
  return onValue(refPath, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const rows = Object.entries(data).map(([id, raw]) =>
      normalizeHabitCandidate({ ...(raw as HabitCandidateRaw), id }, uid)
    );
    callback(rows);
  });
}

export async function upsertHabitCandidate(uid: string, candidateId: string, row: HabitCandidateData) {
  const rowRef = ref(db, userPath(uid, `habitCandidates/${candidateId}`));
  await set(rowRef, cleanUndefinedDeep(row));
}

export async function updateHabitCandidate(uid: string, candidateId: string, updates: Partial<HabitCandidateData>) {
  const rowRef = ref(db, userPath(uid, `habitCandidates/${candidateId}`));
  await update(rowRef, cleanUndefinedDeep(updates));
}

// ============ JOURNAL ENTRIES (Daily Reflection) ============

export interface JournalEntryData {
  date: string; // YYYY-MM-DD
  type?: 'quick' | 'normal' | 'deep';
  mood?: number; // 1-5
  title?: string;
  content?: string;
  wins?: string;
  difficulties?: string;
  gratitude?: string;
  lessons?: string;
  feelings?: string;
  growth?: string;
  freeWrite?: string;
  tags?: string[];
  privateLevel?: 'private' | 'shared-later' | 'sensitive';
  sourceType?: 'manual' | 'import' | 'suggestion' | 'system' | 'integration';
  futureOriginReference?: {
    module?: 'notes' | 'habits' | 'reading' | 'dashboard' | 'goals' | 'guidance' | 'reflection' | 'unknown';
    entityId?: string;
    note?: string;
  };
  futureLinkTargets?: {
    noteCandidate?: boolean;
    habitSignalCandidate?: boolean;
    dashboardMoodTrendCandidate?: boolean;
    readingBacklinkCandidate?: boolean;
    guidanceSignalCandidate?: boolean;
  };
  schemaVersion?: number;
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
    const entries = Object.entries(data).map(([id, entry]) =>
      normalizeReflectionEntry({ ...(entry as ReflectionEntryRaw), id }, uid) as unknown as JournalEntryData & { id: string }
    );
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
