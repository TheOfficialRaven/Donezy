import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ListItemsFilter, ListItemsSort, ListViewFilter } from '@/lib/lists/types';
import { Plus } from 'lucide-react';

interface ListsToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  viewFilter: ListViewFilter;
  onViewFilterChange: (value: ListViewFilter) => void;
  itemFilter: ListItemsFilter;
  onItemFilterChange: (value: ListItemsFilter) => void;
  itemSort: ListItemsSort;
  onItemSortChange: (value: ListItemsSort) => void;
  onCreateList: () => void;
}

export default function ListsToolbar({
  query,
  onQueryChange,
  viewFilter,
  onViewFilterChange,
  itemFilter,
  onItemFilterChange,
  itemSort,
  onItemSortChange,
  onCreateList,
}: ListsToolbarProps) {
  return (
    <div className="glass p-4 rounded-xl space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Keresés listákban és elemekben..."
          className="bg-surface-1/50 border-white/10"
        />
        <Button onClick={onCreateList} className="bg-primary hover:bg-primary/90 text-surface-0">
          <Plus className="h-4 w-4 mr-2" />
          Új lista
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Select value={viewFilter} onValueChange={(value) => onViewFilterChange(value as ListViewFilter)}>
          <SelectTrigger className="bg-surface-1/40 border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-surface-1 border-white/10">
            <SelectItem value="all">Összes lista</SelectItem>
            <SelectItem value="pinned">Pinned listák</SelectItem>
            <SelectItem value="active">Aktív listák</SelectItem>
            <SelectItem value="archived">Archivált listák</SelectItem>
          </SelectContent>
        </Select>
        <Select value={itemFilter} onValueChange={(value) => onItemFilterChange(value as ListItemsFilter)}>
          <SelectTrigger className="bg-surface-1/40 border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-surface-1 border-white/10">
            <SelectItem value="all">Elemek: Összes</SelectItem>
            <SelectItem value="open">Elemek: Nyitott</SelectItem>
            <SelectItem value="completed">Elemek: Kész</SelectItem>
          </SelectContent>
        </Select>
        <Select value={itemSort} onValueChange={(value) => onItemSortChange(value as ListItemsSort)}>
          <SelectTrigger className="bg-surface-1/40 border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-surface-1 border-white/10">
            <SelectItem value="manual">Rendezés: Kézi</SelectItem>
            <SelectItem value="priority">Rendezés: Prioritás</SelectItem>
            <SelectItem value="dueDate">Rendezés: Határidő</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
