import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, FileText, Calendar } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { toast } from 'sonner';

interface QuickAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuickAddDialog({ open, onOpenChange }: QuickAddDialogProps) {
  const { addQuest, addNote, addEvent } = useAppStore();
  const [title, setTitle] = useState('');

  const handleAddQuest = async () => {
    if (!title.trim()) return;
    await addQuest({
      title,
      description: '',
      category: 'Személyes',
      difficulty: 'medium',
      estimatedTime: 30,
      xpReward: 100,
      essenceReward: 20,
      completed: false,
      dueDate: new Date().toISOString().split('T')[0],
      tags: [],
    });
    toast.success('Küldetés hozzáadva!');
    setTitle('');
    onOpenChange(false);
  };

  const handleAddNote = async () => {
    if (!title.trim()) return;
    await addNote({
      title,
      content: '',
      folder: 'Általános',
      tags: [],
      isLocked: false,
    });
    toast.success('Jegyzet hozzáadva!');
    setTitle('');
    onOpenChange(false);
  };

  const handleAddEvent = async () => {
    if (!title.trim()) return;
    const start = new Date();
    start.setHours(start.getHours() + 1, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    await addEvent({
      title,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      category: 'Személyes',
      color: '#4DA3FF',
      reminder: 15,
    });
    toast.success('Esemény hozzáadva!');
    setTitle('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-1 border border-white/10 text-text-primary max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Gyors hozzáadás</DialogTitle>
          <DialogDescription className="text-text-secondary">
            Gyorsan adj hozzá küldetést, jegyzetet vagy eseményt.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="quest" className="space-y-4">
          <TabsList className="bg-surface-0/50 border border-white/10 w-full">
            <TabsTrigger value="quest" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-surface-0">
              <Zap className="h-4 w-4 mr-1" />
              Küldetés
            </TabsTrigger>
            <TabsTrigger value="note" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-surface-0">
              <FileText className="h-4 w-4 mr-1" />
              Jegyzet
            </TabsTrigger>
            <TabsTrigger value="event" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-surface-0">
              <Calendar className="h-4 w-4 mr-1" />
              Esemény
            </TabsTrigger>
          </TabsList>

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Cím..."
            className="bg-surface-0/50 border-white/10"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const tab = document.querySelector('[data-state="active"][role="tab"]')?.getAttribute('data-value');
                if (tab === 'quest') handleAddQuest();
                else if (tab === 'note') handleAddNote();
                else handleAddEvent();
              }
            }}
          />

          <TabsContent value="quest">
            <Button onClick={handleAddQuest} disabled={!title.trim()} className="w-full bg-primary hover:bg-primary/90 text-surface-0">
              <Zap className="h-4 w-4 mr-2" />
              Küldetés hozzáadása
            </Button>
          </TabsContent>

          <TabsContent value="note">
            <Button onClick={handleAddNote} disabled={!title.trim()} className="w-full bg-primary hover:bg-primary/90 text-surface-0">
              <FileText className="h-4 w-4 mr-2" />
              Jegyzet hozzáadása
            </Button>
          </TabsContent>

          <TabsContent value="event">
            <Button onClick={handleAddEvent} disabled={!title.trim()} className="w-full bg-primary hover:bg-primary/90 text-surface-0">
              <Calendar className="h-4 w-4 mr-2" />
              Esemény hozzáadása
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
