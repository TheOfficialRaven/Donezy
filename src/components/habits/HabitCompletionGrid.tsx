import { useMemo } from 'react';
import type { HabitCompletion } from '@/lib/habits/types';
import { getLocalDateString } from '@/lib/dateUtils';

export default function HabitCompletionGrid({
  completions,
}: {
  completions: HabitCompletion[];
}) {
  const map = useMemo(() => {
    const out = new Map<string, number>();
    for (const c of completions) {
      out.set(c.completionDateKey, (out.get(c.completionDateKey) || 0) + 1);
    }
    return out;
  }, [completions]);

  const cells = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay() || 7;
    const totalDays = 7 * 6 + dayOfWeek;
    const result: { dateKey: string; count: number }[] = [];
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = getLocalDateString(d);
      result.push({ dateKey, count: map.get(dateKey) || 0 });
    }
    return result;
  }, [map]);

  const maxCount = Math.max(1, ...cells.map((x) => x.count));

  return (
    <div>
      <p className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">Kovetkezetesseg terkep</p>
      <div className="flex gap-1 flex-wrap">
        {cells.map((cell) => {
          const intensity = cell.count / maxCount;
          return (
            <div
              key={cell.dateKey}
              title={`${cell.dateKey}: ${cell.count}x`}
              className="w-4 h-4 rounded-sm"
              style={{
                backgroundColor:
                  cell.count === 0
                    ? 'hsl(var(--surface-2))'
                    : `hsla(var(--primary) / ${0.25 + intensity * 0.75})`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
