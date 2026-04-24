import { QUICK_CAPTURE_SCHEMA_VERSION } from './constants';
import { applyCaptureSuggestion } from './routing';
import type { QuickCaptureItem, QuickCaptureItemRaw } from './types';

export function normalizeQuickCaptureItem(raw: QuickCaptureItemRaw, userId?: string): QuickCaptureItem {
  const now = new Date().toISOString();
  const normalizedBase: QuickCaptureItem = {
    id: raw.id,
    userId: raw.userId || userId,
    rawInput: String(raw.rawInput || '').trim(),
    normalizedText: raw.normalizedText || String(raw.rawInput || '').trim().toLowerCase(),
    suggestedType: raw.suggestedType,
    suggestedTargetModule: raw.suggestedTargetModule,
    confirmedTargetModule: raw.confirmedTargetModule,
    status: raw.status || 'unprocessed',
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
    sourceType: raw.sourceType || 'manual',
    sourceContext: raw.sourceContext,
    extractedMetadata: raw.extractedMetadata || {},
    futureOriginReference: raw.futureOriginReference,
    futureLinkTargets: raw.futureLinkTargets || { dashboardInboxCandidate: true },
    schemaVersion: raw.schemaVersion || QUICK_CAPTURE_SCHEMA_VERSION,
  };

  if (!normalizedBase.suggestedType || !normalizedBase.suggestedTargetModule) {
    return applyCaptureSuggestion(normalizedBase);
  }
  return normalizedBase;
}
