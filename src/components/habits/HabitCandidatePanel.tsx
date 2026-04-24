import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { HabitCandidate } from '@/lib/habits/types';

export default function HabitCandidatePanel({
  candidates,
  onPromote,
}: {
  candidates: HabitCandidate[];
  onPromote: (candidateId: string) => void;
}) {
  if (candidates.length === 0) {
    return (
      <Card className="glass p-4 border-white/5">
        <p className="text-sm text-text-muted">Nincs meg promotálhato visszatero minta.</p>
      </Card>
    );
  }
  return (
    <Card className="glass p-4 border-white/5 space-y-3">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide">Ismetlodo mintak</h3>
      {candidates.slice(0, 6).map((candidate) => (
        <div key={candidate.id} className="rounded-lg border border-white/10 bg-surface-0/25 px-3 py-2 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-text-primary">{candidate.titleHint || `${candidate.sourceModule} minta`}</p>
            <p className="text-xs text-text-muted">
              {candidate.occurrencesCount} esemeny / {candidate.activeDaysCount} aktiv nap
            </p>
            <div className="mt-1">
              <Badge variant="outline" className="text-[11px] border-amber-500/30 text-amber-200">
                Repeat score: {Math.round(candidate.repeatScore * 100)}%
              </Badge>
            </div>
          </div>
          {!candidate.promotedToHabit ? (
            <Button size="sm" variant="outline" className="border-white/15" onClick={() => onPromote(candidate.id)}>
              Szokassa emel
            </Button>
          ) : (
            <Badge className="bg-emerald-500/15 text-emerald-200 border-emerald-500/25">Promotalt</Badge>
          )}
        </div>
      ))}
    </Card>
  );
}
