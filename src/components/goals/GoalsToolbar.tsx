import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  GOALS_VIEW_FILTER_LABELS,
  GOAL_TYPE_LABELS,
  GOAL_STATUS_LABELS,
  GOAL_PRIORITY_LABELS,
  GOAL_TYPES,
  GOAL_STATUSES,
  GOAL_PRIORITIES,
} from '@/lib/goals/constants';
import type { GoalsViewFilter } from '@/lib/goals/types';
import type { GoalsPriorityFilter, GoalsStatusFilter, GoalsTypeFilter } from '@/lib/goals/selectors';

interface GoalsToolbarProps {
  view: GoalsViewFilter;
  onViewChange: (view: GoalsViewFilter) => void;
  search: string;
  onSearchChange: (q: string) => void;
  typeFilter: GoalsTypeFilter;
  onTypeFilter: (f: GoalsTypeFilter) => void;
  statusFilter: GoalsStatusFilter;
  onStatusFilter: (f: GoalsStatusFilter) => void;
  priorityFilter: GoalsPriorityFilter;
  onPriorityFilter: (f: GoalsPriorityFilter) => void;
  onCreate: () => void;
}

export default function GoalsToolbar({
  view,
  onViewChange,
  search,
  onSearchChange,
  typeFilter,
  onTypeFilter,
  statusFilter,
  onStatusFilter,
  priorityFilter,
  onPriorityFilter,
  onCreate,
}: GoalsToolbarProps) {
  return (
    <div className="space-y-4">
      <Tabs value={view} onValueChange={(v) => onViewChange(v as GoalsViewFilter)}>
        <TabsList className="bg-surface-1/80 border border-white/10 flex flex-wrap h-auto gap-1 p-1">
          {(Object.keys(GOALS_VIEW_FILTER_LABELS) as GoalsViewFilter[]).map((key) => (
            <TabsTrigger
              key={key}
              value={key}
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-xs sm:text-sm"
            >
              {GOALS_VIEW_FILTER_LABELS[key]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Keresés cím, leírás, kategória szerint..."
            className="pl-9 bg-surface-1/50 border-white/10"
          />
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-surface-0 shrink-0" onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Új cél
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Select value={typeFilter} onValueChange={(v) => onTypeFilter(v as GoalsTypeFilter)}>
          <SelectTrigger className="bg-surface-1/50 border-white/10">
            <SelectValue placeholder="Típus" />
          </SelectTrigger>
          <SelectContent className="bg-surface-1 border-white/10">
            <SelectItem value="all">Minden típus</SelectItem>
            {GOAL_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {GOAL_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => onStatusFilter(v as GoalsStatusFilter)}>
          <SelectTrigger className="bg-surface-1/50 border-white/10">
            <SelectValue placeholder="Státusz" />
          </SelectTrigger>
          <SelectContent className="bg-surface-1 border-white/10">
            <SelectItem value="all">Minden státusz</SelectItem>
            {GOAL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {GOAL_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => onPriorityFilter(v as GoalsPriorityFilter)}>
          <SelectTrigger className="bg-surface-1/50 border-white/10">
            <SelectValue placeholder="Prioritás" />
          </SelectTrigger>
          <SelectContent className="bg-surface-1 border-white/10">
            <SelectItem value="all">Minden prioritás</SelectItem>
            {GOAL_PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {GOAL_PRIORITY_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
