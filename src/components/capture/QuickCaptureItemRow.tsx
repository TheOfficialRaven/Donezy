import { Archive, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QUICK_CAPTURE_STATUS_LABELS, QUICK_CAPTURE_TARGET_LABELS } from '@/lib/capture/constants';
import type { QuickCaptureItem } from '@/lib/capture/types';
import QuickCaptureSuggestionBadge from './QuickCaptureSuggestionBadge';

interface QuickCaptureItemRowProps {
  item: QuickCaptureItem;
  onRoute: (id: string, target: QuickCaptureItem['suggestedTargetModule']) => void;
  onArchive: (id: string) => void;
  onDiscard: (id: string) => void;
}

export default function QuickCaptureItemRow({ item, onRoute, onArchive, onDiscard }: QuickCaptureItemRowProps) {
  const routeTarget = item.suggestedTargetModule || 'inbox';
  return (
    <div className="rounded-lg border border-white/10 bg-surface-0/30 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-text-primary">{item.rawInput}</p>
        <span className="text-[11px] text-text-muted whitespace-nowrap">{QUICK_CAPTURE_STATUS_LABELS[item.status]}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <QuickCaptureSuggestionBadge item={item} />
        <div className="flex items-center gap-1">
          {item.status === 'unprocessed' && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 border-white/15 text-[11px]"
              onClick={() => onRoute(item.id, item.suggestedTargetModule)}
              title="Rendezés"
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Rendezés
              <span className="ml-1 text-text-muted">→ {QUICK_CAPTURE_TARGET_LABELS[routeTarget]}</span>
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onArchive(item.id)} title="Archiválás">
            <Archive className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-danger hover:text-danger" onClick={() => onDiscard(item.id)} title="Elvetés">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
