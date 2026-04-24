import { Button } from '@/components/ui/button';
import type { RoutingCandidate } from '@/lib/routing/types';
import RoutingCandidateBadge from './RoutingCandidateBadge';

interface RoutingCandidateRowProps {
  candidate: RoutingCandidate;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
}

export default function RoutingCandidateRow({ candidate, onAccept, onDismiss }: RoutingCandidateRowProps) {
  return (
    <div className="rounded-md border border-white/10 bg-surface-0/20 p-3">
      <RoutingCandidateBadge candidate={candidate} />
      <p className="text-sm text-text-primary font-medium">{candidate.title}</p>
      {candidate.description ? <p className="text-xs text-text-muted mt-1">{candidate.description}</p> : null}
      <p className="text-xs text-text-secondary mt-1">{candidate.reason}</p>
      <div className="flex gap-2 mt-2">
        <Button size="sm" className="bg-primary text-surface-0 hover:bg-primary/90" onClick={() => onAccept(candidate.id)}>
          Alkalmazas
        </Button>
        <Button size="sm" variant="outline" className="border-white/20" onClick={() => onDismiss(candidate.id)}>
          Most nem
        </Button>
      </div>
    </div>
  );
}
