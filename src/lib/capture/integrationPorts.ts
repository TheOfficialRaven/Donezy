import type { QuickCaptureItem, QuickCaptureTargetModule } from './types';

export interface QuickCaptureRoutingCandidate {
  captureId: string;
  targetModule: QuickCaptureTargetModule;
  title?: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface QuickCaptureDashboardStub {
  unprocessedCount: number;
  needingReviewCount: number;
  lastCapturedAt?: string;
}

export function toQuickCaptureRoutingCandidate(item: QuickCaptureItem): QuickCaptureRoutingCandidate {
  return {
    captureId: item.id,
    targetModule: item.confirmedTargetModule || item.suggestedTargetModule || 'inbox',
    content: item.rawInput,
    metadata: item.extractedMetadata || {},
  };
}
