import { Pin, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Note } from '@/lib/notes/types';
import { NOTE_TYPE_LABELS } from '@/lib/notes/constants';
import NotePreview from './NotePreview';

const typeAccent: Record<Note['type'], string> = {
  note: 'border-l-slate-400/60',
  idea: 'border-l-amber-400/70',
  lesson: 'border-l-emerald-400/70',
  plan: 'border-l-sky-400/70',
  dump: 'border-l-violet-400/70',
  quote: 'border-l-rose-400/70',
};

export default function NoteCard({
  note,
  folderLabel,
  selected,
  compact,
  onOpen,
}: {
  note: Note;
  folderLabel: string;
  selected?: boolean;
  compact?: boolean;
  onOpen: () => void;
}) {
  const locked = Boolean(note.locked);
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        'glass border-white/5 cursor-pointer transition-colors border-l-4 text-left',
        typeAccent[note.type],
        selected ? 'ring-1 ring-primary/40 bg-primary/5' : 'hover:border-white/15'
      )}
    >
      <div className={cn('p-4 space-y-2', compact && 'p-3')}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] border-white/15 text-text-muted">
                {NOTE_TYPE_LABELS[note.type]}
              </Badge>
              {note.pinned && <Pin className="h-3.5 w-3.5 text-primary shrink-0" aria-label="Kitűzve" />}
              {locked && <Lock className="h-3.5 w-3.5 text-warning shrink-0" aria-label="Zárolt" />}
            </div>
            <h3 className="font-heading font-semibold text-text-primary mt-1 truncate">
              {note.title?.trim() || (locked ? 'Zárolt jegyzet' : 'Cím nélkül')}
            </h3>
          </div>
        </div>
        {locked ? (
          <p className="text-sm italic text-text-muted">A tartalom zárolva van.</p>
        ) : (
          <NotePreview text={note.preview || note.content} lines={compact ? 2 : 3} />
        )}
        <div className="flex flex-wrap gap-1 pt-1">
          {(note.tags || []).slice(0, 4).map((tag) => (
            <span key={tag} className="text-[10px] text-text-muted">
              #{tag}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-text-muted pt-1 border-t border-white/5">{folderLabel}</p>
      </div>
    </Card>
  );
}
