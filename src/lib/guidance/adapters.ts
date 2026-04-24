import type { DashboardBlock } from '@/lib/dashboard/types';
import type { GuidanceItem, GuidanceItemKind } from './types';

function parseEstimatedMinutes(payload: unknown): number | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const src = payload as Record<string, unknown>;
  const candidates = [
    src.estimatedMinutes,
    (src.item as Record<string, unknown> | undefined)?.estimatedMinutes,
    (src.mission as Record<string, unknown> | undefined)?.estimatedMinutes,
    (src.event as Record<string, unknown> | undefined)?.plannedMinutes,
  ];
  for (const value of candidates) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return undefined;
}

export function dashboardBlockToGuidanceItem(
  block: DashboardBlock,
  kind: GuidanceItemKind,
  reason: string
): GuidanceItem {
  return {
    id: `${kind}-${block.id}`,
    title: block.title,
    subtitle: block.subtitle,
    reason,
    sourceModule: block.sourceModule,
    sourceReference: block.id,
    kind,
    priorityScore: block.priorityScore || 0,
    estimatedMinutes: parseEstimatedMinutes(block.payload),
    actionTarget: block.actionTarget,
  };
}

export function fallbackGuidanceItem(dateKey: string): GuidanceItem {
  return {
    id: `fallback-${dateKey}`,
    title: 'Valassz egy rovid, vallalhato lepest',
    subtitle: 'Egy 10-20 perces feladat eleg a napi lendulethez.',
    reason: 'Nincs eleg strukturalt adat, indulj egy egyszeru lepessel.',
    sourceModule: 'dashboard',
    kind: 'focus',
    priorityScore: 1,
    estimatedMinutes: 15,
    actionTarget: '/app/lists',
  };
}
