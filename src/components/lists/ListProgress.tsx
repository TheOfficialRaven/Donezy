interface ListProgressProps {
  done: number;
  total: number;
  color: string;
}

export default function ListProgress({ done, total, color }: ListProgressProps) {
  if (total <= 0) return null;
  const percent = Math.round((done / total) * 100);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-text-muted mb-1">
        <span>{done} / {total} kész</span>
        <span>{percent}%</span>
      </div>
      <div className="w-full bg-surface-2 rounded-full h-2">
        <div className="h-2 rounded-full transition-all duration-300" style={{ backgroundColor: color, width: `${percent}%` }} />
      </div>
    </div>
  );
}
