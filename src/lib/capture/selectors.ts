import type { QuickCaptureItem, QuickCaptureProductivityMetrics, QuickCaptureStatus } from './types';

function safeArray(items: QuickCaptureItem[] | undefined) {
  return Array.isArray(items) ? items : [];
}

export function getAllCaptureItems(items: QuickCaptureItem[] | undefined) {
  return safeArray(items).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getUnprocessedCaptureItems(items: QuickCaptureItem[] | undefined) {
  return getAllCaptureItems(items).filter((item) => item.status === 'unprocessed');
}

export function getRecentlyCapturedItems(items: QuickCaptureItem[] | undefined, limit = 8) {
  return getAllCaptureItems(items).slice(0, limit);
}

export function getCaptureItemsByStatus(items: QuickCaptureItem[] | undefined, status: QuickCaptureStatus | 'all') {
  if (status === 'all') return getAllCaptureItems(items);
  return getAllCaptureItems(items).filter((item) => item.status === status);
}

export function getCaptureSuggestions(items: QuickCaptureItem[] | undefined) {
  return getAllCaptureItems(items).filter((item) => item.status === 'unprocessed' && item.suggestedTargetModule);
}

export function getCaptureMentalInboxItems(items: QuickCaptureItem[] | undefined) {
  return getAllCaptureItems(items).filter((item) => item.status === 'unprocessed' || item.status === 'routed');
}

export function getCaptureItemsNeedingReview(items: QuickCaptureItem[] | undefined) {
  const now = Date.now();
  return getAllCaptureItems(items).filter((item) => {
    if (item.status !== 'unprocessed') return false;
    const ageHours = (now - new Date(item.createdAt).getTime()) / (1000 * 60 * 60);
    return ageHours >= 24;
  });
}

export function getCaptureProductivityMetrics(items: QuickCaptureItem[] | undefined): QuickCaptureProductivityMetrics {
  const all = getAllCaptureItems(items);
  const unprocessed = all.filter((item) => item.status === 'unprocessed').length;
  const routed = all.filter((item) => item.status === 'routed').length;
  const archived = all.filter((item) => item.status === 'archived').length;
  const discarded = all.filter((item) => item.status === 'discarded').length;
  return {
    total: all.length,
    unprocessed,
    routed,
    archived,
    discarded,
    needingReview: getCaptureItemsNeedingReview(all).length,
  };
}
