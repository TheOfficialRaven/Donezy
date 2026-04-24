import { Folder, Inbox, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type FolderEntry = { key: string; label: string; count: number; color?: string; icon?: string };

export default function FolderSidebar({
  entries,
  selected,
  onSelect,
  onCreateFolder,
}: {
  entries: FolderEntry[];
  selected: string;
  onSelect: (key: string) => void;
  onCreateFolder: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-text-muted uppercase tracking-wide">Mappák</p>
        <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onCreateFolder}>
          <Plus className="h-3 w-3 mr-1" />
          Új
        </Button>
      </div>
      <div className="rounded-xl border border-white/10 bg-surface-0/20 p-1 space-y-0.5 max-h-[min(60vh,420px)] overflow-y-auto">
        <button
          type="button"
          onClick={() => onSelect('all')}
          className={cn(
            'w-full flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors',
            selected === 'all' ? 'bg-primary/15 text-primary' : 'text-text-secondary hover:bg-white/5'
          )}
        >
          <Folder className="h-4 w-4 shrink-0 opacity-70" />
          <span className="truncate flex-1">Összes mappa</span>
        </button>
        {entries.map((e) => (
          <button
            key={e.key}
            type="button"
            onClick={() => onSelect(e.key)}
            className={cn(
              'w-full flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors',
              selected === e.key ? 'bg-primary/15 text-primary' : 'text-text-secondary hover:bg-white/5'
            )}
          >
            {e.key === '__inbox__' ? (
              <Inbox className="h-4 w-4 shrink-0 opacity-70" />
            ) : (
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0 border border-white/20"
                style={{ backgroundColor: e.color || 'hsl(var(--muted))' }}
              />
            )}
            <span className="truncate flex-1">{e.label}</span>
            <span className="text-[10px] text-text-muted tabular-nums">{e.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
