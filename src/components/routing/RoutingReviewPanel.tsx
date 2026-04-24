import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getRoutingCandidatesByFilter } from '@/lib/routing';
import type { RoutingCandidate, RoutingReviewFilter } from '@/lib/routing/types';
import RoutingCandidateRow from './RoutingCandidateRow';

interface RoutingReviewPanelProps {
  candidates: RoutingCandidate[];
  filter: RoutingReviewFilter;
  onFilterChange: (filter: RoutingReviewFilter) => void;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
}

export default function RoutingReviewPanel({
  candidates,
  filter,
  onFilterChange,
  onAccept,
  onDismiss,
}: RoutingReviewPanelProps) {
  const filtered = getRoutingCandidatesByFilter(candidates, filter);
  return (
    <Card className="glass p-4 border-white/10 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-text-primary">Routing review</p>
        <div className="flex gap-2">
          <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => onFilterChange('all')}>
            Osszes
          </Button>
          <Button
            size="sm"
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => onFilterChange('pending')}
          >
            Fuggoben
          </Button>
          <Button
            size="sm"
            variant={filter === 'high-confidence' ? 'default' : 'outline'}
            onClick={() => onFilterChange('high-confidence')}
          >
            Eros
          </Button>
        </div>
      </div>
      <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
        {filtered.map((candidate) => (
          <RoutingCandidateRow key={candidate.id} candidate={candidate} onAccept={onAccept} onDismiss={onDismiss} />
        ))}
      </div>
    </Card>
  );
}
