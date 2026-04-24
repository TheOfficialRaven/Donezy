import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckSquare, Plus } from 'lucide-react';

interface ListsEmptyStateProps {
  onCreate: () => void;
  filtered?: boolean;
  viewFilter?: 'all' | 'pinned' | 'active' | 'archived';
  hasAnyLists?: boolean;
  hasOverload?: boolean;
}

export default function ListsEmptyState({
  onCreate,
  filtered = false,
  viewFilter = 'all',
  hasAnyLists = false,
  hasOverload = false,
}: ListsEmptyStateProps) {
  const title = filtered
    ? viewFilter === 'archived'
      ? 'Még nincs archivált lista'
      : 'Nincs találat erre a szűrésre'
    : 'Még nincsenek listáid';
  const description = filtered
    ? viewFilter === 'archived'
      ? 'Ami már nem aktuális, azt archiválhatod ide.'
      : hasOverload
        ? 'Sok a nyitott elem. Szűkíts kereséssel vagy fókuszálj a mára jelölt tételekre.'
        : 'Próbálj más keresést vagy szűrőt.'
    : hasAnyLists
      ? 'Minden lista most üres. Adj hozzá egy apró következő lépést.'
      : 'Kezdd egy egyszerű listával, és rakd ki a fejedből a teendőket.';
  return (
    <Card className="glass p-12 text-center">
      <CheckSquare className="h-16 w-16 text-text-disabled mx-auto mb-4" />
      <h3 className="text-lg font-heading font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-muted mb-6">{description}</p>
      <Button className="bg-primary hover:bg-primary/90 text-surface-0" onClick={onCreate}>
        <Plus className="h-4 w-4 mr-2" />
        {hasAnyLists ? 'Új lista' : 'Első lista létrehozása'}
      </Button>
    </Card>
  );
}
