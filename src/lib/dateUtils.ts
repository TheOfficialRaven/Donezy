/**
 * Date utility functions that use LOCAL time instead of UTC.
 * This ensures that day boundaries match the user's local midnight,
 * not midnight UTC (which is 1-2 AM in Hungarian time zones).
 */

/** Returns today's local date as YYYY-MM-DD */
export function getLocalDateString(date?: Date): string {
  const d = date || new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Returns yesterday's local date as YYYY-MM-DD */
export function getLocalYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateString(d);
}

/** Returns the Monday of the current week as YYYY-MM-DD (local time) */
export function getLocalMondayOfWeek(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr + 'T12:00:00') : new Date();
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return getLocalDateString(d);
}

/** Returns the Sunday of the current week as YYYY-MM-DD (local time) */
export function getLocalSundayOfWeek(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr + 'T12:00:00') : new Date();
  const day = d.getDay(); // 0 = Sunday
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + daysUntilSunday);
  return getLocalDateString(d);
}
