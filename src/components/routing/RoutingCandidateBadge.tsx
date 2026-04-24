import { Badge } from '@/components/ui/badge';
import type { RoutingCandidate } from '@/lib/routing/types';

interface RoutingCandidateBadgeProps {
  candidate: RoutingCandidate;
}

export default function RoutingCandidateBadge({ candidate }: RoutingCandidateBadgeProps) {
  const confidence = Math.round((candidate.confidence || 0) * 100);
  const statusLabel =
    candidate.status === 'pending'
      ? 'Uj'
      : candidate.status === 'accepted'
        ? 'Elfogadva'
        : candidate.status === 'dismissed'
          ? 'Elutasitva'
          : 'Lejart';

  return (
    <div className="flex items-center gap-2">
      <Badge className="bg-primary/15 text-primary border-primary/30">{candidate.candidateType}</Badge>
      <Badge variant="outline" className="border-white/20 text-text-secondary">
        {statusLabel}
      </Badge>
      <span className="text-[11px] text-text-muted">{confidence}%</span>
    </div>
  );
}
