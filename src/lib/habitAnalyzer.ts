// Automatic habit detection: normalizes task/quest titles and groups recurring
// activities using word-set similarity so "Futás 30 perc" and "futás a parkban"
// are recognized as the same habit.

export interface HabitEntry {
  id: string;
  title: string;
  normalizedTitle: string;
  source: 'task' | 'quest';
  completedAt: string; // YYYY-MM-DD
}

export interface GroupedHabit {
  key: string; // canonical normalized form
  displayName: string; // most common original title
  entries: HabitEntry[];
  totalCount: number;
  /** Completions per day for the last N days */
  dailyCounts: { date: string; count: number }[];
  /** Current consecutive-day streak */
  currentStreak: number;
  /** Longest ever streak */
  longestStreak: number;
  /** Average completions per week */
  weeklyAvg: number;
  firstSeen: string;
  lastSeen: string;
}

// ---- Hungarian accent / diacritic map ----

const ACCENT_MAP: Record<string, string> = {
  á: 'a', é: 'e', í: 'i', ó: 'o', ö: 'o', ő: 'o',
  ú: 'u', ü: 'u', ű: 'u',
  Á: 'a', É: 'e', Í: 'i', Ó: 'o', Ö: 'o', Ő: 'o',
  Ú: 'u', Ü: 'u', Ű: 'u',
};

const STOP_WORDS = new Set([
  'a', 'az', 'egy', 'es', 'is', 'vagy', 'de', 'hogy', 'nem', 'meg',
  'el', 'ki', 'be', 'fel', 'le', 'ra', 're', 'ba', 'ben', 'bol',
  'nak', 'nek', 'val', 'vel', 'hoz', 'hez', 'rol', 'rul', 'tol',
  'the', 'and', 'or', 'to', 'in', 'on', 'at', 'for', 'of', 'with',
  'ma', 'mai', 'napi', 'heti', 'reggeli', 'esti', 'delutani',
  'perc', 'percig', 'percet', 'ora', 'orat', 'mp',
  'db', 'darab', 'szer', 'alkalommal',
]);

function removeAccents(s: string): string {
  return s.replace(/[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/g, (ch) => ACCENT_MAP[ch] || ch);
}

/**
 * Normalizes a title into a canonical word set for comparison.
 * Strips accents, numbers, punctuation, stop words, then sorts.
 */
export function normalizeTitle(raw: string): string {
  let s = raw.toLowerCase().trim();
  s = removeAccents(s);
  s = s.replace(/[^a-z\s]/g, ' '); // keep only letters + space
  const words = s
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
  // Deduplicate and sort for canonical form
  const unique = [...new Set(words)].sort();
  return unique.join(' ');
}

/**
 * Jaccard similarity on word sets: |A∩B| / |A∪B|
 */
function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(' '));
  const setB = new Set(b.split(' '));
  if (setA.size === 0 && setB.size === 0) return 1;

  let intersection = 0;
  for (const w of setA) if (setB.has(w)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Checks if one normalized string is a substring of the other,
 * or if the longest common word run covers ≥60% of the shorter one.
 */
function substringMatch(a: string, b: string): boolean {
  if (a.length === 0 || b.length === 0) return false;
  return a.includes(b) || b.includes(a);
}

const SIMILARITY_THRESHOLD = 0.45;

/**
 * Groups entries by title similarity. Returns a map from canonical key
 * to the list of entries that belong to that group.
 */
function buildGroups(entries: HabitEntry[]): Map<string, HabitEntry[]> {
  const groups = new Map<string, HabitEntry[]>();
  // canonical key for each known group
  const canonicalKeys: string[] = [];

  for (const entry of entries) {
    const norm = entry.normalizedTitle;
    if (!norm) continue;

    let bestKey: string | null = null;
    let bestScore = 0;

    for (const key of canonicalKeys) {
      const score = jaccardSimilarity(norm, key);
      const isSub = substringMatch(norm, key);
      const effective = isSub ? Math.max(score, 0.6) : score;
      if (effective > bestScore) {
        bestScore = effective;
        bestKey = key;
      }
    }

    if (bestKey && bestScore >= SIMILARITY_THRESHOLD) {
      groups.get(bestKey)!.push(entry);
    } else {
      canonicalKeys.push(norm);
      groups.set(norm, [entry]);
    }
  }
  return groups;
}

/**
 * Picks the most common raw title from a list of entries.
 */
function mostCommonTitle(entries: HabitEntry[]): string {
  const freq = new Map<string, number>();
  for (const e of entries) {
    freq.set(e.title, (freq.get(e.title) || 0) + 1);
  }
  let best = entries[0].title;
  let bestCount = 0;
  for (const [title, count] of freq) {
    if (count > bestCount) {
      bestCount = count;
      best = title;
    }
  }
  return best;
}

/**
 * Computes streaks and daily counts for a group of entries.
 */
function computeStats(
  entries: HabitEntry[],
  days: number
): Pick<GroupedHabit, 'dailyCounts' | 'currentStreak' | 'longestStreak' | 'weeklyAvg' | 'firstSeen' | 'lastSeen'> {
  // Build set of dates
  const dateSet = new Set<string>();
  for (const e of entries) dateSet.add(e.completedAt);

  const sortedDates = [...dateSet].sort();
  const firstSeen = sortedDates[0] || '';
  const lastSeen = sortedDates[sortedDates.length - 1] || '';

  // Daily counts for the last N days
  const today = new Date();
  const dailyCounts: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const count = entries.filter((e) => e.completedAt === dateStr).length;
    dailyCounts.push({ date: dateStr, count });
  }

  // Streak calculation (consecutive days counting back from today)
  let currentStreak = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    if (dateSet.has(dateStr)) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Longest streak ever
  let longestStreak = 0;
  let tempStreak = 0;
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      tempStreak = diffDays === 1 ? tempStreak + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  // Weekly average
  const totalDays = Math.max(1, Math.ceil((today.getTime() - new Date(firstSeen).getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const totalWeeks = Math.max(1, totalDays / 7);
  const weeklyAvg = Math.round((entries.length / totalWeeks) * 10) / 10;

  return { dailyCounts, currentStreak, longestStreak, weeklyAvg, firstSeen, lastSeen };
}

/**
 * Main entry point: takes all habit entries and returns grouped + analysed habits
 * sorted by frequency (most common first).
 */
export function analyzeHabits(entries: HabitEntry[], days = 30): GroupedHabit[] {
  if (entries.length === 0) return [];

  const groups = buildGroups(entries);
  const habits: GroupedHabit[] = [];

  for (const [key, groupEntries] of groups) {
    // Only show as a habit if it occurred at least twice
    if (groupEntries.length < 2) continue;

    const stats = computeStats(groupEntries, days);
    habits.push({
      key,
      displayName: mostCommonTitle(groupEntries),
      entries: groupEntries,
      totalCount: groupEntries.length,
      ...stats,
    });
  }

  habits.sort((a, b) => b.totalCount - a.totalCount);
  return habits;
}
