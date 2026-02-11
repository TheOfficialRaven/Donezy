import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, FolderPlus, Lock, MoreHorizontal, Edit3, Trash2, Folder, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppStore, type Note } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';
import NoteDialog from '@/components/dialogs/NoteDialog';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import { toast } from 'sonner';

export default function Notes() {
  const { notes, updateNote, deleteNote } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const folders = Array.from(new Set(notes.map(note => note.folder)));

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = selectedFolder === 'all' || note.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hu-HU', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteDialogOpen(true);
  };

  const handleNewNote = () => {
    setEditingNote(null);
    setNoteDialogOpen(true);
  };

  const handleToggleLock = async (note: Note) => {
    await updateNote(note.id, { isLocked: !note.isLocked });
    toast.success(note.isLocked ? 'Jegyzet feloldva!' : 'Jegyzet zárolva!');
  };

  const handleDeleteNote = async () => {
    if (noteToDelete) {
      await deleteNote(noteToDelete);
      toast.success('Jegyzet törölve.');
      setDeleteConfirmOpen(false);
      setNoteToDelete(null);
    }
  };

  const handleNewFolder = () => {
    if (newFolderName.trim()) {
      setSelectedFolder(newFolderName.trim());
      setNewFolderMode(false);
      setNewFolderName('');
      // The folder will appear once a note is created in it
      toast.success(`"${newFolderName.trim()}" mappa kiválasztva. Hozz létre benne egy jegyzetet!`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary">Jegyzetek</h1>
          <p className="text-text-secondary">Rögzítsd gondolataidat és ötleteidet</p>
        </div>
        <div className="flex gap-2">
          {newFolderMode ? (
            <div className="flex gap-2">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleNewFolder(); if (e.key === 'Escape') setNewFolderMode(false); }}
                placeholder="Mappa neve..."
                className="w-40 bg-surface-1/50 border-white/10"
                autoFocus
              />
              <Button size="sm" onClick={handleNewFolder} className="bg-primary text-surface-0">OK</Button>
              <Button size="sm" variant="ghost" onClick={() => setNewFolderMode(false)}>Mégse</Button>
            </div>
          ) : (
            <Button variant="outline" className="border-white/20" onClick={() => setNewFolderMode(true)}>
              <FolderPlus className="h-4 w-4 mr-2" />Új mappa
            </Button>
          )}
          <Button className="bg-primary hover:bg-primary/90 text-surface-0" onClick={handleNewNote}>
            <Plus className="h-4 w-4 mr-2" />Új jegyzet
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="glass p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input placeholder="Jegyzetek keresése..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-surface-1/50 border-white/10" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant={selectedFolder === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setSelectedFolder('all')}
              className={cn(selectedFolder === 'all' ? 'bg-primary text-surface-0' : 'border-white/20')}>
              Összes ({notes.length})
            </Button>
            {folders.map(folder => (
              <Button key={folder} variant={selectedFolder === folder ? 'default' : 'outline'} size="sm" onClick={() => setSelectedFolder(folder)}
                className={cn(selectedFolder === folder ? 'bg-primary text-surface-0' : 'border-white/20')}>
                <Folder className="h-3 w-3 mr-1" />{folder} ({notes.filter(n => n.folder === folder).length})
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Notes Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredNotes.map((note, index) => (
          <motion.div key={note.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <Card className="glass p-6 hover-lift cursor-pointer group h-fit" onClick={() => handleEditNote(note)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {note.isLocked && <Lock className="h-4 w-4 text-warning flex-shrink-0" />}
                  <h3 className="font-heading font-semibold text-text-primary truncate">{note.title}</h3>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-surface-1 border border-white/10">
                    <DropdownMenuItem className="text-text-primary hover:bg-white/5" onClick={(e) => { e.stopPropagation(); handleEditNote(note); }}>
                      <Edit3 className="h-4 w-4 mr-2" />Szerkesztés
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-text-primary hover:bg-white/5" onClick={(e) => { e.stopPropagation(); handleToggleLock(note); }}>
                      {note.isLocked ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                      {note.isLocked ? 'Feloldás' : 'Zárolás'}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-danger hover:bg-danger/10" onClick={(e) => { e.stopPropagation(); setNoteToDelete(note.id); setDeleteConfirmOpen(true); }}>
                      <Trash2 className="h-4 w-4 mr-2" />Törlés
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mb-4">
                <p className="text-text-secondary text-sm leading-relaxed">
                  {note.isLocked ? <span className="italic text-text-muted">Ez a jegyzet zárolva van</span> : truncateContent(note.content)}
                </p>
              </div>
              <div className="space-y-3">
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs border-white/20 text-text-muted">#{tag}</Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <div className="flex items-center gap-2"><Folder className="h-3 w-3" /><span>{note.folder}</span></div>
                  <div className="text-right"><div>Módosítva:</div><div>{formatDate(note.updatedAt)}</div></div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}

        {filteredNotes.length === 0 && searchQuery && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="col-span-full">
            <Card className="glass p-12 text-center">
              <Search className="h-16 w-16 text-text-disabled mx-auto mb-4" />
              <h3 className="text-lg font-heading font-semibold text-text-primary mb-2">Nincs találat</h3>
              <p className="text-text-muted">Próbálj másik keresési kifejezést</p>
            </Card>
          </motion.div>
        )}

        {notes.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="col-span-full">
            <Card className="glass p-12 text-center">
              <Plus className="h-16 w-16 text-text-disabled mx-auto mb-4" />
              <h3 className="text-lg font-heading font-semibold text-text-primary mb-2">Még nincsenek jegyzeteid</h3>
              <p className="text-text-muted mb-6">Hozd létre az első jegyzetedet ötletek és gondolatok rögzítéséhez</p>
              <Button className="bg-primary hover:bg-primary/90 text-surface-0" onClick={handleNewNote}>
                <Plus className="h-4 w-4 mr-2" />Első jegyzet létrehozása
              </Button>
            </Card>
          </motion.div>
        )}
      </div>

      {/* FAB for Mobile */}
      <div className="fixed bottom-20 right-4 md:hidden">
        <Button size="lg" className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-surface-0 shadow-lg glow-primary" onClick={handleNewNote}>
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      <NoteDialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen} note={editingNote} />
      <ConfirmDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen} title="Jegyzet törlése" description="Biztosan törölni szeretnéd ezt a jegyzetet?" confirmLabel="Törlés" onConfirm={handleDeleteNote} destructive />
    </div>
  );
}
