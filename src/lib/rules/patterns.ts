import type { FocusArea } from '@/lib/focusAreas';

export interface ReflectionSignal {
  date: string;
  mood: number;
}

export interface PatternInput {
  focusAreaCounts: Record<FocusArea, number>;
  reflectionSignals: ReflectionSignal[];
  completionHours: number[];
  upcomingEventTitles: string[];
  upcomingEventsCount: number;
  hasUrgent: boolean;
  overloaded: boolean;
  hasEventSoon: boolean;
  overdueItemsCount: number;
  dueSoonItemsCount: number;
  highPriorityOpenTasks: number;
  completedItems7d: number;
  completionTrend: 'up' | 'down' | 'stable';
  preferredActiveTime?: 'morning' | 'afternoon' | 'evening';
  userChallenge?: string;
}

export interface PatternInsight {
  daily: string;
  weekly: string;
  coach: string;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function areaLabel(areaKey: string): string {
  if (areaKey === 'tudat') return 'Tudat';
  if (areaKey === 'test') return 'Test';
  if (areaKey === 'munka_tanulas') return 'Munka / Tanulás';
  if (areaKey === 'otthon') return 'Otthon';
  if (areaKey === 'kapcsolatok') return 'Kapcsolatok';
  return areaKey;
}

function inferredActiveTimeFromHours(hours: number[]): 'morning' | 'afternoon' | 'evening' | null {
  if (hours.length === 0) return null;
  const hourAvg = avg(hours);
  if (hourAvg < 12) return 'morning';
  if (hourAvg < 18) return 'afternoon';
  return 'evening';
}

export function buildPatternInsight(input: PatternInput): PatternInsight {
  const topAreas = Object.entries(input.focusAreaCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key]) => areaLabel(key));

  const moodAvg = avg(input.reflectionSignals.map((r) => r.mood));
  const observedActiveTime = inferredActiveTimeFromHours(input.completionHours);
  const normalizedUpcoming = input.upcomingEventTitles.join(' ').toLowerCase();
  const hasMeetingLikeEvent =
    normalizedUpcoming.includes('meeting') ||
    normalizedUpcoming.includes('megbesz') ||
    normalizedUpcoming.includes('vizsga') ||
    normalizedUpcoming.includes('interju') ||
    normalizedUpcoming.includes('prezent');

  let daily: string;
  if (hasMeetingLikeEvent && input.hasEventSoon) {
    daily =
      'Közeledik egy fontos eseményed. Most az segíthet a legtöbbet, ha 5 percben tisztázod a célt, a 2-3 kulcspontot és a következő konkrét lépést.';
  } else if (input.overloaded) {
    daily =
      'A mai terhelésed magasnak tűnik. A stabil haladáshoz érdemes 1-2 kulcslépésre szűkíteni a fókuszt, és tudatos pihenőablakot beiktatni.';
  } else if (input.highPriorityOpenTasks > 0) {
    daily =
      'Van nyitott magas prioritású feladatod. Javasolt ezzel kezdeni, mert ez adja ma a legnagyobb tehermentesítő hatást.';
  } else if (input.overdueItemsCount > 0) {
    daily =
      'Található lejárt tétel a listában. Egy gyors, célzott lezárás most tisztább fókuszt adhat a nap további részére.';
  } else if (!input.hasUrgent && input.upcomingEventsCount === 0) {
    daily =
      'Ma nem látszik kritikus időnyomás. Ez kiváló alkalom a fontos, de nem sürgős feladatok előkészítésére vagy mélyebb fókuszmunkára.';
  } else if (moodAvg <= 2.5) {
    daily =
      'Úgy tűnik, ma érzékenyebb napod lehet. Kisebb, biztosan zárható lépésekben haladva kiegyensúlyozottabb maradhat a napod.';
  } else {
    daily =
      'Úgy tűnik, ma jó alapod van a haladáshoz. Kezdj egy rövid, nagy hatású lépéssel, majd haladj a következő legfontosabb elemre.';
  }

  let weekly = 'Ezen a héten változatos fókuszterületeken haladtál, ami jó egyensúlyt jelez.';
  if (topAreas.length === 2) {
    weekly = `Ezen a héten főként erre figyeltél: ${topAreas[0]} és ${topAreas[1]}.`;
  }
  if (input.completionTrend === 'up') {
    weekly += ' A heti ritmusod erősödik, ez jó alap a következő napokra.';
  } else if (input.completionTrend === 'down') {
    weekly += ' Kisebb visszaesés látszik; most segíthet a napi terhelés finom visszaskálázása.';
  }
  if (observedActiveTime === 'evening') weekly += ' Úgy tűnik, este könnyebben haladsz.';
  if (observedActiveTime === 'morning') weekly += ' Úgy tűnik, délelőtt vagy a leghatékonyabb.';

  let coach: string;
  if (hasMeetingLikeEvent && input.hasEventSoon) {
    coach =
      'Asszisztens javaslat: a közelgő esemény előtt készíts rövid felkészülési vázlatot (cél, kulcsüzenet, nyitó lépés). Ez csökkenti a mentális terhelést és növeli a kontrollérzetet.';
  } else if (input.overloaded) {
    coach =
      'Asszisztens javaslat: ütemezz át 1-2 nem sürgős tételt, és tervezz be egy rövid regeneráló szünetet. Így fenntarthatóbb marad a teljesítményed.';
  } else if (input.userChallenge === 'priorities') {
    coach =
      'Asszisztens javaslat: ma egyetlen fő prioritást jelölj ki, majd a többi teendőt “később ma” és “később ezen a héten” listára bontsd.';
  } else if (input.userChallenge === 'focus') {
    coach =
      'Asszisztens javaslat: dolgozz 25-30 perces fókuszblokkokban, köztük rövid átmeneti szünettel. Ez segíthet csökkenteni a szétszórtságot.';
  } else if (input.userChallenge === 'motivation') {
    coach =
      'Asszisztens javaslat: kezdd a napot egy gyors, biztosan teljesíthető feladattal. A korai siker lendületet ad a nehezebb tételekhez.';
  } else if (input.userChallenge === 'routine') {
    coach =
      'Asszisztens javaslat: rögzíts egy minimum rutint (egy rövid, minden nap elvégezhető lépés). A stabilitás most fontosabb a mennyiségnél.';
  } else if (input.preferredActiveTime && observedActiveTime && input.preferredActiveTime !== observedActiveTime) {
    coach =
      'Asszisztens javaslat: a tényleges aktivitási mintád eltér a beállított idősávtól. Érdemes a legfontosabb feladatokat arra az időablakra tenni, amikor valójában jobban haladsz.';
  } else if (!input.hasUrgent && input.upcomingEventsCount === 0) {
    coach =
      'Asszisztens javaslat: használd ki a nyugodtabb sávot egy fontos, hosszú távú feladat előkészítésére. Ez később jelentősen csökkentheti a sürgős terhelést.';
  } else if (input.dueSoonItemsCount > 0) {
    coach =
      'Asszisztens javaslat: a közelgő határidős tételek közül válassz ki egyet, és haladj benne most 15-20 percet. A korai előrelépés csökkenti a napi nyomást.';
  } else if (input.completedItems7d >= 8) {
    coach =
      'Asszisztens javaslat: az elmúlt napok teljesítménye alapján jó ritmusban vagy. Most érdemes a tempó megtartására és a túlterhelés megelőzésére figyelni.';
  } else if (input.completedItems7d <= 2) {
    coach =
      'Asszisztens javaslat: jelenleg kisebb az aktivitás, ezért most a belépési küszöb csökkentése segíthet a legtöbbet: egy rövid, biztosan teljesíthető lépéssel érdemes kezdeni.';
  } else {
    coach =
      'Asszisztens javaslat: jelölj ki egy fő fókuszt a napra, és záráskor röviden értékeld, mi segített a haladásban. Ez gyorsan javítja az önismereti pontosságot.';
  }

  return { daily, weekly, coach };
}
