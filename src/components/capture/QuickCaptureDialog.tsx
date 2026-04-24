import { useMemo } from 'react';
import { Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAppStore } from '@/stores/useAppStore';
import { getCaptureItemsByStatus, getCaptureProductivityMetrics } from '@/lib/capture/selectors';
import QuickCaptureBar from './QuickCaptureBar';
import QuickCapturePanel from './QuickCapturePanel';
import { getGuidancePreferenceProfile, getNotesPreferenceProfile } from '@/lib/preferences/selectors';

interface QuickCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuickCaptureDialog({ open, onOpenChange }: QuickCaptureDialogProps) {
  const {
    quickCaptureItems,
    quickCaptureStatusFilter,
    addQuickCaptureItem,
    archiveQuickCaptureItem,
    discardQuickCaptureItem,
    suggestQuickCaptureRouting,
    confirmQuickCaptureRouting,
    userPreferences,
  } = useAppStore();
  const guidanceProfile = useMemo(() => getGuidancePreferenceProfile(userPreferences), [userPreferences]);
  const notesProfile = useMemo(() => getNotesPreferenceProfile(userPreferences), [userPreferences]);

  const visibleItems = useMemo(
    () =>
      getCaptureItemsByStatus(quickCaptureItems, quickCaptureStatusFilter)
        .filter((item) => item.status === 'unprocessed' || item.status === 'routed')
        .slice(0, 20),
    [quickCaptureItems, quickCaptureStatusFilter]
  );
  const metrics = useMemo(() => getCaptureProductivityMetrics(quickCaptureItems), [quickCaptureItems]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-1 border border-white/10 text-text-primary max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl flex items-center gap-2">
            <Inbox className="h-5 w-5 text-primary" />
            Quick Add / Global Capture
          </DialogTitle>
          <DialogDescription className="text-text-secondary">
            {guidanceProfile.preferredTone === 'direct'
              ? 'Rovid input, gyors mentes. A rendszer azonnal javasol celmodult.'
              : notesProfile.notesInboxBehavior === 'structured'
                ? 'Dobj be gyorsan bármit, a rendszer strukturaltan javasol celmodult es kapcsolodo helyet.'
                : 'Dobj be gyorsan bármit, hogy ne kelljen fejben tartani. Később rendezed.'}
          </DialogDescription>
        </DialogHeader>

        <QuickCaptureBar
          onSuggest={suggestQuickCaptureRouting}
          onSubmit={async (rawInput) => {
            await addQuickCaptureItem({ rawInput, sourceType: 'quick-add-dialog', sourceContext: 'header' });
            toast.success('Elmentve a mentális inboxba.');
          }}
        />

        <div className="text-xs text-text-muted">
          Feldolgozatlan: {metrics.unprocessed} • Rendezve: {metrics.routed} • Reviewt kér: {metrics.needingReview}
        </div>

        <QuickCapturePanel
          items={visibleItems}
          onRoute={(id, target) => void confirmQuickCaptureRouting(id, target || 'inbox')}
          onArchive={(id) => void archiveQuickCaptureItem(id)}
          onDiscard={(id) => void discardQuickCaptureItem(id)}
        />
      </DialogContent>
    </Dialog>
  );
}
