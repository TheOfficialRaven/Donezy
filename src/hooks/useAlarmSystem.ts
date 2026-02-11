import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { alarmSound } from '@/lib/alarmSound';
import { getLocalDateString } from '@/lib/dateUtils';
import type { AlarmItem } from '@/components/AlarmPopup';

const STORAGE_KEY = 'donezy-fired-alarms';
const CHECK_INTERVAL_MS = 10_000; // check every 10 seconds

/**
 * Loads the set of already-fired alarm IDs from localStorage.
 * Clears entries older than 24h on load.
 */
function loadFiredAlarms(): Map<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const entries: [string, number][] = JSON.parse(raw);
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return new Map(entries.filter(([, ts]) => ts > cutoff));
  } catch {
    return new Map();
  }
}

function saveFiredAlarms(map: Map<string, number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...map.entries()]));
  } catch {
    // storage full or blocked
  }
}

/**
 * Hook that monitors calendar events and tasks for upcoming reminders,
 * triggers an alarm sound loop and returns active alarms for UI display.
 *
 * KEY DESIGN: reads store data via getState() inside the interval callback
 * so the interval never needs to be restarted when store data changes.
 */
export function useAlarmSystem() {
  const [activeAlarms, setActiveAlarms] = useState<AlarmItem[]>([]);
  const firedRef = useRef<Map<string, number>>(loadFiredAlarms());
  const snoozeRef = useRef<Map<string, number>>(new Map());
  // Keep a ref so the dismiss/snooze callbacks can access latest alarms
  const activeAlarmsRef = useRef<AlarmItem[]>([]);

  useEffect(() => {
    const checkReminders = () => {
      // Read DIRECTLY from the Zustand store to always get fresh data
      // without needing the callback to be recreated on every store change.
      const { events, lists } = useAppStore.getState();
      const now = Date.now();
      const today = getLocalDateString();
      const newAlarms: AlarmItem[] = [];

      // --- Calendar Events ---
      for (const event of events) {
        const eventStart = new Date(event.startTime).getTime();
        if (isNaN(eventStart)) continue; // skip invalid dates

        const reminderMinutes = event.reminder ?? 15;
        const alarmTime = eventStart - reminderMinutes * 60 * 1000;
        const alarmId = `event-${event.id}`;

        // Check if already dismissed
        if (firedRef.current.has(alarmId)) continue;
        // Check if snoozed
        const snoozeUntil = snoozeRef.current.get(alarmId);
        if (snoozeUntil && now < snoozeUntil) continue;

        // Fire if we're within the alarm window (alarm time passed, event hasn't ended)
        const eventEnd = new Date(event.endTime).getTime();
        if (now >= alarmTime && now < eventEnd) {
          // Clear expired snooze
          if (snoozeUntil) snoozeRef.current.delete(alarmId);

          const startFormatted = new Date(event.startTime).toLocaleTimeString('hu-HU', {
            hour: '2-digit', minute: '2-digit',
          });
          const endFormatted = new Date(event.endTime).toLocaleTimeString('hu-HU', {
            hour: '2-digit', minute: '2-digit',
          });

          const eventDate = new Date(event.startTime);
          const todayDate = new Date();
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);

          let datePrefix = '';
          if (eventDate.toDateString() === todayDate.toDateString()) {
            datePrefix = 'Ma';
          } else if (eventDate.toDateString() === tomorrow.toDateString()) {
            datePrefix = 'Holnap';
          } else {
            datePrefix = eventDate.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
          }

          newAlarms.push({
            id: alarmId,
            type: 'event',
            title: event.title,
            description: event.description,
            time: `${datePrefix} ${startFormatted} – ${endFormatted}`,
            color: event.color,
            category: event.category,
          });
        }
      }

      // --- Tasks with dueDate = today ---
      for (const list of lists) {
        for (const task of list.tasks) {
          if (task.completed) continue;
          if (!task.dueDate) continue;

          const alarmId = `task-${list.id}-${task.id}`;

          if (firedRef.current.has(alarmId)) continue;
          const snoozeUntil = snoozeRef.current.get(alarmId);
          if (snoozeUntil && now < snoozeUntil) continue;

          // Fire alarm if due date is today
          if (task.dueDate === today) {
            if (snoozeUntil) snoozeRef.current.delete(alarmId);

            newAlarms.push({
              id: alarmId,
              type: 'task',
              title: task.title,
              description: `Lista: ${list.name}`,
              time: `Ma esedékes – ${task.priority === 'high' ? 'Magas' : task.priority === 'medium' ? 'Közepes' : 'Alacsony'} prioritás`,
              color: list.color,
            });
          }
        }
      }

      // Update state and ref
      activeAlarmsRef.current = newAlarms;
      setActiveAlarms(newAlarms);

      // Start or stop alarm sound
      if (newAlarms.length > 0) {
        if (!alarmSound.playing) {
          alarmSound.start();
        }
      } else {
        if (alarmSound.playing) {
          alarmSound.stop();
        }
      }
    };

    // Initial check after a short delay to let store data load
    const initialTimeout = setTimeout(checkReminders, 2000);
    // Then periodic checks
    const interval = setInterval(checkReminders, CHECK_INTERVAL_MS);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      // NOTE: we intentionally do NOT stop the alarm here.
      // The alarm is only stopped by user action (dismiss/snooze)
      // or when checkReminders finds no active alarms.
    };
  }, []); // Empty deps — reads from store.getState() directly

  // Dismiss a single alarm
  const dismissAlarm = useCallback((alarmId: string) => {
    firedRef.current.set(alarmId, Date.now());
    saveFiredAlarms(firedRef.current);
    snoozeRef.current.delete(alarmId);

    const next = activeAlarmsRef.current.filter((a) => a.id !== alarmId);
    activeAlarmsRef.current = next;
    setActiveAlarms(next);
    if (next.length === 0) alarmSound.stop();
  }, []);

  // Dismiss all alarms
  const dismissAll = useCallback(() => {
    for (const alarm of activeAlarmsRef.current) {
      firedRef.current.set(alarm.id, Date.now());
    }
    saveFiredAlarms(firedRef.current);
    snoozeRef.current.clear();

    activeAlarmsRef.current = [];
    setActiveAlarms([]);
    alarmSound.stop();
  }, []);

  // Snooze an alarm for N minutes
  const snoozeAlarm = useCallback((alarmId: string, minutes: number) => {
    const snoozeUntil = Date.now() + minutes * 60 * 1000;
    snoozeRef.current.set(alarmId, snoozeUntil);

    const next = activeAlarmsRef.current.filter((a) => a.id !== alarmId);
    activeAlarmsRef.current = next;
    setActiveAlarms(next);
    if (next.length === 0) alarmSound.stop();
  }, []);

  return {
    activeAlarms,
    dismissAlarm,
    dismissAll,
    snoozeAlarm,
  };
}
