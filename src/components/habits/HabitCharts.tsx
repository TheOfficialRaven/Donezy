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

export function HabitTrendChart({
  data,
  title,
}: {
  data: Array<{ dateKey: string; count: number; label?: string }>;
  title: string;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wide">{title}</h4>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="label" tick={{ fill: 'hsl(var(--text-muted))', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--text-muted))', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--surface-1))',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: 'hsl(var(--text-primary))',
              }}
            />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={26} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function HabitActivityChart({
  data,
}: {
  data: Array<{ dateKey: string; count: number }>;
}) {
  const chartData = data.map((row) => ({ ...row, label: row.dateKey.slice(5) }));
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wide">Aktivitasi jelek trendje</h4>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="habitSignalArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="label" tick={{ fill: 'hsl(var(--text-muted))', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--text-muted))', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--surface-1))',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: 'hsl(var(--text-primary))',
              }}
            />
            <Area type="monotone" dataKey="count" stroke="hsl(var(--secondary))" fill="url(#habitSignalArea)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
