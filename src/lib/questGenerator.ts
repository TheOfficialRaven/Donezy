import type { Quest, TodoList, UserStats } from '@/stores/useAppStore';
import { getLocalSundayOfWeek } from '@/lib/dateUtils';

// ============ TYPES ============

interface QuestTemplate {
  id: string;
  titles: string[];
  descriptions: string[];
  category: string;
  baseDifficulty: 'easy' | 'medium' | 'hard' | 'epic';
  baseTime: number;
  personas: string[];
  dayPreference?: number[];
  keywords: string[];
  frequency: 'daily' | 'weekly';
  // Progress-based quest support (for weekly quests that auto-track progress)
  trackingType?: 'tasks_completed' | 'quests_completed' | 'notes_created';
  baseTargetCount?: number; // base target count, scales with level
}

// ============ SEEDED RANDOM ============

function createRng(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

// ============ HABIT KEYWORD ANALYSIS ============

const HABIT_KEYWORDS: Record<string, string[]> = {
  Produktivitás: ['munka', 'feladat', 'projekt', 'email', 'deadline', 'határidő', 'prezentáció', 'report', 'megbeszélés', 'fókusz'],
  Egészség: ['sport', 'edzés', 'futás', 'séta', 'mozgás', 'alvás', 'víz', 'étel', 'egészség', 'torna', 'jóga'],
  Tanulás: ['tanul', 'olvas', 'kurzus', 'vizsga', 'lecke', 'könyv', 'jegyzet', 'képzés', 'gyakorl', 'nyelv'],
  Szociális: ['barát', 'család', 'találkozó', 'hívás', 'meeting', 'kapcsolat', 'összejövetel'],
  Kreativitás: ['ír', 'rajz', 'zene', 'fotó', 'design', 'terv', 'ötlet', 'alkotás', 'blog', 'videó'],
  Szervezés: ['takarít', 'rend', 'szervez', 'tervez', 'bevásárl', 'tisztít', 'pakol', 'rendez', 'lista'],
  Fejlődés: ['szokás', 'rutin', 'cél', 'meditáci', 'napló', 'hála', 'olvas'],
};

// ============ QUEST TEMPLATES ============
// Every template is assigned to specific personas only.
// daily = quick routine tasks for the day
// weekly = larger challenges that span the week

const TEMPLATES: QuestTemplate[] = [
  // ═══════════════════════════════════════
  //  STUDENT — DIÁK
  // ═══════════════════════════════════════

  // --- Daily ---
  {
    id: 's_study_block',
    titles: ['Tanulási blokk', 'Koncentrált tanulás', '45 perc tanulás'],
    descriptions: ['Tanulj megszakítás nélkül 45 percig egy adott tantárgyból.', 'Végezz el egy mélytanulási blokkot teljes fókusszal.'],
    category: 'Tanulás',
    baseDifficulty: 'medium',
    baseTime: 45,
    personas: ['student'],
    keywords: ['tanul', 'vizsga', 'lecke'],
    frequency: 'daily',
  },
  {
    id: 's_review_notes',
    titles: ['Jegyzetek átnézése', 'Napi ismétlés', 'Jegyzet összefoglalás'],
    descriptions: ['Tekintsd át a mai/tegnapi jegyzeteidet és emeld ki a lényeget.', 'Készíts rövid összefoglalót a legutóbbi tananyagból.'],
    category: 'Tanulás',
    baseDifficulty: 'easy',
    baseTime: 20,
    personas: ['student'],
    keywords: ['jegyzet', 'ismétlés'],
    frequency: 'daily',
  },
  {
    id: 's_flashcards',
    titles: ['Kártyás ismétlés', 'Flashcard gyakorlás', 'Aktív felidézés'],
    descriptions: ['Gyakorolj flashcard-okkal 20 percig a tananyag rögzítéséhez.', 'Használj aktív felidézési technikát a memorizáláshoz.'],
    category: 'Tanulás',
    baseDifficulty: 'easy',
    baseTime: 20,
    personas: ['student'],
    keywords: ['kártya', 'ismétlés'],
    frequency: 'daily',
  },
  {
    id: 's_class_prep',
    titles: ['Órai felkészülés', 'Holnapi anyag átnézése', 'Előzetes olvasás'],
    descriptions: ['Olvasd el a következő órára kijelölt anyagot előre.', 'Készülj fel a holnapi előadásra az anyag átnézésével.'],
    category: 'Tanulás',
    baseDifficulty: 'easy',
    baseTime: 25,
    personas: ['student'],
    keywords: ['óra', 'felkészülés', 'olvas'],
    frequency: 'daily',
  },
  {
    id: 's_homework',
    titles: ['Házi feladat', 'Napi feladatok elvégzése', 'Feladatlap megoldása'],
    descriptions: ['Dolgozz a kijelölt házi feladatokon.', 'Haladj a beadandó feladataiddal.'],
    category: 'Tanulás',
    baseDifficulty: 'medium',
    baseTime: 40,
    personas: ['student'],
    keywords: ['házi', 'feladat'],
    frequency: 'daily',
  },
  {
    id: 's_plan_day',
    titles: ['Napi tanulási terv', 'Tanulás ütemezés', 'Mai feladatok listázása'],
    descriptions: ['Tervezd meg mit fogsz ma tanulni és mennyi időt szánsz rá.', 'Írd össze a mai tanulási céljaidat sorrendben.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['student'],
    keywords: ['terv', 'nap'],
    frequency: 'daily',
  },
  {
    id: 's_active_break',
    titles: ['Aktív tanulási szünet', 'Mozgás a tanulás között', 'Frissítő szünet'],
    descriptions: ['Tarts 10 perc aktív szünetet tanulási blokkok között.', 'Sétálj, nyújtózz vagy tornázz kicsit a hatékonyabb tanulásért.'],
    category: 'Egészség',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['student'],
    keywords: ['szünet', 'mozgás'],
    frequency: 'daily',
  },

  // --- Weekly ---
  {
    id: 's_exam_plan',
    titles: ['Vizsgafelkészülési terv', 'Vizsga stratégia kidolgozása', 'Felkészülési ütemterv'],
    descriptions: ['Készíts részletes felkészülési tervet a következő vizsgádra.', 'Oszd be a tananyagot a vizsgáig hátralévő napokra.'],
    category: 'Szervezés',
    baseDifficulty: 'medium',
    baseTime: 30,
    personas: ['student'],
    keywords: ['vizsga', 'terv'],
    frequency: 'weekly',
  },
  {
    id: 's_assignment_week',
    titles: ['Beadandó befejezése', 'Projekt mérföldkő elérése', 'Nagydolgozat haladás'],
    descriptions: ['Érj el egy jelentős mérföldkövet a beadandódban ezen a héten.', 'Fejezz be egy fontos részt a projekt feladatodból.'],
    category: 'Tanulás',
    baseDifficulty: 'hard',
    baseTime: 120,
    personas: ['student'],
    keywords: ['beadandó', 'projekt'],
    frequency: 'weekly',
  },
  {
    id: 's_group_study',
    titles: ['Csoportos tanulás szervezése', 'Közös felkészülés', 'Tanulókör'],
    descriptions: ['Szervezz vagy vegyél részt egy csoportos tanulási alkalmon.', 'Tanulj együtt az osztálytársaiddal egy nehéz témából.'],
    category: 'Szociális',
    baseDifficulty: 'medium',
    baseTime: 90,
    personas: ['student'],
    keywords: ['csoport', 'közös'],
    frequency: 'weekly',
  },
  {
    id: 's_weekly_review',
    titles: ['Heti tanulás értékelés', 'Heti haladás áttekintése', 'Tanulmányi összegzés'],
    descriptions: ['Tekintsd át mit tanultál ezen a héten és mit kell ismételni.', 'Értékeld a heti tanulmányi haladásodat és tervezd a következő hetet.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 20,
    personas: ['student'],
    keywords: ['heti', 'értékel'],
    frequency: 'weekly',
  },
  {
    id: 's_deep_topic',
    titles: ['Egy téma mély feldolgozása', 'Kutatás és megértés', 'Mélyebb tudás szerzése'],
    descriptions: ['Válassz egy nehéz témát és dolgozd fel alaposan extra forrásokkal.', 'Menj túl a tananyagon és értsd meg egy témát mélyen.'],
    category: 'Tanulás',
    baseDifficulty: 'hard',
    baseTime: 90,
    personas: ['student'],
    keywords: ['kutatás', 'téma'],
    frequency: 'weekly',
  },

  // ═══════════════════════════════════════
  //  WORKER — DOLGOZÓ FIATAL
  // ═══════════════════════════════════════

  // --- Daily ---
  {
    id: 'w_morning_plan',
    titles: ['Reggeli tervezés', 'Napi prioritások', 'Top 3 feladat meghatározása'],
    descriptions: ['Határozd meg a nap 3 legfontosabb feladatát és kezdj velük.', 'Tervezd meg a napodat a legfontosabb teendők köré.'],
    category: 'Produktivitás',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['worker'],
    keywords: ['terv', 'prioritás', 'reggel'],
    frequency: 'daily',
  },
  {
    id: 'w_deep_focus',
    titles: ['Mélymunka blokk', 'Koncentrált munkamenet', 'Fókusz idő'],
    descriptions: ['Végezz 45 perc megszakítás nélküli mélymunkát.', 'Kapcsold ki az értesítéseket és dolgozz egy kiemelt feladaton.'],
    category: 'Produktivitás',
    baseDifficulty: 'medium',
    baseTime: 45,
    personas: ['worker'],
    keywords: ['fókusz', 'munka'],
    frequency: 'daily',
  },
  {
    id: 'w_inbox',
    titles: ['Email feldolgozás', 'Inbox rendezés', 'Üzenetek megválaszolása'],
    descriptions: ['Dolgozd fel a bejövő emaileket és üzeneteket hatékonyan.', 'Válaszolj a függő emailekre és tartsd rendben az inboxodat.'],
    category: 'Produktivitás',
    baseDifficulty: 'easy',
    baseTime: 20,
    personas: ['worker'],
    dayPreference: [1, 2, 3, 4, 5],
    keywords: ['email', 'üzenet'],
    frequency: 'daily',
  },
  {
    id: 'w_meeting_prep',
    titles: ['Meeting előkészítés', 'Megbeszélés felkészülés', 'Agenda átgondolása'],
    descriptions: ['Készülj fel a mai megbeszélésekre: nézd át az agendát és céljaidat.', 'Gondold végig mit akarsz elérni a mai meetingeken.'],
    category: 'Produktivitás',
    baseDifficulty: 'easy',
    baseTime: 15,
    personas: ['worker'],
    dayPreference: [1, 2, 3, 4, 5],
    keywords: ['meeting', 'megbeszélés'],
    frequency: 'daily',
  },
  {
    id: 'w_task_sprint',
    titles: ['Feladat sprint', 'Gyors feladatok ledolgozása', 'Admin blokk'],
    descriptions: ['Végezd el az apróbb, gyorsan megoldható feladatokat egy blokkban.', 'Csoportosítsd és hajtsd végre a rövid adminisztratív teendőket.'],
    category: 'Produktivitás',
    baseDifficulty: 'medium',
    baseTime: 30,
    personas: ['worker'],
    keywords: ['feladat', 'admin'],
    frequency: 'daily',
  },
  {
    id: 'w_eod_review',
    titles: ['Nap végi összegzés', 'Holnap előkészítése', 'Napi zárás'],
    descriptions: ['Tekintsd át mit végeztél el ma és jegyezd fel a holnapi teendőket.', 'Zárd le a napodat rendezetten és tervezd a holnapot.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['worker'],
    dayPreference: [1, 2, 3, 4, 5],
    keywords: ['összegzés', 'holnap'],
    frequency: 'daily',
  },
  {
    id: 'w_real_break',
    titles: ['Valódi ebédszünet', 'Regeneráló szünet', 'Levegőzés'],
    descriptions: ['Tarts igazi szünetet: menj el az asztalodtól és pihenj.', 'Ne dolgozz ebédidőben — szánj időt a feltöltődésre.'],
    category: 'Egészség',
    baseDifficulty: 'easy',
    baseTime: 30,
    personas: ['worker'],
    dayPreference: [1, 2, 3, 4, 5],
    keywords: ['szünet', 'pihenés'],
    frequency: 'daily',
  },

  // --- Weekly ---
  {
    id: 'w_skill_dev',
    titles: ['Szakmai fejlődés', 'Készségfejlesztés', 'Új skill tanulása'],
    descriptions: ['Szánj legalább 1 órát egy új szakmai készség tanulására ezen a héten.', 'Nézz meg egy webinart, olvasd el egy szakmai cikket vagy végezz el egy kurzusleckét.'],
    category: 'Tanulás',
    baseDifficulty: 'medium',
    baseTime: 60,
    personas: ['worker'],
    keywords: ['készség', 'tanulás', 'karrier'],
    frequency: 'weekly',
  },
  {
    id: 'w_network',
    titles: ['Networking', 'Szakmai kapcsolatépítés', 'Kapcsolattartás'],
    descriptions: ['Keress meg egy szakmai kapcsolatot és kezdeményezz beszélgetést.', 'Bővítsd vagy ápolj egy szakmai kapcsolatot ezen a héten.'],
    category: 'Szociális',
    baseDifficulty: 'medium',
    baseTime: 30,
    personas: ['worker'],
    keywords: ['kapcsolat', 'hálózat'],
    frequency: 'weekly',
  },
  {
    id: 'w_weekly_goals',
    titles: ['Heti célok kiértékelése', 'Heti előrehaladás áttekintése', 'Heti sprint értékelés'],
    descriptions: ['Értékeld a heti céljaidat: mit sikerült, mit kell vinni tovább.', 'Tekintsd át a heted és tervezd meg a következőt.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 20,
    personas: ['worker'],
    dayPreference: [5, 0],
    keywords: ['heti', 'cél', 'értékel'],
    frequency: 'weekly',
  },
  {
    id: 'w_career_step',
    titles: ['Karrier lépés', 'Előrelépés tervezés', 'Karrier cél felé haladás'],
    descriptions: ['Tegyél egy konkrét lépést a karrier céljaid felé ezen a héten.', 'Frissítsd az önéletrajzod, jelentkezz valahova vagy tanulj valami releváns dolgot.'],
    category: 'Produktivitás',
    baseDifficulty: 'hard',
    baseTime: 60,
    personas: ['worker'],
    keywords: ['karrier', 'előrelépés'],
    frequency: 'weekly',
  },
  {
    id: 'w_process_improve',
    titles: ['Folyamat javítás', 'Hatékonyság növelés', 'Munkafolyamat optimalizálás'],
    descriptions: ['Azonosíts egy ismétlődő munkafolyamatot és gondold ki hogyan lehetne hatékonyabb.', 'Automatizálj vagy egyszerűsíts egy feladatot a munkádban.'],
    category: 'Produktivitás',
    baseDifficulty: 'hard',
    baseTime: 45,
    personas: ['worker'],
    keywords: ['folyamat', 'hatékonyság'],
    frequency: 'weekly',
  },

  // ═══════════════════════════════════════
  //  SELFDEV — ÖNFEJLESZTŐ
  // ═══════════════════════════════════════

  // --- Daily ---
  {
    id: 'd_reading',
    titles: ['Napi olvasás', 'Könyv idő', '30 perc olvasás'],
    descriptions: ['Olvass legalább 30 percig egy fejlesztő vagy szépirodalmi könyvet.', 'Haladj a jelenlegi olvasmányoddal.'],
    category: 'Fejlődés',
    baseDifficulty: 'easy',
    baseTime: 30,
    personas: ['selfdev'],
    keywords: ['olvas', 'könyv'],
    frequency: 'daily',
  },
  {
    id: 'd_meditate',
    titles: ['Meditáció', '10 perc mindfulness', 'Tudatos jelenlét'],
    descriptions: ['Végezz 10 perc meditációt vagy légzőgyakorlatot.', 'Szánj időt a belső csendre és tudatos jelenlétre.'],
    category: 'Fejlődés',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['selfdev'],
    keywords: ['meditáció', 'légzés'],
    frequency: 'daily',
  },
  {
    id: 'd_journal',
    titles: ['Napló írás', 'Esti reflexió', 'Gondolatok leírása'],
    descriptions: ['Írj naplót a napodról: mit tanultál, mit éreztél, mire vagy hálás.', 'Reflektálj a napodra 10 perc naplóírással.'],
    category: 'Fejlődés',
    baseDifficulty: 'easy',
    baseTime: 15,
    personas: ['selfdev'],
    keywords: ['napló', 'írás', 'reflexió'],
    frequency: 'daily',
  },
  {
    id: 'd_gratitude',
    titles: ['Hála gyakorlat', '3 dolog amiért hálás vagy', 'Pozitív fókusz'],
    descriptions: ['Írj le 3 dolgot amiért ma hálás vagy.', 'Kezdd vagy zárd a napodat hálaadással.'],
    category: 'Fejlődés',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['selfdev'],
    keywords: ['hála', 'pozitív'],
    frequency: 'daily',
  },
  {
    id: 'd_exercise',
    titles: ['Napi mozgás', 'Testmozgás', 'Aktív 30 perc'],
    descriptions: ['Mozogj legalább 30 percig: edzés, séta, jóga vagy futás.', 'Tedd mozgalmas a napodat valamilyen fizikai aktivitással.'],
    category: 'Egészség',
    baseDifficulty: 'medium',
    baseTime: 30,
    personas: ['selfdev'],
    keywords: ['mozgás', 'sport', 'edzés'],
    frequency: 'daily',
  },
  {
    id: 'd_podcast',
    titles: ['Fejlesztő podcast', 'Inspiráló tartalom', 'TED Talk'],
    descriptions: ['Hallgass meg egy fejlesztő podcastot vagy nézz meg egy TED Talk-ot.', 'Tölts 20 percet inspiráló, gondolatébresztő tartalommal.'],
    category: 'Tanulás',
    baseDifficulty: 'easy',
    baseTime: 25,
    personas: ['selfdev'],
    keywords: ['podcast', 'videó'],
    frequency: 'daily',
  },
  {
    id: 'd_habit',
    titles: ['Szokás gyakorlás', 'Napi rutin betartása', 'Szokás lánc folytatása'],
    descriptions: ['Gyakorold tudatosan a legújabb szokásodat ma.', 'Ne törd meg a láncot — tartsd be a napi rutinodat.'],
    category: 'Fejlődés',
    baseDifficulty: 'easy',
    baseTime: 15,
    personas: ['selfdev'],
    keywords: ['szokás', 'rutin'],
    frequency: 'daily',
  },
  {
    id: 'd_affirmation',
    titles: ['Reggeli affirmáció', 'Pozitív megerősítés', 'Motiváció feltöltés'],
    descriptions: ['Mondj el 5 pozitív affirmációt magadról reggel.', 'Erősítsd az önbizalmadat pozitív megerősítésekkel.'],
    category: 'Fejlődés',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['selfdev'],
    keywords: ['motiváció', 'pozitív'],
    frequency: 'daily',
  },

  // --- Weekly ---
  {
    id: 'd_comfort_zone',
    titles: ['Komfortzóna kihívás', 'Bátorság gyakorlat', 'Új dolog kipróbálása'],
    descriptions: ['Csinálj valamit ezen a héten ami kívül esik a komfortzónádon.', 'Próbálj ki egy új tevékenységet vagy helyzetet ami kihívás.'],
    category: 'Fejlődés',
    baseDifficulty: 'hard',
    baseTime: 60,
    personas: ['selfdev'],
    keywords: ['kihívás', 'új'],
    frequency: 'weekly',
  },
  {
    id: 'd_book_progress',
    titles: ['Könyv haladás', 'Olvasási mérföldkő', 'Fejezet befejezés'],
    descriptions: ['Fejezz be legalább 2 fejezetet a jelenlegi könyvedből ezen a héten.', 'Halady az olvasási céljaiddal.'],
    category: 'Tanulás',
    baseDifficulty: 'medium',
    baseTime: 120,
    personas: ['selfdev'],
    keywords: ['könyv', 'olvas'],
    frequency: 'weekly',
  },
  {
    id: 'd_goal_review',
    titles: ['Célok áttekintése', 'Heti haladás értékelés', 'Cél-check'],
    descriptions: ['Tekintsd át a céljaidat és értékeld a haladásodat ezen a héten.', 'Ellenőrizd, hogy jó úton haladsz-e a hosszú távú céljaid felé.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 20,
    personas: ['selfdev'],
    keywords: ['cél', 'haladás'],
    frequency: 'weekly',
  },
  {
    id: 'd_new_skill',
    titles: ['Új készség fejlesztése', 'Kurzus haladás', 'Skill milestone'],
    descriptions: ['Haladj egy online kurzussal vagy gyakorolj egy új készséget legalább 1 órát.', 'Tegyél konkrét lépést egy új készség elsajátításában.'],
    category: 'Tanulás',
    baseDifficulty: 'hard',
    baseTime: 60,
    personas: ['selfdev'],
    keywords: ['készség', 'kurzus'],
    frequency: 'weekly',
  },
  {
    id: 'd_digital_detox',
    titles: ['Digitális detox', 'Képernyőmentes idő', 'Tech szünet'],
    descriptions: ['Tölts legalább 3 órát egy nap telefon és laptop nélkül ezen a héten.', 'Tapasztald meg a digitális kikapcsolódás erejét.'],
    category: 'Fejlődés',
    baseDifficulty: 'medium',
    baseTime: 180,
    personas: ['selfdev'],
    keywords: ['detox', 'képernyő'],
    frequency: 'weekly',
  },

  // ═══════════════════════════════════════
  //  FREELANCER
  // ═══════════════════════════════════════

  // --- Daily ---
  {
    id: 'f_morning_plan',
    titles: ['Napi sprint tervezés', 'Mai feladatok priorizálása', 'Projekt fókusz meghatározása'],
    descriptions: ['Határozd meg melyik projekten fogsz ma dolgozni és mit kell elvégezni.', 'Tervezd meg a mai munkanapod a legfontosabb deliverable-ök köré.'],
    category: 'Produktivitás',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['freelancer'],
    keywords: ['terv', 'sprint'],
    frequency: 'daily',
  },
  {
    id: 'f_deep_work',
    titles: ['Mélymunka blokk', 'Projekt deep work', 'Koncentrált munkamenet'],
    descriptions: ['Dolgozz megszakítás nélkül 60 percig az aktuális projekten.', 'Kapcsold ki az értesítéseket és merülj el a munkában.'],
    category: 'Produktivitás',
    baseDifficulty: 'medium',
    baseTime: 60,
    personas: ['freelancer'],
    keywords: ['munka', 'projekt', 'fókusz'],
    frequency: 'daily',
  },
  {
    id: 'f_client_comm',
    titles: ['Ügyfélkommunikáció', 'Ügyfél emailek megválaszolása', 'Státusz update küldése'],
    descriptions: ['Válaszolj az ügyfél emailekre és küldj haladási összefoglalót.', 'Tartsd naprakészen az ügyfeleidet a projekt státuszáról.'],
    category: 'Produktivitás',
    baseDifficulty: 'easy',
    baseTime: 20,
    personas: ['freelancer'],
    keywords: ['ügyfél', 'email', 'kommunikáció'],
    frequency: 'daily',
  },
  {
    id: 'f_time_track',
    titles: ['Időkövetés', 'Napi munkaóra naplózás', 'Time tracking ellenőrzés'],
    descriptions: ['Ellenőrizd és naplózd a mai munkáidődet projektenként.', 'Biztosítsd, hogy minden elszámolható óra rögzítve van.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['freelancer'],
    keywords: ['idő', 'naplóz'],
    frequency: 'daily',
  },
  {
    id: 'f_task_batch',
    titles: ['Admin feladatok', 'Üzleti adminisztráció', 'Gyors teendők elvégzése'],
    descriptions: ['Végezd el az apró adminisztratív feladatokat: email, fájlok, üzenetek.', 'Csoportosítsd és hajtsd végre a rövid üzleti teendőket.'],
    category: 'Produktivitás',
    baseDifficulty: 'easy',
    baseTime: 25,
    personas: ['freelancer'],
    keywords: ['admin', 'feladat'],
    frequency: 'daily',
  },
  {
    id: 'f_eod_review',
    titles: ['Nap végi áttekintés', 'Deliverable check', 'Holnapi terv'],
    descriptions: ['Tekintsd át mit végeztél el ma és mit kell holnap folytatni.', 'Ellenőrizd a napi haladást a projekt célokhoz képest.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['freelancer'],
    keywords: ['áttekintés', 'holnap'],
    frequency: 'daily',
  },
  {
    id: 'f_social_post',
    titles: ['Szakmai poszt ötlet', 'Social media jelenlét', 'Rövid tartalom megosztás'],
    descriptions: ['Ossz meg egy gyors szakmai gondolatot vagy tippet a közösségi médián.', 'Tartsd aktívan a szakmai online jelenlétedet.'],
    category: 'Kreativitás',
    baseDifficulty: 'easy',
    baseTime: 15,
    personas: ['freelancer'],
    keywords: ['poszt', 'közösségi'],
    frequency: 'daily',
  },

  // --- Weekly ---
  {
    id: 'f_client_reach',
    titles: ['Új ügyfél megkeresés', 'Lead generálás', 'Üzletszerzés'],
    descriptions: ['Keress meg legalább 3 potenciális ügyfelet ajánlattal ezen a héten.', 'Aktívan bővítsd az ügyfélkörödet proaktív megkereséssel.'],
    category: 'Produktivitás',
    baseDifficulty: 'hard',
    baseTime: 60,
    personas: ['freelancer'],
    keywords: ['ügyfél', 'lead'],
    frequency: 'weekly',
  },
  {
    id: 'f_portfolio',
    titles: ['Portfólió frissítés', 'Munkák dokumentálása', 'Referencia összeállítás'],
    descriptions: ['Frissítsd a portfóliódat a legújabb munkáiddal.', 'Dokumentáld és mutasd be a legutóbbi befejezett projektjeidet.'],
    category: 'Kreativitás',
    baseDifficulty: 'medium',
    baseTime: 60,
    personas: ['freelancer'],
    keywords: ['portfólió', 'bemutató'],
    frequency: 'weekly',
  },
  {
    id: 'f_invoice_week',
    titles: ['Számlázás és pénzügyek', 'Heti pénzügyi áttekintés', 'Kintlévőségek kezelése'],
    descriptions: ['Küldj ki számlákat, ellenőrizd a befizetéseket és rendezd a pénzügyeket.', 'Tartsd rendben a heti pénzügyi adminisztrációdat.'],
    category: 'Szervezés',
    baseDifficulty: 'medium',
    baseTime: 30,
    personas: ['freelancer'],
    keywords: ['számla', 'pénz'],
    frequency: 'weekly',
  },
  {
    id: 'f_skill_up',
    titles: ['Szakmai továbbképzés', 'Készségfejlesztés', 'Új eszköz tanulása'],
    descriptions: ['Szánj legalább 1 órát új technika vagy eszköz tanulására a szakterületeden.', 'Fejleszd a versenyképességedet egy releváns kurzussal.'],
    category: 'Tanulás',
    baseDifficulty: 'medium',
    baseTime: 60,
    personas: ['freelancer'],
    keywords: ['tanulás', 'készség'],
    frequency: 'weekly',
  },
  {
    id: 'f_project_plan',
    titles: ['Projekt tervezés', 'Sprint planning', 'Heti projekt roadmap'],
    descriptions: ['Tervezd meg a projektek következő heti fázisait és feladatait.', 'Bontsd le a nagy feladatokat heti szintű lépésekre.'],
    category: 'Szervezés',
    baseDifficulty: 'medium',
    baseTime: 30,
    personas: ['freelancer'],
    keywords: ['projekt', 'terv'],
    frequency: 'weekly',
  },
  {
    id: 'f_content_piece',
    titles: ['Tartalomgyártás', 'Blog/videó készítés', 'Szakmai tartalom alkotás'],
    descriptions: ['Készíts egy tartalmat: blogposzt, videó vagy részletes közösségi poszt.', 'Alkoss értékes tartalmat ami a szakmai márkádat erősíti.'],
    category: 'Kreativitás',
    baseDifficulty: 'hard',
    baseTime: 90,
    personas: ['freelancer'],
    keywords: ['tartalom', 'blog'],
    frequency: 'weekly',
  },

  // ═══════════════════════════════════════
  //  ORGANIZER — RENDSZEREZŐ
  // ═══════════════════════════════════════

  // --- Daily ---
  {
    id: 'o_daily_clean',
    titles: ['Napi takarítás', 'Gyors rendrakás', 'Háztartási rutin'],
    descriptions: ['Végezd el a napi takarítási rutint: konyha, edények, felületek.', 'Tartsd rendben az otthonod a napi 15 perces rutinnal.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 15,
    personas: ['organizer'],
    keywords: ['takarít', 'rend'],
    frequency: 'daily',
  },
  {
    id: 'o_cook',
    titles: ['Egészséges főzés', 'Napi étkezés elkészítése', 'Otthoni főzés'],
    descriptions: ['Főzz otthon egészséges ételt ma.', 'Készíts házi ételt a családnak az étlap alapján.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 30,
    personas: ['organizer'],
    keywords: ['főzés', 'étel'],
    frequency: 'daily',
  },
  {
    id: 'o_family_moment',
    titles: ['Családi idő', 'Minőségi idő a szerettekkel', 'Közös pillanat'],
    descriptions: ['Tölts legalább 30 perc minőségi időt a családtagjaiddal.', 'Legyél jelen és figyelmes a családod felé ma.'],
    category: 'Szociális',
    baseDifficulty: 'easy',
    baseTime: 30,
    personas: ['organizer'],
    keywords: ['család', 'közös'],
    frequency: 'daily',
  },
  {
    id: 'o_quick_tidy',
    titles: ['10 perc rendrakás', 'Gyors rendezés', 'Egy terület rendbe tétele'],
    descriptions: ['Válassz egy felszínt vagy szekrényt és tegyél rendet 10 perc alatt.', 'Kis lépések a rendezett otthonért.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['organizer'],
    keywords: ['rendez', 'szekrény'],
    frequency: 'daily',
  },
  {
    id: 'o_schedule_check',
    titles: ['Napirend átnézése', 'Holnap megtervezése', 'Teendők listázása'],
    descriptions: ['Nézd át a holnapi programot és készítsd elő amit kell.', 'Tervezd meg a holnapi napodat és írd össze a teendőket.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['organizer'],
    keywords: ['napirend', 'terv'],
    frequency: 'daily',
  },
  {
    id: 'o_errands',
    titles: ['Napi intéznivalók', 'Ügyek elintézése', 'Elintézendő feladatok'],
    descriptions: ['Végezd el a mai szükséges intéznivalókat: posta, üzlet, ügyintézés.', 'Hajtsd végre a napi praktikus teendőket.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 30,
    personas: ['organizer'],
    keywords: ['intéz', 'ügy'],
    frequency: 'daily',
  },
  {
    id: 'o_laundry',
    titles: ['Mosás/vasalás', 'Ruha rendrakás', 'Textil karbantartás'],
    descriptions: ['Mosd ki, szárítsd meg vagy vasald ki a ruhákat.', 'Tartsd naprakészen a mosást és ruharendet.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 20,
    personas: ['organizer'],
    keywords: ['mosás', 'ruha'],
    frequency: 'daily',
  },

  // --- Weekly ---
  {
    id: 'o_deep_clean',
    titles: ['Nagytakarítás', 'Egy szoba alapos takarítása', 'Heti nagytakarítás'],
    descriptions: ['Válassz egy szobát és végezd el az alapos takarítást.', 'Selejtezd ki a felesleges tárgyakat és takaríts alaposan.'],
    category: 'Szervezés',
    baseDifficulty: 'hard',
    baseTime: 90,
    personas: ['organizer'],
    dayPreference: [0, 6],
    keywords: ['nagytakarítás', 'selejtez'],
    frequency: 'weekly',
  },
  {
    id: 'o_meal_plan',
    titles: ['Heti étlap tervezés', 'Menü összeállítás', 'Meal prep tervezés'],
    descriptions: ['Tervezd meg a jövő hét menüjét és készítsd el a bevásárlólistát.', 'Szervezd meg előre a heti étkezéseket.'],
    category: 'Szervezés',
    baseDifficulty: 'medium',
    baseTime: 30,
    personas: ['organizer'],
    keywords: ['étlap', 'bevásárlás'],
    frequency: 'weekly',
  },
  {
    id: 'o_budget',
    titles: ['Heti pénzügyi áttekintés', 'Költségvetés ellenőrzés', 'Kiadások összegzése'],
    descriptions: ['Tekintsd át a heti kiadásaidat és hasonlítsd a tervhez.', 'Ellenőrizd a pénzügyeidet és keresd a spórolási lehetőségeket.'],
    category: 'Szervezés',
    baseDifficulty: 'medium',
    baseTime: 25,
    personas: ['organizer'],
    keywords: ['pénz', 'költség'],
    frequency: 'weekly',
  },
  {
    id: 'o_grocery',
    titles: ['Heti bevásárlás', 'Nagybevásárlás', 'Élelmiszer beszerzés'],
    descriptions: ['Végezd el a heti bevásárlást a lista alapján.', 'Szerezd be az alapanyagokat és háztartási cikkeket a hétre.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 60,
    personas: ['organizer'],
    keywords: ['bevásárlás', 'bolt'],
    frequency: 'weekly',
  },
  {
    id: 'o_family_plan',
    titles: ['Családi program szervezés', 'Hétvégi közös program', 'Családi tevékenység'],
    descriptions: ['Szervezz egy közös programot a családdal erre a hétvégére.', 'Tervezzetek valami közöset ami mindenkinek öröm.'],
    category: 'Szociális',
    baseDifficulty: 'medium',
    baseTime: 60,
    personas: ['organizer'],
    keywords: ['család', 'program'],
    frequency: 'weekly',
  },
  {
    id: 'o_bills',
    titles: ['Számlák rendezése', 'Kifizetések', 'Heti pénzügyi admin'],
    descriptions: ['Fizesd ki az esedékes számlákat és rendezd a pénzügyi adminisztrációt.', 'Ellenőrizd az előfizetéseket és esedékes fizetéseket.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 20,
    personas: ['organizer'],
    keywords: ['számla', 'fizetés'],
    frequency: 'weekly',
  },

  // ═══════════════════════════════════════
  //  PROGRESS-BASED WEEKLY QUESTS (all personas)
  //  These auto-track progress and complete when the target is reached.
  // ═══════════════════════════════════════

  // --- Tasks completed this week ---
  {
    id: 'prog_tasks_student',
    titles: ['Heti feladat kihívás', 'Feladat mester', 'Produktív hét'],
    descriptions: ['Teljesíts megadott számú feladatot ezen a héten a listáidból!', 'Legyél produktív és pipáld ki a feladataidat a héten!'],
    category: 'Produktivitás',
    baseDifficulty: 'medium',
    baseTime: 0,
    personas: ['student'],
    keywords: ['feladat', 'teljesít'],
    frequency: 'weekly',
    trackingType: 'tasks_completed',
    baseTargetCount: 8,
  },
  {
    id: 'prog_tasks_worker',
    titles: ['Munka kihívás', 'Feladatok teljesítése', 'Heti produktivitás'],
    descriptions: ['Teljesíts megadott számú feladatot ezen a héten!', 'Mutasd meg a produktivitásodat a heti feladat kihívással!'],
    category: 'Produktivitás',
    baseDifficulty: 'medium',
    baseTime: 0,
    personas: ['worker'],
    keywords: ['feladat', 'munka'],
    frequency: 'weekly',
    trackingType: 'tasks_completed',
    baseTargetCount: 10,
  },
  {
    id: 'prog_tasks_freelancer',
    titles: ['Freelancer kihívás', 'Projekt feladatok', 'Heti haladás'],
    descriptions: ['Teljesíts megadott számú feladatot ezen a héten a projektjeidből!', 'Haladj a projektjeiddel – teljesítsd a heti feladat célt!'],
    category: 'Produktivitás',
    baseDifficulty: 'medium',
    baseTime: 0,
    personas: ['freelancer'],
    keywords: ['feladat', 'projekt'],
    frequency: 'weekly',
    trackingType: 'tasks_completed',
    baseTargetCount: 10,
  },
  {
    id: 'prog_tasks_selfdev',
    titles: ['Fejlődési kihívás', 'Heti teljesítmény', 'Célok felé'],
    descriptions: ['Teljesíts megadott számú feladatot ezen a héten az önfejlesztési utadon!', 'Minden elvégzett feladat egy lépés a jobb verzió felé!'],
    category: 'Fejlődés',
    baseDifficulty: 'medium',
    baseTime: 0,
    personas: ['selfdev'],
    keywords: ['feladat', 'fejlődés'],
    frequency: 'weekly',
    trackingType: 'tasks_completed',
    baseTargetCount: 8,
  },
  {
    id: 'prog_tasks_organizer',
    titles: ['Háztartási kihívás', 'Heti feladat cél', 'Szervezett hét'],
    descriptions: ['Teljesíts megadott számú feladatot ezen a héten a rendezett életért!', 'Tartsd a lendületet – teljesítsd a heti feladat célodat!'],
    category: 'Szervezés',
    baseDifficulty: 'medium',
    baseTime: 0,
    personas: ['organizer'],
    keywords: ['feladat', 'szervez'],
    frequency: 'weekly',
    trackingType: 'tasks_completed',
    baseTargetCount: 10,
  },

  // --- Quests completed this week ---
  {
    id: 'prog_quests_all',
    titles: ['Küldetés mester', 'Heti küldetés kihívás', 'Küldetés sorozat'],
    descriptions: ['Teljesítsd az összes napi küldetésedet ezen a héten!', 'Legyél következetes – végezd el a napi küldetéseidet minden nap!'],
    category: 'Fejlődés',
    baseDifficulty: 'hard',
    baseTime: 0,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['küldetés', 'napi'],
    frequency: 'weekly',
    trackingType: 'quests_completed',
    baseTargetCount: 10,
  },

  // --- Notes created this week ---
  {
    id: 'prog_notes_student',
    titles: ['Jegyzetek hete', 'Tudásgyűjtő', 'Heti jegyzetelés'],
    descriptions: ['Készíts megadott számú jegyzetet ezen a héten!', 'Rögzítsd a gondolataidat és tanulnivalóidat jegyzetekben!'],
    category: 'Tanulás',
    baseDifficulty: 'easy',
    baseTime: 0,
    personas: ['student'],
    keywords: ['jegyzet', 'tanulás'],
    frequency: 'weekly',
    trackingType: 'notes_created',
    baseTargetCount: 3,
  },
  {
    id: 'prog_notes_selfdev',
    titles: ['Reflexiós hét', 'Gondolatok rögzítése', 'Heti naplózás'],
    descriptions: ['Készíts megadott számú jegyzetet ezen a héten a gondolataidról!', 'Írd le a felismeréseidet, céljaidat és haladásodat!'],
    category: 'Fejlődés',
    baseDifficulty: 'easy',
    baseTime: 0,
    personas: ['selfdev'],
    keywords: ['jegyzet', 'napló'],
    frequency: 'weekly',
    trackingType: 'notes_created',
    baseTargetCount: 3,
  },

  // --- Planning-focused weekly quests ---
  {
    id: 'plan_week_student',
    titles: ['Heti tanulási terv', 'Tanulás megtervezése', 'Heti tanrend összeállítás'],
    descriptions: ['Készítsd el a jövő heti tanulási tervedet: mit, mikor, mennyit tanulsz.', 'Tervezd meg a vizsgaidőszakot vagy a heti tanulási blokkjaidat előre.'],
    category: 'Szervezés',
    baseDifficulty: 'medium',
    baseTime: 25,
    personas: ['student'],
    keywords: ['terv', 'tanulás', 'hét'],
    frequency: 'weekly',
  },
  {
    id: 'plan_week_worker',
    titles: ['Heti munka tervezés', 'Prioritások meghatározása', 'Heti sprint tervezés'],
    descriptions: ['Tervezd meg a következő hét fő feladatait és prioritásait.', 'Határozd meg a heti 3 legfontosabb célodat és a hozzájuk tartozó lépéseket.'],
    category: 'Produktivitás',
    baseDifficulty: 'medium',
    baseTime: 20,
    personas: ['worker'],
    keywords: ['terv', 'prioritás', 'hét'],
    frequency: 'weekly',
  },
  {
    id: 'plan_week_selfdev',
    titles: ['Önfejlesztési terv', 'Heti célok kitűzése', 'Fejlődési roadmap'],
    descriptions: ['Tűzz ki 3 konkrét fejlődési célt a hétre és írd le a lépéseket.', 'Tervezd meg az önfejlesztési rutinodat a következő hétre.'],
    category: 'Fejlődés',
    baseDifficulty: 'medium',
    baseTime: 20,
    personas: ['selfdev'],
    keywords: ['terv', 'cél', 'fejlődés'],
    frequency: 'weekly',
  },
  {
    id: 'plan_week_freelancer',
    titles: ['Üzleti tervezés', 'Heti ügyfél stratégia', 'Freelancer roadmap'],
    descriptions: ['Tervezd meg a heti ügyfélmunkákat, határidőket és üzleti teendőket.', 'Készíts heti áttekintést a projektjeidről és az üzleti céljaidról.'],
    category: 'Produktivitás',
    baseDifficulty: 'medium',
    baseTime: 25,
    personas: ['freelancer'],
    keywords: ['terv', 'üzlet', 'projekt'],
    frequency: 'weekly',
  },
  {
    id: 'plan_week_organizer',
    titles: ['Heti családi tervezés', 'Háztartás szervezés', 'Heti menetrend'],
    descriptions: ['Tervezd meg a család hetét: programok, étkezések, teendők.', 'Készíts átfogó heti tervet a háztartás és család számára.'],
    category: 'Szervezés',
    baseDifficulty: 'medium',
    baseTime: 25,
    personas: ['organizer'],
    keywords: ['terv', 'család', 'hét'],
    frequency: 'weekly',
  },
];

// ============ HELPER FUNCTIONS ============

function analyzeUserHabits(lists: TodoList[]): Record<string, number> {
  const weights: Record<string, number> = {};
  for (const cat of Object.keys(HABIT_KEYWORDS)) {
    weights[cat] = 1;
  }

  const allTexts: string[] = [];
  for (const list of lists) {
    allTexts.push(list.name.toLowerCase());
    for (const task of list.tasks) {
      allTexts.push(task.title.toLowerCase());
    }
  }

  const combined = allTexts.join(' ');
  for (const [category, keywords] of Object.entries(HABIT_KEYWORDS)) {
    for (const kw of keywords) {
      if (combined.includes(kw.toLowerCase())) {
        weights[category] = (weights[category] || 1) + 0.5;
      }
    }
  }

  return weights;
}

function getRecentQuestTitles(quests: Quest[], days: number): Set<string> {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();
  const titles = new Set<string>();
  for (const q of quests) {
    if (q.generated) {
      const refDate = q.completedAt || q.dueDate || '';
      if (refDate >= cutoff || !q.completed) {
        titles.add(q.title.toLowerCase());
      }
    }
  }
  return titles;
}

function scaleDifficulty(
  base: 'easy' | 'medium' | 'hard' | 'epic',
  level: number
): 'easy' | 'medium' | 'hard' | 'epic' {
  const diffOrder: ('easy' | 'medium' | 'hard' | 'epic')[] = ['easy', 'medium', 'hard', 'epic'];
  let idx = diffOrder.indexOf(base);
  if (level >= 15) idx = Math.min(idx + 1, 3);
  else if (level >= 8) idx = Math.min(idx + (base === 'easy' ? 1 : 0), 3);
  return diffOrder[idx];
}

function calculateRewards(
  difficulty: 'easy' | 'medium' | 'hard' | 'epic',
  level: number
): { xp: number; essence: number } {
  const baseXp = { easy: 30, medium: 60, hard: 100, epic: 150 };
  const baseEssence = { easy: 5, medium: 10, hard: 20, epic: 35 };
  const levelBonus = { easy: 3, medium: 5, hard: 8, epic: 12 };
  return {
    xp: baseXp[difficulty] + levelBonus[difficulty] * Math.min(level, 30),
    essence: baseEssence[difficulty] + Math.floor(level / 5),
  };
}

function weightedSelect<T>(items: T[], weights: number[], rng: () => number, count: number): T[] {
  const selected: T[] = [];
  const usedIndices = new Set<number>();

  for (let c = 0; c < count && usedIndices.size < items.length; c++) {
    const totalWeight = weights.reduce((sum, w, i) => sum + (usedIndices.has(i) ? 0 : w), 0);
    if (totalWeight <= 0) break;

    let target = rng() * totalWeight;
    for (let i = 0; i < items.length; i++) {
      if (usedIndices.has(i)) continue;
      target -= weights[i];
      if (target <= 0) {
        selected.push(items[i]);
        usedIndices.add(i);
        break;
      }
    }
  }
  return selected;
}

// ============ MAIN GENERATORS ============

export interface GenerateOptions {
  persona: string;
  level: number;
  quests: Quest[];
  lists: TodoList[];
  uid: string;
  date: string;
}

export function generateDailyQuests(options: GenerateOptions): Omit<Quest, 'id'>[] {
  const { persona, level, quests, lists, uid, date } = options;
  const rng = createRng(`daily-${uid}-${date}`);
  const dayOfWeek = new Date(date).getDay();

  const questCount = level >= 11 ? 4 : 3;

  // ONLY templates that explicitly include this persona AND are daily
  const applicable = TEMPLATES.filter((t) => {
    if (t.frequency !== 'daily') return false;
    if (!t.personas.includes(persona)) return false;
    if (t.dayPreference && !t.dayPreference.includes(dayOfWeek)) return false;
    return true;
  });

  const habitWeights = analyzeUserHabits(lists);
  const recentTitles = getRecentQuestTitles(quests, 7);

  const scores = applicable.map((t) => {
    let score = 1;
    score += (habitWeights[t.category] || 1) * 0.3;
    const hasRecent = t.titles.some((title) => recentTitles.has(title.toLowerCase()));
    if (hasRecent) score *= 0.15;
    score += rng() * 0.6;
    return score;
  });

  const selected = weightedSelect(applicable, scores, rng, questCount);

  // Ensure category variety
  const categories = new Set(selected.map((t) => t.category));
  if (categories.size < 2 && selected.length >= 2) {
    const lastIdx = selected.length - 1;
    const currentCat = selected[lastIdx].category;
    const alt = applicable.find(
      (t) => t.category !== currentCat && !selected.includes(t) && !t.titles.some((title) => recentTitles.has(title.toLowerCase()))
    );
    if (alt) selected[lastIdx] = alt;
  }

  return selected.map((template) => {
    const titleIdx = Math.floor(rng() * template.titles.length);
    const descIdx = Math.floor(rng() * template.descriptions.length);
    const difficulty = scaleDifficulty(template.baseDifficulty, level);
    const rewards = calculateRewards(difficulty, level);

    return {
      title: template.titles[titleIdx],
      description: template.descriptions[descIdx],
      category: template.category,
      difficulty,
      estimatedTime: template.baseTime,
      xpReward: rewards.xp,
      essenceReward: rewards.essence,
      completed: false,
      dueDate: date,
      tags: [template.id, 'generated', 'daily'],
      persona,
      generated: true,
      questType: 'daily' as const,
    };
  });
}

export function generateWeeklyQuests(options: GenerateOptions): Omit<Quest, 'id'>[] {
  const { persona, level, quests, lists, uid, date } = options;
  const rng = createRng(`weekly-${uid}-${date}`);

  // ONLY templates that explicitly include this persona AND are weekly
  const applicable = TEMPLATES.filter((t) => {
    if (t.frequency !== 'weekly') return false;
    if (!t.personas.includes(persona)) return false;
    return true;
  });

  // Separate progress-based and regular templates
  const progressTemplates = applicable.filter((t) => t.trackingType);
  const regularTemplates = applicable.filter((t) => !t.trackingType);

  const habitWeights = analyzeUserHabits(lists);
  const recentTitles = getRecentQuestTitles(quests, 14);

  // Select 1 progress-based quest (if available)
  let selectedProgress: QuestTemplate[] = [];
  if (progressTemplates.length > 0) {
    const progScores = progressTemplates.map((t) => {
      let score = 1;
      score += (habitWeights[t.category] || 1) * 0.3;
      const hasRecent = t.titles.some((title) => recentTitles.has(title.toLowerCase()));
      if (hasRecent) score *= 0.15;
      score += rng() * 0.6;
      return score;
    });
    selectedProgress = weightedSelect(progressTemplates, progScores, rng, 1);
  }

  // Select 2 regular quests (or more if no progress templates)
  const regularCount = selectedProgress.length > 0 ? 2 : 3;
  const regScores = regularTemplates.map((t) => {
    let score = 1;
    score += (habitWeights[t.category] || 1) * 0.3;
    const hasRecent = t.titles.some((title) => recentTitles.has(title.toLowerCase()));
    if (hasRecent) score *= 0.15;
    score += rng() * 0.6;
    return score;
  });
  const selectedRegular = weightedSelect(regularTemplates, regScores, rng, regularCount);

  const selected = [...selectedProgress, ...selectedRegular];

  // Weekly due date = Sunday of the current week (local time)
  const weeklyDueDate = getLocalSundayOfWeek(date);

  return selected.map((template) => {
    const titleIdx = Math.floor(rng() * template.titles.length);
    const descIdx = Math.floor(rng() * template.descriptions.length);
    const difficulty = scaleDifficulty(template.baseDifficulty, level);
    const rewards = calculateRewards(difficulty, level);

    // Calculate target count for progress-based quests (scales with level)
    const targetCount = template.baseTargetCount
      ? Math.floor(template.baseTargetCount + Math.floor(level / 5) * 2)
      : undefined;

    // For progress-based quests, update description with target count
    let description = template.descriptions[descIdx];
    if (targetCount) {
      description = description.replace('megadott számú', `${targetCount}`);
    }

    const quest: Omit<Quest, 'id'> = {
      title: template.titles[titleIdx],
      description,
      category: template.category,
      difficulty,
      estimatedTime: template.baseTime,
      xpReward: Math.floor(rewards.xp * 1.5),
      essenceReward: Math.floor(rewards.essence * 1.5),
      completed: false,
      dueDate: weeklyDueDate,
      tags: [template.id, 'generated', 'weekly'],
      persona,
      generated: true,
      questType: 'weekly' as const,
    };

    // Add progress tracking fields if applicable
    if (template.trackingType && targetCount) {
      quest.trackingType = template.trackingType;
      quest.targetCount = targetCount;
      quest.currentProgress = 0;
    }

    return quest;
  });
}
