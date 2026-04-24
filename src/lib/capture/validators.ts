import { QUICK_CAPTURE_STATUSES, QUICK_CAPTURE_SUGGESTED_TYPES, QUICK_CAPTURE_TARGET_MODULES } from './constants';
import type { QuickCaptureItem } from './types';

export function validateQuickCaptureItem(item: Partial<QuickCaptureItem>): string[] {
  const errors: string[] = [];
  if (!item.rawInput || !item.rawInput.trim()) errors.push('A gyors rögzítés szövege nem lehet üres.');
  if (item.status && !QUICK_CAPTURE_STATUSES.includes(item.status)) errors.push('Érvénytelen capture státusz.');
  if (item.suggestedType && !QUICK_CAPTURE_SUGGESTED_TYPES.includes(item.suggestedType)) errors.push('Érvénytelen javasolt típus.');
  if (item.suggestedTargetModule && !QUICK_CAPTURE_TARGET_MODULES.includes(item.suggestedTargetModule)) errors.push('Érvénytelen javasolt célmodul.');
  if (item.confirmedTargetModule && !QUICK_CAPTURE_TARGET_MODULES.includes(item.confirmedTargetModule)) errors.push('Érvénytelen megerősített célmodul.');
  return errors;
}
