import MilestoneRow from './MilestoneRow';
import type { Milestone } from '@/lib/goals/types';

interface GoalMilestonesListProps {
  milestones: Milestone[];
  onToggle: (milestoneId: string) => void;
  maxVisible?: number;
}

export default function GoalMilestonesList({ milestones, onToggle, maxVisible = 4 }: GoalMilestonesListProps) {
  const sorted = [...milestones].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
  const open = sorted.filter((milestone) => !milestone.completed);
  const completedCount = sorted.length - open.length;
  const shown = maxVisible ? open.slice(0, maxVisible) : open;
  const moreOpen = open.length - shown.length;

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] text-text-muted px-1">
        Hátralévő lépések: {open.length}
        {completedCount > 0 ? ` • Kész: ${completedCount}` : ''}
      </p>
      {open.length === 0 && (
        <p className="text-[11px] text-emerald-300 px-1">Nincs nyitott mérföldkő - szép munka.</p>
      )}
      {shown.map((milestone) => (
        <MilestoneRow key={milestone.id} milestone={milestone} onToggle={() => onToggle(milestone.id)} dense />
      ))}
      {moreOpen > 0 && (
        <p className="text-[11px] text-text-muted px-1">+{moreOpen} további hátralévő lépés a részleteknél.</p>
      )}
    </div>
  );
}
