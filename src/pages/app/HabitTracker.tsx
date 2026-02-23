import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Flame, TrendingUp, BarChart3, Calendar, Repeat } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import { analyzeHabits, type GroupedHabit } from '@/lib/habitAnalyzer';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

type TimeRange = 7 | 14 | 30 | 90;

const TIME_LABELS: Record<TimeRange, string> = {
  7: '7 nap',
  14: '14 nap',
  30: '30 nap',
  90: '90 nap',
};

export default function HabitTracker() {
  const { habitEntries } = useAppStore();
  const [timeRange, setTimeRange] = useState<TimeRange>(30);
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);

  const habits = useMemo(
    () => analyzeHabits(habitEntries, timeRange),
    [habitEntries, timeRange]
  );

  const activeHabit = habits.find((h) => h.key === selectedHabit) || habits[0] || null;

  // Aggregate chart: completions per day across all habits
  const aggregateDaily = useMemo(() => {
    const map = new Map<string, number>();
    const today = new Date();
    for (let i = timeRange - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      map.set(d.toISOString().slice(0, 10), 0);
    }
    for (const entry of habitEntries) {
      if (map.has(entry.completedAt)) {
        map.set(entry.completedAt, map.get(entry.completedAt)! + 1);
      }
    }
    return [...map.entries()].map(([date, count]) => ({
      date,
      label: formatDateShort(date),
      count,
    }));
  }, [habitEntries, timeRange]);

  // Stats
  const totalHabits = habits.length;
  const longestStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak), 0);
  const totalCompletions = habitEntries.length;
  const activeStreaks = habits.filter((h) => h.currentStreak > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            Szokás Tracker
          </h1>
          <p className="text-text-secondary mt-1">
            Automatikusan nyomon követi a rendszeres tevékenységeidet
          </p>
        </div>
        {/* Time range selector */}
        <div className="flex bg-surface-2/50 rounded-lg p-1 gap-1">
          {(Object.keys(TIME_LABELS) as unknown as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(Number(range) as TimeRange)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                timeRange === Number(range)
                  ? 'bg-primary text-surface-0 shadow-lg'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {TIME_LABELS[Number(range) as TimeRange]}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Felismert szokás', value: totalHabits, icon: Repeat, color: 'text-primary' },
          { label: 'Leghosszabb sorozat', value: `${longestStreak} nap`, icon: Flame, color: 'text-orange-400' },
          { label: 'Összes teljesítés', value: totalCompletions, icon: BarChart3, color: 'text-emerald-400' },
          { label: 'Aktív sorozatok', value: activeStreaks, icon: TrendingUp, color: 'text-blue-400' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="glass p-4">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg bg-surface-2/50', stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                  <p className="text-xs text-text-muted">{stat.label}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {habits.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass p-12 text-center">
            <Activity className="h-16 w-16 text-text-disabled mx-auto mb-4" />
            <h3 className="text-lg font-heading font-semibold text-text-primary mb-2">
              Még nincsenek felismert szokásaid
            </h3>
            <p className="text-text-muted mb-2 max-w-md mx-auto">
              Teljesíts feladatokat és küldetéseket — a rendszer automatikusan felismeri
              az ismétlődő tevékenységeket és nyomon követi azokat.
            </p>
            <p className="text-xs text-text-muted">
              Legalább 2 hasonló elvégzett feladat szükséges egy szokás felismeréséhez.
            </p>
          </Card>
        </motion.div>
      ) : (
        <>
          {/* Aggregate Activity Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="glass p-6">
              <h2 className="text-lg font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Napi aktivitás
              </h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={aggregateDaily} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: 'hsl(var(--text-muted))', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      interval={timeRange <= 14 ? 0 : timeRange <= 30 ? 2 : 6}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: 'hsl(var(--text-muted))', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--surface-1))',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        color: 'hsl(var(--text-primary))',
                        fontSize: 13,
                      }}
                      labelFormatter={(l) => `${l}`}
                      formatter={(v: number) => [`${v} teljesítés`, 'Aktivitás']}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#areaGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Habit List + Detail */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Habit List */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-1">
              <Card className="glass p-4 space-y-2 max-h-[520px] overflow-y-auto">
                <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide px-2 mb-2">
                  Szokásaid ({habits.length})
                </h3>
                {habits.map((habit) => (
                  <button
                    key={habit.key}
                    onClick={() => setSelectedHabit(habit.key)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg transition-all',
                      activeHabit?.key === habit.key
                        ? 'bg-primary/20 border border-primary/30'
                        : 'hover:bg-white/5 border border-transparent'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-text-primary truncate pr-2">
                        {habit.displayName}
                      </span>
                      <Badge className="text-xs bg-primary/20 text-primary border-primary/30 flex-shrink-0">
                        {habit.totalCount}×
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      {habit.currentStreak > 0 && (
                        <span className="flex items-center gap-1 text-orange-400">
                          <Flame className="h-3 w-3" />
                          {habit.currentStreak} nap
                        </span>
                      )}
                      <span>{habit.weeklyAvg}/hét</span>
                    </div>
                  </button>
                ))}
              </Card>
            </motion.div>

            {/* Habit Detail */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="lg:col-span-2">
              {activeHabit ? (
                <HabitDetail habit={activeHabit} timeRange={timeRange} />
              ) : (
                <Card className="glass p-8 text-center">
                  <p className="text-text-muted">Válassz egy szokást a részletekért</p>
                </Card>
              )}
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}

function HabitDetail({ habit, timeRange }: { habit: GroupedHabit; timeRange: TimeRange }) {
  return (
    <Card className="glass p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-heading font-bold text-text-primary mb-1">
          {habit.displayName}
        </h2>
        <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted">
          <span className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            {habit.totalCount} teljesítés
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            {habit.weeklyAvg}/hét átlag
          </span>
          {habit.currentStreak > 0 && (
            <span className="flex items-center gap-1 text-orange-400">
              <Flame className="h-4 w-4" />
              {habit.currentStreak} napos sorozat
            </span>
          )}
          {habit.longestStreak > 0 && (
            <span className="flex items-center gap-1 text-emerald-400">
              <Flame className="h-4 w-4" />
              {habit.longestStreak} nap rekord
            </span>
          )}
        </div>
      </div>

      {/* Frequency Chart */}
      <div>
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">
          Gyakoriság ({TIME_LABELS[timeRange]})
        </h3>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={habit.dailyCounts} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => formatDateShort(d)}
                tick={{ fill: 'hsl(var(--text-muted))', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={timeRange <= 14 ? 0 : timeRange <= 30 ? 2 : 6}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: 'hsl(var(--text-muted))', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--surface-1))',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: 'hsl(var(--text-primary))',
                  fontSize: 13,
                }}
                labelFormatter={(l) => formatDateFull(l as string)}
                formatter={(v: number) => [`${v}×`, 'Teljesítve']}
              />
              <Bar
                dataKey="count"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap-style mini calendar (last 5 weeks) */}
      <div>
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">
          Aktivitás térkép
        </h3>
        <HeatmapGrid entries={habit.entries} />
      </div>
    </Card>
  );
}

function HeatmapGrid({ entries }: { entries: GroupedHabit['entries'] }) {
  const dateCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      map.set(e.completedAt, (map.get(e.completedAt) || 0) + 1);
    }
    return map;
  }, [entries]);

  // Build 5 weeks (35 days) grid ending today
  const cells = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay() || 7; // Monday = 1
    const totalDays = 7 * 5 + dayOfWeek;
    const result: { date: string; count: number }[] = [];
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      result.push({ date: dateStr, count: dateCountMap.get(dateStr) || 0 });
    }
    return result;
  }, [dateCountMap]);

  const maxCount = Math.max(1, ...cells.map((c) => c.count));

  return (
    <div className="flex gap-1 flex-wrap">
      {cells.map((cell) => {
        const intensity = cell.count / maxCount;
        return (
          <div
            key={cell.date}
            title={`${formatDateFull(cell.date)}: ${cell.count}×`}
            className="w-4 h-4 rounded-sm transition-colors"
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
  );
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
}
