import { Card } from '@/components/ui/card';
import type { NoteProductivityMetrics } from '@/lib/notes/types';

export default function NotesSummaryPanel({ metrics }: { metrics: NoteProductivityMetrics }) {
  const chips = [
    { label: 'Összes', value: metrics.totalCount },
    { label: 'Aktív', value: metrics.activeCount },
    { label: 'Kitűzve', value: metrics.pinnedCount },
    { label: 'Archív', value: metrics.archivedCount },
    { label: 'Utóbbi 7 nap', value: metrics.recent7dCount },
    { label: 'Inbox-jelöltek', value: metrics.inboxCandidateCount },
    { label: 'Figyelmet kér', value: metrics.needingAttentionCount },
  ];
  return (
    <Card className="glass border-white/5 p-4">
      <p className="text-xs text-text-muted uppercase tracking-wide mb-3">Áttekintés</p>
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <div
            key={c.label}
            className="rounded-lg border border-white/10 bg-surface-0/30 px-3 py-1.5 text-xs text-text-secondary"
          >
            <span className="text-text-muted">{c.label}: </span>
            <span className="font-semibold text-text-primary">{c.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
