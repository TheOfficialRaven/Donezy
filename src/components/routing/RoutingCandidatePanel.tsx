import { Card } from '@/components/ui/card';
import type { RoutingCandidate } from '@/lib/routing/types';
import RoutingCandidateRow from './RoutingCandidateRow';

interface RoutingCandidatePanelProps {
  candidates: RoutingCandidate[];
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
}

export default function RoutingCandidatePanel({ candidates, onAccept, onDismiss }: RoutingCandidatePanelProps) {
  if (candidates.length === 0) return null;
  return (
    <Card className="glass p-4 border-white/10 space-y-2">
      <p className="text-sm font-semibold text-text-primary">Atalakithato javaslatok</p>
      <p className="text-xs text-text-muted">Ezekbol egy lepessel tovabb mehetsz masik modulba.</p>
      <div className="space-y-2">
        {candidates.map((candidate) => (
          <RoutingCandidateRow key={candidate.id} candidate={candidate} onAccept={onAccept} onDismiss={onDismiss} />
        ))}
      </div>
    </Card>
  );
}
