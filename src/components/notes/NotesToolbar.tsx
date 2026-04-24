import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NOTES_VIEW_FILTER_LABELS, NOTE_TYPE_LABELS, NOTE_TYPES } from '@/lib/notes/constants';
import type { NotesArchivedFilter, NotesTypeFilter, NotesViewFilter } from '@/lib/notes/types';
const ARCHIVED_LABELS: Record<NotesArchivedFilter, string> = {
  active: 'Aktívak',
  archived: 'Archív',
  all: 'Mind',
};

export default function NotesToolbar({
  view,
  onView,
  query,
  onQuery,
  typeFilter,
  onTypeFilter,
  archivedFilter,
  onArchivedFilter,
  layoutMode,
  onLayoutMode,
}: {
  view: NotesViewFilter;
  onView: (v: NotesViewFilter) => void;
  query: string;
  onQuery: (q: string) => void;
  typeFilter: NotesTypeFilter;
  onTypeFilter: (t: NotesTypeFilter) => void;
  archivedFilter: NotesArchivedFilter;
  onArchivedFilter: (a: NotesArchivedFilter) => void;
  layoutMode: 'comfortable' | 'compact';
  onLayoutMode: (m: 'comfortable' | 'compact') => void;
}) {
  return (
    <div className="space-y-3">
      <Tabs value={view} onValueChange={(v) => onView(v as NotesViewFilter)}>
        <TabsList className="bg-surface-1/80 border border-white/10 flex flex-wrap h-auto gap-1 p-1">
          {(Object.keys(NOTES_VIEW_FILTER_LABELS) as NotesViewFilter[]).map((key) => (
            <TabsTrigger
              key={key}
              value={key}
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-xs"
            >
              {NOTES_VIEW_FILTER_LABELS[key]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-end flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="h-4 w-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            className="pl-9 bg-surface-1/50 border-white/10"
            placeholder="Keresés cím, tartalom, címke szerint..."
          />
        </div>

        <Select value={typeFilter} onValueChange={(v) => onTypeFilter(v as NotesTypeFilter)}>
          <SelectTrigger className="w-full sm:w-[180px] bg-surface-1/50 border-white/10">
            <SelectValue placeholder="Típus" />
          </SelectTrigger>
          <SelectContent className="bg-surface-1 border-white/10">
            <SelectItem value="all">Minden típus</SelectItem>
            {NOTE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {NOTE_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={archivedFilter} onValueChange={(v) => onArchivedFilter(v as NotesArchivedFilter)}>
          <SelectTrigger className="w-full sm:w-[140px] bg-surface-1/50 border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-surface-1 border-white/10">
            {(Object.keys(ARCHIVED_LABELS) as NotesArchivedFilter[]).map((k) => (
              <SelectItem key={k} value={k}>
                {ARCHIVED_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={layoutMode} onValueChange={(v) => onLayoutMode(v as 'comfortable' | 'compact')}>
          <SelectTrigger className="w-full sm:w-[160px] bg-surface-1/50 border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-surface-1 border-white/10">
            <SelectItem value="comfortable">Kényelmes lista</SelectItem>
            <SelectItem value="compact">Tömör lista</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
