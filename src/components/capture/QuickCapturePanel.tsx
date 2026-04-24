import type { QuickCaptureItem } from '@/lib/capture/types';
import QuickCaptureItemRow from './QuickCaptureItemRow';
import QuickCaptureEmptyState from './QuickCaptureEmptyState';

interface QuickCapturePanelProps {
  items: QuickCaptureItem[];
  onRoute: (id: string, target: QuickCaptureItem['suggestedTargetModule']) => void;
  onArchive: (id: string) => void;
  onDiscard: (id: string) => void;
}

export default function QuickCapturePanel({ items, onRoute, onArchive, onDiscard }: QuickCapturePanelProps) {
  if (items.length === 0) return <QuickCaptureEmptyState />;
  return (
    <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
      {items.map((item) => (
        <QuickCaptureItemRow key={item.id} item={item} onRoute={onRoute} onArchive={onArchive} onDiscard={onDiscard} />
      ))}
    </div>
  );
}
