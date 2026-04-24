import { useMemo, useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/useAppStore';
import {
  filterNotesForMainView,
  getNoteFolderLabel,
  getNoteFolderSidebarEntries,
  getNoteProductivityMetrics,
} from '@/lib/notes/selectors';
import { DEFAULT_NOTE_FOLDER_COLOR, DEFAULT_NOTE_FOLDER_ICON } from '@/lib/notes/constants';
import type { Note, NoteType } from '@/lib/notes/types';
import NotesToolbar from '@/components/notes/NotesToolbar';
import NoteCard from '@/components/notes/NoteCard';
import NotesEmptyState from '@/components/notes/NotesEmptyState';
import type { NotesEmptyKind } from '@/components/notes/NotesEmptyState';
import NoteEditorDialog from '@/components/notes/NoteEditorDialog';
import NoteDetailPanel from '@/components/notes/NoteDetailPanel';
import FolderSidebar from '@/components/notes/FolderSidebar';
import NotesSummaryPanel from '@/components/notes/NotesSummaryPanel';
import QuickCaptureBar from '@/components/notes/QuickCaptureBar';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function Notes() {
  const {
    notes,
    noteFolders,
    notesViewFilter,
    notesSearchQuery,
    notesTypeFilter,
    notesFolderFilter,
    notesArchivedFilter,
    selectedNoteId,
    notesLayoutMode,
    setNotesViewFilter,
    setNotesSearchQuery,
    setNotesTypeFilter,
    setNotesFolderFilter,
    setNotesArchivedFilter,
    setSelectedNoteId,
    setNotesLayoutMode,
    addNote,
    updateNote,
    deleteNote,
    archiveNote,
    pinNote,
    addFolder,
    touchNoteOpened,
  } = useAppStore();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newFolderTitle, setNewFolderTitle] = useState('');

  const safeNotes = notes || [];
  const safeFolders = noteFolders || [];

  const filtered = useMemo(
    () =>
      filterNotesForMainView(safeNotes, {
        view: notesViewFilter,
        searchQuery: notesSearchQuery,
        typeFilter: notesTypeFilter,
        folderFilter: notesFolderFilter,
        archivedFilter: notesArchivedFilter,
      }),
    [safeNotes, notesViewFilter, notesSearchQuery, notesTypeFilter, notesFolderFilter, notesArchivedFilter]
  );

  const metrics = useMemo(() => getNoteProductivityMetrics(safeNotes, safeFolders), [safeNotes, safeFolders]);

  const folderSidebarEntries = useMemo(() => getNoteFolderSidebarEntries(safeNotes, safeFolders), [safeNotes, safeFolders]);

  const selectedNote = useMemo(
    () => (selectedNoteId ? safeNotes.find((n) => n.id === selectedNoteId) || null : null),
    [safeNotes, selectedNoteId]
  );

  const selectNote = (id: string) => {
    setSelectedNoteId(id);
    void touchNoteOpened(id);
  };

  const emptyKind: NotesEmptyKind | null = useMemo(() => {
    if (safeNotes.length === 0) return 'no-notes';
    if (filtered.length > 0) return null;
    if (notesSearchQuery.trim()) return 'no-search';
    if (notesViewFilter === 'archived') return 'no-archived';
    if (notesViewFilter === 'pinned') return 'no-pinned';
    if (notesTypeFilter !== 'all') return 'no-type-match';
    if (notesFolderFilter !== 'all') return 'no-folder-notes';
    return 'no-search';
  }, [safeNotes.length, filtered.length, notesSearchQuery, notesViewFilter, notesTypeFilter, notesFolderFilter]);

  const openCreate = () => {
    setEditingNote(null);
    setEditorOpen(true);
  };

  const openEdit = (n: Note) => {
    setEditingNote(n);
    setEditorOpen(true);
  };

  const handleEditorSave = async (payload: Partial<Note> & { title?: string; content?: string }) => {
    try {
      if (editingNote) {
        await updateNote(editingNote.id, payload);
        toast.success('Jegyzet mentve.');
      } else {
        await addNote({
          title: payload.title,
          content: payload.content,
          type: payload.type,
          folderId: payload.folderId,
          legacyFolder: payload.legacyFolder,
          tags: payload.tags,
          pinned: payload.pinned,
          archived: payload.archived,
          locked: payload.locked,
        });
        toast.success('Elmentve.');
      }
    } catch {
      toast.error('Mentési hiba.');
    }
  };

  const handleQuickSave = async ({ content, type }: { content: string; type: NoteType }) => {
    await addNote({ content, type });
    toast.success('Gyors rögzítés elmentve.');
  };

  const handleCreateFolder = async () => {
    const t = newFolderTitle.trim();
    if (!t) return;
    await addFolder({
      title: t,
      color: DEFAULT_NOTE_FOLDER_COLOR,
      icon: DEFAULT_NOTE_FOLDER_ICON,
    });
    toast.success('Mappa létrehozva.');
    setNewFolderTitle('');
    setFolderDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Jegyzetek
          </h1>
          <p className="text-text-secondary mt-1 max-w-2xl text-sm">
            Gyors mentális inbox: írd ki, ami a fejedben van, majd rendezd mappa és típus szerint — anélkül, hogy
            dokumentumrendszer érzése lenne.
          </p>
        </div>
        <Button className="bg-primary text-surface-0 shrink-0" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Új jegyzet
        </Button>
      </div>

      <NotesSummaryPanel metrics={metrics} />

      <QuickCaptureBar onSave={handleQuickSave} />

      <NotesToolbar
        view={notesViewFilter}
        onView={setNotesViewFilter}
        query={notesSearchQuery}
        onQuery={setNotesSearchQuery}
        typeFilter={notesTypeFilter}
        onTypeFilter={setNotesTypeFilter}
        archivedFilter={notesArchivedFilter}
        onArchivedFilter={setNotesArchivedFilter}
        layoutMode={notesLayoutMode}
        onLayoutMode={setNotesLayoutMode}
      />

      <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)_minmax(280px,340px)]">
        <FolderSidebar
          entries={folderSidebarEntries}
          selected={notesFolderFilter}
          onSelect={setNotesFolderFilter}
          onCreateFolder={() => setFolderDialogOpen(true)}
        />

        <div className="space-y-4 min-w-0">
          {emptyKind ? (
            <NotesEmptyState kind={emptyKind} onCreate={openCreate} />
          ) : (
            <div
              className={
                notesLayoutMode === 'compact' ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3' : 'grid gap-4 sm:grid-cols-2'
              }
            >
              {filtered.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  folderLabel={getNoteFolderLabel(note, safeFolders)}
                  selected={selectedNoteId === note.id}
                  compact={notesLayoutMode === 'compact'}
                  onOpen={() => selectNote(note.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-4">
          {selectedNote ? (
            <NoteDetailPanel
              note={selectedNote}
              folders={safeFolders}
              onArchive={() => void archiveNote(selectedNote.id, !selectedNote.archived)}
              onPin={() => void pinNote(selectedNote.id, !selectedNote.pinned)}
              onDelete={() => setDeleteId(selectedNote.id)}
              onEdit={() => openEdit(selectedNote)}
              onToggleLock={() => void updateNote(selectedNote.id, { locked: !selectedNote.locked })}
            />
          ) : (
            <div className="glass border border-white/5 rounded-xl p-6 text-sm text-text-muted">
              Válassz jegyzetet a részletekhez, vagy hozz létre újat.
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-20 right-4 md:hidden z-40">
        <Button
          size="lg"
          className="w-14 h-14 rounded-full bg-primary text-surface-0 shadow-lg"
          onClick={openCreate}
          aria-label="Új jegyzet"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      <NoteEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        note={editingNote}
        folders={safeFolders}
        onSave={handleEditorSave}
      />

      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent className="bg-surface-1 border border-white/10">
          <DialogHeader>
            <DialogTitle>Új mappa</DialogTitle>
          </DialogHeader>
          <Input
            value={newFolderTitle}
            onChange={(e) => setNewFolderTitle(e.target.value)}
            placeholder="Mappa neve"
            className="bg-surface-0/50 border-white/10"
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleCreateFolder();
            }}
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setFolderDialogOpen(false)}>
              Mégse
            </Button>
            <Button className="bg-primary text-surface-0" onClick={() => void handleCreateFolder()}>
              Létrehozás
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Jegyzet törlése"
        description="Véglegesen törlöd? Ez nem archiválás."
        confirmLabel="Törlés"
        destructive
        onConfirm={async () => {
          if (deleteId) {
            await deleteNote(deleteId);
            setSelectedNoteId(undefined);
            setDeleteId(null);
            toast.success('Törölve.');
          }
        }}
      />
    </div>
  );
}
