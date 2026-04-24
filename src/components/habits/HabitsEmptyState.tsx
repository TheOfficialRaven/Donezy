import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type EmptyKind =
  | 'no-habits'
  | 'no-today'
  | 'no-auto'
  | 'no-filter'
  | 'no-archived'
  | 'no-completions'
  | 'no-signals'
  | 'no-candidates';

const copy: Record<EmptyKind, { title: string; body: string }> = {
  'no-habits': {
    title: 'Meg nincs szokas',
    body: 'A rendszer itt gyujti a visszatero rutinokat. Kezdhetsz manualis szokassal is.',
  },
  'no-today': {
    title: 'Ma nincs fenntarto szokas',
    body: 'Ez jo jel is lehet: vagy kész vagy mara, vagy ideje felvenni egy mini rutint.',
  },
  'no-auto': {
    title: 'Nincs auto tracked szokas',
    body: 'Ha tobbszor ismetlodik egy aktivitet, a rendszer jeloltkent fel fogja ajanlani.',
  },
  'no-filter': {
    title: 'Nincs talalat',
    body: 'Próbálj lazább keresést vagy masik szurot.',
  },
  'no-archived': {
    title: 'Az archivum ures',
    body: 'Ha felreteszel szokast, itt jelenik meg.',
  },
  'no-completions': {
    title: 'Meg nincs teljesites',
    body: 'Egy mini lepessel mar ma elindulhat a sorozat.',
  },
  'no-signals': {
    title: 'Ma nincs eszlelt aktivitas',
    body: 'Ha hasznalod a listakat, naptarat, olvasast vagy reflextiot, itt megjelenik.',
  },
  'no-candidates': {
    title: 'Nincs visszatero minta',
    body: 'A jeloltekhez tobb alkalom es tobb aktiv nap szukseges.',
  },
};

export default function HabitsEmptyState({ kind, onCreate }: { kind: EmptyKind; onCreate?: () => void }) {
  return (
    <Card className="glass p-10 text-center border-white/5">
      <h3 className="text-lg font-heading font-semibold text-text-primary mb-2">{copy[kind].title}</h3>
      <p className="text-sm text-text-muted max-w-md mx-auto mb-5">{copy[kind].body}</p>
      {onCreate && (kind === 'no-habits' || kind === 'no-today') && (
        <Button className="bg-primary text-surface-0" onClick={onCreate}>
          Uj szokas
        </Button>
      )}
    </Card>
  );
}
