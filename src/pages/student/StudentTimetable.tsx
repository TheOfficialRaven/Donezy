import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Plus, Pencil, Trash2, Sparkles, CheckCircle2, XCircle, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getLocalDateString } from '@/lib/dateUtils';
import {
  DEFAULT_STUDENT_SCHEDULE_SETTINGS,
  computeFreeGaps,
  dayOfWeekMondayFirst,
  dedupeWindows,
  generateStudyWindowsFromGaps,
  hasClassOverlap,
  minutesToHHMM,
  parseHHMM,
  sortClassesByTime,
  type StudentScheduleClass,
} from '@/lib/studentScheduleEngine';
import {
  addStudentStudyWindow,
  clearStudentTimetable,
  deleteStudentPrepByDate,
  deleteStudentTimetableClass,
  subscribeToStudentPrepByDate,
  subscribeToStudentScheduleSettings,
  subscribeToStudentStudyWindows,
  subscribeToStudentTimetable,
  updateStudentScheduleSettings,
  updateStudentStudyWindow,
  upsertStudentPrepByDate,
  upsertStudentTimetableClass,
  type StudentPrepItemData,
  type StudentScheduleSettingsData,
  type StudentStudyWindowData,
  type StudentTimetableClassData,
} from '@/services/databaseService';

type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const DAY_LABELS: Array<{ id: DayOfWeek; short: string; label: string }> = [
  { id: 1, short: 'H', label: 'Hétfő' },
  { id: 2, short: 'K', label: 'Kedd' },
  { id: 3, short: 'Sze', label: 'Szerda' },
  { id: 4, short: 'Cs', label: 'Csütörtök' },
  { id: 5, short: 'P', label: 'Péntek' },
  { id: 6, short: 'Szo', label: 'Szombat' },
  { id: 7, short: 'V', label: 'Vasárnap' },
];

interface ClassFormState {
  id?: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  note: string;
  importance: 'low' | 'normal' | 'high';
  energyDemand: 'easy' | 'medium' | 'hard';
}

interface PrepFormState {
  id?: string;
  subject: string;
  topic: string;
  note: string;
  priority: 'low' | 'normal' | 'high';
}

const EMPTY_CLASS_FORM: ClassFormState = {
  title: '',
  startTime: '08:00',
  endTime: '08:45',
  location: '',
  note: '',
  importance: 'normal',
  energyDemand: 'medium',
};

const EMPTY_PREP_FORM: PrepFormState = {
  subject: '',
  topic: '',
  note: '',
  priority: 'normal',
};

function toClassData(form: ClassFormState): StudentTimetableClassData {
  return {
    title: form.title.trim(),
    startTime: form.startTime,
    endTime: form.endTime,
    location: form.location.trim() || undefined,
    note: form.note.trim() || undefined,
    importance: form.importance,
    energyDemand: form.energyDemand,
  };
}

function toPrepData(form: PrepFormState): Omit<StudentPrepItemData, 'updatedAt'> {
  return {
    subject: form.subject.trim(),
    topic: form.topic.trim() || undefined,
    note: form.note.trim() || undefined,
    priority: form.priority,
  };
}

function getTomorrowDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return getLocalDateString(d);
}

function dateToDayOfWeek(dateString: string): DayOfWeek {
  return dayOfWeekMondayFirst(new Date(`${dateString}T12:00:00`)) as DayOfWeek;
}

export default function StudentTimetable() {
  const user = useAuthStore((s) => s.user);
  const { events, lists } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<DayOfWeek>(1);
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [clearWeekConfirmOpen, setClearWeekConfirmOpen] = useState(false);
  const [prepDialogOpen, setPrepDialogOpen] = useState(false);
  const [classForm, setClassForm] = useState<ClassFormState>(EMPTY_CLASS_FORM);
  const [prepForm, setPrepForm] = useState<PrepFormState>(EMPTY_PREP_FORM);

  const [settings, setSettings] = useState<StudentScheduleSettingsData>(DEFAULT_STUDENT_SCHEDULE_SETTINGS);
  const [timetable, setTimetable] = useState<Record<number, StudentScheduleClass[]>>({
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
  });

  const tomorrow = getTomorrowDateString();
  const tomorrowDay = dateToDayOfWeek(tomorrow);
  const [prepItems, setPrepItems] = useState<Array<StudentPrepItemData & { id: string }>>([]);
  const [studyWindows, setStudyWindows] = useState<Array<StudentStudyWindowData & { id: string }>>([]);

  useEffect(() => {
    if (!user) return;
    const unsubTimetable = subscribeToStudentTimetable(user.uid, (data) => {
      setTimetable({
        1: sortClassesByTime(data[1] || []),
        2: sortClassesByTime(data[2] || []),
        3: sortClassesByTime(data[3] || []),
        4: sortClassesByTime(data[4] || []),
        5: sortClassesByTime(data[5] || []),
        6: sortClassesByTime(data[6] || []),
        7: sortClassesByTime(data[7] || []),
      });
      setLoading(false);
    });
    const unsubSettings = subscribeToStudentScheduleSettings(user.uid, (value) => {
      if (value) setSettings((prev) => ({ ...prev, ...value }));
    });

    return () => {
      unsubTimetable();
      unsubSettings();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubPrep = subscribeToStudentPrepByDate(user.uid, tomorrow, (items) => setPrepItems(items));
    const unsubWindows = subscribeToStudentStudyWindows(user.uid, tomorrow, (items) => setStudyWindows(items));
    return () => {
      unsubPrep();
      unsubWindows();
    };
  }, [tomorrow, user]);

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(async () => {
      try {
        await updateStudentScheduleSettings(user.uid, settings);
      } catch {
        toast.error('A beállítások mentése most nem sikerült.');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [settings, user]);

  const currentDayClasses = useMemo(() => timetable[activeDay] || [], [activeDay, timetable]);
  const tomorrowClasses = useMemo(() => timetable[tomorrowDay] || [], [timetable, tomorrowDay]);

  const tomorrowEvents = useMemo(
    () =>
      events.filter((event) => {
        const date = new Date(event.startTime);
        return getLocalDateString(date) === tomorrow;
      }),
    [events, tomorrow]
  );

  const dueTomorrowTasksCount = useMemo(
    () =>
      lists
        .flatMap((list) => list.tasks)
        .filter((task) => !task.completed && task.dueDate && task.dueDate <= tomorrow).length,
    [lists, tomorrow]
  );

  const busyBlocksForTomorrow = useMemo(() => {
    const classBlocks = tomorrowClasses.map((item) => ({
      id: `class-${item.id}`,
      title: item.title,
      startTime: item.startTime,
      endTime: item.endTime,
    }));

    const eventBlocks = tomorrowEvents.map((event) => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      return {
        id: `event-${event.id}`,
        title: event.title,
        startTime: `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
        endTime: `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`,
      };
    });
    return sortClassesByTime([...classBlocks, ...eventBlocks]);
  }, [tomorrowClasses, tomorrowEvents]);

  const tomorrowGaps = useMemo(
    () => computeFreeGaps(busyBlocksForTomorrow, settings.dayStart, settings.dayEnd),
    [busyBlocksForTomorrow, settings.dayStart, settings.dayEnd]
  );

  const tomorrowGeneratedWindows = useMemo(
    () =>
      generateStudyWindowsFromGaps(
        tomorrowGaps.filter((gap) => gap.durationMinutes >= settings.minGapMinutes),
        settings
      ),
    [settings, tomorrowGaps]
  );

  useEffect(() => {
    if (!user || loading) return;
    const toCreate = dedupeWindows(
      studyWindows.map((w) => ({ startISO: w.startISO, endISO: w.endISO })),
      tomorrowGeneratedWindows
    );
    if (toCreate.length === 0) return;

    (async () => {
      try {
        for (const item of toCreate) {
          const now = Date.now();
          await addStudentStudyWindow(user.uid, tomorrow, {
            startISO: new Date(`${tomorrow}T${minutesToHHMM(item.startMinutes)}:00`).toISOString(),
            endISO: new Date(`${tomorrow}T${minutesToHHMM(item.endMinutes)}:00`).toISOString(),
            type: item.type,
            suggestedMinutes: item.suggestedMinutes,
            source: 'auto-gap',
            status: 'suggested',
            createdAt: now,
            updatedAt: now,
          });
        }
      } catch {
        toast.error('A holnapi tanulási ablakok mentése most nem sikerült.');
      }
    })();
  }, [loading, studyWindows, tomorrow, tomorrowGeneratedWindows, user]);

  const hourRows = useMemo(() => {
    const start = parseHHMM(settings.dayStart);
    const end = parseHHMM(settings.dayEnd);
    const rows: number[] = [];
    for (let minute = start; minute < end; minute += 60) rows.push(minute);
    return rows;
  }, [settings.dayEnd, settings.dayStart]);

  const saveClass = async () => {
    if (!user) return;
    if (!classForm.title.trim()) {
      toast.error('Adj meg tantárgy nevet.');
      return;
    }
    if (classForm.endTime <= classForm.startTime) {
      toast.error('A befejezés legyen később, mint a kezdés.');
      return;
    }
    const overlap = hasClassOverlap(currentDayClasses, {
      id: classForm.id,
      startTime: classForm.startTime,
      endTime: classForm.endTime,
    });
    if (overlap) {
      toast.warning('Időbeli ütközést találtam. Menthető, de javasolt ellenőrizni.');
    }

    try {
      await upsertStudentTimetableClass(user.uid, activeDay, toClassData(classForm), classForm.id);
      toast.success(classForm.id ? 'Óra frissítve.' : 'Óra hozzáadva.');
      setClassForm(EMPTY_CLASS_FORM);
      setClassDialogOpen(false);
    } catch {
      toast.error('Az óra mentése most nem sikerült.');
    }
  };

  const openClassEditor = (day: DayOfWeek, item?: StudentScheduleClass, defaultStart?: string) => {
    setActiveDay(day);
    if (item) {
      setClassForm({
        id: item.id,
        title: item.title,
        startTime: item.startTime,
        endTime: item.endTime,
        location: item.location || '',
        note: item.note || '',
        importance: item.importance || 'normal',
        energyDemand: item.energyDemand || 'medium',
      });
    } else {
      const startTime = defaultStart || '08:00';
      const endMinutes = Math.min(parseHHMM(startTime) + 45, parseHHMM(settings.dayEnd));
      setClassForm({
        ...EMPTY_CLASS_FORM,
        startTime,
        endTime: minutesToHHMM(endMinutes),
      });
    }
    setClassDialogOpen(true);
  };

  const deleteClass = async (id: string) => {
    if (!user) return;
    try {
      await deleteStudentTimetableClass(user.uid, activeDay, id);
      toast.success('Óra törölve.');
    } catch {
      toast.error('A törlés most nem sikerült.');
    }
  };

  const clearWeek = async () => {
    if (!user) return;
    try {
      await clearStudentTimetable(user.uid);
      toast.success('Az órarend törölve. Most tiszta lappal indulhatsz.');
    } catch {
      toast.error('Az órarend ürítése most nem sikerült.');
    }
  };

  const copyMondayToWeek = async () => {
    if (!user) return;
    const monday = timetable[1] || [];
    if (monday.length === 0) {
      toast.message('Hétfőn még nincs rögzített óra.');
      return;
    }
    try {
      for (const day of [2, 3, 4, 5, 6, 7] as DayOfWeek[]) {
        for (const item of monday) {
          await upsertStudentTimetableClass(user.uid, day, {
            title: item.title,
            startTime: item.startTime,
            endTime: item.endTime,
            location: item.location,
            note: item.note,
            importance: item.importance || 'normal',
            energyDemand: item.energyDemand || 'medium',
          });
        }
      }
      toast.success('A hétfői órák átmásolva a hét többi napjára.');
    } catch {
      toast.error('A másolás most nem sikerült.');
    }
  };

  const savePrepItem = async () => {
    if (!user) return;
    if (!prepForm.subject.trim()) {
      toast.error('Adj meg tantárgyat.');
      return;
    }
    try {
      await upsertStudentPrepByDate(user.uid, tomorrow, toPrepData(prepForm), prepForm.id);
      toast.success(prepForm.id ? 'Felkészülési elem frissítve.' : 'Felkészülési elem hozzáadva.');
      setPrepForm(EMPTY_PREP_FORM);
      setPrepDialogOpen(false);
    } catch {
      toast.error('A mentés most nem sikerült.');
    }
  };

  const deletePrepItem = async (id: string) => {
    if (!user) return;
    try {
      await deleteStudentPrepByDate(user.uid, tomorrow, id);
      toast.success('Felkészülési elem törölve.');
    } catch {
      toast.error('A törlés most nem sikerült.');
    }
  };

  const updateWindowStatus = async (id: string, status: StudentStudyWindowData['status']) => {
    if (!user) return;
    try {
      await updateStudentStudyWindow(user.uid, tomorrow, id, { status });
      if (status === 'accepted') toast.success('Tanulási ablak elfogadva.');
      if (status === 'dismissed') toast.message('Rendben, ezt a blokkot most kihagyjuk.');
      if (status === 'completed') toast.success('Készre jelölve.');
    } catch {
      toast.error('Az állapot frissítése most nem sikerült.');
    }
  };

  const suggested = studyWindows
    .filter((item) => item.status === 'suggested')
    .sort((a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime());
  const accepted = studyWindows
    .filter((item) => item.status === 'accepted')
    .sort((a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime());

  const tomorrowHeadline = tomorrowClasses.find((item) => item.importance === 'high')
    ? `Holnap kiemelt tárgyad: ${tomorrowClasses.find((item) => item.importance === 'high')?.title}.`
    : tomorrowClasses.length >= 4
      ? 'Sűrű holnapi nap: egy rövid, fókuszált felkészülési blokk már sokat segít.'
      : tomorrowClasses.length === 0
        ? 'Holnap rugalmasabb nap: itt az idő előre dolgozni.'
        : 'Holnapra stabil ütemezéssel tudsz készülni.';

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold text-text-primary">Heti órarend</h1>
        <p className="text-text-secondary">
          Töltsd ki a heti órarendedet, és a rendszer holnapra automatikusan felkészülési tervet és tanulási időablakokat ajánl.
        </p>
      </div>

      <Card className="glass p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          <Button className="bg-primary hover:bg-primary/90 text-surface-0" onClick={() => setClassDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Óra hozzáadása
          </Button>
          <Button variant="outline" className="border-white/20" onClick={copyMondayToWeek}>
            Hétfő másolása
          </Button>
          <Button variant="outline" className="border-white/20" onClick={() => setClearWeekConfirmOpen(true)}>
            Üres hét
          </Button>
        </div>
      </Card>

      <Card className="glass p-0 overflow-x-auto">
        <div className="min-w-[980px]">
          <div className="grid" style={{ gridTemplateColumns: `100px repeat(7, minmax(110px, 1fr))` }}>
            <div className="border-b border-r border-white/10 p-3 text-xs text-text-muted">Idő</div>
            {DAY_LABELS.map((day) => (
              <div key={day.id} className="border-b border-r border-white/10 p-3 text-sm font-medium text-text-primary text-center">
                {day.label}
              </div>
            ))}
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={`sk-${i}`} className="col-span-8 p-3">
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))
              : hourRows.map((hourStart) => (
                  <div className="contents" key={hourStart}>
                    <div className="border-b border-r border-white/10 p-2 text-xs text-text-muted">{minutesToHHMM(hourStart)}</div>
                    {DAY_LABELS.map((day) => {
                      const hourEnd = hourStart + 60;
                      const items = (timetable[day.id] || []).filter((item) => {
                        const start = parseHHMM(item.startTime);
                        const end = parseHHMM(item.endTime);
                        return start < hourEnd && end > hourStart;
                      });
                      return (
                        <div
                          key={`${day.id}-${hourStart}`}
                          className="border-b border-r border-white/10 p-1 min-h-[52px] hover:bg-white/5 transition-colors cursor-pointer"
                          onClick={() => openClassEditor(day.id, undefined, minutesToHHMM(hourStart))}
                          title="Kattints új óra hozzáadásához"
                        >
                          <div className="space-y-1">
                            {items.map((item) => (
                              <div
                                key={item.id}
                                className="rounded bg-primary/15 border border-primary/25 px-1.5 py-1 hover:bg-primary/25"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openClassEditor(day.id, item);
                                }}
                                title="Kattints a szerkesztéshez"
                              >
                                <p className="text-[11px] leading-4 text-text-primary font-medium">{item.title}</p>
                                <p className="text-[10px] text-text-muted">{item.startTime}-{item.endTime}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
          </div>
        </div>
      </Card>

      <Card className="glass p-4 sm:p-5">
        <Tabs value={String(activeDay)} onValueChange={(value) => setActiveDay(Number(value) as DayOfWeek)}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {DAY_LABELS.map((day) => (
              <TabsTrigger key={day.id} value={String(day.id)}>
                {day.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {DAY_LABELS.map((day) => (
            <TabsContent key={day.id} value={String(day.id)} className="pt-3">
              {(timetable[day.id] || []).length === 0 ? (
                <p className="text-sm text-text-muted">Még nincs rögzített óra ezen a napon.</p>
              ) : (
                <div className="space-y-2">
                  {sortClassesByTime(timetable[day.id] || []).map((item) => (
                    <Card key={item.id} className="bg-surface-1/35 border border-white/10 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-text-primary">{item.title}</p>
                          <p className="text-sm text-text-muted">
                            {item.startTime} - {item.endTime}
                            {item.location ? ` • ${item.location}` : ''}
                          </p>
                          {item.note && <p className="text-sm text-text-secondary">{item.note}</p>}
                          <div className="flex gap-2 mt-2">
                            <Badge className="bg-primary/15 text-primary border-primary/25">{item.importance || 'normal'}</Badge>
                            <Badge variant="outline" className="border-white/20 text-text-muted">
                              {item.energyDemand || 'medium'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openClassEditor(day.id, item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-danger" onClick={() => deleteClass(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </Card>

      <Card className="glass p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-heading font-semibold text-text-primary">Holnapi felkészülési terv</h2>
            <p className="text-sm text-text-secondary mt-1">{tomorrowHeadline}</p>
          </div>
          <Badge variant="outline" className="border-white/20 text-text-muted">
            {new Date(`${tomorrow}T12:00:00`).toLocaleDateString('hu-HU', { month: 'long', day: 'numeric', weekday: 'long' })}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-text-muted">
          <div>Holnapi órák: {tomorrowClasses.length}</div>
          <div>Fix események: {tomorrowEvents.length}</div>
          <div>Függő feladatok: {dueTomorrowTasksCount}</div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-primary">Mire készülj holnapra?</h3>
            <Button
              size="sm"
              variant="outline"
              className="border-white/20"
              onClick={() => {
                setPrepForm(EMPTY_PREP_FORM);
                setPrepDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Elem hozzáadása
            </Button>
          </div>
          {prepItems.length === 0 ? (
            <p className="text-sm text-text-muted">Adj hozzá tantárgyanként rövid felkészülési pontokat. Ezek külön vannak az órarendtől.</p>
          ) : (
            prepItems.map((item) => (
              <Card key={item.id} className="bg-surface-1/35 border border-white/10 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-text-primary">{item.subject}</p>
                    {item.topic && <p className="text-sm text-text-secondary">Tananyag: {item.topic}</p>}
                    {item.note && <p className="text-sm text-text-muted">{item.note}</p>}
                    <Badge className="mt-2 bg-primary/15 text-primary border-primary/25">{item.priority || 'normal'}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setPrepForm({
                          id: item.id,
                          subject: item.subject,
                          topic: item.topic || '',
                          note: item.note || '',
                          priority: item.priority || 'normal',
                        });
                        setPrepDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-danger" onClick={() => deletePrepItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>

      <Card className="glass p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-heading font-semibold text-text-primary">Ajánlott tanulási ablakok holnapra</h2>
        </div>
        <p className="text-sm text-text-secondary">
          A javaslatok figyelembe veszik a holnapi órákat, fix eseményeket, és a teendőid terhelését.
        </p>

        <div className="space-y-2">
          {suggested.length === 0 ? (
            <p className="text-sm text-text-muted">Nincs új javasolt ablak. Ez teljesen rendben van egy sűrű nap előtt.</p>
          ) : (
            suggested.map((item) => (
              <Card key={item.id} className="bg-surface-1/35 border border-white/10 p-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm text-text-primary">
                      {new Date(item.startISO).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(item.endISO).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="border-white/20 text-text-muted">{item.type}</Badge>
                      <span className="text-xs text-text-muted">{item.suggestedMinutes} perc</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-surface-0" onClick={() => updateWindowStatus(item.id, 'accepted')}>
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Elfogadom
                    </Button>
                    <Button size="sm" variant="outline" className="border-white/20" onClick={() => updateWindowStatus(item.id, 'dismissed')}>
                      <XCircle className="h-4 w-4 mr-1" />
                      Ma nem
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-2 pt-1">
          <h3 className="text-sm font-medium text-text-primary">Elfogadott ablakok</h3>
          {accepted.length === 0 ? (
            <p className="text-sm text-text-muted">Még nincs elfogadott tanulási ablak.</p>
          ) : (
            accepted.map((item) => (
              <Card key={item.id} className="bg-surface-1/35 border border-white/10 p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-text-primary">
                    {new Date(item.startISO).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })} -{' '}
                    {new Date(item.endISO).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-text-muted">{item.suggestedMinutes} perc</p>
                </div>
                <Button size="sm" className="bg-emerald-500 hover:bg-emerald-500/90 text-surface-0" onClick={() => updateWindowStatus(item.id, 'completed')}>
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Kész
                </Button>
              </Card>
            ))
          )}
        </div>
      </Card>

      <Card className="glass p-4 sm:p-5 space-y-3">
        <h2 className="text-lg font-heading font-semibold text-text-primary flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          Órarend motor beállítások
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label>Napi kezdés</Label>
            <Input type="time" value={settings.dayStart} onChange={(e) => setSettings((p) => ({ ...p, dayStart: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Napi zárás</Label>
            <Input type="time" value={settings.dayEnd} onChange={(e) => setSettings((p) => ({ ...p, dayEnd: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Min. gap (perc)</Label>
            <Input type="number" value={settings.minGapMinutes} onChange={(e) => setSettings((p) => ({ ...p, minGapMinutes: Number(e.target.value || 0) }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Preferált ablak</Label>
            <Input
              type="number"
              value={settings.preferredStudyWindowMinutes}
              onChange={(e) => setSettings((p) => ({ ...p, preferredStudyWindowMinutes: Number(e.target.value || 0) }))}
            />
          </div>
        </div>
      </Card>

      <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
        <DialogContent className="bg-surface-1 border border-white/10 text-text-primary max-w-xl">
          <DialogHeader>
            <DialogTitle>{classForm.id ? 'Óra szerkesztése' : 'Új óra hozzáadása'}</DialogTitle>
            <DialogDescription className="text-text-secondary">
              Rögzítsd az órát egyszer, a rendszer utána segít tervezni.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Tantárgy / óra neve</Label>
              <Input value={classForm.title} onChange={(e) => setClassForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Kezdés</Label>
                <Input type="time" value={classForm.startTime} onChange={(e) => setClassForm((p) => ({ ...p, startTime: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Vég</Label>
                <Input type="time" value={classForm.endTime} onChange={(e) => setClassForm((p) => ({ ...p, endTime: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Helyszín</Label>
              <Input value={classForm.location} onChange={(e) => setClassForm((p) => ({ ...p, location: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Jegyzet</Label>
              <Textarea value={classForm.note} onChange={(e) => setClassForm((p) => ({ ...p, note: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Fontosság</Label>
                <Select value={classForm.importance} onValueChange={(value: 'low' | 'normal' | 'high') => setClassForm((p) => ({ ...p, importance: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Alacsony</SelectItem>
                    <SelectItem value="normal">Normál</SelectItem>
                    <SelectItem value="high">Magas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Energiaigény</Label>
                <Select
                  value={classForm.energyDemand}
                  onValueChange={(value: 'easy' | 'medium' | 'hard') => setClassForm((p) => ({ ...p, energyDemand: value }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Könnyű</SelectItem>
                    <SelectItem value="medium">Közepes</SelectItem>
                    <SelectItem value="hard">Nehéz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setClassDialogOpen(false)}>Mégse</Button>
              <Button className="bg-primary hover:bg-primary/90 text-surface-0" onClick={saveClass}>Mentés</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={clearWeekConfirmOpen} onOpenChange={setClearWeekConfirmOpen}>
        <AlertDialogContent className="bg-surface-1 border border-white/10 text-text-primary">
          <AlertDialogHeader>
            <AlertDialogTitle>Biztosan törlöd a teljes heti órarendet?</AlertDialogTitle>
            <AlertDialogDescription className="text-text-secondary">
              Ez a művelet az összes nap összes óráját törli. Ha nem ez volt a cél, inkább válaszd a megszakítást.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 bg-transparent text-text-primary hover:bg-white/10">
              Mégse
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger hover:bg-danger/90 text-white"
              onClick={clearWeek}
            >
              Igen, törlöm a hetet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={prepDialogOpen} onOpenChange={setPrepDialogOpen}>
        <DialogContent className="bg-surface-1 border border-white/10 text-text-primary max-w-lg">
          <DialogHeader>
            <DialogTitle>{prepForm.id ? 'Felkészülési pont szerkesztése' : 'Új felkészülési pont'}</DialogTitle>
            <DialogDescription className="text-text-secondary">
              Ez a rész tantárgyankénti felkészüléshez van, az órarend soraitól külön.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Tantárgy</Label>
              <Input value={prepForm.subject} onChange={(e) => setPrepForm((p) => ({ ...p, subject: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Tananyag</Label>
              <Input value={prepForm.topic} onChange={(e) => setPrepForm((p) => ({ ...p, topic: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Megjegyzés</Label>
              <Textarea value={prepForm.note} onChange={(e) => setPrepForm((p) => ({ ...p, note: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Prioritás</Label>
              <Select value={prepForm.priority} onValueChange={(value: 'low' | 'normal' | 'high') => setPrepForm((p) => ({ ...p, priority: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Alacsony</SelectItem>
                  <SelectItem value="normal">Normál</SelectItem>
                  <SelectItem value="high">Magas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setPrepDialogOpen(false)}>Mégse</Button>
              <Button className="bg-primary hover:bg-primary/90 text-surface-0" onClick={savePrepItem}>Mentés</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
