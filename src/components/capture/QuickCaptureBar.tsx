import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QUICK_CAPTURE_TARGET_LABELS } from '@/lib/capture/constants';
import type { QuickCaptureSuggestion } from '@/lib/capture/types';

interface QuickCaptureBarProps {
  onSubmit: (rawInput: string) => Promise<void> | void;
  onSuggest: (rawInput: string) => QuickCaptureSuggestion;
}

export default function QuickCaptureBar({ onSubmit, onSuggest }: QuickCaptureBarProps) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const suggestion = value.trim() ? onSuggest(value) : undefined;

  const submit = async () => {
    const rawInput = value.trim();
    if (!rawInput) return;
    setBusy(true);
    try {
      await onSubmit(rawInput);
      setValue('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Írj be bármit gyorsan… később rendszerezzük."
          className="bg-surface-0/50 border-white/10"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void submit();
            }
          }}
        />
        <Button className="bg-primary hover:bg-primary/90 text-surface-0" disabled={!value.trim() || busy} onClick={() => void submit()}>
          {busy ? 'Mentés…' : 'Mentés'}
        </Button>
      </div>
      {suggestion?.suggestedTargetModule && (
        <p className="text-xs text-text-muted">
          Javasolt cél:{' '}
          <span className="text-text-primary">{QUICK_CAPTURE_TARGET_LABELS[suggestion.suggestedTargetModule]}</span>
          {typeof suggestion.extractedMetadata?.suggestedListName === 'string'
            ? ` (${suggestion.extractedMetadata.suggestedListName})`
            : typeof suggestion.extractedMetadata?.matchedEntityName === 'string'
              ? ` (${suggestion.extractedMetadata.matchedEntityName})`
              : ''}
          {' '}({Math.round(suggestion.confidence * 100)}%)
        </p>
      )}
    </div>
  );
}
