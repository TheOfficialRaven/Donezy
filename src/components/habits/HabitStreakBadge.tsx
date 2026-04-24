import { Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function HabitStreakBadge({ streak }: { streak: number }) {
  if (streak <= 0) return null;
  return (
    <Badge className="text-xs bg-orange-500/15 text-orange-300 border-orange-500/25">
      <Flame className="h-3 w-3 mr-1" />
      {streak} nap
    </Badge>
  );
}
