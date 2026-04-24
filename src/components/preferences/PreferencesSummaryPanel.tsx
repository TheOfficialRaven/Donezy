import { Card } from '@/components/ui/card';
import { getPreferenceSummary } from '@/lib/preferences/selectors';
import type { UserProfilePreferences } from '@/lib/preferences/types';

export default function PreferencesSummaryPanel({ preferences }: { preferences: UserProfilePreferences }) {
  return (
    <Card className="glass p-4 border-white/5">
      <p className="text-xs uppercase tracking-wide text-text-muted">Szemelyre szabasi osszkep</p>
      <p className="text-sm text-text-primary mt-1">{getPreferenceSummary(preferences)}</p>
      <p className="text-xs text-text-muted mt-1">
        Ezek a beallitasok kesobb a Dashboard priorizalast, guidance hangsulyokat es modulon beluli suruseget is befolyasoljak.
      </p>
    </Card>
  );
}
