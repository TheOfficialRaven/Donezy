import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getSelectableDayModes } from '@/lib/dayModes/selectors';
import type { DayModeKey, DayModeSuggestion } from '@/lib/dayModes/types';
import { cn } from '@/lib/utils';

interface DayModeSwitcherProps {
  currentMode: DayModeKey;
  onChange: (mode: DayModeKey) => void;
  summary: string;
  suggestion?: DayModeSuggestion;
  onAcceptSuggestion?: () => void;
  onDismissSuggestion?: () => void;
}

export function DayModeSwitcher({
  currentMode,
  onChange,
  summary,
  suggestion,
  onAcceptSuggestion,
  onDismissSuggestion,
}: DayModeSwitcherProps) {
  const modes = getSelectableDayModes();
  return (
    <Card className="glass p-3 border-white/10">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-medium text-text-primary">Mai mod</p>
          <p className="text-xs text-text-muted">{summary}</p>
        </div>
        <Badge className="bg-primary/20 text-primary border-primary/30">{modes.find((m) => m.key === currentMode)?.label || 'Normal'}</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {modes.map((mode) => (
          <Button
            key={mode.key}
            size="sm"
            variant={mode.key === currentMode ? 'default' : 'outline'}
            className={cn(mode.key === currentMode ? 'bg-primary text-surface-0 hover:bg-primary/90' : 'border-white/20')}
            onClick={() => onChange(mode.key)}
          >
            {mode.label}
          </Button>
        ))}
      </div>
      {suggestion && (
        <div className="mt-3 border-t border-white/10 pt-3 space-y-2">
          <p className="text-xs text-text-secondary">
            Javasolt mai mod: <span className="font-medium text-text-primary">{modes.find((m) => m.key === suggestion.suggestedMode)?.label || suggestion.suggestedMode}</span>
            {' '}({suggestion.confidence})
          </p>
          {suggestion.reasons[0] && <p className="text-xs text-text-muted">{suggestion.reasons[0]}</p>}
          <div className="flex gap-2">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-surface-0" onClick={onAcceptSuggestion}>
              Alkalmazas
            </Button>
            <Button size="sm" variant="outline" className="border-white/20" onClick={onDismissSuggestion}>
              Most nem
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
