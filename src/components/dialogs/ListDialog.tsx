import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    description: '',
    type: 'general' as TodoList['type'],
    icon: 'list',
    color: '#4DA3FF',
  });

  useEffect(() => {
    if (list) {
      setFormData({
        name: list.title || list.name,
        description: list.description || '',
        type: list.type || 'general',
        icon: list.icon || 'list',
        color: list.color,
      });
    } else {
      setFormData({ name: '', description: '', type: 'general', icon: 'list', color: '#4DA3FF' });
    }
  }, [list, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (list) {
        await updateList(list.id, {
          title: formData.name,
          name: formData.name,
          description: formData.description,
          type: formData.type,
          icon: formData.icon,
          color: formData.color,
        });
        toast.success('Lista frissítve!');
      } else {
        await addList({
          title: formData.name,
          name: formData.name,
          description: formData.description,
          type: formData.type,
          icon: formData.icon,
          color: formData.color,
          pinned: false,
          archived: false,
          targetGroupVisibility: ['all'],
          tags: [],
        });
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
            <Label>Leírás</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
              placeholder="Rövid leírás (opcionális)"
              className="bg-surface-0/50 border-white/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Típus</Label>
              <Select value={formData.type || 'general'} onValueChange={(value) => setFormData((f) => ({ ...f, type: value as TodoList['type'] }))}>
                <SelectTrigger className="bg-surface-0/50 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-1 border-white/10">
                  <SelectItem value="general">Általános</SelectItem>
                  <SelectItem value="todo">Teendők</SelectItem>
                  <SelectItem value="shopping">Bevásárlás</SelectItem>
                  <SelectItem value="project">Projekt</SelectItem>
                  <SelectItem value="ideas">Ötletek</SelectItem>
                  <SelectItem value="routine">Rutin</SelectItem>
                  <SelectItem value="self-development">Önfejlesztés</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ikon kulcs</Label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData((f) => ({ ...f, icon: e.target.value }))}
                placeholder="pl. list"
                className="bg-surface-0/50 border-white/10"
              />
            </div>
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
