import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export type NotesEmptyKind =
  | 'no-notes'
  | 'no-search'
  | 'no-archived'
  | 'no-pinned'
  | 'no-type-match'
  | 'no-folder-notes';

const copy: Record<NotesEmptyKind, { title: string; body: string }> = {
  'no-notes': {
    title: 'Még üres a fejed „kimenete”',
    body: 'Írj le bármit — ötletet, tanulságot, vagy csak engedd ki magadból. Nem kell tökéletesnek lennie.',
  },
  'no-search': {
    title: 'Nincs találat',
    body: 'Próbálj más szót, vagy lazíts a szűrőkön.',
  },
  'no-archived': {
    title: 'Nincs archivált jegyzet',
    body: 'Az archívum a félretett, nem törlött bejegyzések helye.',
  },
  'no-pinned': {
    title: 'Nincs kitűzött jegyzet',
    body: 'Tűzz ki fontosakat, hogy mindig szem előtt legyenek.',
  },
  'no-type-match': {
    title: 'Ebben a típusban még nincs semmi',
    body: 'Válts típust, vagy hozz létre egy új rögzítést.',
  },
  'no-folder-notes': {
    title: 'Ebben a mappában nincs jegyzet',
    body: 'Húzz ide rögzítéseket, vagy hozz létre újat ebben a mappában.',
  },
};

export default function NotesEmptyState({
  kind,
  onCreate,
}: {
  kind: NotesEmptyKind;
  onCreate?: () => void;
}) {
  const c = copy[kind];
  return (
    <Card className="glass p-10 text-center border-white/5">
      <h3 className="text-lg font-heading font-semibold text-text-primary mb-2">{c.title}</h3>
      <p className="text-sm text-text-muted max-w-md mx-auto mb-5">{c.body}</p>
      {onCreate && (kind === 'no-notes' || kind === 'no-type-match' || kind === 'no-folder-notes') && (
        <Button className="bg-primary text-surface-0" onClick={onCreate}>
          Gyors rögzítés
        </Button>
      )}
    </Card>
  );
}
