import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  HABITS_VIEW_FILTER_LABELS,
  HABITS_TRACKING_FILTER_LABELS,
  HABITS_STATUS_FILTER_LABELS,
  HABIT_TIME_RANGE_LABELS,
  HABIT_TIME_RANGE_FILTERS,
} from '@/lib/habits/constants';
import type {
  HabitTimeRangeFilter,
  HabitsStatusFilter,
  HabitsViewFilter,
  HabitTrackingModeFilter,
} from '@/lib/habits/types';

export default function HabitsToolbar({
  view,
  onView,
  query,
  onQuery,
  status,
  onStatus,
  tracking,
  onTracking,
  range,
  onRange,
  category,
  categories,
  onCategory,
  onCreate,
  layoutMode,
  onLayoutMode,
  trendsMode,
}: {
  view: HabitsViewFilter;
  onView: (view: HabitsViewFilter) => void;
  query: string;
  onQuery: (query: string) => void;
  status: HabitsStatusFilter;
  onStatus: (status: HabitsStatusFilter) => void;
  tracking: HabitTrackingModeFilter;
  onTracking: (mode: HabitTrackingModeFilter) => void;
  range: HabitTimeRangeFilter;
  onRange: (range: HabitTimeRangeFilter) => void;
  category: string;
  categories: string[];
  onCategory: (category: string) => void;
  onCreate: () => void;
  layoutMode?: 'compact' | 'comfortable';
  onLayoutMode?: (mode: 'compact' | 'comfortable') => void;
  /** Csak trend nézet: kevesebb szűrő, több hely a grafikonoknak. */
  trendsMode?: boolean;
}) {
  return (
    <div className="space-y-3">
      <Tabs value={view} onValueChange={(v) => onView(v as HabitsViewFilter)}>
        <TabsList className="bg-surface-1/80 border border-white/10 flex flex-wrap h-auto gap-1 p-1">
          {(Object.keys(HABITS_VIEW_FILTER_LABELS) as HabitsViewFilter[]).map((key) => (
            <TabsTrigger key={key} value={key} className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-xs">
              {HABITS_VIEW_FILTER_LABELS[key]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
        {!trendsMode && (
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={query} onChange={(e) => onQuery(e.target.value)} className="pl-9 bg-surface-1/50 border-white/10" placeholder="Kereses cim, leiras, cimke alapjan..." />
          </div>
        )}
        {trendsMode && (
          <p className="text-sm text-text-muted flex-1">
            Időablak és összesítő trendek — a részletekhez válassz szokást a jobb oldali panelben.
          </p>
        )}
        <Button className="bg-primary text-surface-0 shrink-0" onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Uj szokas
        </Button>
      </div>

      <div className={`grid grid-cols-1 gap-3 ${trendsMode ? 'sm:grid-cols-2' : 'sm:grid-cols-5'}`}>
        {!trendsMode && (
          <>
            <Select value={status} onValueChange={(v) => onStatus(v as HabitsStatusFilter)}>
              <SelectTrigger className="bg-surface-1/50 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-surface-1 border-white/10">
                {(Object.keys(HABITS_STATUS_FILTER_LABELS) as HabitsStatusFilter[]).map((key) => (
                  <SelectItem key={key} value={key}>{HABITS_STATUS_FILTER_LABELS[key]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tracking} onValueChange={(v) => onTracking(v as HabitTrackingModeFilter)}>
              <SelectTrigger className="bg-surface-1/50 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-surface-1 border-white/10">
                {(Object.keys(HABITS_TRACKING_FILTER_LABELS) as HabitTrackingModeFilter[]).map((key) => (
                  <SelectItem key={key} value={key}>{HABITS_TRACKING_FILTER_LABELS[key]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={onCategory}>
              <SelectTrigger className="bg-surface-1/50 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-surface-1 border-white/10">
                <SelectItem value="all">Minden kategoria</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        <Select value={range} onValueChange={(v) => onRange(v as HabitTimeRangeFilter)}>
          <SelectTrigger className="bg-surface-1/50 border-white/10"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-surface-1 border-white/10">
            {HABIT_TIME_RANGE_FILTERS.map((r) => (
              <SelectItem key={r} value={r}>{HABIT_TIME_RANGE_LABELS[r]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!trendsMode && (
          <Select value={layoutMode || 'comfortable'} onValueChange={(v) => onLayoutMode?.(v as 'compact' | 'comfortable')}>
            <SelectTrigger className="bg-surface-1/50 border-white/10"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-surface-1 border-white/10">
              <SelectItem value="comfortable">Kényelmes nézet</SelectItem>
              <SelectItem value="compact">Tömör nézet</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
