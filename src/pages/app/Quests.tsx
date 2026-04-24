import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock3, Flag, Search, Target, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMissionProductivityMetrics, getMissionsBySearch, getMissionFocusCandidates } from '@/lib/missions/selectors';
import type { Mission } from '@/lib/missions/types';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import { toast } from 'sonner';
import { getMissionPreferenceProfile, getGuidancePreferenceProfile } from '@/lib/preferences/selectors';

function MissionStatusBadge({ status }: { status: Mission['status'] }) {
  const map = {
    active: 'bg-primary/15 text-primary border-primary/30',
    completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    skipped: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    archived: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
  };
  return <Badge className={cn('text-xs', map[status])}>{status === 'active' ? 'Aktiv' : status === 'completed' ? 'Teljesitett' : status === 'skipped' ? 'Atugrott' : 'Archivalt'}</Badge>;
}

function MissionDifficultyBadge({ difficulty }: { difficulty: Mission['difficulty'] }) {
  const map = {
    easy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    hard: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  };
  return <Badge className={cn('text-xs', map[difficulty])}>{difficulty === 'easy' ? 'Konnyu' : difficulty === 'medium' ? 'Kozepes' : 'Nehéz'}</Badge>;
}

function MissionMetaRow({ mission }: { mission: Mission }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
      <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{mission.estimatedMinutes} perc</span>
      <span className="inline-flex items-center gap-1"><Flag className="h-3.5 w-3.5" />{mission.priority === 'high' ? 'Magas prioritas' : mission.priority === 'medium' ? 'Kozepes prioritas' : 'Alacsony prioritas'}</span>
      <Badge variant="outline" className="text-xs border-white/20">{mission.category}</Badge>
    </div>
  );
}

function MissionCard({ mission, onComplete, onSkip, onOpen }: { mission: Mission; onComplete: (id: string) => void; onSkip: (id: string) => void; onOpen: (id: string) => void }) {
  return (
    <Card className="glass p-4 hover-lift cursor-pointer" onClick={() => onOpen(mission.id)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading font-semibold text-text-primary">{mission.title}</h3>
            <MissionStatusBadge status={mission.status} />
            <MissionDifficultyBadge difficulty={mission.difficulty} />
          </div>
          <p className="text-sm text-text-secondary">{mission.description}</p>
          <MissionMetaRow mission={mission} />
        </div>
        {mission.status === 'active' && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="border-white/20" onClick={(e) => { e.stopPropagation(); onSkip(mission.id); }}>
              <XCircle className="h-4 w-4 mr-1" />Atugras
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={(e) => { e.stopPropagation(); onComplete(mission.id); }}>
              <CheckCircle2 className="h-4 w-4 mr-1" />Kesz
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function MissionDetailPanel({ mission, onClose }: { mission: Mission; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] glass-intense border-l border-white/10 z-50 overflow-y-auto p-5">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-heading font-semibold text-text-primary">{mission.title}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>✕</Button>
      </div>
      <div className="space-y-3">
        <p className="text-sm text-text-secondary">{mission.description}</p>
        <MissionMetaRow mission={mission} />
        <div className="flex gap-2">
          <MissionStatusBadge status={mission.status} />
          <MissionDifficultyBadge difficulty={mission.difficulty} />
          <Badge variant="outline" className="text-xs border-white/20">{mission.type === 'daily' ? 'Napi' : mission.type === 'weekly' ? 'Heti' : mission.type === 'suggested' ? 'Javasolt' : 'Iranyitott'}</Badge>
        </div>
      </div>
    </motion.div>
  );
}

function MissionSummaryPanel({ missions }: { missions: Mission[] }) {
  const metrics = useMemo(() => getMissionProductivityMetrics(missions), [missions]);
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card className="glass p-3"><p className="text-2xl font-bold text-primary">{metrics.activeMissions}</p><p className="text-xs text-text-muted">Aktiv kuldetes</p></Card>
      <Card className="glass p-3"><p className="text-2xl font-bold text-emerald-400">{metrics.completedMissions}</p><p className="text-xs text-text-muted">Teljesitett</p></Card>
      <Card className="glass p-3"><p className="text-2xl font-bold text-blue-400">{metrics.dailyTimeLoadMinutes}p</p><p className="text-xs text-text-muted">Mai idoigeny</p></Card>
      <Card className="glass p-3"><p className="text-2xl font-bold text-amber-400">{metrics.focusCandidates}</p><p className="text-xs text-text-muted">Fokusz jelolt</p></Card>
    </div>
  );
}

function MissionEmptyState({ mode }: { mode: 'daily' | 'weekly' | 'completed' | 'search' | 'focus' }) {
  const copy: Record<typeof mode, string> = {
    daily: 'Ma nincs aktiv kuldetes. Adj magadnak egy vallalhato kovetkezo lepest.',
    weekly: 'Erre a hetre most nincs kuldetes.',
    completed: 'Még nincs teljesitett kuldetes ebben a nezetben.',
    search: 'Nincs talalat erre a szuresre.',
    focus: 'Most nincs kiemelheto fokusz kuldetes.',
  };
  return <Card className="glass p-10 text-center text-text-muted">{copy[mode]}</Card>;
}

export default function Quests() {
  const {
    missions,
    missionViewFilter,
    missionTypeFilter,
    missionStatusFilter,
    missionCategoryFilter,
    missionSearchQuery,
    selectedMissionId,
    completeMission,
    skipMission,
    setMissionViewFilter,
    setMissionTypeFilter,
    setMissionStatusFilter,
    setMissionCategoryFilter,
    setMissionSearchQuery,
    setSelectedMissionId,
    userPreferences,
  } = useAppStore();
  const missionPreference = useMemo(() => getMissionPreferenceProfile(userPreferences), [userPreferences]);
  const guidancePreference = useMemo(() => getGuidancePreferenceProfile(userPreferences), [userPreferences]);

  const categories = useMemo(() => ['all', ...new Set(missions.map((m) => m.category).filter(Boolean))], [missions]);
  const filtered = useMemo(() => {
    let out = missions.slice();
    if (missionTypeFilter !== 'all') out = out.filter((m) => m.type === missionTypeFilter);
    if (missionStatusFilter !== 'all') out = out.filter((m) => m.status === missionStatusFilter);
    if (missionCategoryFilter !== 'all') out = out.filter((m) => m.category === missionCategoryFilter);
    out = getMissionsBySearch(out, missionSearchQuery);
    if (missionViewFilter === 'daily') out = out.filter((m) => m.type === 'daily');
    if (missionViewFilter === 'weekly') out = out.filter((m) => m.type === 'weekly');
    if (missionViewFilter === 'active') out = out.filter((m) => m.status === 'active');
    if (missionViewFilter === 'completed') out = out.filter((m) => m.status === 'completed');
    if (missionViewFilter === 'focus') out = getMissionFocusCandidates(out);
    out = out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    if (missionPreference.missionVisibility === 'secondary') return out.slice(0, 8);
    if (missionPreference.missionVisibility === 'balanced') return out.slice(0, 12);
    return out;
  }, [
    missions,
    missionTypeFilter,
    missionStatusFilter,
    missionCategoryFilter,
    missionSearchQuery,
    missionViewFilter,
    missionPreference.missionVisibility,
  ]);

  const selected = useMemo(() => missions.find((m) => m.id === selectedMissionId), [missions, selectedMissionId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-text-primary">Küldetések</h1>
        <p className="text-text-secondary">
          {guidancePreference.preferredTone === 'direct'
            ? 'Rovid, vegrehajthato kuldetesek a kovetkezo lepeseidhez.'
            : missionPreference.missionVisibility === 'secondary'
              ? 'Tamogato kuldetesek, masodlagos hangsullyal a napi prioritasaid mellett.'
              : 'Napi es heti iranyok, amelyek valoban segitik a haladast.'}
        </p>
      </div>

      {missionPreference.missionVisibility === 'secondary' && (
        <Card className="glass p-3 border-white/10 text-sm text-text-muted">
          A kuldetesek most tamogato szerepben vannak, a fo hangsuly a Dashboard napi prioritasain marad.
        </Card>
      )}

      <MissionSummaryPanel missions={missions} />

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-3">
        <Input value={missionSearchQuery} onChange={(e) => setMissionSearchQuery(e.target.value)} placeholder="Kereses cim vagy kategoriaban..." className="bg-surface-0/50 border-white/10" />
        <Select value={missionViewFilter} onValueChange={(v) => setMissionViewFilter(v as any)}>
          <SelectTrigger className="bg-surface-0/50 border-white/10 w-full sm:w-[160px]"><Target className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent className="bg-surface-1 border-white/10">
            <SelectItem value="focus">Fokusz</SelectItem>
            <SelectItem value="daily">Napi</SelectItem>
            <SelectItem value="weekly">Heti</SelectItem>
            <SelectItem value="active">Aktiv</SelectItem>
            <SelectItem value="completed">Teljesitett</SelectItem>
            <SelectItem value="all">Osszes</SelectItem>
          </SelectContent>
        </Select>
        <Select value={missionTypeFilter} onValueChange={(v) => setMissionTypeFilter(v as any)}>
          <SelectTrigger className="bg-surface-0/50 border-white/10 w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-surface-1 border-white/10">
            <SelectItem value="all">Minden tipus</SelectItem>
            <SelectItem value="daily">Napi</SelectItem>
            <SelectItem value="weekly">Heti</SelectItem>
            <SelectItem value="suggested">Javasolt</SelectItem>
            <SelectItem value="guided">Iranyitott</SelectItem>
          </SelectContent>
        </Select>
        <Select value={missionCategoryFilter} onValueChange={setMissionCategoryFilter}>
          <SelectTrigger className="bg-surface-0/50 border-white/10 w-full sm:w-[180px]"><Search className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent className="bg-surface-1 border-white/10">
            {categories.map((category) => <SelectItem key={category} value={category}>{category === 'all' ? 'Minden kategoria' : category}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <MissionEmptyState mode={missionSearchQuery ? 'search' : missionViewFilter === 'daily' ? 'daily' : missionViewFilter === 'weekly' ? 'weekly' : missionViewFilter === 'completed' ? 'completed' : missionViewFilter === 'focus' ? 'focus' : 'search'} />
        ) : (
          filtered.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onComplete={async (id) => { await completeMission(id); toast.success('Kuldetes teljesitve.'); }}
              onSkip={async (id) => { await skipMission(id); toast.success('Kuldetes atugorva.'); }}
              onOpen={setSelectedMissionId}
            />
          ))
        )}
      </div>

      <AnimatePresence>{selected && <MissionDetailPanel mission={selected} onClose={() => setSelectedMissionId(undefined)} />}</AnimatePresence>
    </div>
  );
}
