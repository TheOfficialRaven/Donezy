import { Archive, ArchiveRestore, Pin, PinOff, Trash2, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { Note, NoteFolder } from '@/lib/notes/types';
import { NOTE_TYPE_HINTS, NOTE_TYPE_LABELS } from '@/lib/notes/constants';
import { getNoteFolderLabel } from '@/lib/notes/selectors';

export default function NoteDetailPanel({
  note,
  folders,
  onArchive,
  onPin,
  onDelete,
  onEdit,
  onToggleLock,
}: {
  note: Note;
  folders: NoteFolder[];
  onArchive: () => void;
  onPin: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onToggleLock: () => void;
}) {
  const locked = Boolean(note.locked);
  return (
    <Card className="glass border-white/5 p-5 space-y-4 sticky top-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Badge variant="outline" className="border-white/15">
          {NOTE_TYPE_LABELS[note.type]}
        </Badge>
        {note.pinned && <Badge className="bg-primary/20 text-primary border-0">Kitűzve</Badge>}
        {note.archived && <Badge variant="secondary">Archiválva</Badge>}
      </div>
      <p className="text-xs text-text-muted">{NOTE_TYPE_HINTS[note.type]}</p>
      <div>
        <h2 className="text-xl font-heading font-semibold text-text-primary">{note.title?.trim() || 'Cím nélküli rögzítés'}</h2>
        <p className="text-xs text-text-muted mt-1">{getNoteFolderLabel(note, folders)}</p>
      </div>
      {locked ? (
        <p className="text-sm italic text-text-muted">Ez a jegyzet zárolva van.</p>
      ) : (
        <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-text-secondary text-sm leading-relaxed">
          {note.content || '—'}
        </div>
      )}
      {(note.tags || []).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {note.tags!.map((t) => (
            <Badge key={t} variant="outline" className="text-xs border-white/15">
              #{t}
            </Badge>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
        <Button size="sm" variant="secondary" onClick={onEdit}>
          Szerkesztés
        </Button>
        <Button size="sm" variant="outline" className="border-white/15" onClick={onPin}>
          {note.pinned ? <PinOff className="h-4 w-4 mr-1" /> : <Pin className="h-4 w-4 mr-1" />}
          {note.pinned ? 'Kitűzés levétele' : 'Kitűzés'}
        </Button>
        <Button size="sm" variant="outline" className="border-white/15" onClick={onArchive}>
          {note.archived ? <ArchiveRestore className="h-4 w-4 mr-1" /> : <Archive className="h-4 w-4 mr-1" />}
          {note.archived ? 'Visszaállítás' : 'Archiválás'}
        </Button>
        <Button size="sm" variant="outline" className="border-white/15" onClick={onToggleLock}>
          {locked ? <Unlock className="h-4 w-4 mr-1" /> : <Lock className="h-4 w-4 mr-1" />}
          {locked ? 'Feloldás' : 'Zárolás'}
        </Button>
        <Button size="sm" variant="destructive" className="ml-auto" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-1" />
          Törlés
        </Button>
      </div>
    </Card>
  );
}
