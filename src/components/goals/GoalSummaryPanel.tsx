import { Card } from '@/components/ui/card';
import type { GoalProductivityMetrics } from '@/lib/goals/types';

export default function GoalSummaryPanel({ metrics }: { metrics: GoalProductivityMetrics }) {
  const items = [
    { label: 'Aktív cél', value: metrics.activeCount, tone: 'text-primary' },
    { label: 'Szünetel', value: metrics.pausedCount, tone: 'text-amber-300' },
    { label: 'Befejezett', value: metrics.completedCount, tone: 'text-emerald-300' },
    { label: 'Archivált', value: metrics.archivedCount, tone: 'text-text-muted' },
    { label: 'Nyitott mérföldkő', value: metrics.openMilestoneCount, tone: 'text-secondary' },
    { label: 'Lejárt mérföldkő', value: metrics.overdueMilestoneCount, tone: 'text-warning' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {items.map((item) => (
        <Card key={item.label} className="glass p-4 border-white/5">
          <p className={`text-2xl font-bold ${item.tone}`}>{item.value}</p>
          <p className="text-xs text-text-muted">{item.label}</p>
        </Card>
      ))}
      {metrics.activeFocusOverload && (
        <Card className="glass p-4 border-amber-500/30 col-span-2 lg:col-span-3 xl:col-span-6">
          <p className="text-sm text-amber-200">
            Sok aktív cél fut egyszerre — érdemes 3–5 fókuszcél körül tartani a listát, hogy ne szóródjon szét az energia.
          </p>
        </Card>
      )}
    </div>
  );
}
