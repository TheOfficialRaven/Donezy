import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CalendarProductivityMetrics } from '@/lib/calendar/types';
import CalendarEmptyState from './CalendarEmptyState';

interface TodaySummaryPanelProps {
  metrics: CalendarProductivityMetrics;
}

function formatMinutes(value: number) {
  if (value >= 60) {
    const hours = value / 60;
    return `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)} óra`;
  }
  return `${value} perc`;
}

export default function TodaySummaryPanel({ metrics }: TodaySummaryPanelProps) {
  return (
    <Card className="glass p-4">
      <h3 className="font-heading font-semibold text-text-primary mb-3">Mai összefoglaló</h3>
      {metrics.todayEventsCount === 0 ? (
        <CalendarEmptyState mode="no-day-events" />
      ) : (
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Mai események</span>
            <Badge variant="outline" className="border-white/20">{metrics.todayEventsCount}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Fókusz blokkok</span>
            <Badge variant="outline" className="border-white/20">{metrics.todayFocusBlocksCount}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Tervezett idő</span>
            <span className="text-text-primary">{formatMinutes(metrics.totalScheduledMinutesForDay)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Szabad ablak</span>
            <span className="text-text-primary">{formatMinutes(metrics.totalFreeMinutesForDay)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Terhelés</span>
            <Badge className="bg-primary/20 text-primary border-primary/30">{metrics.dailyLoadIndicator}</Badge>
          </div>
        </div>
      )}
    </Card>
  );
}
