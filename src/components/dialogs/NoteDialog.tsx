import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAppStore, type Note } from '@/stores/useAppStore';
import { toast } from 'sonner';

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: Note | null;
}

export default function NoteDialog({ open, onOpenChange, note }: NoteDialogProps) {
  const { addNote, updateNote } = useAppStore();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    folder: 'Általános',
    tags: '',
  });

  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title,
        content: note.content,
        folder: note.folder,
        tags: note.tags.join(', '),
      });
    } else {
      setFormData({ title: '', content: '', folder: 'Általános', tags: '' });
    }
  }, [note, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const tags = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (note) {
        await updateNote(note.id, {
          title: formData.title,
          content: formData.content,
          folder: formData.folder,
          tags,
        });
        toast.success('Jegyzet frissítve!');
      } else {
        await addNote({
          title: formData.title,
          content: formData.content,
          folder: formData.folder,
          tags,
          isLocked: false,
        });
        toast.success('Új jegyzet létrehozva!');
      }
      onOpenChange(false);
    } catch {
      toast.error('Hiba történt.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-1 border border-white/10 text-text-primary max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {note ? 'Jegyzet szerkesztése' : 'Új jegyzet'}
          </DialogTitle>
          <DialogDescription className="text-text-secondary">
            {note ? 'Módosítsd a jegyzet tartalmát.' : 'Rögzítsd gondolataidat és ötleteidet.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Cím</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
              placeholder="Jegyzet címe..."
              className="bg-surface-0/50 border-white/10"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Tartalom</Label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData((f) => ({ ...f, content: e.target.value }))}
              placeholder="Írd le a gondolataidat..."
              className="bg-surface-0/50 border-white/10 resize-none"
              rows={8}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mappa</Label>
              <Input
                value={formData.folder}
                onChange={(e) => setFormData((f) => ({ ...f, folder: e.target.value }))}
                placeholder="Mappa neve..."
                className="bg-surface-0/50 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label>Címkék (vesszővel)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData((f) => ({ ...f, tags: e.target.value }))}
                placeholder="pl. fontos, ötlet"
                className="bg-surface-0/50 border-white/10"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Mégse
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-surface-0">
              {note ? 'Mentés' : 'Létrehozás'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
