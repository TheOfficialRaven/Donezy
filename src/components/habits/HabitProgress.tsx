import { Progress } from '@/components/ui/progress';

export default function HabitProgress({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-text-muted">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <Progress value={Math.max(0, Math.min(100, value))} className="h-2 bg-surface-2" />
    </div>
  );
}
