import { useEffect, useMemo, useState } from 'react';
import { Activity, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/useAppStore';
import {
  getActivityDensitySeries,
  getHabitCandidates,
  getHabitCompletionTrend,
  getPromotableHabitCandidates,
  getMergedHabitRepresentations,
  getHabitOverviewMetrics,
  getPrimaryHabitInsights,
  getHabitNarrativeSummary,
  filterHabitsForView,
} from '@/lib/habits/selectors';
import type { Habit, HabitTimeRangeFilter, HabitsStatusFilter, HabitTrackingModeFilter, UserFacingHabit } from '@/lib/habits/types';
import HabitDetailPanel from '@/components/habits/HabitDetailPanel';
import HabitDialog from '@/components/habits/HabitDialog';
import { HabitActivityChart, HabitTrendChart } from '@/components/habits/HabitCharts';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getHabitPreferenceProfile, getGuidancePreferenceProfile, getDashboardPreferenceProfile } from '@/lib/preferences/selectors';

export default function HabitTracker() {
  const {
    habits,
    habitCompletions,
    habitActivitySignals,
    habitCandidates,
    habitsSearchQuery,
    habitsCategoryFilter,
    habitsStatusFilter,
    habitsTrackingModeFilter,
    habitsTimeRangeFilter,
    userPreferences,
    selectedHabitId,
    setHabitsSearchQuery,
    setHabitsCategoryFilter,
    setHabitsStatusFilter,
    setHabitsTrackingModeFilter,
    setHabitsTimeRangeFilter,
    setSelectedHabitId,
    addHabit,
    updateHabit,
    archiveHabit,
    toggleHabitCompletionForDate,
    promoteHabitCandidate,
  } = useAppStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [focusFilter, setFocusFilter] = useState<'all' | 'stable' | 'needs-attention' | 'emerging'>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const safeHabits = useMemo(() => habits || [], [habits]);
  const safeCompletions = useMemo(() => habitCompletions || [], [habitCompletions]);
  const safeActivitySignals = useMemo(() => habitActivitySignals || [], [habitActivitySignals]);
  const safeStoredCandidates = useMemo(() => habitCandidates || [], [habitCandidates]);

  const computedCandidates = useMemo(() => {
    const fromSignals = getHabitCandidates(safeActivitySignals);
    if (fromSignals.length > 0) return fromSignals;
    return safeStoredCandidates;
  }, [safeActivitySignals, safeStoredCandidates]);

  const filteredHabits = useMemo(
    () =>
      filterHabitsForView(safeHabits, 'active', {
        search: habitsSearchQuery,
        categoryFilter: habitsCategoryFilter,
        statusFilter: habitsStatusFilter,
        trackingModeFilter: habitsTrackingModeFilter,
        completions: safeCompletions,
      }),
    [
      safeHabits,
      habitsSearchQuery,
      habitsCategoryFilter,
      habitsStatusFilter,
      habitsTrackingModeFilter,
      safeCompletions,
    ]
  );

  const categories = useMemo(() => [...new Set(safeHabits.map((h) => h.category).filter(Boolean))].sort(), [safeHabits]);

  const promotable = useMemo(() => getPromotableHabitCandidates(computedCandidates), [computedCandidates]);
  const mergedHabits = useMemo(() => getMergedHabitRepresentations(filteredHabits, safeCompletions), [filteredHabits, safeCompletions]);
  const overviewMetrics = useMemo(() => getHabitOverviewMetrics(mergedHabits), [mergedHabits]);
  const insightGroups = useMemo(() => getPrimaryHabitInsights(mergedHabits), [mergedHabits]);
  const habitPreferenceProfile = useMemo(() => getHabitPreferenceProfile(userPreferences), [userPreferences]);
  const guidanceProfile = useMemo(() => getGuidancePreferenceProfile(userPreferences), [userPreferences]);
  const dashboardPreference = useMemo(() => getDashboardPreferenceProfile(userPreferences), [userPreferences]);
  const insightLimit = dashboardPreference.dashboardDensity === 'minimal' ? 2 : dashboardPreference.dashboardDensity === 'detailed' ? 4 : 3;
  const groupedSummary = useMemo(() => getHabitNarrativeSummary(mergedHabits), [mergedHabits]);
  const visibleMergedHabits = useMemo(() => {
    if (focusFilter === 'stable') return insightGroups.stable;
    if (focusFilter === 'needs-attention') return insightGroups.needsAttention;
    if (focusFilter === 'emerging') return [...insightGroups.emerging, ...insightGroups.strengthening].slice(0, 6);
    return mergedHabits.slice(0, 8);
  }, [focusFilter, insightGroups, mergedHabits]);

  const globalCompletionSeries = useMemo(() => {
    const syntheticHabit: Habit = {
      id: 'all',
      title: 'All',
      description: '',
      category: '',
      trackingMode: 'auto',
      frequencyType: 'daily',
      frequencyTarget: 1,
      preferredDays: [],
      color: '#8B5CF6',
      icon: 'repeat',
      active: true,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
      sourceType: 'system',
      futureLinkTargets: {},
      schemaVersion: 2,
    };
    return getHabitCompletionTrend(syntheticHabit, safeCompletions, habitsTimeRangeFilter);
  }, [safeCompletions, habitsTimeRangeFilter]);
  const activitySeries = useMemo(
    () => getActivityDensitySeries(safeActivitySignals, habitsTimeRangeFilter),
    [safeActivitySignals, habitsTimeRangeFilter]
  );
  const selectedHabit = useMemo(() => {
    if (selectedHabitId) return safeHabits.find((h) => h.id === selectedHabitId) ?? null;
    const firstVisible = visibleMergedHabits[0]?.sourceHabitIds[0];
    if (!firstVisible) return null;
    return safeHabits.find((h) => h.id === firstVisible) ?? null;
  }, [selectedHabitId, safeHabits, visibleMergedHabits]);

  useEffect(() => {
    setShowAdvancedFilters(Boolean(userPreferences.showAdvancedFilters));
  }, [userPreferences.showAdvancedFilters]);

  const openCreate = () => {
    setEditingHabit(null);
    setDialogOpen(true);
  };

  const openEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setDialogOpen(true);
  };

  const saveHabit = async (payload: Partial<Habit> & Pick<Habit, 'title'>) => {
    if (editingHabit) {
      await updateHabit(editingHabit.id, payload);
      toast.success('Szokas frissitve.');
    } else {
      await addHabit(payload);
      toast.success('Szokas letrehozva.');
    }
    setEditingHabit(null);
  };

  return (
    <div className="space-y-5">
      <Card className="glass border-white/5 p-5 md:p-6">
        <h1 className="text-3xl font-heading font-bold text-text-primary flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary" />
          Szokas Tracker
        </h1>
        <p className="text-text-secondary mt-2 max-w-3xl text-sm leading-relaxed">
          {guidanceProfile.preferredTone === 'direct'
            ? 'Itt latod, mely rutinok stabilak, melyek erosodnek, es melyek kernek azonnali figyelmet.'
            : 'Itt azt latod, milyen visszatero mintak alakulnak a napi mukodesedben. Nem az egyszeri aktivitast emeljuk ki, hanem a rutinna ero viselkedest: mi stabil, mi erosodik, es mi ker most figyelmet.'}
        </p>
      </Card>

      <Card className="glass p-4 border-white/5 space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            value={habitsSearchQuery}
            onChange={(e) => setHabitsSearchQuery(e.target.value)}
            className="md:max-w-sm bg-surface-1/50 border-white/10"
            placeholder="Kereses rutin nev vagy leiras alapjan..."
          />
          <Select value={focusFilter} onValueChange={(value) => setFocusFilter(value as typeof focusFilter)}>
            <SelectTrigger className="md:w-56 bg-surface-1/50 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-surface-1 border-white/10">
              <SelectItem value="all">Minden minta</SelectItem>
              <SelectItem value="stable">Stabil rutinok</SelectItem>
              <SelectItem value="needs-attention">Figyelmet ker</SelectItem>
              <SelectItem value="emerging">Uj / erosodo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={habitsTimeRangeFilter} onValueChange={(value) => setHabitsTimeRangeFilter(value as HabitTimeRangeFilter)}>
            <SelectTrigger className="md:w-44 bg-surface-1/50 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-surface-1 border-white/10">
              <SelectItem value="7d">7 nap</SelectItem>
              <SelectItem value="14d">14 nap</SelectItem>
              <SelectItem value="30d">30 nap</SelectItem>
              <SelectItem value="90d">90 nap</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-primary text-surface-0 md:ml-auto" onClick={openCreate}>Uj rutin</Button>
        </div>
        <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="h-8 px-2 text-text-muted">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Tovabbi szurok
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="grid gap-2 md:grid-cols-3">
              <Select value={habitsStatusFilter} onValueChange={(v) => setHabitsStatusFilter(v as HabitsStatusFilter)}>
                <SelectTrigger className="bg-surface-1/50 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-surface-1 border-white/10">
                  <SelectItem value="all">Minden allapot</SelectItem>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="paused">Szuneteltetett</SelectItem>
                  <SelectItem value="archived">Archivalt</SelectItem>
                </SelectContent>
              </Select>
              <Select value={habitsTrackingModeFilter} onValueChange={(v) => setHabitsTrackingModeFilter(v as HabitTrackingModeFilter)}>
                <SelectTrigger className="bg-surface-1/50 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-surface-1 border-white/10">
                  <SelectItem value="all">Minden forras</SelectItem>
                  <SelectItem value="auto">Automatikus</SelectItem>
                  <SelectItem value="hybrid">Vegyes</SelectItem>
                  <SelectItem value="manual">Kezileg rogzitett</SelectItem>
                </SelectContent>
              </Select>
              <Select value={habitsCategoryFilter} onValueChange={setHabitsCategoryFilter}>
                <SelectTrigger className="bg-surface-1/50 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-surface-1 border-white/10">
                  <SelectItem value="all">Minden kategoria</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <OverviewCard label="Stabil rutinok" value={overviewMetrics.stableCount} tone="text-emerald-300" />
        <OverviewCard label="Erosodo rutinok" value={overviewMetrics.strengtheningCount} tone="text-primary" />
        <OverviewCard label="Figyelmet ker" value={overviewMetrics.needsAttentionCount} tone="text-amber-300" />
        <OverviewCard label="Uj mintak" value={overviewMetrics.emergingCount} tone="text-sky-300" />
      </div>

      <Card className="glass border-white/5 p-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h3 className="font-heading font-semibold text-text-primary">Rutin osszkep</h3>
          <Badge variant="outline" className="border-white/15 text-text-muted text-xs">
            {overviewMetrics.groupedCount} osszevont rutin
          </Badge>
        </div>
        <p className="text-sm text-text-secondary">{groupedSummary}</p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {mergedHabits.length === 0 ? (
            <HabitEmptyState />
          ) : (
            <>
              <InsightSection title="Stabil rutinok" items={insightGroups.stable} onOpenHabit={setSelectedHabitId} limit={insightLimit} />
              <InsightSection title="Erosodo rutinok" items={insightGroups.strengthening} onOpenHabit={setSelectedHabitId} limit={insightLimit} />
              <InsightSection title="Figyelmet kero rutinok" items={insightGroups.needsAttention} onOpenHabit={setSelectedHabitId} limit={insightLimit} attention />
            </>
          )}

          <Card className="glass p-4 border-white/5 space-y-4">
            <div>
              <h3 className="font-heading font-semibold text-text-primary">Rutin trendek</h3>
              <p className="text-xs text-text-muted mt-1">Nem nyers adat: azt mutatja, mennyire tartosak a visszatero mintak.</p>
            </div>
            <div className={`grid grid-cols-1 ${dashboardPreference.dashboardDensity === 'minimal' ? '' : 'xl:grid-cols-2'} gap-4`}>
              <HabitTrendChart data={globalCompletionSeries} title="Kovetkezetesseg trend" />
              {dashboardPreference.dashboardDensity !== 'minimal' && <HabitActivityChart data={activitySeries} />}
            </div>
            <div className="rounded-lg border border-white/10 bg-surface-0/25 p-3 text-sm text-text-secondary">
              {overviewMetrics.strengtheningCount > 0
                ? `Az elmult idoszakban ${overviewMetrics.strengtheningCount} rutin erosodeset latjuk.`
                : 'Most inkabb stabilizalo idoszak latszik, keves uj erosodo rutinnal.'}
              {` `}
              {overviewMetrics.needsAttentionCount > 0
                ? `${overviewMetrics.needsAttentionCount} rutin ker finom visszacsatlakozast.`
                : 'Jelenleg nincs kifejezetten visszaeso rutin.'}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {selectedHabit ? (
            <HabitDetailPanel
              habit={selectedHabit}
              completions={safeCompletions}
              signals={safeActivitySignals}
              candidates={computedCandidates}
              range={habitsTimeRangeFilter}
              onToggleToday={() => toggleHabitCompletionForDate(selectedHabit.id, new Date().toISOString().slice(0, 10))}
              onArchive={() => archiveHabit(selectedHabit.id, !selectedHabit.archived)}
              onActivate={(active) => updateHabit(selectedHabit.id, { active })}
            />
          ) : (
            <Card className="glass border-white/5 p-4 text-sm text-text-muted">
              Valassz egy rutint a fenti insight listakbol a reszletes nezethez.
            </Card>
          )}

          {promotable.length > 0 && (
            <Card className="glass p-4 border-white/5">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Javasolt uj rutinok</p>
              <div className="space-y-2">
                {promotable.slice(0, habitPreferenceProfile.habitTrackingPreference === 'manual-light' ? 1 : 2).map((candidate) => (
                  <div key={candidate.id} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-surface-0/20 px-3 py-2">
                    <div>
                      <p className="text-sm text-text-primary">{candidate.titleHint || 'Uj minta'}</p>
                      <p className="text-xs text-text-muted">Ez mostanaban rendszeresebben visszater.</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/15"
                      onClick={async () => {
                        await promoteHabitCandidate(candidate.id);
                        toast.success('A minta felkerult a rutinok koze.');
                      }}
                    >
                      Hozzaad
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <HabitDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editingHabit} onSave={saveHabit} />

      {selectedHabit && (
        <div className="flex justify-end">
          <button type="button" className="text-xs text-text-muted underline" onClick={() => openEdit(selectedHabit)}>
            Kivalasztott rutin szerkesztese
          </button>
        </div>
      )}
    </div>
  );
}

function HabitEmptyState() {
  return (
    <Card className="glass p-8 border-white/5">
      <h3 className="text-lg font-heading font-semibold text-text-primary">Meg nincs eleg adat a rutinmintakhoz</h3>
      <p className="text-sm text-text-muted mt-2 max-w-xl">
        Ahogy rendszeresebben hasznalod az oldalt, itt fokozatosan kirajzolodnak a visszatero mintak. Nem minden egyszeri
        aktivitas jelenik meg, csak az, ami valoban ismétlodik.
      </p>
    </Card>
  );
}

function OverviewCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card className="glass p-4 border-white/5">
      <p className={`text-2xl font-bold ${tone}`}>{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </Card>
  );
}

function InsightSection({
  title,
  items,
  onOpenHabit,
  limit,
  attention,
}: {
  title: string;
  items: UserFacingHabit[];
  onOpenHabit: (habitId: string | undefined) => void;
  limit: number;
  attention?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-2">
      <p className="text-xs text-text-muted uppercase tracking-wide">{title}</p>
      <div className="grid gap-3 md:grid-cols-2">
        {items.slice(0, limit).map((group) => (
          <GroupedHabitCard
            key={`${group.groupKey}-${group.sourceHabitIds[0]}`}
            group={group}
            attention={attention}
            onOpen={() => onOpenHabit(group.sourceHabitIds[0])}
          />
        ))}
      </div>
    </section>
  );
}

function GroupedHabitCard({ group, onOpen, attention }: { group: UserFacingHabit; onOpen: () => void; attention?: boolean }) {
  const badgeLabel =
    group.insightStatus === 'stable'
      ? 'Stabil'
      : group.insightStatus === 'strengthening'
        ? 'Erosodik'
        : group.insightStatus === 'emerging'
          ? 'Kialakulo'
          : 'Figyelmet ker';

  return (
    <Card className={`glass border-white/5 p-4 ${attention ? 'border-amber-500/30' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-heading font-semibold text-text-primary">{group.title}</h3>
          <p className="text-sm text-text-secondary mt-1">{group.description}</p>
        </div>
        <Badge variant="outline" className="border-white/15 text-xs">{badgeLabel}</Badge>
      </div>
      <p className="mt-2 text-xs text-text-muted">
        Heti ritmus: {group.weeklyRate}% · Sorozat: {group.streak} nap
        {group.lastActivityDateKey ? ` · Utolso aktivitas: ${group.lastActivityDateKey}` : ''}
      </p>
      <p className="mt-2 text-sm text-text-secondary">{group.insight}</p>
      <div className="mt-3 flex justify-end">
        <Button size="sm" variant="outline" className="border-white/15" onClick={onOpen}>
          Reszletek
        </Button>
      </div>
    </Card>
  );
}
