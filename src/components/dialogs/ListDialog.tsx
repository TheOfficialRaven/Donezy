import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore, type TodoList } from '@/stores/useAppStore';
import { toast } from 'sonner';

interface ListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  list?: TodoList | null;
}

const colorOptions = [
  '#4DA3FF', '#11E1B1', '#FFC056', '#F87171',
  '#A78BFA', '#34D399', '#FB923C', '#818CF8',
];

export default function ListDialog({ open, onOpenChange, list }: ListDialogProps) {
  const { addList, updateList } = useAppStore();

  const [formData, setFormData] = useState({
    name: '',
    color: '#4DA3FF',
  });

  useEffect(() => {
    if (list) {
      setFormData({ name: list.name, color: list.color });
    } else {
      setFormData({ name: '', color: '#4DA3FF' });
    }
  }, [list, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (list) {
        await updateList(list.id, { name: formData.name, color: formData.color });
        toast.success('Lista frissítve!');
      } else {
        await addList({ name: formData.name, color: formData.color });
        toast.success('Új lista létrehozva!');
      }
      onOpenChange(false);
    } catch {
      toast.error('Hiba történt.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-1 border border-white/10 text-text-primary max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {list ? 'Lista szerkesztése' : 'Új lista'}
          </DialogTitle>
          <DialogDescription className="text-text-secondary">
            {list ? 'Módosítsd a lista nevét és színét.' : 'Hozz létre egy új listát a feladataid szervezéséhez.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Lista neve</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
              placeholder="pl. Munka feladatok"
              className="bg-surface-0/50 border-white/10"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Szín</Label>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData((f) => ({ ...f, color }))}
                  className="w-8 h-8 rounded-full transition-all"
                  style={{
                    backgroundColor: color,
                    outline: formData.color === color ? '2px solid white' : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Mégse
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-surface-0">
              {list ? 'Mentés' : 'Létrehozás'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
