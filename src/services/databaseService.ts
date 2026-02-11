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
  await update(taskRef, updates);
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
