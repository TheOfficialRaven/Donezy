export interface StudentScheduleClass {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  note?: string;
  importance?: 'low' | 'normal' | 'high';
  energyDemand?: 'easy' | 'medium' | 'hard';
}

export interface StudentScheduleSettings {
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

export interface FreeGap {
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
}

export interface GeneratedWindow {
  startMinutes: number;
  endMinutes: number;
  suggestedMinutes: number;
  type: 'mini' | 'normal' | 'deep';
  source: 'auto-gap';
}

export const DEFAULT_STUDENT_SCHEDULE_SETTINGS: StudentScheduleSettings = {
  timezone: 'Europe/Zurich',
  dayStart: '08:00',
  dayEnd: '20:00',
  minGapMinutes: 20,
  minStudyMinutes: 25,
  maxStudyMinutes: 90,
  splitLongGapsAboveMinutes: 90,
  preferredStudyWindowMinutes: 45,
  allowMiniWindows: true,
};

export function parseHHMM(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToHHMM(value: number): string {
  const mins = Math.max(0, Math.min(23 * 60 + 59, Math.round(value)));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function dayOfWeekMondayFirst(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

export function sortClassesByTime(classes: StudentScheduleClass[]): StudentScheduleClass[] {
  return [...classes].sort((a, b) => parseHHMM(a.startTime) - parseHHMM(b.startTime));
}

export function computeClassesForDate(
  date: Date,
  timetableByDay: Record<number, StudentScheduleClass[]>,
  overrideForDate: StudentScheduleClass[]
): StudentScheduleClass[] {
  if (overrideForDate.length > 0) return sortClassesByTime(overrideForDate);
  return sortClassesByTime(timetableByDay[dayOfWeekMondayFirst(date)] || []);
}

export function computeFreeGaps(classes: StudentScheduleClass[], dayStart: string, dayEnd: string): FreeGap[] {
  const sorted = sortClassesByTime(classes);
  const gaps: FreeGap[] = [];
  let cursor = parseHHMM(dayStart);
  const endOfDay = parseHHMM(dayEnd);

  for (const item of sorted) {
    const start = parseHHMM(item.startTime);
    const end = parseHHMM(item.endTime);
    if (start > cursor) {
      gaps.push({ startMinutes: cursor, endMinutes: start, durationMinutes: start - cursor });
    }
    cursor = Math.max(cursor, end);
  }
  if (endOfDay > cursor) {
    gaps.push({ startMinutes: cursor, endMinutes: endOfDay, durationMinutes: endOfDay - cursor });
  }
  return gaps;
}

export function generateStudyWindowsFromGaps(gaps: FreeGap[], settings: StudentScheduleSettings): GeneratedWindow[] {
  const windows: GeneratedWindow[] = [];

  for (const gap of gaps) {
    const duration = gap.durationMinutes;
    if (duration < settings.minGapMinutes || duration < 15) continue;

    if (duration <= 29) {
      if (!settings.allowMiniWindows) continue;
      const len = Math.min(25, duration);
      windows.push({
        startMinutes: gap.startMinutes,
        endMinutes: gap.startMinutes + len,
        suggestedMinutes: len,
        type: 'mini',
        source: 'auto-gap',
      });
      continue;
    }

    if (duration <= 60) {
      const len = Math.min(45, duration);
      windows.push({
        startMinutes: gap.startMinutes,
        endMinutes: gap.startMinutes + len,
        suggestedMinutes: len,
        type: 'normal',
        source: 'auto-gap',
      });
      continue;
    }

    if (duration <= 90) {
      const len = Math.min(settings.maxStudyMinutes, duration);
      windows.push({
        startMinutes: gap.startMinutes,
        endMinutes: gap.startMinutes + len,
        suggestedMinutes: len,
        type: 'deep',
        source: 'auto-gap',
      });
      continue;
    }

    if (duration > settings.splitLongGapsAboveMinutes) {
      const preferred = Math.max(settings.minStudyMinutes, settings.preferredStudyWindowMinutes);
      const pause = 10;
      let cursor = gap.startMinutes;
      let remaining = duration;

      while (remaining >= settings.minStudyMinutes) {
        let segment = Math.min(preferred, settings.maxStudyMinutes, remaining);
        const postPause = remaining - segment - pause;
        if (postPause > 0 && postPause < settings.minStudyMinutes) {
          segment = Math.min(remaining, segment + postPause);
        }
        if (segment < settings.minStudyMinutes) break;

        windows.push({
          startMinutes: cursor,
          endMinutes: cursor + segment,
          suggestedMinutes: segment,
          type: segment >= 61 ? 'deep' : segment >= 30 ? 'normal' : 'mini',
          source: 'auto-gap',
        });

        cursor += segment + pause;
        remaining = gap.endMinutes - cursor;
      }
    }
  }

  return windows;
}

export interface ExistingWindowShape {
  startISO: string;
  endISO: string;
}

export function dedupeWindows(existing: ExistingWindowShape[], generated: GeneratedWindow[]): GeneratedWindow[] {
  const toMinutes = (iso: string) => {
    const d = new Date(iso);
    return d.getHours() * 60 + d.getMinutes();
  };

  const existingTimes = existing.map((w) => ({ start: toMinutes(w.startISO), end: toMinutes(w.endISO) }));
  return generated.filter((candidate) => {
    const dup = existingTimes.some(
      (item) => Math.abs(item.start - candidate.startMinutes) <= 2 && Math.abs(item.end - candidate.endMinutes) <= 2
    );
    return !dup;
  });
}

export function hasClassOverlap(
  classes: StudentScheduleClass[],
  candidate: { id?: string; startTime: string; endTime: string }
): boolean {
  const cStart = parseHHMM(candidate.startTime);
  const cEnd = parseHHMM(candidate.endTime);
  return classes.some((item) => {
    if (candidate.id && item.id === candidate.id) return false;
    const iStart = parseHHMM(item.startTime);
    const iEnd = parseHHMM(item.endTime);
    return cStart < iEnd && cEnd > iStart;
  });
}
