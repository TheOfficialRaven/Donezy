import QuickCaptureDialog from '@/components/capture/QuickCaptureDialog';

interface QuickAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuickAddDialog({ open, onOpenChange }: QuickAddDialogProps) {
  return <QuickCaptureDialog open={open} onOpenChange={onOpenChange} />;
}
