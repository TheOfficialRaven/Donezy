import { Card } from '@/components/ui/card';
import type { HabitProductivityMetrics } from '@/lib/habits/types';

export default function HabitStatsPanel({ metrics }: { metrics: HabitProductivityMetrics }) {
  const items = [
    { label: 'Aktiv szokas', value: metrics.activeHabits, tone: 'text-primary' },
    { label: 'Mai teljesites', value: metrics.todayCompletions, tone: 'text-emerald-300' },
    { label: 'Heti arany', value: `${metrics.weeklyCompletionRate}%`, tone: 'text-secondary' },
    { label: 'Uj rutin mintak', value: metrics.candidateCount, tone: 'text-amber-300' },
    { label: 'Konnyen emelheto', value: metrics.promotableCandidateCount, tone: 'text-amber-100' },
    { label: 'Figyelmet ker', value: metrics.habitsNeedingAttention, tone: 'text-warning' },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {items.map((item) => (
        <Card key={item.label} className="glass p-4 border-white/5">
          <p className={`text-2xl font-bold ${item.tone}`}>{item.value}</p>
          <p className="text-xs text-text-muted">{item.label}</p>
        </Card>
      ))}
      {metrics.overloadedActiveHabits && (
        <Card className="glass p-4 border-amber-500/25 col-span-2 lg:col-span-3 xl:col-span-6">
          <p className="text-sm text-amber-100">
            Sok aktiv szokas fut egyszerre. Erdemes a fokuszt a legfontosabb 5-8 rutinra szukiteni.
          </p>
        </Card>
      )}
    </div>
  );
}
