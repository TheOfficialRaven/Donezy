import { Target, Search, Archive, CheckCircle2, ListTodo } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { GoalsViewFilter } from '@/lib/goals/types';

type EmptyVariant = 'none' | 'no-active' | 'no-filter' | 'no-milestones' | 'no-completed' | 'archived-empty';

const copy: Record<
  EmptyVariant,
  { title: string; body: string; icon: typeof Target }
> = {
  none: {
    title: 'Még nincs célod',
    body: 'Egy jó cél nem büntetés — iránytű. Kezdj egyetlen olyan céllal, ami tényleg számít neked most.',
    icon: Target,
  },
  'no-active': {
    title: 'Nincs aktív cél',
    body: 'Ha minden le van zárva vagy szünetel, érdemes egy új irányt választani — kicsiben is elég kezdeni.',
    icon: ListTodo,
  },
  'no-filter': {
    title: 'Nincs találat',
    body: 'Próbálj másik szűrőt vagy rövidebb keresőt — néha egy szó elég ahhoz, hogy előbukkanjon, amit keresel.',
    icon: Search,
  },
  'no-milestones': {
    title: 'Még nincs mérföldkő',
    body: 'Bontsd egy-két konkrét lépésre — így mindig egyértelmű lesz a következő legjobb lépés.',
    icon: ListTodo,
  },
  'no-completed': {
    title: 'Még nincs befejezett cél',
    body: 'A haladás itt is látszik majd. Addig is: egy kis lépés ma többet ér, mint a tökéletes terv holnap.',
    icon: CheckCircle2,
  },
  'archived-empty': {
    title: 'Az archívum üres',
    body: 'Ha lezársz vagy félreteszel egy célt, ide kerül — rendben marad a fókuszlistád.',
    icon: Archive,
  },
};

export default function GoalsEmptyState({
  variant,
  onCreate,
  filterView,
}: {
  variant: EmptyVariant;
  onCreate?: () => void;
  filterView?: GoalsViewFilter;
}) {
  const { title, body, icon: Icon } = copy[variant];
  const showCta = variant === 'none' || variant === 'no-active';

  return (
    <Card className="glass p-10 text-center border-white/5">
      <Icon className="h-12 w-12 text-text-disabled mx-auto mb-4" />
      <h3 className="text-lg font-heading font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-muted text-sm max-w-md mx-auto mb-6">{body}</p>
      {filterView && variant === 'no-filter' && (
        <p className="text-xs text-text-disabled mb-4">Nézet: {filterView}</p>
      )}
      {showCta && onCreate && (
        <Button className="bg-primary hover:bg-primary/90 text-surface-0" onClick={onCreate}>
          Új cél
        </Button>
      )}
    </Card>
  );
}
