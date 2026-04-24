import { Card } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';

interface CalendarEmptyStateProps {
  mode: 'no-events' | 'no-day-events' | 'no-upcoming' | 'no-filter-results' | 'overloaded-day';
}

const copy: Record<CalendarEmptyStateProps['mode'], { title: string; text: string }> = {
  'no-events': {
    title: 'Még nincs eseményed',
    text: 'Kezdd egyetlen blokk létrehozásával, és máris átláthatóbb lesz a napod.',
  },
  'no-day-events': {
    title: 'Erre a napra nincs esemény',
    text: 'Ez most egy szabadabb napnak tűnik. Tervezhetsz fókuszblokkot vagy pihenőt.',
  },
  'no-upcoming': {
    title: 'Nincs közelgő esemény',
    text: 'Ha szeretnéd, adj hozzá egy következő lépést, hogy biztos legyen a fókusz.',
  },
  'no-filter-results': {
    title: 'Nincs találat a szűrésre',
    text: 'Módosíts egy szűrőt vagy töröld a keresést.',
  },
  'overloaded-day': {
    title: 'Sűrű napnak tűnik',
    text: 'Érdemes 1-2 blokkot átmozgatni, hogy maradjon levegő a napodban.',
  },
};

export default function CalendarEmptyState({ mode }: CalendarEmptyStateProps) {
  return (
    <Card className="glass p-6 text-center">
      <CalendarDays className="h-10 w-10 text-text-disabled mx-auto mb-3" />
      <h3 className="text-base font-semibold text-text-primary mb-1">{copy[mode].title}</h3>
      <p className="text-sm text-text-muted">{copy[mode].text}</p>
    </Card>
  );
}
