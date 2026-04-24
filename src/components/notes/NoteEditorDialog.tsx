import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Note, NoteFolder, NoteType } from '@/lib/notes/types';
import { NOTE_TYPE_LABELS, NOTE_TYPES } from '@/lib/notes/constants';
import { legacyFolderFilterKey } from '@/lib/notes/selectors';

const FOLDER_NONE = '__none__';

function folderKeyFromNote(note: Note | null): string {
  if (!note) return FOLDER_NONE;
  if (note.folderId) return note.folderId;
  if (note.legacyFolder) return legacyFolderFilterKey(note.legacyFolder);
  return FOLDER_NONE;
}

export default function NoteEditorDialog({
  open,
  onOpenChange,
  note,
  folders,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  note: Note | null;
  folders: NoteFolder[];
  onSave: (payload: Partial<Note> & { title?: string; content?: string }) => Promise<void> | void;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<NoteType>('note');
  const [folderKey, setFolderKey] = useState('');
  const [tags, setTags] = useState('');
  const [pinned, setPinned] = useState(false);
  const [archived, setArchived] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setType(note.type);
      setFolderKey(folderKeyFromNote(note));
      setTags((note.tags || []).join(', '));
      setPinned(note.pinned);
      setArchived(note.archived);
      setLocked(Boolean(note.locked));
    } else {
      setTitle('');
      setContent('');
      setType('note');
      setFolderKey(FOLDER_NONE);
      setTags('');
      setPinned(false);
      setArchived(false);
      setLocked(false);
    }
  }, [note, open]);

  const folderOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [{ value: FOLDER_NONE, label: 'Nincs mappa (inbox)' }];
    for (const f of folders) {
      opts.push({ value: f.id, label: f.title });
    }
    if (note?.legacyFolder && !note.folderId) {
      const k = legacyFolderFilterKey(note.legacyFolder);
      if (!opts.some((o) => o.value === k)) {
        opts.push({ value: k, label: `${note.legacyFolder} (régi)` });
      }
    }
    return opts;
  }, [folders, note]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    let folderId: string | undefined;
    let legacyFolder: string | undefined;
    if (!folderKey || folderKey === FOLDER_NONE) {
      folderId = undefined;
      legacyFolder = undefined;
    } else if (folderKey.startsWith('legacy::')) {
      folderId = undefined;
      legacyFolder = note?.legacyFolder && legacyFolderFilterKey(note.legacyFolder) === folderKey ? note.legacyFolder : undefined;
    } else {
      folderId = folderKey;
      legacyFolder = undefined;
    }

    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await onSave({
      title,
      content,
      type,
      folderId,
      legacyFolder,
      tags: tagList,
      pinned,
      archived,
      locked,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-1 border border-white/10 text-text-primary max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">{note ? 'Jegyzet szerkesztése' : 'Új jegyzet'}</DialogTitle>
          <DialogDescription className="text-text-secondary text-sm">
            {note ? 'Finomítsd a szöveget, típust és helyet.' : 'Elég a tartalom is — a cím lehet üres.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void submit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label>Cím (opcionális)</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Rövid megnevezés…"
              className="bg-surface-0/50 border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label>Tartalom</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Írd ki, ami a fejedben van…"
              className="bg-surface-0/50 border-white/10 min-h-[160px] resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Típus</Label>
              <Select value={type} onValueChange={(v) => setType(v as NoteType)}>
                <SelectTrigger className="bg-surface-0/50 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-1 border-white/10">
                  {NOTE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {NOTE_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mappa</Label>
              <Select value={folderKey} onValueChange={setFolderKey}>
                <SelectTrigger className="bg-surface-0/50 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-1 border-white/10">
                  {folderOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Címkék (vesszővel)</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="pl. később, fontos"
              className="bg-surface-0/50 border-white/10"
            />
          </div>

          <div className="flex flex-wrap gap-6 items-center">
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <Switch checked={pinned} onCheckedChange={setPinned} />
              Kitűzés
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <Switch checked={archived} onCheckedChange={setArchived} />
              Archiválva
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <Switch checked={locked} onCheckedChange={setLocked} />
              Zárolt
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Mégse
            </Button>
            <Button type="submit" className="bg-primary text-surface-0">
              {note ? 'Mentés' : 'Létrehozás'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
