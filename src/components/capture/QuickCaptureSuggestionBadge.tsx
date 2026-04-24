import { Badge } from '@/components/ui/badge';
import { QUICK_CAPTURE_TARGET_LABELS } from '@/lib/capture/constants';
import type { QuickCaptureItem } from '@/lib/capture/types';

export default function QuickCaptureSuggestionBadge({ item }: { item: QuickCaptureItem }) {
  if (!item.suggestedTargetModule) return null;
  const listName =
    item.suggestedTargetModule === 'lists' && typeof item.extractedMetadata?.suggestedListName === 'string'
      ? item.extractedMetadata.suggestedListName
      : undefined;
  const relatedEntityName = typeof item.extractedMetadata?.matchedEntityName === 'string' ? item.extractedMetadata.matchedEntityName : undefined;
  return (
    <Badge variant="outline" className="border-primary/30 text-primary text-[11px]">
      Javaslat: {QUICK_CAPTURE_TARGET_LABELS[item.suggestedTargetModule]}
      {listName ? ` (${listName})` : ''}
      {!listName && relatedEntityName ? ` (${relatedEntityName})` : ''}
    </Badge>
  );
}
