import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HabitActivityChart, HabitTrendChart } from './HabitCharts';

export default function HabitOverviewPanel({
  completionSeries,
  activitySeries,
  consistencyTop,
  onSelectHabitId,
}: {
  completionSeries: Array<{ dateKey: string; count: number; label?: string }>;
  activitySeries: Array<{ dateKey: string; count: number; label?: string }>;
  consistencyTop: Array<{ habitId: string; title: string; consistencyScore: number; weeklyRate: number }>;
  /** Trend nézetben: kattintás → kiválasztott szokás a részletek panelhez. */
  onSelectHabitId?: (habitId: string) => void;
}) {
  return (
    <Card className="glass p-5 border-white/5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="font-heading font-semibold text-text-primary">Automatikus rutin trendek</h3>
          <p className="text-xs text-text-muted">
            Gyors kep arrol, mely rutinok erosodnek, es hol erdemes visszakapcsolodni.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <HabitTrendChart data={completionSeries} title="Heti/havi completion trend" />
        <HabitActivityChart data={activitySeries} />
      </div>

      {consistencyTop.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-text-muted uppercase tracking-wide">Megerosodo rutinok</p>
          <div className="flex flex-wrap gap-2">
            {consistencyTop.slice(0, 6).map((item) =>
              onSelectHabitId ? (
                <button
                  key={item.habitId}
                  type="button"
                  onClick={() => onSelectHabitId(item.habitId)}
                  className="inline-flex"
                >
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-200 cursor-pointer hover:bg-emerald-500/10">
                    {item.title}: {item.consistencyScore}%
                  </Badge>
                </button>
              ) : (
                <Badge key={item.habitId} variant="outline" className="border-emerald-500/30 text-emerald-200">
                  {item.title}: {item.consistencyScore}%
                </Badge>
              )
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
