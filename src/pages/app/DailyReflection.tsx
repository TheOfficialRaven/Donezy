import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PenLine, Sparkles, Heart, Brain, TrendingUp, Smile, Meh, Frown,
  ChevronLeft, ChevronRight, Plus, Trash2, Calendar, Lock, Shield,
  Sun, Moon, CloudRain, Zap, Flame, Leaf, Star, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useAppStore, type JournalEntry } from '@/stores/useAppStore';
import { getLocalDateString } from '@/lib/dateUtils';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import { toast } from 'sonner';

const MOOD_CONFIG = [
  { value: 1, icon: Frown, label: 'Nehéz nap', color: 'text-red-400', bg: 'bg-red-500/20', ring: 'ring-red-500/30' },
  { value: 2, icon: CloudRain, label: 'Nem a legjobb', color: 'text-orange-400', bg: 'bg-orange-500/20', ring: 'ring-orange-500/30' },
  { value: 3, icon: Meh, label: 'Semleges', color: 'text-yellow-400', bg: 'bg-yellow-500/20', ring: 'ring-yellow-500/30' },
  { value: 4, icon: Smile, label: 'Jó nap', color: 'text-emerald-400', bg: 'bg-emerald-500/20', ring: 'ring-emerald-500/30' },
  { value: 5, icon: Sun, label: 'Kiváló!', color: 'text-amber-300', bg: 'bg-amber-400/20', ring: 'ring-amber-400/30' },
];

const JOURNAL_PROMPTS = [
  { key: 'gratitude', icon: Heart, label: 'Hálás vagyok...', hint: 'Minek örültél ma? Mi az, amiért hálás lehetsz — akár apróság is?', color: 'text-rose-400', bg: 'bg-rose-500/10' },
  { key: 'lessons', icon: Brain, label: 'Amit ma tanultam...', hint: 'Mi volt a nap tanulsága? Milyen új gondolat, felismerés jutott eszedbe?', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { key: 'feelings', icon: Sparkles, label: 'Érzések, gondolatok...', hint: 'Hogyan érezted magad ma? Mi foglalkoztatott? Nyugodtan írj szabadon, ez csak a tiéd.', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { key: 'growth', icon: TrendingUp, label: 'Miben fejlődtem...', hint: 'Miben lettél ma jobb? Milyen lépést tettél a céljaid felé?', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { key: 'freeWrite', icon: PenLine, label: 'Szabad gondolatok...', hint: 'Bármi, ami a lelkeden van. Nincs szabály — ez a te biztonságos helyed.', color: 'text-amber-400', bg: 'bg-amber-500/10' },
];

const ENTRY_TAGS = [
  { id: 'productive', label: 'Produktív', icon: Zap },
  { id: 'creative', label: 'Kreatív', icon: Sparkles },
  { id: 'calm', label: 'Nyugodt', icon: Leaf },
  { id: 'motivated', label: 'Motivált', icon: Flame },
  { id: 'grateful', label: 'Hálás', icon: Heart },
  { id: 'reflective', label: 'Gondolkodó', icon: Brain },
  { id: 'energetic', label: 'Energikus', icon: Sun },
  { id: 'tired', label: 'Fáradt', icon: Moon },
  { id: 'inspired', label: 'Inspirált', icon: Star },
];

function formatHungarianDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
}

export default function DailyReflection() {
  const { journalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useAppStore();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [newEntryDate, setNewEntryDate] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const detailRef = useRef<HTMLDivElement>(null);

  const today = getLocalDateString();
  const todaysEntry = journalEntries.find((e) => e.date === today);

  const sortedEntries = useMemo(
    () => [...journalEntries].sort((a, b) => b.date.localeCompare(a.date)),
    [journalEntries]
  );

  const currentStreak = useMemo(() => {
    const dates = new Set(journalEntries.map((e) => e.date));
    let streak = 0;
    const d = new Date();
    while (true) {
      const ds = d.toISOString().slice(0, 10);
      if (dates.has(ds)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [journalEntries]);

  const avgMood = useMemo(() => {
    if (journalEntries.length === 0) return 0;
    const last30 = journalEntries.filter((e) => {
      const diff = (Date.now() - new Date(e.date + 'T12:00:00').getTime()) / 86400000;
      return diff <= 30;
    });
    if (last30.length === 0) return 0;
    return last30.reduce((s, e) => s + e.mood, 0) / last30.length;
  }, [journalEntries]);

  const openNewEntry = (forDate?: string) => {
    setNewEntryDate(forDate || null);
    setEditingEntry(null);
    setEditorOpen(true);
  };

  const openEditEntry = (entry: JournalEntry) => {
    setNewEntryDate(null);
    setEditingEntry(entry);
    setEditorOpen(true);
  };

  const selectAndScrollToEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleCalendarDayClick = (dateStr: string) => {
    const entry = journalEntries.find((e) => e.date === dateStr);
    if (entry) {
      selectAndScrollToEntry(entry);
    } else if (dateStr <= today) {
      openNewEntry(dateStr);
    }
  };

  const handleDelete = async () => {
    if (!entryToDelete) return;
    await deleteJournalEntry(entryToDelete);
    if (selectedEntry?.id === entryToDelete) setSelectedEntry(null);
    setDeleteConfirmOpen(false);
    setEntryToDelete(null);
    toast.success('Bejegyzés törölve.');
  };

  const calendarDays = useMemo(() => {
    const { year, month } = calendarMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const days: Array<{ date: string; day: number; inMonth: boolean; hasEntry: boolean; mood: number }> = [];
    for (let i = 0; i < startOffset; i++) {
      const d = new Date(year, month, -startOffset + i + 1);
      const ds = d.toISOString().slice(0, 10);
      const e = journalEntries.find((je) => je.date === ds);
      days.push({ date: ds, day: d.getDate(), inMonth: false, hasEntry: !!e, mood: e?.mood || 0 });
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const ds = d.toISOString().slice(0, 10);
      const e = journalEntries.find((je) => je.date === ds);
      days.push({ date: ds, day: i, inMonth: true, hasEntry: !!e, mood: e?.mood || 0 });
    }
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 0; i < remaining; i++) {
        const d = new Date(year, month + 1, i + 1);
        const ds = d.toISOString().slice(0, 10);
        const e = journalEntries.find((je) => je.date === ds);
        days.push({ date: ds, day: d.getDate(), inMonth: false, hasEntry: !!e, mood: e?.mood || 0 });
      }
    }
    return days;
  }, [calendarMonth, journalEntries]);

  const monthName = new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' });

  const navigateMonth = (dir: -1 | 1) => {
    setCalendarMonth((prev) => {
      let m = prev.month + dir;
      let y = prev.year;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      return { year: y, month: m };
    });
  };

  const moodForCalendar = (mood: number): string => {
    if (mood >= 5) return 'bg-amber-400/40';
    if (mood >= 4) return 'bg-emerald-500/40';
    if (mood >= 3) return 'bg-yellow-500/30';
    if (mood >= 2) return 'bg-orange-500/30';
    return 'bg-red-500/30';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-4"
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center ring-1 ring-purple-500/20">
            <PenLine className="h-5 w-5 text-purple-400" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-text-primary">Napi Reflexió</h1>
        </div>
        <p className="text-text-secondary max-w-md mx-auto">
          A te biztonságos helyed. Írd le a gondolataid, érzéseid, felismeréseid — csak neked.
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Shield className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs text-emerald-400/80">Privát és biztonságos</span>
        </div>
      </motion.div>

      {/* Quick Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        <Card className="glass p-4 text-center">
          <div className="text-2xl font-bold text-primary">{journalEntries.length}</div>
          <div className="text-xs text-text-muted">Bejegyzés</div>
        </Card>
        <Card className="glass p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">{currentStreak}</div>
          <div className="text-xs text-text-muted">Napos sorozat</div>
        </Card>
        <Card className="glass p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">
            {avgMood > 0 ? avgMood.toFixed(1) : '—'}
          </div>
          <div className="text-xs text-text-muted">Átlag hangulat</div>
        </Card>
      </motion.div>

      {/* Today's prompt or CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {todaysEntry ? (
          <Card
            className="relative overflow-hidden cursor-pointer hover-lift"
            onClick={() => openEditEntry(todaysEntry)}
          >
            {/* Journal paper texture */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 31px, hsl(var(--text-primary)) 31px, hsl(var(--text-primary)) 32px)`,
              backgroundPositionY: '8px',
            }} />
            <div className="absolute left-12 top-0 bottom-0 w-px bg-rose-400/10 hidden sm:block" />
            <div className="relative p-4 pl-6 sm:p-6 sm:pl-16">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {(() => { const mc = MOOD_CONFIG.find((m) => m.value === todaysEntry.mood); return mc ? <mc.icon className={cn('h-5 w-5', mc.color)} /> : null; })()}
                  <span className="text-sm font-medium text-text-primary">Mai bejegyzés</span>
                </div>
                <span className="text-xs text-text-muted">{formatHungarianDate(todaysEntry.date)}</span>
              </div>
              {todaysEntry.gratitude && (
                <p className="text-sm text-text-secondary italic line-clamp-2 mb-1">
                  "{todaysEntry.gratitude}"
                </p>
              )}
              {todaysEntry.freeWrite && !todaysEntry.gratitude && (
                <p className="text-sm text-text-secondary italic line-clamp-2 mb-1">
                  "{todaysEntry.freeWrite}"
                </p>
              )}
              {todaysEntry.tags && todaysEntry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {todaysEntry.tags.map((t) => {
                    const tag = ENTRY_TAGS.find((et) => et.id === t);
                    return tag ? (
                      <Badge key={t} variant="outline" className="text-xs border-purple-500/20 text-purple-300">
                        {tag.label}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
              <p className="text-xs text-primary mt-3">Kattints a szerkesztéshez</p>
            </div>
          </Card>
        ) : (
          <Card
            className="relative overflow-hidden cursor-pointer hover-lift group"
            onClick={openNewEntry}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all" />
            <div className="relative p-5 sm:p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4 ring-1 ring-purple-500/20 group-hover:ring-purple-500/40 transition-all">
                <PenLine className="h-7 w-7 text-purple-400" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-text-primary mb-2">
                Hogyan telt a napod?
              </h3>
              <p className="text-sm text-text-secondary mb-4 max-w-sm mx-auto">
                Szánj rá pár percet. Gondold át mit tapasztaltál, mit éreztél, miben fejlődtél ma.
              </p>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <PenLine className="h-4 w-4 mr-2" />
                Napló megnyitása
              </Button>
            </div>
          </Card>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1"
        >
          <Card className="glass p-4">
            <div className="flex items-center justify-between mb-3">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => navigateMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-text-primary capitalize">{monthName}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => navigateMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {['H', 'K', 'Sz', 'Cs', 'P', 'Sz', 'V'].map((d, i) => (
                <span key={i} className="text-[10px] font-medium text-text-muted">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((d, i) => (
                <button
                  key={i}
                  className={cn(
                    'relative aspect-square rounded-md text-xs flex items-center justify-center transition-all',
                    !d.inMonth && 'opacity-25',
                    d.date === today && 'ring-1 ring-primary/60',
                    selectedEntry?.date === d.date && 'ring-2 ring-purple-500/70 scale-110',
                    d.hasEntry ? moodForCalendar(d.mood) : 'hover:bg-white/5',
                    d.hasEntry && 'cursor-pointer hover:scale-105',
                    !d.hasEntry && d.date <= today && 'cursor-pointer',
                  )}
                  onClick={() => handleCalendarDayClick(d.date)}
                  title={d.hasEntry ? 'Bejegyzés megtekintése' : d.date <= today ? 'Új bejegyzés erre a napra' : ''}
                >
                  {d.day}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-text-muted">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500/40" /> 1</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-orange-500/40" /> 2</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-500/40" /> 3</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500/40" /> 4</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400/40" /> 5</span>
            </div>
          </Card>
        </motion.div>

        {/* Entry Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading font-semibold text-text-primary flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-400" />
              Bejegyzéseim
            </h2>
            <Button size="sm" onClick={openNewEntry} className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="h-4 w-4 mr-1" /> Új bejegyzés
            </Button>
          </div>

          {sortedEntries.length === 0 ? (
            <Card className="glass p-8 text-center">
              <Lock className="h-10 w-10 text-text-muted mx-auto mb-3 opacity-40" />
              <p className="text-text-secondary text-sm mb-1">Még nincs bejegyzésed.</p>
              <p className="text-text-muted text-xs">Kezdd el a naplózást — akár pár mondat is sokat jelent az önismeretben.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {sortedEntries.map((entry) => {
                const mc = MOOD_CONFIG.find((m) => m.value === entry.mood);
                const preview = entry.gratitude || entry.feelings || entry.freeWrite || entry.lessons || entry.growth || '';
                return (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Card
                      className={cn(
                        'glass relative overflow-hidden cursor-pointer hover-lift group',
                        selectedEntry?.id === entry.id && 'ring-1 ring-purple-500/40'
                      )}
                      onClick={() => selectAndScrollToEntry(entry)}
                    >
                      {/* Paper line accent */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg" style={{
                        backgroundColor: mc ? `var(--tw-${mc.color.replace('text-', '')})` : undefined,
                        background: mc?.value === 5 ? 'linear-gradient(to bottom, #fbbf24, #f59e0b)' :
                                    mc?.value === 4 ? 'linear-gradient(to bottom, #34d399, #10b981)' :
                                    mc?.value === 3 ? 'linear-gradient(to bottom, #facc15, #eab308)' :
                                    mc?.value === 2 ? 'linear-gradient(to bottom, #fb923c, #f97316)' :
                                    'linear-gradient(to bottom, #f87171, #ef4444)',
                      }} />
                      <div className="p-4 pl-5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {mc && <mc.icon className={cn('h-4 w-4', mc.color)} />}
                            <span className="text-sm font-medium text-text-primary">
                              {entry.date === today ? 'Ma' : formatShortDate(entry.date)}
                            </span>
                            {mc && (
                              <span className={cn('text-xs', mc.color)}>{mc.label}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-text-muted hover:text-primary"
                              onClick={(e) => { e.stopPropagation(); openEditEntry(entry); }}
                            >
                              <PenLine className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-text-muted hover:text-danger"
                              onClick={(e) => { e.stopPropagation(); setEntryToDelete(entry.id); setDeleteConfirmOpen(true); }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        {preview && (
                          <p className="text-sm text-text-secondary line-clamp-2 italic">"{preview}"</p>
                        )}
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {entry.tags.slice(0, 4).map((t) => {
                              const tag = ENTRY_TAGS.find((et) => et.id === t);
                              return tag ? (
                                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300/70 border border-purple-500/10">
                                  {tag.label}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Selected entry detail view */}
      <div ref={detailRef}>
        <AnimatePresence>
          {selectedEntry && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <EntryDetailView
                entry={selectedEntry}
                onEdit={() => openEditEntry(selectedEntry)}
                onClose={() => setSelectedEntry(null)}
                onDelete={() => { setEntryToDelete(selectedEntry.id); setDeleteConfirmOpen(true); }}
                onNavigate={(dir) => {
                  const idx = sortedEntries.findIndex((e) => e.id === selectedEntry.id);
                  const next = dir === 'prev' ? sortedEntries[idx - 1] : sortedEntries[idx + 1];
                  if (next) {
                    setSelectedEntry(next);
                    const d = new Date(next.date + 'T12:00:00');
                    setCalendarMonth({ year: d.getFullYear(), month: d.getMonth() });
                  }
                }}
                hasPrev={sortedEntries.findIndex((e) => e.id === selectedEntry.id) > 0}
                hasNext={sortedEntries.findIndex((e) => e.id === selectedEntry.id) < sortedEntries.length - 1}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Editor Dialog */}
      <JournalEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editingEntry={editingEntry}
        defaultDate={newEntryDate}
        onSave={async (data) => {
          if (editingEntry) {
            await updateJournalEntry(editingEntry.id, data);
            const updated = { ...editingEntry, ...data, updatedAt: new Date().toISOString() };
            setSelectedEntry(updated);
            toast.success('Bejegyzés frissítve.');
          } else {
            await addJournalEntry(data as any);
            toast.success('Bejegyzés elmentve.');
          }
          setEditorOpen(false);
        }}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Bejegyzés törlése"
        description="Biztosan törölni szeretnéd ezt a naplóbejegyzést? Ez a művelet nem vonható vissza."
        confirmLabel="Törlés"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ==== Entry Detail View ====

function EntryDetailView({
  entry,
  onEdit,
  onClose,
  onDelete,
  onNavigate,
  hasPrev,
  hasNext,
}: {
  entry: JournalEntry;
  onEdit: () => void;
  onClose: () => void;
  onDelete: () => void;
  onNavigate: (dir: 'prev' | 'next') => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const mc = MOOD_CONFIG.find((m) => m.value === entry.mood);
  const sections = JOURNAL_PROMPTS.filter((p) => {
    const val = entry[p.key as keyof JournalEntry];
    return val && typeof val === 'string' && val.trim().length > 0;
  });

  return (
    <Card className="glass relative overflow-hidden">
      {/* Paper lines background */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 31px, hsl(var(--text-primary)) 31px, hsl(var(--text-primary)) 32px)`,
        backgroundPositionY: '8px',
      }} />
      <div className="absolute left-14 top-0 bottom-0 w-px bg-rose-400/8 hidden sm:block" />

      <div className="relative p-4 sm:p-6 sm:pl-[4.5rem]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base sm:text-lg font-heading font-semibold text-text-primary">
              {formatHungarianDate(entry.date)}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              {mc && (
                <Badge className={cn('text-xs', mc.bg, mc.color, 'border', mc.ring)}>
                  <mc.icon className="h-3 w-3 mr-1" />
                  {mc.label}
                </Badge>
              )}
              {entry.tags && entry.tags.map((t) => {
                const tag = ENTRY_TAGS.find((et) => et.id === t);
                return tag ? (
                  <Badge key={t} variant="outline" className="text-xs border-purple-500/20 text-purple-300/70">
                    {tag.label}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button size="sm" variant="ghost" className="text-primary" onClick={onEdit}>
              <PenLine className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Szerkesztés</span><span className="sm:hidden">Szerk.</span>
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-text-muted hover:text-danger" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-text-muted" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-5">
          {sections.map((prompt) => {
            const value = entry[prompt.key as keyof JournalEntry] as string;
            return (
              <div key={prompt.key}>
                <div className="flex items-center gap-2 mb-2">
                  <prompt.icon className={cn('h-4 w-4', prompt.color)} />
                  <span className="text-sm font-medium text-text-primary">{prompt.label}</span>
                </div>
                <div className={cn('rounded-lg p-3 sm:p-4', prompt.bg)}>
                  <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {sections.length === 0 && (
          <p className="text-text-muted text-sm italic text-center py-8">Üres bejegyzés — kattints a szerkesztéshez.</p>
        )}

        {/* Day navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
          <Button
            size="sm"
            variant="ghost"
            className="text-text-muted hover:text-text-primary"
            disabled={!hasPrev}
            onClick={() => onNavigate('prev')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Újabb nap
          </Button>
          <span className="text-xs text-text-muted">
            {entry.date === getLocalDateString() ? 'Ma' : formatShortDate(entry.date)}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="text-text-muted hover:text-text-primary"
            disabled={!hasNext}
            onClick={() => onNavigate('next')}
          >
            Régebbi nap <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ==== Journal Editor Dialog ====

function JournalEditor({
  open,
  onOpenChange,
  editingEntry,
  defaultDate,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingEntry: JournalEntry | null;
  defaultDate?: string | null;
  onSave: (data: Partial<JournalEntry>) => Promise<void>;
}) {
  const [mood, setMood] = useState(3);
  const [gratitude, setGratitude] = useState('');
  const [lessons, setLessons] = useState('');
  const [feelings, setFeelings] = useState('');
  const [growth, setGrowth] = useState('');
  const [freeWrite, setFreeWrite] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [date, setDate] = useState(getLocalDateString());
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (editingEntry) {
        setMood(editingEntry.mood);
        setGratitude(editingEntry.gratitude || '');
        setLessons(editingEntry.lessons || '');
        setFeelings(editingEntry.feelings || '');
        setGrowth(editingEntry.growth || '');
        setFreeWrite(editingEntry.freeWrite || '');
        setTags(editingEntry.tags || []);
        setDate(editingEntry.date);
      } else {
        setMood(3);
        setGratitude('');
        setLessons('');
        setFeelings('');
        setGrowth('');
        setFreeWrite('');
        setTags([]);
        setDate(defaultDate || getLocalDateString());
        setActiveSection(null);
      }
    }
  }, [open, editingEntry, defaultDate]);

  const toggleTag = (id: string) => {
    setTags((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: Partial<JournalEntry> = { date, mood };
      if (gratitude.trim()) data.gratitude = gratitude.trim();
      if (lessons.trim()) data.lessons = lessons.trim();
      if (feelings.trim()) data.feelings = feelings.trim();
      if (growth.trim()) data.growth = growth.trim();
      if (freeWrite.trim()) data.freeWrite = freeWrite.trim();
      if (tags.length > 0) data.tags = tags;
      await onSave(data);
    } finally {
      setSaving(false);
    }
  };

  const mc = MOOD_CONFIG.find((m) => m.value === mood);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none max-h-none sm:w-[calc(100%-2rem)] sm:max-w-2xl sm:max-h-[85vh] sm:h-auto rounded-none sm:rounded-xl overflow-y-auto scrollbar-custom glass border-purple-500/20 p-4 sm:p-6 top-0 left-0 translate-x-0 translate-y-0 sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]">
        <DialogHeader className="pr-8">
          <DialogTitle className="flex items-center gap-2 text-text-primary text-base sm:text-lg">
            <PenLine className="h-5 w-5 text-purple-400 flex-shrink-0" />
            <span className="truncate">{editingEntry ? 'Bejegyzés szerkesztése' : 'Új naplóbejegyzés'}</span>
          </DialogTitle>
          <DialogDescription className="text-text-secondary text-xs sm:text-sm">
            {formatHungarianDate(date)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-1 sm:py-2">
          {/* Mood selector */}
          <div>
            <label className="text-xs sm:text-sm font-medium text-text-primary mb-2 sm:mb-3 block">Hogyan érzed magad?</label>
            <div className="grid grid-cols-5 gap-1 sm:flex sm:items-center sm:justify-center sm:gap-2">
              {MOOD_CONFIG.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMood(m.value)}
                  className={cn(
                    'flex flex-col items-center gap-0.5 sm:gap-1 py-2 px-1 sm:p-3 rounded-xl transition-all duration-200',
                    mood === m.value
                      ? cn(m.bg, 'ring-2', m.ring, 'sm:scale-110')
                      : 'hover:bg-white/5 opacity-50 hover:opacity-80'
                  )}
                >
                  <m.icon className={cn('h-6 w-6 sm:h-7 sm:w-7', m.color)} />
                  <span className={cn('text-[9px] sm:text-[10px] font-medium leading-tight text-center', mood === m.value ? m.color : 'text-text-muted')}>
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Journal sections */}
          <div className="space-y-1.5 sm:space-y-3">
            <p className="text-[11px] sm:text-xs text-text-muted">
              Kattints egy kategóriára az íráshoz. Írd azt, ami természetes.
            </p>
            {JOURNAL_PROMPTS.map((prompt) => {
              const value = prompt.key === 'gratitude' ? gratitude :
                            prompt.key === 'lessons' ? lessons :
                            prompt.key === 'feelings' ? feelings :
                            prompt.key === 'growth' ? growth : freeWrite;
              const setValue = prompt.key === 'gratitude' ? setGratitude :
                              prompt.key === 'lessons' ? setLessons :
                              prompt.key === 'feelings' ? setFeelings :
                              prompt.key === 'growth' ? setGrowth : setFreeWrite;
              const isOpen = activeSection === prompt.key || value.length > 0;

              return (
                <div key={prompt.key}>
                  <button
                    onClick={() => setActiveSection(isOpen && !value ? null : prompt.key)}
                    className={cn(
                      'w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl transition-all text-left',
                      isOpen ? cn(prompt.bg, 'ring-1 ring-white/5') : 'hover:bg-white/5'
                    )}
                  >
                    <prompt.icon className={cn('h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0', prompt.color)} />
                    <span className="flex-1 min-w-0 text-xs sm:text-sm font-medium text-text-primary truncate">{prompt.label}</span>
                    {value && (
                      <span className="text-[10px] text-emerald-400 flex-shrink-0">Kitöltve</span>
                    )}
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-1.5 sm:pt-2 px-1">
                          <p className="text-[11px] sm:text-xs text-text-muted mb-1.5 sm:mb-2 italic leading-relaxed">{prompt.hint}</p>
                          <JournalTextarea
                            value={value}
                            onChange={(v) => setValue(v)}
                            placeholder="Kezdj el írni..."
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs sm:text-sm font-medium text-text-primary mb-1.5 sm:mb-2 block">Milyen nap volt?</label>
            <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
              {ENTRY_TAGS.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    'flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-all border',
                    tags.includes(tag.id)
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : 'bg-transparent text-text-muted border-white/10 hover:border-white/20 hover:text-text-secondary'
                  )}
                >
                  <tag.icon className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{tag.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Privacy note */}
          <div className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400 flex-shrink-0" />
            <p className="text-[10px] sm:text-xs text-emerald-300/70">
              Privát bejegyzés — csak te láthatod.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-inherit pb-1">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving} size="sm">
            Mégse
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white"
            size="sm"
          >
            {saving ? 'Mentés...' : editingEntry ? 'Frissítés' : 'Mentés'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==== Styled Textarea for journal feel ====

function JournalTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.max(80, el.scrollHeight) + 'px';
    }
  }, [value]);

  return (
    <div className="relative">
      {/* Ruled lines */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none rounded-lg" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 27px, hsl(var(--text-primary)) 27px, hsl(var(--text-primary)) 28px)`,
        backgroundPositionY: '6px',
      }} />
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full min-h-[80px] bg-transparent border border-white/5 rounded-lg px-4 py-3',
          'text-sm text-text-primary placeholder:text-text-muted/50 resize-none',
          'focus:outline-none focus:ring-1 focus:ring-purple-500/30 focus:border-purple-500/20',
          'leading-7 font-light',
        )}
        style={{ lineHeight: '28px' }}
      />
    </div>
  );
}
