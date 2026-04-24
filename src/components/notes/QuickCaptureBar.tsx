import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { NOTE_TYPE_LABELS, NOTE_TYPES } from '@/lib/notes/constants';
import type { NoteType } from '@/lib/notes/types';

export default function QuickCaptureBar({ onSave }: { onSave: (payload: { content: string; type: NoteType }) => Promise<void> | void }) {
  const [text, setText] = useState('');
  const [type, setType] = useState<NoteType>('dump');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const content = text.trim();
    if (!content) return;
    setBusy(true);
    try {
      await onSave({ content, type });
      setText('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="glass border-primary/20 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm text-text-primary font-medium">
        <Sparkles className="h-4 w-4 text-primary" />
        Gyors rögzítés — ürítsd ki a fejed
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Írj ide bármit… ötlet, mondat, teendő — mentés után rendezheted."
        className="bg-surface-0/40 border-white/10 min-h-[88px] resize-y text-sm"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            void submit();
          }
        }}
      />
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <Select value={type} onValueChange={(v) => setType(v as NoteType)}>
          <SelectTrigger className="w-full sm:w-[200px] bg-surface-1/50 border-white/10">
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
        <Button type="button" className="bg-primary text-surface-0 shrink-0" disabled={busy || !text.trim()} onClick={() => void submit()}>
          {busy ? 'Mentés…' : 'Mentés (Ctrl+Enter)'}
        </Button>
      </div>
    </Card>
  );
}
