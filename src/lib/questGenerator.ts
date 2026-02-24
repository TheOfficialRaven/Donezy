import type { Quest, TodoList, UserStats } from '@/stores/useAppStore';
import { getLocalSundayOfWeek } from '@/lib/dateUtils';

// ============ INTEREST GROUP METADATA ============
// Shared between quest generator, Quests page, and Dashboard

export const INTEREST_GROUPS: Record<string, { label: string; icon: string; color: string }> = {
  health:       { label: 'Egészség & Fitnesz',   icon: 'Heart',    color: 'hsl(0 80% 60%)' },
  finance:      { label: 'Pénzügyek',             icon: 'Banknote', color: 'hsl(45 90% 50%)' },
  social:       { label: 'Társas kapcsolatok',     icon: 'Users',    color: 'hsl(330 80% 60%)' },
  productivity: { label: 'Produktivitás',          icon: 'Rocket',   color: 'hsl(200 85% 55%)' },
  learning:     { label: 'Tanulás & Fejlődés',    icon: 'BookOpen', color: 'hsl(150 60% 45%)' },
  creativity:   { label: 'Kreativitás',            icon: 'Palette',  color: 'hsl(280 75% 60%)' },
  home:         { label: 'Otthoni rend',           icon: 'Home',     color: 'hsl(30 80% 55%)' },
  mental:       { label: 'Mentális jólét',         icon: 'Brain',    color: 'hsl(170 70% 50%)' },
};

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
  // Preference-based: only shown if user selected this interest in onboarding
  preferenceTag?: string;
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
  //  ADDITIONAL PERSONA-SPECIFIC TEMPLATES
  //  (deeper, richer quest pool per persona)
  // ═══════════════════════════════════════

  // --- Student (additional daily) ---
  {
    id: 's_pomodoro',
    titles: ['Pomodoro tanulás', 'Időzített tanulási blokk', 'Fókusz sprint'],
    descriptions: ['Alkalmazz Pomodoro technikát: 25 perc tanulás, 5 perc szünet, ismételd 3x.', 'Használj időzítőt a koncentrált tanuláshoz – 25 perces blokkokban haladj.'],
    category: 'Tanulás',
    baseDifficulty: 'medium',
    baseTime: 90,
    personas: ['student'],
    keywords: ['pomodoro', 'időzít', 'fókusz'],
    frequency: 'daily',
  },
  {
    id: 's_desk_org',
    titles: ['Tanulósarok rendezése', 'Íróasztal takarítás', 'Rendezett tanulóhely'],
    descriptions: ['Rendezd be a tanulóhelyedet: tiszta asztal, rendezett jegyzet, töltött laptop.', 'Készítsd elő a tanulóhelyed – a rendezett környezet javítja a koncentrációt.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['student'],
    keywords: ['asztal', 'rendez', 'tanulóhely'],
    frequency: 'daily',
  },
  {
    id: 's_vocab',
    titles: ['Nyelvgyakorlás', 'Szókincs bővítés', 'Napi nyelvi kihívás'],
    descriptions: ['Gyakorolj idegen nyelvet 15 percig: új szavak, mondatok, hallgatás.', 'Bővítsd a szókincsedet – tanulj meg 10 új szót vagy kifejezést.'],
    category: 'Tanulás',
    baseDifficulty: 'easy',
    baseTime: 15,
    personas: ['student'],
    keywords: ['nyelv', 'szó', 'angol'],
    frequency: 'daily',
  },
  {
    id: 's_teach_back',
    titles: ['Tanítsd el valakinek', 'Magyarázd el a tananyagot', 'Tudásmegosztás'],
    descriptions: ['Magyarázz el egy mai témát valakinek – a tanítás a legjobb tanulás.', 'Foglald össze hangosan vagy írd le a mai legfontosabb tanulságot.'],
    category: 'Tanulás',
    baseDifficulty: 'easy',
    baseTime: 15,
    personas: ['student'],
    keywords: ['tanít', 'magyaráz'],
    frequency: 'daily',
  },
  {
    id: 's_campus_walk',
    titles: ['Kampusz séta', 'Levegőzés órák között', 'Frissítő séta'],
    descriptions: ['Sétálj 15 percet a friss levegőn órák/tanulás között.', 'Menj ki egy gyors sétára – a mozgás javítja a memóriát.'],
    category: 'Egészség',
    baseDifficulty: 'easy',
    baseTime: 15,
    personas: ['student'],
    keywords: ['séta', 'friss', 'levegő'],
    frequency: 'daily',
  },

  // --- Student (additional weekly) ---
  {
    id: 's_library',
    titles: ['Könyvtári kutatás', 'Könyvtári tanulás', 'Források keresése'],
    descriptions: ['Menj el a könyvtárba és kutatj legalább 1 órát a tananyagodhoz.', 'Keress kiegészítő forrásokat az aktuális témádhoz a könyvtárban vagy online adatbázisokban.'],
    category: 'Tanulás',
    baseDifficulty: 'medium',
    baseTime: 60,
    personas: ['student'],
    keywords: ['könyvtár', 'kutatás'],
    frequency: 'weekly',
  },
  {
    id: 's_practice_exam',
    titles: ['Próbavizsga', 'Gyakorló teszt megoldása', 'Önellenőrzés'],
    descriptions: ['Oldj meg egy próbavizsgát vagy gyakorló tesztet időre.', 'Teszteld a tudásodat egy korábbi vizsga vagy kvíz segítségével.'],
    category: 'Tanulás',
    baseDifficulty: 'hard',
    baseTime: 90,
    personas: ['student'],
    keywords: ['vizsga', 'teszt', 'gyakorol'],
    frequency: 'weekly',
  },
  {
    id: 's_skill_outside',
    titles: ['Tanórán kívüli fejlődés', 'Új készség tanulása', 'Hobbihoz kapcsolódó tanulás'],
    descriptions: ['Szánj időt egy olyan készség fejlesztésére ami nem a tananyag de érdekel.', 'Tanulj programozni, rajzolni, zenélni vagy bármi mást ami érdekel.'],
    category: 'Fejlődés',
    baseDifficulty: 'medium',
    baseTime: 60,
    personas: ['student'],
    keywords: ['készség', 'hobbi'],
    frequency: 'weekly',
  },

  // --- Worker (additional daily) ---
  {
    id: 'w_skill_article',
    titles: ['Szakmai cikk olvasás', 'Iparági hír áttekintés', 'Tudásfrissítés'],
    descriptions: ['Olvass el egy szakmai cikket vagy blogposztot a szakterületedről.', 'Tartsd naprakészen a tudásodat – olvasd a legújabb iparági híreket.'],
    category: 'Tanulás',
    baseDifficulty: 'easy',
    baseTime: 15,
    personas: ['worker'],
    keywords: ['cikk', 'szakmai', 'olvas'],
    frequency: 'daily',
  },
  {
    id: 'w_desk_stretch',
    titles: ['Irodai nyújtás', 'Ergonómiai szünet', 'Mozgás az íróasztalnál'],
    descriptions: ['Végezz 5 perc nyújtást és testtartás-korrekciót az asztalodnál.', 'Állj fel, nyújtózz és végezz néhány egyszerű gyakorlatot a hátadnak.'],
    category: 'Egészség',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['worker'],
    dayPreference: [1, 2, 3, 4, 5],
    keywords: ['nyújtás', 'ergonómia'],
    frequency: 'daily',
  },
  {
    id: 'w_gratitude_work',
    titles: ['Munkahelyi pozitívum', 'Munkanapi hála', 'Jó dolgok a munkában'],
    descriptions: ['Keress 3 pozitív dolgot a mai munkanapodban.', 'Fejezd ki háládat egy kollégának a segítségéért vagy munkájáért.'],
    category: 'Fejlődés',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['worker'],
    keywords: ['hála', 'pozitív', 'kolléga'],
    frequency: 'daily',
  },
  {
    id: 'w_boundary',
    titles: ['Munkaidő határ', 'Fejeződj be időben', 'Work-life balance'],
    descriptions: ['Tartsd be a munkaidő végét – zárd le a napot és kapcsolj ki.', 'Ma ne dolgozz túlórát. Zárd le az e-maileket és pihenj.'],
    category: 'Egészség',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['worker'],
    dayPreference: [1, 2, 3, 4, 5],
    keywords: ['határ', 'egyensúly'],
    frequency: 'daily',
  },
  {
    id: 'w_learn_tool',
    titles: ['Új eszköz felfedezése', 'Produktivitási trükk', 'Hatékonyabb munkamódszer'],
    descriptions: ['Tanulj meg egy új gyorsbillentyűt, eszközt vagy módszert ami gyorsabbá teszi a munkádat.', 'Fedezz fel egy új funkciót a használt szoftveredben.'],
    category: 'Tanulás',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['worker'],
    keywords: ['eszköz', 'trükk', 'hatékony'],
    frequency: 'daily',
  },

  // --- Worker (additional weekly) ---
  {
    id: 'w_mentor',
    titles: ['Mentor konzultáció', 'Tapasztaltabb kolléga megkeresése', 'Karriertanácsadás'],
    descriptions: ['Kérj tanácsot egy tapasztaltabb kollégától vagy mentortól ezen a héten.', 'Beszélj valakivel aki inspirál téged a szakmádban.'],
    category: 'Szociális',
    baseDifficulty: 'medium',
    baseTime: 30,
    personas: ['worker'],
    keywords: ['mentor', 'tanács'],
    frequency: 'weekly',
  },
  {
    id: 'w_automate',
    titles: ['Munkafolyamat egyszerűsítés', 'Automatizálás keresés', 'Hatékonyság javítás'],
    descriptions: ['Keress egy ismétlődő feladatot amit automatizálhatsz vagy egyszerűsíthetsz.', 'Készíts sablont, makrót vagy egyszerűsíts egy munkafolyamatot.'],
    category: 'Produktivitás',
    baseDifficulty: 'hard',
    baseTime: 60,
    personas: ['worker'],
    keywords: ['automatizál', 'egyszerűsít'],
    frequency: 'weekly',
  },
  {
    id: 'w_social_lunch',
    titles: ['Szociális ebéd', 'Kollégával közös ebéd', 'Csapatépítő beszélgetés'],
    descriptions: ['Ebédelj együtt egy kollégáddal és beszéljetek nem munka témákról is.', 'Szánj időt a munkahelyi kapcsolatok ápolására egy közös étkezéssel.'],
    category: 'Szociális',
    baseDifficulty: 'easy',
    baseTime: 45,
    personas: ['worker'],
    keywords: ['ebéd', 'kolléga', 'szociális'],
    frequency: 'weekly',
  },

  // --- Selfdev (additional daily) ---
  {
    id: 'd_cold_exposure',
    titles: ['Komfortzóna mikro-kihívás', 'Napi bátorság', 'Apró kihívás'],
    descriptions: ['Csinálj egy apró dolgot ami kicsit kívül esik a komfortzónádon.', 'Zuhanyozz hidegebb vízzel, szólíts meg valakit, vagy próbálj ki valami újat.'],
    category: 'Fejlődés',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['selfdev'],
    keywords: ['kihívás', 'komfort'],
    frequency: 'daily',
  },
  {
    id: 'd_screen_limit',
    titles: ['Képernyőidő csökkentés', 'Tudatos telefon-használat', 'Digitális tudatosság'],
    descriptions: ['Csökkentsd a social media használatodat ma – állíts be időkorlátot.', 'Figyelj tudatosan a telefon-felkapásokra és tegyél le ha nem kell.'],
    category: 'Fejlődés',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['selfdev'],
    keywords: ['telefon', 'képernyő', 'social'],
    frequency: 'daily',
  },
  {
    id: 'd_visualization',
    titles: ['Cél vizualizáció', 'Jövőkép képzelés', 'Motivációs percek'],
    descriptions: ['Zárd be a szemed 5 percre és képzeld el magad a céljaid elérése után.', 'Vizualizáld a heted, hónapod vagy éved sikerét részletesen.'],
    category: 'Fejlődés',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['selfdev'],
    keywords: ['vizualizáció', 'cél', 'motiváció'],
    frequency: 'daily',
  },
  {
    id: 'd_teach_share',
    titles: ['Tudásmegosztás', 'Oszd meg amit tanultál', 'Inspirálj másokat'],
    descriptions: ['Oszd meg egy baráttal vagy online amit ma tanultál.', 'Írj egy rövid posztot vagy mesélj valakinek egy érdekes felismerésedről.'],
    category: 'Szociális',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['selfdev'],
    keywords: ['megosztás', 'tanít'],
    frequency: 'daily',
  },
  {
    id: 'd_nature_time',
    titles: ['Természet idő', 'Szabadtéri séta', 'Zöldben töltött idő'],
    descriptions: ['Tölts legalább 20 percet a természetben – parkban, erdőben vagy kertben.', 'Menj ki a szabadba és figyelj a természetre tudatosan.'],
    category: 'Egészség',
    baseDifficulty: 'easy',
    baseTime: 20,
    personas: ['selfdev'],
    keywords: ['természet', 'séta', 'zöld'],
    frequency: 'daily',
  },

  // --- Selfdev (additional weekly) ---
  {
    id: 'd_new_experience',
    titles: ['Új élmény', 'Ismeretlen kipróbálása', 'Első alkalommal'],
    descriptions: ['Próbálj ki ezen a héten valamit amit még sosem csináltál.', 'Menj egy új helyre, kóstolj egy új ételt, vagy próbálj egy új tevékenységet.'],
    category: 'Fejlődés',
    baseDifficulty: 'hard',
    baseTime: 60,
    personas: ['selfdev'],
    keywords: ['új', 'élmény', 'első'],
    frequency: 'weekly',
  },
  {
    id: 'd_habit_audit',
    titles: ['Szokás audit', 'Rutin áttekintés', 'Szokások értékelése'],
    descriptions: ['Tekintsd át a szokásaidat: melyik működik, melyiket kell változtatni.', 'Értékeld a heti szokásaidat és tervezz módosításokat ahol kell.'],
    category: 'Szervezés',
    baseDifficulty: 'medium',
    baseTime: 25,
    personas: ['selfdev'],
    keywords: ['szokás', 'audit', 'rutin'],
    frequency: 'weekly',
  },
  {
    id: 'd_gratitude_letter',
    titles: ['Hálalevél írás', 'Köszönet kifejezés', 'Értékelés valakinek'],
    descriptions: ['Írj egy rövid levelet vagy üzenetet valakinek akit értékelsz.', 'Fejezd ki a háládat egy fontos személynek az életedben.'],
    category: 'Szociális',
    baseDifficulty: 'medium',
    baseTime: 20,
    personas: ['selfdev'],
    keywords: ['hála', 'levél', 'köszönet'],
    frequency: 'weekly',
  },

  // --- Freelancer (additional daily) ---
  {
    id: 'f_networking_dm',
    titles: ['Networking üzenet', 'Kapcsolatépítő DM', 'Szakmai köszönés'],
    descriptions: ['Küldj egy személyes üzenetet egy szakmai kapcsolatodnak.', 'Írj egy rövid üzenetet egy potenciális együttműködő partnernek.'],
    category: 'Szociális',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['freelancer'],
    keywords: ['networking', 'üzenet'],
    frequency: 'daily',
  },
  {
    id: 'f_quick_finance',
    titles: ['Pénzügyi gyorscheck', 'Bevétel/kiadás ellenőrzés', 'Számlák állapota'],
    descriptions: ['Ellenőrizd gyorsan a bankszámlád, függő számláid és kifizetéseid.', 'Nézd meg a mai bevételeket és kiadásokat – tarts mindent naprakészen.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['freelancer'],
    keywords: ['pénz', 'számla', 'bevétel'],
    frequency: 'daily',
  },
  {
    id: 'f_skill_15',
    titles: ['15 perces skill boost', 'Gyors készségfejlesztés', 'Mikro-tanulás'],
    descriptions: ['Szánj 15 percet egy konkrét szaktudás gyakorlására.', 'Nézz meg egy rövid tutorialt vagy cikket a szakterületedről.'],
    category: 'Tanulás',
    baseDifficulty: 'easy',
    baseTime: 15,
    personas: ['freelancer'],
    keywords: ['készség', 'tanulás', 'gyors'],
    frequency: 'daily',
  },
  {
    id: 'f_outdoor_break',
    titles: ['Szabadtéri szünet', 'Levegőzés a munkából', 'Séta a blokk körül'],
    descriptions: ['Menj ki 15 percre a szabadba – sétálj, lélegezz, töltődj.', 'Szakítsd meg a munkát egy rövid szabadtéri sétával.'],
    category: 'Egészség',
    baseDifficulty: 'easy',
    baseTime: 15,
    personas: ['freelancer'],
    keywords: ['séta', 'szabadtér', 'szünet'],
    frequency: 'daily',
  },
  {
    id: 'f_idea_capture',
    titles: ['Ötlet rögzítés', 'Napi brainstorm', 'Kreatív jegyzet'],
    descriptions: ['Jegyezz le 3 új ötletet: projekthez, tartalomhoz vagy üzletfejlesztéshez.', 'Szánj 10 percet szabad brainstormingra és írd le ami eszedbe jut.'],
    category: 'Kreativitás',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['freelancer'],
    keywords: ['ötlet', 'brainstorm'],
    frequency: 'daily',
  },

  // --- Freelancer (additional weekly) ---
  {
    id: 'f_testimonial',
    titles: ['Visszajelzés kérés', 'Ügyfél ajánlás gyűjtés', 'Review begyűjtés'],
    descriptions: ['Kérj visszajelzést egy korábbi ügyfeledtől a munkádról.', 'Gyűjts be egy ajánlást vagy értékelést ami erősíti a portfóliódat.'],
    category: 'Produktivitás',
    baseDifficulty: 'medium',
    baseTime: 20,
    personas: ['freelancer'],
    keywords: ['visszajelzés', 'ajánlás'],
    frequency: 'weekly',
  },
  {
    id: 'f_financial_plan',
    titles: ['Személyes pénzügyi terv', 'Havi bevétel tervezés', 'Pénzügyi cél kitűzés'],
    descriptions: ['Tekintsd át a havi bevételeid/kiadásaid és tervezd a következő hónapot.', 'Határozd meg a pénzügyi céljaidat és a szükséges lépéseket.'],
    category: 'Szervezés',
    baseDifficulty: 'hard',
    baseTime: 45,
    personas: ['freelancer'],
    keywords: ['pénzügyi', 'terv', 'bevétel'],
    frequency: 'weekly',
  },
  {
    id: 'f_brand_refresh',
    titles: ['Személyes márka frissítés', 'Online profil update', 'LinkedIn/Portfolio átnézés'],
    descriptions: ['Frissítsd az online profiljaidat: LinkedIn, portfólió, közösségi média bio.', 'Gondold át a személyes márkádat és frissítsd ahol szükséges.'],
    category: 'Kreativitás',
    baseDifficulty: 'medium',
    baseTime: 30,
    personas: ['freelancer'],
    keywords: ['márka', 'profil', 'frissít'],
    frequency: 'weekly',
  },

  // --- Organizer (additional daily) ---
  {
    id: 'o_plants',
    titles: ['Növények gondozása', 'Kert/virágok öntözése', 'Zöld percek'],
    descriptions: ['Gondozd a növényeidet: öntözés, levelek átnézése, átültetés ha kell.', 'Szánj 10 percet a növényeid gondozására.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['organizer'],
    keywords: ['növény', 'kert', 'öntöz'],
    frequency: 'daily',
  },
  {
    id: 'o_one_drawer',
    titles: ['Egy fiók rendje', 'Kis terület selejtezés', 'Mikro-rendrakás'],
    descriptions: ['Válassz EGY fiókot, polcot vagy dobozt és rakd rendbe teljesen.', 'Selejtezz ki legalább 3 felesleges tárgyat egy kis területről.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 15,
    personas: ['organizer'],
    keywords: ['fiók', 'selejtez', 'rendez'],
    frequency: 'daily',
  },
  {
    id: 'o_family_gratitude',
    titles: ['Családi hála', 'Szeretetnyelvek gyakorlása', 'Pozitív szó a családnak'],
    descriptions: ['Mondj valami szépet minden családtagodnak ma.', 'Fejezd ki háládat és szeretetedet a családod felé egy apró gesztussal.'],
    category: 'Szociális',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['organizer'],
    keywords: ['család', 'hála', 'szeretet'],
    frequency: 'daily',
  },
  {
    id: 'o_self_care',
    titles: ['Önkarbantartás idő', 'Személyes ápolás', 'Időt magadra'],
    descriptions: ['Szánj 20 percet kizárólag magadra: fürdő, bőrápolás, nyugalom.', 'Ne felejtkezz el magadról – csinálj valamit ami jól esik csak neked.'],
    category: 'Egészség',
    baseDifficulty: 'easy',
    baseTime: 20,
    personas: ['organizer'],
    keywords: ['ápolás', 'magad', 'pihenés'],
    frequency: 'daily',
  },
  {
    id: 'o_digital_tidy',
    titles: ['Digitális rendrakás', 'Email és fájlok rendezése', 'Telefon takarítás'],
    descriptions: ['Rendezd az e-mailjeidet, töröld a felesleges fájlokat és appokat.', 'Szánj 15 percet a digitális rendrakásra: értesítések, fotók, letöltések.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 15,
    personas: ['organizer'],
    keywords: ['digitális', 'email', 'rendez'],
    frequency: 'daily',
  },

  // --- Organizer (additional weekly) ---
  {
    id: 'o_subscription_audit',
    titles: ['Előfizetés felülvizsgálat', 'Ismétlődő kiadások átnézése', 'Felesleges tagságok lemondása'],
    descriptions: ['Nézd át az előfizetéseidet és mondd le amit nem használsz.', 'Ellenőrizd a havi ismétlődő kiadásaidat és optimalizálj.'],
    category: 'Szervezés',
    baseDifficulty: 'medium',
    baseTime: 25,
    personas: ['organizer'],
    keywords: ['előfizetés', 'kiadás', 'lemond'],
    frequency: 'weekly',
  },
  {
    id: 'o_pantry_clean',
    titles: ['Kamra/hűtő rendezés', 'Élelmiszer leltár', 'Lejárat ellenőrzés'],
    descriptions: ['Rendezd ki a kamrát és hűtőt: dobd ki a lejártat, rendszerezd a többit.', 'Készíts leltárt a meglévő élelmiszerekből a hatékonyabb bevásárláshoz.'],
    category: 'Szervezés',
    baseDifficulty: 'medium',
    baseTime: 30,
    personas: ['organizer'],
    keywords: ['kamra', 'hűtő', 'élelmiszer'],
    frequency: 'weekly',
  },
  {
    id: 'o_family_meeting',
    titles: ['Családi megbeszélés', 'Heti családi egyeztetés', 'Közös tervezés'],
    descriptions: ['Tartsatok rövid családi megbeszélést: mi volt jó, mi a terv a következő hétre.', 'Beszéljétek meg a család igényeit, terveit és elosztjátok a feladatokat.'],
    category: 'Szociális',
    baseDifficulty: 'medium',
    baseTime: 30,
    personas: ['organizer'],
    keywords: ['család', 'megbeszélés', 'terv'],
    frequency: 'weekly',
  },

  // ═══════════════════════════════════════
  //  EXPANDED PERSONA POOL — ROUND 3
  //  Even more variety per persona
  // ═══════════════════════════════════════

  // --- Student (expanded daily) ---
  {
    id: 's_essay_draft',
    titles: ['Esszé/dolgozat vázlat', 'Írás tervezés', 'Gondolattérkép készítés'],
    descriptions: ['Készíts vázlatot vagy gondolattérképet a következő beadandódhoz.', 'Tervezd meg a dolgozatod szerkezetét: bevezető, kifejtés, összegzés.'],
    category: 'Tanulás',
    baseDifficulty: 'medium',
    baseTime: 30,
    personas: ['student'],
    keywords: ['esszé', 'dolgozat', 'vázlat'],
    frequency: 'daily',
  },
  {
    id: 's_study_group_org',
    titles: ['Tanulócsoport szervezés', 'Közös tanulás', 'Csoportos megbeszélés'],
    descriptions: ['Szervezz vagy csatlakozz egy tanulócsoporthoz közös felkészüléshez.', 'Gyakoroljatok együtt egy nehezebb témát csoportban.'],
    category: 'Szociális',
    baseDifficulty: 'easy',
    baseTime: 15,
    personas: ['student'],
    keywords: ['csoport', 'közös', 'tanulás'],
    frequency: 'daily',
  },
  {
    id: 's_vocab_drill',
    titles: ['Szókincs gyakorlás', 'Fogalom ismétlés', 'Definíciók tanulása'],
    descriptions: ['Gyakorold a kulcsfogalmakat és definíciókat 15 percig.', 'Ismételd át a legfontosabb szakkifejezéseket a tananyagodból.'],
    category: 'Tanulás',
    baseDifficulty: 'easy',
    baseTime: 15,
    personas: ['student'],
    keywords: ['szókincs', 'fogalom', 'definíció'],
    frequency: 'daily',
  },
  {
    id: 's_online_resource',
    titles: ['Online forrás keresés', 'Kiegészítő anyag', 'Videó lecke nézés'],
    descriptions: ['Keress egy hasznos YouTube videót vagy cikket a tananyagodhoz.', 'Nézz egy oktató videót vagy olvass el egy kiegészítő cikket.'],
    category: 'Tanulás',
    baseDifficulty: 'easy',
    baseTime: 20,
    personas: ['student'],
    keywords: ['online', 'videó', 'forrás'],
    frequency: 'daily',
  },
  {
    id: 's_practice_problems',
    titles: ['Gyakorló feladatok', 'Próba feladatsor', 'Önellenőrzés'],
    descriptions: ['Oldj meg gyakorló feladatokat a nehezebb témakörökből.', 'Teszteld tudásodat próba feladatokkal vagy régi vizsga kérdésekkel.'],
    category: 'Tanulás',
    baseDifficulty: 'medium',
    baseTime: 35,
    personas: ['student'],
    keywords: ['gyakorlás', 'feladat', 'teszt'],
    frequency: 'daily',
  },

  // --- Student (expanded weekly) ---
  {
    id: 's_week_study_review',
    titles: ['Heti tanulmányi összefoglaló', 'Tanulási visszatekintés', 'Heti progress check'],
    descriptions: ['Tekintsd át mit tanultál ezen a héten és mit kell ismételned.', 'Készíts heti összefoglalót a tananyagról és tervezd a következő hetet.'],
    category: 'Tanulás',
    baseDifficulty: 'medium',
    baseTime: 30,
    personas: ['student'],
    keywords: ['heti', 'összefoglaló', 'tanulás'],
    frequency: 'weekly',
  },
  {
    id: 's_study_environment',
    titles: ['Tanulókörnyezet rendezés', 'Íróasztal tisztítás', 'Tanulósarok frissítés'],
    descriptions: ['Rendezd be a tanulóhelyed: tiszta asztal, rendezett jegyzetei, feltöltött eszközök.', 'Készítsd elő a tanulókörnyezetedet a következő hétre.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 20,
    personas: ['student'],
    keywords: ['környezet', 'rendezés', 'asztal'],
    frequency: 'weekly',
  },

  // --- Worker (expanded daily) ---
  {
    id: 'w_inbox_zero',
    titles: ['Inbox rendezés', 'Email feldolgozás', 'Levelezés nullázás'],
    descriptions: ['Dolgozd fel az összes olvasatlan emailedet: válaszolj, archiválj vagy töröld.', 'Érd el az inbox zero-t — ne maradjon feldolgozatlan levél.'],
    category: 'Produktivitás',
    baseDifficulty: 'easy',
    baseTime: 15,
    personas: ['worker'],
    keywords: ['email', 'inbox', 'levél'],
    frequency: 'daily',
  },
  {
    id: 'w_priority_matrix',
    titles: ['Prioritás mátrix', 'Eisenhower rendszerezés', 'Fontos vs. sürgős'],
    descriptions: ['Rendezd a mai feladataidat fontos/sürgős mátrixba és fókuszálj a lényegesre.', 'Kategorizáld a teendőidet: csináld, delegáld, tervezd, vagy hagyd el.'],
    category: 'Produktivitás',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['worker'],
    keywords: ['prioritás', 'mátrix', 'fontos'],
    frequency: 'daily',
  },
  {
    id: 'w_learn_tool',
    titles: ['Új eszköz tanulás', 'Shortcut felfedezés', 'Munkaeszköz tipp'],
    descriptions: ['Tanulj meg egy új shortcutot vagy funkciót a mindennapi munkaeszközödben.', 'Fedezz fel egy hasznos funkciót amit eddig nem használtál a munkádban.'],
    category: 'Tanulás',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['worker'],
    keywords: ['eszköz', 'shortcut', 'tanulás'],
    frequency: 'daily',
  },
  {
    id: 'w_feedback_give',
    titles: ['Visszajelzés adás', 'Kolléga elismerés', 'Konstruktív feedback'],
    descriptions: ['Adj konstruktív visszajelzést egy kollégádnak a munkájáról.', 'Ismerd el egy csapattársad munkáját — építő visszajelzéssel.'],
    category: 'Szociális',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['worker'],
    keywords: ['visszajelzés', 'kolléga', 'elismerés'],
    frequency: 'daily',
  },
  {
    id: 'w_standup_prep',
    titles: ['Standup előkészítés', 'Napi beszámoló', 'Haladás áttekintés'],
    descriptions: ['Készülj a napi standupra: mit csináltál tegnap, mit csinálsz ma, mi blokkol.', 'Foglald össze röviden a haladásodat és a mai tervedet.'],
    category: 'Produktivitás',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['worker'],
    keywords: ['standup', 'beszámoló', 'haladás'],
    frequency: 'daily',
  },

  // --- Worker (expanded weekly) ---
  {
    id: 'w_career_step',
    titles: ['Karrier lépés', 'Szakmai fejlődés', 'Karrierterv haladás'],
    descriptions: ['Tegyél egy konkrét lépést a karriered fejlesztéséért ezen a héten.', 'Dolgozz a szakmai fejlődéseden: tanulj, networkölj, vagy frissítsd a CV-d.'],
    category: 'Fejlődés',
    baseDifficulty: 'medium',
    baseTime: 30,
    personas: ['worker'],
    keywords: ['karrier', 'fejlődés', 'szakmai'],
    frequency: 'weekly',
  },
  {
    id: 'w_week_retro',
    titles: ['Heti retrospektív', 'Munka visszatekintés', 'Heti kiértékelés'],
    descriptions: ['Értékeld az elmúlt hetet: mi ment jól, min javíthatsz, mit tanultál.', 'Végezz heti retrospektívet a munkádról és tervezd a következő hetet.'],
    category: 'Produktivitás',
    baseDifficulty: 'medium',
    baseTime: 20,
    personas: ['worker'],
    keywords: ['retrospektív', 'heti', 'értékelés'],
    frequency: 'weekly',
  },

  // --- Selfdev (expanded daily) ---
  {
    id: 'd_affirmation',
    titles: ['Napi affirmáció', 'Pozitív mantra', 'Önerősítő mondatok'],
    descriptions: ['Mondj el 5 pozitív affirmációt magadról reggel.', 'Gyakorold a pozitív önbeszédet — erősítsd a hitedet önmagadban.'],
    category: 'Fejlődés',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['selfdev'],
    keywords: ['affirmáció', 'pozitív', 'mantra'],
    frequency: 'daily',
  },
  {
    id: 'd_comfort_zone',
    titles: ['Komfortzóna kihívás', 'Bátorság gyakorlat', 'Félelem legyőzés'],
    descriptions: ['Csinálj ma valamit ami kicsit kívül esik a komfortzónádon.', 'Vállalj egy apró kihívást ami fejleszti a bátorságodat.'],
    category: 'Fejlődés',
    baseDifficulty: 'medium',
    baseTime: 15,
    personas: ['selfdev'],
    keywords: ['komfortzóna', 'kihívás', 'bátorság'],
    frequency: 'daily',
  },
  {
    id: 'd_vision_review',
    titles: ['Jövőkép áttekintés', 'Célok vizualizálás', 'Álom táblád frissítés'],
    descriptions: ['Tekintsd át a hosszú távú céljaidat és vizualizáld az elérésüket.', 'Olvass el néhány hosszú távú célodat és gondolkodj el a következő lépésekről.'],
    category: 'Fejlődés',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['selfdev'],
    keywords: ['jövőkép', 'cél', 'vizualizálás'],
    frequency: 'daily',
  },
  {
    id: 'd_skill_practice',
    titles: ['Készség gyakorlás', 'Szándékos gyakorlás', 'Mester szint felé'],
    descriptions: ['Gyakorolj szándékosan egy készséget amit fejleszteni akarsz.', 'Szánj 20 percet egy konkrét készség tudatos fejlesztésére.'],
    category: 'Tanulás',
    baseDifficulty: 'medium',
    baseTime: 20,
    personas: ['selfdev'],
    keywords: ['készség', 'gyakorlás', 'fejlesztés'],
    frequency: 'daily',
  },
  {
    id: 'd_mindset_content',
    titles: ['Gondolkodásmód tartalom', 'Inspiráló podcast', 'Motivációs tartalom'],
    descriptions: ['Hallgass egy inspiráló podcastot vagy nézz egy motivációs TED talkot.', 'Fogyassz fejlődés-orientált tartalmat — könyv, podcast, videó.'],
    category: 'Fejlődés',
    baseDifficulty: 'easy',
    baseTime: 20,
    personas: ['selfdev'],
    keywords: ['podcast', 'motiváció', 'tartalom'],
    frequency: 'daily',
  },

  // --- Selfdev (expanded weekly) ---
  {
    id: 'd_30day_progress',
    titles: ['30 napos kihívás haladás', 'Kihívás mérföldkő', 'Challenge check-in'],
    descriptions: ['Értékeld a haladásodat a folyamatban lévő kihívásodban.', 'Ellenőrizd hol tartasz a jelenlegi önfejlesztő kihívásoddal.'],
    category: 'Fejlődés',
    baseDifficulty: 'medium',
    baseTime: 15,
    personas: ['selfdev'],
    keywords: ['kihívás', '30 nap', 'haladás'],
    frequency: 'weekly',
  },
  {
    id: 'd_values_check',
    titles: ['Értékek felülvizsgálat', 'Iránytű ellenőrzés', 'Prioritás egyeztetés'],
    descriptions: ['Vizsgáld meg a heti döntéseidet: összhangban voltak az értékeiddel?', 'Ellenőrizd hogy a heted tükrözte-e amit igazán fontosnak tartasz.'],
    category: 'Fejlődés',
    baseDifficulty: 'medium',
    baseTime: 20,
    personas: ['selfdev'],
    keywords: ['értékek', 'iránytű', 'prioritás'],
    frequency: 'weekly',
  },

  // --- Freelancer (expanded daily) ---
  {
    id: 'f_client_followup',
    titles: ['Ügyfél utánkövetés', 'Follow-up üzenet', 'Projekt státusz küldés'],
    descriptions: ['Küldj státusz frissítést egy aktív ügyfelednek a projekt haladásáról.', 'Kövess utána egy korábbi ajánlatnak vagy megbeszélésnek.'],
    category: 'Produktivitás',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['freelancer'],
    keywords: ['ügyfél', 'utánkövetés', 'státusz'],
    frequency: 'daily',
  },
  {
    id: 'f_content_create',
    titles: ['Tartalom készítés', 'Social media poszt', 'Szakmai jelenlét építés'],
    descriptions: ['Készíts egy rövid posztot a szakmai közösségi médiádra.', 'Oszd meg a tudásodat: írj egy tippet, gondolatot vagy tanulságot.'],
    category: 'Kreativitás',
    baseDifficulty: 'easy',
    baseTime: 15,
    personas: ['freelancer'],
    keywords: ['tartalom', 'poszt', 'közösségi'],
    frequency: 'daily',
  },
  {
    id: 'f_admin_30',
    titles: ['Admin 30 perc', 'Ügyvitel rendezés', 'Számlázás és papírok'],
    descriptions: ['Szánj 30 percet az adminisztratív feladatokra: számlák, szerződések, emailek.', 'Intézd el a halmozódó admin ügyeket: iktatás, számlázás, válaszolás.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 30,
    personas: ['freelancer'],
    keywords: ['admin', 'számla', 'szervezés'],
    frequency: 'daily',
  },
  {
    id: 'f_time_track',
    titles: ['Időkövetés indítás', 'Munkaóra naplózás', 'Idő rögzítés'],
    descriptions: ['Kövesd nyomon a mai munkaidődet projektenként.', 'Rögzítsd pontosan mennyi időt töltöttél az egyes projekteken ma.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['freelancer'],
    keywords: ['időkövetés', 'munkaóra', 'napló'],
    frequency: 'daily',
  },
  {
    id: 'f_learn_market',
    titles: ['Piac figyelés', 'Trend követés', 'Versenyelem analízis'],
    descriptions: ['Nézd meg mit csinálnak a versenytársaid és a piacod trendjeit.', 'Tájékozódj a szakterületed legújabb trendjeiben és lehetőségeiben.'],
    category: 'Tanulás',
    baseDifficulty: 'easy',
    baseTime: 15,
    personas: ['freelancer'],
    keywords: ['piac', 'trend', 'verseny'],
    frequency: 'daily',
  },

  // --- Freelancer (expanded weekly) ---
  {
    id: 'f_pipeline_review',
    titles: ['Pipeline áttekintés', 'Projekt csővezeték', 'Munka tervezés'],
    descriptions: ['Tekintsd át a projekt pipeline-odat: mi jön, mi vár ajánlatra, mi zárul.', 'Értékeld a munkaterheidet és tervezz a következő hétekre.'],
    category: 'Produktivitás',
    baseDifficulty: 'medium',
    baseTime: 25,
    personas: ['freelancer'],
    keywords: ['pipeline', 'projekt', 'tervezés'],
    frequency: 'weekly',
  },
  {
    id: 'f_brand_building',
    titles: ['Márkaépítés', 'Portfólió frissítés', 'Online jelenlét erősítés'],
    descriptions: ['Frissítsd a portfóliódat, weboldalad vagy LinkedIn profilodat.', 'Dolgozz a személyes márkádon: frissíts egy platformot vagy készíts új tartalmat.'],
    category: 'Kreativitás',
    baseDifficulty: 'medium',
    baseTime: 30,
    personas: ['freelancer'],
    keywords: ['márka', 'portfólió', 'online'],
    frequency: 'weekly',
  },

  // --- Organizer (expanded daily) ---
  {
    id: 'o_meal_plan_day',
    titles: ['Mai étkezés tervezés', 'Menü összeállítás', 'Recept keresés'],
    descriptions: ['Tervezd meg a mai/holnapi étkezéseket: reggeli, ebéd, vacsora.', 'Válassz recepteket és ellenőrizd hogy megvan-e minden hozzávaló.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['organizer'],
    keywords: ['étkezés', 'menü', 'recept'],
    frequency: 'daily',
  },
  {
    id: 'o_chore_assign',
    titles: ['Feladat kiosztás', 'Háztartási feladat delegálás', 'Közös teendők'],
    descriptions: ['Oszd ki a mai háztartási feladatokat a családtagok között.', 'Szervezd meg ki mit csinál ma otthon — egyenletes elosztásban.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['organizer'],
    keywords: ['feladat', 'kiosztás', 'háztartás'],
    frequency: 'daily',
  },
  {
    id: 'o_bill_check',
    titles: ['Számla ellenőrzés', 'Csekk fizetés', 'Pénzügyi napirend'],
    descriptions: ['Ellenőrizd a beérkezett számlákat és fizess ha szükséges.', 'Nézd át a mai pénzügyi teendőket: számlák, átutalások, határidők.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['organizer'],
    keywords: ['számla', 'fizetés', 'pénzügy'],
    frequency: 'daily',
  },
  {
    id: 'o_stock_check',
    titles: ['Készlet ellenőrzés', 'Hiánylista készítés', 'Kamra leltár'],
    descriptions: ['Ellenőrizd az otthoni készleteket: konyha, fürdő, háztartási szerek.', 'Készíts hiánylistát amiket pótolni kell a következő bevásárláskor.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['organizer'],
    keywords: ['készlet', 'hiány', 'kamra'],
    frequency: 'daily',
  },
  {
    id: 'o_family_checkin',
    titles: ['Családi check-in', 'Hogyan vagytok?', 'Napi összehangolás'],
    descriptions: ['Kérdezd meg a családtagjaidat hogyan telt a napjuk és mire van szükségük.', 'Végezz egy rövid családi check-in-t: mi történt ma, mi lesz holnap.'],
    category: 'Szociális',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['organizer'],
    keywords: ['család', 'check-in', 'beszélgetés'],
    frequency: 'daily',
  },

  // --- Organizer (expanded weekly) ---
  {
    id: 'o_family_meeting',
    titles: ['Családi megbeszélés', 'Heti családi gyűlés', 'Közös tervezés'],
    descriptions: ['Tartsatok családi megbeszélést: mit csináltatok, mi jön, mire van szükség.', 'Szervezzetek heti családi gyűlést a tervezéshez és összehangoláshoz.'],
    category: 'Szociális',
    baseDifficulty: 'medium',
    baseTime: 30,
    personas: ['organizer'],
    keywords: ['család', 'gyűlés', 'tervezés'],
    frequency: 'weekly',
  },
  {
    id: 'o_home_project',
    titles: ['Otthoni projekt haladás', 'Háztartási fejlesztés', 'DIY feladat'],
    descriptions: ['Haladj az otthoni projekteddel: festés, javítás, rendezés, berendezés.', 'Dolgozz egy otthoni fejlesztésen amit már régóta tervezel.'],
    category: 'Szervezés',
    baseDifficulty: 'hard',
    baseTime: 60,
    personas: ['organizer'],
    keywords: ['projekt', 'fejlesztés', 'otthon'],
    frequency: 'weekly',
  },

  // ═══════════════════════════════════════
  //  UNIVERSAL TEMPLATES (all personas)
  //  These are general life tasks that everyone needs.
  //  Available to ALL personas for a well-rounded experience.
  // ═══════════════════════════════════════

  // --- Universal Daily: Health & Wellness ---
  {
    id: 'u_morning_move',
    titles: ['Reggeli mozgás', 'Ébresztő torna', 'Nap indító mozgás'],
    descriptions: ['Kezdd a napodat 10 perc mozgással: nyújtás, torna vagy séta.', 'Mozdulj meg reggel – frissebben fogod kezdeni a napodat.'],
    category: 'Egészség',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['reggeli', 'mozgás', 'torna'],
    frequency: 'daily',
  },
  {
    id: 'u_hydration',
    titles: ['Vízfogyasztás', 'Igyál elég vizet', 'Hidratálás'],
    descriptions: ['Igyál meg legalább 8 pohár vizet ma – kövesd nyomon!', 'Figyelj a vízfogyasztásodra: tegyél ki egy palackot és idd meg napközben.'],
    category: 'Egészség',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['víz', 'ital', 'hidratál'],
    frequency: 'daily',
  },
  {
    id: 'u_walk_outside',
    titles: ['Séta a szabadban', '20 perc séta', 'Levegőzés'],
    descriptions: ['Sétálj legalább 20 percet a szabadban – parkban, utcán, bárhol.', 'Menj ki a friss levegőre és sétálj – a tested és elméd is megköszöni.'],
    category: 'Egészség',
    baseDifficulty: 'easy',
    baseTime: 20,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['séta', 'levegő', 'szabadban'],
    frequency: 'daily',
  },
  {
    id: 'u_stretch',
    titles: ['Nyújtás', 'Testtartás javítás', '5 perc nyújtózás'],
    descriptions: ['Végezz 5 perc nyújtást – különösen nyak, váll és derék.', 'Szakíts meg egy hosszabb ülést nyújtással a jobb testtartásért.'],
    category: 'Egészség',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['nyújtás', 'testtartás'],
    frequency: 'daily',
  },
  {
    id: 'u_healthy_meal',
    titles: ['Egészséges étkezés', 'Tudatos étel választás', 'Tápláló obéd'],
    descriptions: ['Válassz egészséges opciót legalább egy étkezésnél ma.', 'Figyelj arra mit eszel: válassz zöldséget, gyümölcsöt vagy teljes kiőrlést.'],
    category: 'Egészség',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['egészséges', 'étel', 'táplálkozás'],
    frequency: 'daily',
  },
  {
    id: 'u_wind_down',
    titles: ['Esti levezetés', 'Lefekvési rutin', 'Nyugodt este'],
    descriptions: ['Kezdd el az esti rutint 1 órával lefekvés előtt: nem képernyő, nyugalom.', 'Készülj a pihenésre: tedd le a telefont, igyál egy teát, lazíts.'],
    category: 'Egészség',
    baseDifficulty: 'easy',
    baseTime: 30,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['este', 'alvás', 'rutin'],
    frequency: 'daily',
  },

  // --- Universal Daily: Organization & Household ---
  {
    id: 'u_tidy_space',
    titles: ['Környezet rendezés', '10 perc rendrakás', 'Gyors takarítás'],
    descriptions: ['Szánj 10 percet a közvetlen környezeted rendezésére.', 'Pakolj el, töröld le a felületet, mosd el az edényt – csak 10 perc!'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['rendez', 'takarít', 'pakol'],
    frequency: 'daily',
  },
  {
    id: 'u_cook_simple',
    titles: ['Otthoni főzés', 'Egyszerű házi étel', 'Főzz ma otthon'],
    descriptions: ['Készíts otthon ételt ma – nem kell bonyolult, csak házi legyen.', 'Főzz egy egyszerű, egészséges ételt ahelyett hogy rendelnél.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 30,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['főzés', 'étel', 'otthon'],
    frequency: 'daily',
  },
  {
    id: 'u_expense_note',
    titles: ['Napi kiadás feljegyzés', 'Költés nyomon követés', 'Pénztárca check'],
    descriptions: ['Jegyezd fel a mai kiadásaidat – tartsd szem előtt mire megy a pénzed.', 'Nézd meg mennyit költöttél ma és kategorrizáld a kiadásokat.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['kiadás', 'pénz', 'költés'],
    frequency: 'daily',
  },
  {
    id: 'u_plan_tomorrow',
    titles: ['Holnap megtervezése', 'Következő nap előkészítése', 'Esti tervezés'],
    descriptions: ['Írd össze a holnapi 3 legfontosabb teendődet lefekvés előtt.', 'Készítsd elő a holnapi napodat: ruha, táska, teendők listája.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['holnap', 'terv', 'előkészít'],
    frequency: 'daily',
  },

  // --- Universal Daily: Social & Growth ---
  {
    id: 'u_connect',
    titles: ['Kapcsolattartás', 'Hívj fel valakit', 'Szociális pillanat'],
    descriptions: ['Hívd fel vagy írd meg egy barátod/családtagod akit régóta nem kerestél.', 'Szánj 10 percet egy fontos emberi kapcsolat ápolására.'],
    category: 'Szociális',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['hív', 'barát', 'család', 'kapcsolat'],
    frequency: 'daily',
  },
  {
    id: 'u_learn_something',
    titles: ['Tanulj valami újat', 'Napi érdekesség', 'Tudásbővítés'],
    descriptions: ['Tanulj meg egy új dolgot ma: egy szót, egy tényt, egy trükköt.', 'Nézz meg egy rövid videót, olvass egy cikket – bővítsd a látókörödet.'],
    category: 'Tanulás',
    baseDifficulty: 'easy',
    baseTime: 15,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['tanul', 'új', 'érdekesség'],
    frequency: 'daily',
  },
  {
    id: 'u_screen_break',
    titles: ['Képernyőszünet', 'Szem pihentetés', 'Digitális szünet'],
    descriptions: ['Tarts legalább 3 alkalommal 5 perces szünetet a képernyőtől.', 'Alkalmazzd a 20-20-20 szabályt: 20 percenként nézz 20 másodpercig 20 lábra.'],
    category: 'Egészség',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['képernyő', 'szünet', 'szem'],
    frequency: 'daily',
  },
  {
    id: 'u_gratitude_general',
    titles: ['Napi hálaadás', '3 dolog amiért hálás vagy', 'Pozitív percek'],
    descriptions: ['Gondolj 3 dologra amiért ma hálás vagy – írd le vagy mondd ki.', 'Fejezd be a napodat azzal hogy felidézed a nap legjobb pillanatait.'],
    category: 'Fejlődés',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['hála', 'pozitív'],
    frequency: 'daily',
  },
  {
    id: 'u_inbox_process',
    titles: ['Üzenetek feldolgozása', 'Inbox rendezés', 'Értesítések kitakarítása'],
    descriptions: ['Dolgozd fel az összegyűlt üzeneteidet, emailjeidet és értesítéseidet.', 'Rendezd az inboxodat: válaszolj, archiválj, törölj.'],
    category: 'Produktivitás',
    baseDifficulty: 'easy',
    baseTime: 15,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['email', 'üzenet', 'inbox'],
    frequency: 'daily',
  },

  // --- Universal Weekly ---
  {
    id: 'u_weekly_groceries',
    titles: ['Heti bevásárlás', 'Élelmiszer beszerzés', 'Bevásárlólista alapján vásárlás'],
    descriptions: ['Tervezd meg és végezd el a heti bevásárlást lista alapján.', 'Szerezd be a hétre szükséges élelmiszereket és háztartási cikkeket.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 60,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['bevásárlás', 'bolt', 'élelmiszer'],
    frequency: 'weekly',
  },
  {
    id: 'u_home_clean',
    titles: ['Heti takarítás', 'Egy szoba alapos takarítása', 'Otthon frissítés'],
    descriptions: ['Válassz egy szobát vagy területet és takaríts alaposan.', 'Végezd el a heti nagytakarítást: porszívózás, felmosás, por törlés.'],
    category: 'Szervezés',
    baseDifficulty: 'medium',
    baseTime: 60,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['takarítás', 'tisztaság'],
    frequency: 'weekly',
  },
  {
    id: 'u_finance_review',
    titles: ['Heti pénzügyi áttekintés', 'Költségvetés ellenőrzés', 'Kiadások összesítése'],
    descriptions: ['Tekintsd át a heti kiadásaidat és hasonlítsd össze a terveddel.', 'Összesítsd a heti kiadásokat, keresd a spórolási lehetőségeket.'],
    category: 'Szervezés',
    baseDifficulty: 'medium',
    baseTime: 20,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['pénz', 'költség', 'áttekintés'],
    frequency: 'weekly',
  },
  {
    id: 'u_meal_plan',
    titles: ['Étkezés tervezés', 'Heti menü összeállítás', 'Meal prep ötletek'],
    descriptions: ['Tervezd meg a következő hét étkezéseit és készíts bevásárlólistát.', 'Gondold végig mit fogsz főzni/enni jövő héten és szervezd meg.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 20,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['étel', 'menü', 'terv'],
    frequency: 'weekly',
  },
  {
    id: 'u_social_plan',
    titles: ['Szociális program', 'Találkozó szervezés', 'Közös program barátokkal'],
    descriptions: ['Szervezz vagy vegyél részt egy szociális programon ezen a héten.', 'Hívd el egy barátodat kávézni, sétálni vagy bármilyen közös programra.'],
    category: 'Szociális',
    baseDifficulty: 'medium',
    baseTime: 60,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['barát', 'program', 'közös'],
    frequency: 'weekly',
  },
  {
    id: 'u_fitness_goal',
    titles: ['Heti fitness cél', 'Sportolás a héten', 'Aktív hét'],
    descriptions: ['Sportolj legalább 3x ezen a héten: edzés, futás, úszás, bármi.', 'Tűzz ki egy konkrét fitness célt a hétre és tartsd be.'],
    category: 'Egészség',
    baseDifficulty: 'medium',
    baseTime: 120,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['sport', 'edzés', 'fitness'],
    frequency: 'weekly',
  },
  {
    id: 'u_self_reflection',
    titles: ['Heti önreflexió', 'Heti értékelés', 'Mit tanultam a héten'],
    descriptions: ['Gondold végig a hetedet: mi ment jól, min változtatnál, mire vagy büszke.', 'Írj egy rövid összefoglalót a hetedről – sikerei, tanulságai.'],
    category: 'Fejlődés',
    baseDifficulty: 'easy',
    baseTime: 15,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['reflexió', 'értékel', 'hét'],
    frequency: 'weekly',
  },
  {
    id: 'u_digital_cleanup',
    titles: ['Digitális nagytakarítás', 'Fájlok és appok rendezése', 'Digitális rend'],
    descriptions: ['Rendezd a fájljaidat, töröld a felesleges appokat és frissítsd a jelszavaidat.', 'Szánj 30 percet a digitális élettered rendezésére.'],
    category: 'Szervezés',
    baseDifficulty: 'medium',
    baseTime: 30,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['digitális', 'fájl', 'rendez'],
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

  // ═══════════════════════════════════════════════════════════
  //  PREFERENCE-BASED QUESTS — only shown if user selected
  //  the matching interest during onboarding
  //
  //  DAILY  = simple, quick, routine-building habits (easy, 5-20 min)
  //  WEEKLY = complex, challenging, multi-step tasks  (hard/epic, 45-120 min)
  // ═══════════════════════════════════════════════════════════

  // ── HEALTH (Egészség & Fitnesz) ─────────────────────────

  // --- Health Daily: simple routines ---
  {
    id: 'pref_h_water_track',
    titles: ['Napi vízfogyasztás', 'Igyál elég vizet', 'Hidratálás nyomon követés'],
    descriptions: ['Igyál meg legalább 8 pohár vizet a nap folyamán és kövesd nyomon.', 'Figyelj a folyadékbeviteledre — jelöld minden pohár vizet amit megiszol.'],
    category: 'Egészség',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['víz', 'hidratálás', 'folyadék'],
    frequency: 'daily',
    preferenceTag: 'health',
  },
  {
    id: 'pref_h_morning_stretch',
    titles: ['Reggeli nyújtás', '5 perces torna', 'Ébredés után mozgás'],
    descriptions: ['Végezz 5 perces nyújtást reggel felkelés után — ébreszd fel a testedet.', 'Kezdd a napodat rövid nyújtózással: nyak, váll, hát, láb.'],
    category: 'Egészség',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['nyújtás', 'reggel', 'torna'],
    frequency: 'daily',
    preferenceTag: 'health',
  },
  {
    id: 'pref_h_walk_10min',
    titles: ['10 perces séta', 'Rövid levegőzés', 'Napi séta rutin'],
    descriptions: ['Menj ki 10 percre sétálni — friss levegő és mozgás a szervezetednek.', 'Iktatj be egy rövid sétát a napodba, akár ebédszünetben is.'],
    category: 'Egészség',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['séta', 'levegő', 'mozgás'],
    frequency: 'daily',
    preferenceTag: 'health',
  },
  {
    id: 'pref_h_sleep_routine',
    titles: ['Esti levezetés', 'Alvás rutin betartás', 'Képernyő lekapcsolás'],
    descriptions: ['Kapcsold ki a képernyőket 30 perccel lefekvés előtt és készülj az alvásra.', 'Tartsd be az esti rutinodat: képernyőszünet, fogmosás, lefekvés időben.'],
    category: 'Egészség',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['alvás', 'este', 'rutin'],
    frequency: 'daily',
    preferenceTag: 'health',
  },
  {
    id: 'pref_h_healthy_snack',
    titles: ['Egészséges nasi', 'Tudatos étkezés', 'Gyümölcs a nassolás helyett'],
    descriptions: ['Válassz egészséges nassolnivalót a chipek vagy édesség helyett.', 'Ma cseréld le a feldolgozott nasit gyümölcsre, dióra vagy zöldségre.'],
    category: 'Egészség',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['nasi', 'egészséges', 'gyümölcs'],
    frequency: 'daily',
    preferenceTag: 'health',
  },

  // --- Health Weekly: complex challenges ---
  {
    id: 'pref_h_meal_prep_week',
    titles: ['Heti meal prep kihívás', 'Egészséges ételek előkészítése', 'Komplett heti étkezés terv'],
    descriptions: ['Tervezd meg a teljes heti étrendedet, vásárolj be és készíts elő legalább 4 adag egészséges ételt előre.', 'Készíts komplett heti meal prepet: tervezés, bevásárlás, főzés, tárolás — az egész hétre.'],
    category: 'Egészség',
    baseDifficulty: 'hard',
    baseTime: 120,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['meal prep', 'főzés', 'heti terv'],
    frequency: 'weekly',
    preferenceTag: 'health',
  },
  {
    id: 'pref_h_fitness_plan',
    titles: ['Heti edzésterv összeállítás és végrehajtás', 'Komplett fitness hét', 'Edzésprogram teljesítés'],
    descriptions: ['Állíts össze egy heti edzéstervet legalább 4 edzésnappal, és hajtsd végre az egészet a hét során.', 'Tervezd meg és teljesítsd a heti edzésprogramodat: cardio, erősítés és nyújtás kombinálásával.'],
    category: 'Egészség',
    baseDifficulty: 'hard',
    baseTime: 90,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['edzésterv', 'fitness', 'program'],
    frequency: 'weekly',
    preferenceTag: 'health',
  },
  {
    id: 'pref_h_new_sport',
    titles: ['Új sport kipróbálás', 'Aktív kaland', 'Ismeretlen mozgásforma felfedezés'],
    descriptions: ['Próbálj ki egy teljesen új sportot vagy mozgásformát: sziklamászás, úszás, küzdősport, jóga — valami amit még sosem csináltál.', 'Lépj ki a komfortzónádból és vegyél részt egy új sportélményen, kutatva hogy mi illik hozzád.'],
    category: 'Egészség',
    baseDifficulty: 'hard',
    baseTime: 90,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['új sport', 'kaland', 'mozgás'],
    frequency: 'weekly',
    preferenceTag: 'health',
  },
  {
    id: 'pref_h_health_audit',
    titles: ['Heti egészség audit', 'Egészségügyi önvizsgálat', 'Teljes jóléti áttekintés'],
    descriptions: ['Végezz teljes heti egészség auditot: értékeld az alvásod, étkezésed, mozgásod, stresszed és állíts fel konkrét célokat a jövő hétre.', 'Tekintsd át az elmúlt hét egészségügyi szokásaidat részletesen, írd le mi működött és mi nem, majd készíts javítási tervet.'],
    category: 'Egészség',
    baseDifficulty: 'hard',
    baseTime: 60,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['audit', 'egészség', 'áttekintés'],
    frequency: 'weekly',
    preferenceTag: 'health',
  },

  // ── FINANCE (Pénzügyek) ─────────────────────────────────

  // --- Finance Daily: simple routines ---
  {
    id: 'pref_f_receipt_log',
    titles: ['Napi kiadás rögzítés', 'Blokk feldolgozás', 'Pénzügyi napló frissítés'],
    descriptions: ['Jegyezd fel a mai kiadásaidat — minden tételt, még a kicsiket is.', 'Tartsd naprakészen a pénzügyi naplódat a mai kiadásokkal.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['kiadás', 'blokk', 'napló'],
    frequency: 'daily',
    preferenceTag: 'finance',
  },
  {
    id: 'pref_f_no_impulse',
    titles: ['Impulzusvásárlás elkerülés', 'Tudatos költés', 'Csak a szükséges'],
    descriptions: ['Ma ne vegyél semmit ami nem szükséges — csak tervezett kiadások.', 'Mielőtt vásárolsz, kérdezd meg magadtól: tényleg szükségem van rá?'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 0,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['vásárlás', 'pénz', 'tudatos'],
    frequency: 'daily',
    preferenceTag: 'finance',
  },
  {
    id: 'pref_f_micro_save',
    titles: ['Napi micro-megtakarítás', 'Félretétel', 'Megtakarítási szokás'],
    descriptions: ['Tegyél félre ma egy kis összeget — akár 100 Ft is számít.', 'Építsd a megtakarítási szokásodat egy napi kis összeggel.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['megtakarítás', 'pénz', 'félretétel'],
    frequency: 'daily',
    preferenceTag: 'finance',
  },
  {
    id: 'pref_f_price_compare',
    titles: ['Ár-összehasonlítás', 'Tudatos fogyasztó', 'Legjobb ár keresés'],
    descriptions: ['Mielőtt megveszel valamit, hasonlítsd össze az árakat legalább 2 helyen.', 'Gyakorold a tudatos vásárlást: keress jobb árakat mielőtt pénzt költesz.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['ár', 'összehasonlítás', 'vásárlás'],
    frequency: 'daily',
    preferenceTag: 'finance',
  },

  // --- Finance Weekly: complex challenges ---
  {
    id: 'pref_f_budget_plan',
    titles: ['Komplett heti büdzsé készítés', 'Részletes költségvetés tervezés', 'Pénzügyi heti mester terv'],
    descriptions: ['Készíts részletes heti költségvetést: írd össze a bevételeidet, fix kiadásokat, változó kiadásokat, és határozz meg kategóriánként költési limitet.', 'Tervezd meg az egész heti pénzügyeidet: bevételek, számlák, élelmiszer, szórakozás — és tartsd be a tervet a hét végéig.'],
    category: 'Szervezés',
    baseDifficulty: 'hard',
    baseTime: 60,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['költségvetés', 'büdzsé', 'terv'],
    frequency: 'weekly',
    preferenceTag: 'finance',
  },
  {
    id: 'pref_f_invest_research',
    titles: ['Befektetési kutatás', 'Pénzügyi tudás elmélyítés', 'Befektetési stratégia kidolgozás'],
    descriptions: ['Kutass fel egy befektetési lehetőséget alaposan: olvasd el a feltételeket, számold ki a hozamot, és készíts összehasonlítást legalább 3 opcióról.', 'Végezz mélyreható kutatást egy pénzügyi témában: olvass cikkeket, nézz elemzéseket és készíts saját összefoglalót a tanultakról.'],
    category: 'Tanulás',
    baseDifficulty: 'hard',
    baseTime: 90,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['befektetés', 'kutatás', 'pénzügy'],
    frequency: 'weekly',
    preferenceTag: 'finance',
  },
  {
    id: 'pref_f_savings_challenge',
    titles: ['Heti megtakarítási kihívás', 'Spórolási projekt', 'Felesleges kiadás megszüntetés'],
    descriptions: ['Ezen a héten találj legalább 3 felesleges kiadást amit megszüntethetsz és számold ki mennyit spórolsz velük havonta.', 'Vállalj egy heti kihívást: ne költs semmit ami nem szükséges, és a hét végén számold össze mennyit sikerült megtakarítanod.'],
    category: 'Szervezés',
    baseDifficulty: 'hard',
    baseTime: 45,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['megtakarítás', 'spórolás', 'kihívás'],
    frequency: 'weekly',
    preferenceTag: 'finance',
  },

  // ── SOCIAL (Társas kapcsolatok) ─────────────────────────

  // --- Social Daily: simple routines ---
  {
    id: 'pref_s_compliment',
    titles: ['Bók adás', 'Pozitív visszajelzés', 'Öröm szerzés másnak'],
    descriptions: ['Adj egy őszinte bókot vagy elismerést valakinek a környezetedben.', 'Emeld fel valaki napját egy kedves szóval vagy gesztussal.'],
    category: 'Szociális',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['bók', 'elismerés', 'pozitív'],
    frequency: 'daily',
    preferenceTag: 'social',
  },
  {
    id: 'pref_s_check_in',
    titles: ['Rövid bejelentkezés', 'Gyors üzenet valakinek', 'Kapcsolat fenntartás'],
    descriptions: ['Küldj egy rövid üzenetet egy barátnak vagy családtagnak — kérdezd meg hogy van.', 'Jelentkezz be valakinél akit régóta nem kerestél — elég egy pár szó is.'],
    category: 'Szociális',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['üzenet', 'kapcsolat', 'bejelentkezés'],
    frequency: 'daily',
    preferenceTag: 'social',
  },
  {
    id: 'pref_s_active_listen',
    titles: ['Aktív hallgatás', 'Figyelmes jelenlét', 'Hallgass meg valakit'],
    descriptions: ['Ma gyakorold az aktív hallgatást — ne szakíts félbe, kérdezz vissza.', 'Légy teljesen jelen egy beszélgetésben: figyelj, értsd meg, reagálj.'],
    category: 'Szociális',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['hallgatás', 'figyelem', 'jelenlét'],
    frequency: 'daily',
    preferenceTag: 'social',
  },
  {
    id: 'pref_s_gratitude_express',
    titles: ['Hála kifejezés', 'Köszönet mondás', 'Hálaüzenet küldés'],
    descriptions: ['Fejezd ki a háládat valakinek ma — mondd el vagy írd le miért fontos számodra.', 'Köszönj meg valamit valakinek akit nem szoktál elég gyakran megköszönni.'],
    category: 'Szociális',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['hála', 'köszönet', 'kifejezés'],
    frequency: 'daily',
    preferenceTag: 'social',
  },

  // --- Social Weekly: complex challenges ---
  {
    id: 'pref_s_organize_event',
    titles: ['Közös program szervezés', 'Társasági esemény tervezés', 'Barátok összehozás'],
    descriptions: ['Szervezz meg egy közös programot barátaiddal vagy családoddal: vacsorameghívás, kirándulás, társasjáték est — a tervezéstől a megvalósításig.', 'Tervezz és valósíts meg egy társasági eseményt: válaszd ki a helyet, hívd meg az embereket, készülj fel rá és vezényeld le.'],
    category: 'Szociális',
    baseDifficulty: 'hard',
    baseTime: 120,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['szervezés', 'program', 'barátok'],
    frequency: 'weekly',
    preferenceTag: 'social',
  },
  {
    id: 'pref_s_reconnect_deep',
    titles: ['Mély kapcsolat újjáépítés', 'Régi barátság felújítás', 'Kapcsolati időbefektetés'],
    descriptions: ['Keress fel egy régi barátot akivel már hónapok óta nem beszéltél, és töltsetek együtt legalább 1 órát — személyesen vagy videóhívásban.', 'Válassz ki egy fontos kapcsolatot amit elhanyagoltál, vedd fel a kapcsolatot és szervezz egy hosszabb találkozót a héten belül.'],
    category: 'Szociális',
    baseDifficulty: 'hard',
    baseTime: 90,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['barát', 'régi', 'kapcsolat'],
    frequency: 'weekly',
    preferenceTag: 'social',
  },
  {
    id: 'pref_s_relationship_audit',
    titles: ['Kapcsolati audit', 'Társas élet áttekintés', 'Közösségi fejlesztési terv'],
    descriptions: ['Végezz teljes kapcsolati auditot: ki az 5 legfontosabb ember az életedben, mikor beszéltél velük utoljára, és hogyan tudnád a kapcsolatot erősíteni? Készíts konkrét tervet.', 'Gondold át a társas kapcsolataidat: kikkel töltenél több időt, milyen új közösséghez csatlakoznál? Írj le legalább 3 konkrét lépést.'],
    category: 'Szociális',
    baseDifficulty: 'hard',
    baseTime: 60,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['audit', 'kapcsolat', 'közösség'],
    frequency: 'weekly',
    preferenceTag: 'social',
  },

  // ── PRODUCTIVITY (Produktivitás) ────────────────────────

  // --- Productivity Daily: simple routines ---
  {
    id: 'pref_p_top3_tasks',
    titles: ['Top 3 feladat kijelölés', 'Napi prioritások', 'Fő célok meghatározás'],
    descriptions: ['Reggel jelöld ki a nap 3 legfontosabb feladatát és koncentrálj rájuk.', 'Határozd meg a mai nap 3 legfontosabb teendőjét mielőtt bármi mást csinálsz.'],
    category: 'Produktivitás',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['prioritás', 'feladat', 'top 3'],
    frequency: 'daily',
    preferenceTag: 'productivity',
  },
  {
    id: 'pref_p_2min_rule',
    titles: ['2 perces szabály', 'Azonnali elvégzés', 'Gyors teendők'],
    descriptions: ['Ha valami 2 perc alatt megoldható, csináld meg azonnal — ne halaszd.', 'Alkalmazd a 2 perces szabályt: amit gyorsan meg tudsz csinálni, tedd meg rögtön.'],
    category: 'Produktivitás',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['2 perc', 'azonnali', 'gyors'],
    frequency: 'daily',
    preferenceTag: 'productivity',
  },
  {
    id: 'pref_p_no_distraction',
    titles: ['Zavarásmentes 25 perc', 'Fókusz blokk', 'Pomodoro session'],
    descriptions: ['Végezz egy 25 perces fókuszált munkablokkot telefon és értesítések nélkül.', 'Kapcsold ki az értesítéseket és dolgozz 25 percig megszakítás nélkül.'],
    category: 'Produktivitás',
    baseDifficulty: 'easy',
    baseTime: 25,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['fókusz', 'pomodoro', 'zavarásmentes'],
    frequency: 'daily',
    preferenceTag: 'productivity',
  },
  {
    id: 'pref_p_evening_review',
    titles: ['Esti napi összefoglaló', 'Nap zárása', 'Haladás ellenőrzés'],
    descriptions: ['Este 5 percben tekintsd át mit végeztél el ma és mit kell holnap megcsinálnod.', 'Zárd a napot egy gyors visszatekintéssel: mi sikerült, mi maradt el, mi a terv holnapra?'],
    category: 'Produktivitás',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['összefoglaló', 'este', 'áttekintés'],
    frequency: 'daily',
    preferenceTag: 'productivity',
  },
  {
    id: 'pref_p_inbox_zero',
    titles: ['Inbox rendezés', 'Email feldolgozás', 'Üzenetek kezelése'],
    descriptions: ['Dolgozd fel a bejövő emailjeidet/üzeneteidet: válaszolj, archiválj vagy törölj.', 'Tarts 10 perces inbox-rendezést: ne maradjon megválaszolatlan fontos üzenet.'],
    category: 'Produktivitás',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['inbox', 'email', 'rendezés'],
    frequency: 'daily',
    preferenceTag: 'productivity',
  },

  // --- Productivity Weekly: complex challenges ---
  {
    id: 'pref_p_system_overhaul',
    titles: ['Produktivitási rendszer felülvizsgálat', 'Hatékonysági audit', 'Munkafolyamat optimalizálás'],
    descriptions: ['Végezz teljes produktivitási auditot: vizsgáld meg a napi rutinodat, az eszközeidet, a munkamódszeredet, és készíts konkrét fejlesztési tervet legalább 5 pontban.', 'Tekintsd át az elmúlt hét hatékonyságát részletesen: melyik nap voltál a legproduktívabb és miért? Mi akadályozott? Optimalizáld a rendszeredet a tanulságok alapján.'],
    category: 'Produktivitás',
    baseDifficulty: 'hard',
    baseTime: 60,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['rendszer', 'audit', 'hatékonyság'],
    frequency: 'weekly',
    preferenceTag: 'productivity',
  },
  {
    id: 'pref_p_automate_workflow',
    titles: ['Munkafolyamat automatizálás', 'Ismétlődő feladatok kiváltása', 'Hatékonyság projekt'],
    descriptions: ['Keress 3 ismétlődő feladatot a hetedben, és dolgozz ki konkrét megoldást mindegyikre: automatizálás, sablon, delegálás vagy egyszerűsítés.', 'Elemezd végig a heti rutinod és azonosíts minden felesleges lépést. Készíts és valósíts meg egy konkrét automatizálási vagy egyszerűsítési tervet.'],
    category: 'Produktivitás',
    baseDifficulty: 'hard',
    baseTime: 90,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['automatizálás', 'egyszerűsítés', 'workflow'],
    frequency: 'weekly',
    preferenceTag: 'productivity',
  },
  {
    id: 'pref_p_week_plan_master',
    titles: ['Komplett heti tervezés', 'Stratégiai hét felépítés', 'Időgazdálkodási mester terv'],
    descriptions: ['Tervezd meg a teljes jövő heted óráról órára: munka blokkok, szünetek, sport, társas programok, tanulás — és kövesd végig a tervet.', 'Készíts részletes heti tervet: listázd ki minden feladatodat, becsüld meg az időigényüket, priorizáld és oszd be a hét napjaira.'],
    category: 'Produktivitás',
    baseDifficulty: 'hard',
    baseTime: 45,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['heti terv', 'időgazdálkodás', 'stratégia'],
    frequency: 'weekly',
    preferenceTag: 'productivity',
  },

  // ── LEARNING (Tanulás & Fejlődés) ──────────────────────

  // --- Learning Daily: simple routines ---
  {
    id: 'pref_l_read_10min',
    titles: ['10 perc olvasás', 'Napi olvasási rutin', 'Tudásbővítés olvasással'],
    descriptions: ['Olvass 10 percet egy szakkönyvből, cikkből vagy tananyagból.', 'Szánj 10 percet olvasásra — bármilyen tanulságos tartalom számít.'],
    category: 'Tanulás',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['olvasás', 'könyv', 'tanulás'],
    frequency: 'daily',
    preferenceTag: 'learning',
  },
  {
    id: 'pref_l_language_5min',
    titles: ['Nyelvi gyors gyakorlás', 'Szókincs bővítés', '5 perc nyelvtanulás'],
    descriptions: ['Gyakorolj 5 percet nyelvtanulásra: applikáció, szókártyák vagy podcast.', 'Tanulj meg 5 új szót a tanult nyelveden és használd őket mondatban.'],
    category: 'Tanulás',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['nyelv', 'szókincs', 'gyakorlás'],
    frequency: 'daily',
    preferenceTag: 'learning',
  },
  {
    id: 'pref_l_podcast_listen',
    titles: ['Podcast vagy TED talk', 'Tanulságos tartalom', 'Napi tudásinput'],
    descriptions: ['Hallgass meg egy rövid podcast epizódot vagy TED talkot a nap folyamán.', 'Fogyassz egy rövid tudástartalmat: podcast, videó vagy cikk — ami érdekli.'],
    category: 'Tanulás',
    baseDifficulty: 'easy',
    baseTime: 15,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['podcast', 'ted talk', 'tartalom'],
    frequency: 'daily',
    preferenceTag: 'learning',
  },
  {
    id: 'pref_l_note_one_thing',
    titles: ['Egy új dolog lejegyzése', 'Ma tanultam', 'Tudás rögzítés'],
    descriptions: ['Jegyezz le egy új dolgot amit ma tanultál — bármilyen rövid is legyen.', 'Írd le saját szavaiddal a legérdekesebb dolgot amit ma megtudtál.'],
    category: 'Tanulás',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['jegyzet', 'tanulás', 'lejegyzés'],
    frequency: 'daily',
    preferenceTag: 'learning',
  },

  // --- Learning Weekly: complex challenges ---
  {
    id: 'pref_l_deep_study',
    titles: ['Mély tanulási session', 'Koncentrált tudás elmélyítés', 'Tanulási maraton'],
    descriptions: ['Szánj 2 órát mély, megszakítatlan tanulásra egy választott témában: telefonok kikapcsolva, jegyzetek készítése, és összefoglalás a végén.', 'Végezz egy hosszú tanulási sessiont: válassz egy témát, olvasd el a forrásokat, készíts jegyzeteket és próbáld meg összefoglalni saját szavaiddal.'],
    category: 'Tanulás',
    baseDifficulty: 'hard',
    baseTime: 120,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['mély', 'tanulás', 'fókusz'],
    frequency: 'weekly',
    preferenceTag: 'learning',
  },
  {
    id: 'pref_l_practical_project',
    titles: ['Gyakorlati mini projekt', 'Tanultak alkalmazása', 'Tudás tesztelés projektben'],
    descriptions: ['Alkalmazd gyakorlatban amit tanultál: készíts egy mini projektet, oldj meg egy valós problémát, vagy taníts meg valakinek egy témát részletesen.', 'Készíts egy gyakorlati projektet a tanult ismereteidből: tervezés, megvalósítás és dokumentáció egy témából amit nemrég tanultál.'],
    category: 'Tanulás',
    baseDifficulty: 'hard',
    baseTime: 90,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['projekt', 'gyakorlat', 'alkalmazás'],
    frequency: 'weekly',
    preferenceTag: 'learning',
  },
  {
    id: 'pref_l_course_milestone',
    titles: ['Kurzus mérföldkő teljesítés', 'Tanfolyam fejezet befejezés', 'Képzési modul teljesítés'],
    descriptions: ['Teljesíts egy teljes fejezetet vagy modult az online kurzusodból: nézd végig az anyagot, csináld meg a gyakorlatokat és tedd le a tesztet.', 'Haladj jelentősen előre a képzésedben: végezz el legalább egy teljes szekciót jegyzetekkel és gyakorlati feladatokkal együtt.'],
    category: 'Tanulás',
    baseDifficulty: 'hard',
    baseTime: 90,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['kurzus', 'modul', 'teljesítés'],
    frequency: 'weekly',
    preferenceTag: 'learning',
  },

  // ── CREATIVITY (Kreativitás) ────────────────────────────

  // --- Creativity Daily: simple routines ---
  {
    id: 'pref_c_sketch_doodle',
    titles: ['Napi rajz/doodle', 'Kreatív firkálás', 'Vizuális játék'],
    descriptions: ['Rajzolj vagy firkálj 5 percet — bármi számít, a lényeg hogy alkoss.', 'Készíts egy gyors rajzot vagy doodlet: nem kell tökéletesnek lennie.'],
    category: 'Kreativitás',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['rajz', 'doodle', 'firkálás'],
    frequency: 'daily',
    preferenceTag: 'creativity',
  },
  {
    id: 'pref_c_freewrite',
    titles: ['Szabad írás 10 perc', 'Gondolat kiírás', 'Stream of consciousness'],
    descriptions: ['Írj 10 percig szabadon — ne törődj a minőséggel, csak engedd folyni a gondolatokat.', 'Gyakorold a szabad írást: papír vagy billentyűzet, írd le ami eszedbe jut.'],
    category: 'Kreativitás',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['írás', 'szabad', 'gondolat'],
    frequency: 'daily',
    preferenceTag: 'creativity',
  },
  {
    id: 'pref_c_inspiration_5min',
    titles: ['Inspiráció gyűjtés', 'Kreatív input', 'Ihlet keresés'],
    descriptions: ['Tölts 5 percet inspiráció kereséssel: nézz galériákat, olvasd alkotókat, hallgass zenét.', 'Keress kreatív inspirációt: böngéssz portfoliókat, design oldalakat vagy zenét.'],
    category: 'Kreativitás',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['inspiráció', 'ihlet', 'gyűjtés'],
    frequency: 'daily',
    preferenceTag: 'creativity',
  },
  {
    id: 'pref_c_photo_moment',
    titles: ['Kreatív fotó', 'Pillanatrögzítés', 'Napi vizuális napló'],
    descriptions: ['Készíts egy kreatív fotót a nap során — keress egy érdekes perspektívát vagy fényt.', 'Fotózz le valamit ami megragadja a figyelmed — gyakorold a vizuális kifejezést.'],
    category: 'Kreativitás',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['fotó', 'vizuális', 'kreatív'],
    frequency: 'daily',
    preferenceTag: 'creativity',
  },

  // --- Creativity Weekly: complex challenges ---
  {
    id: 'pref_c_project_milestone',
    titles: ['Kreatív projekt mérföldkő', 'Alkotói munka haladás', 'Komplett alkotás elkészítés'],
    descriptions: ['Dolgozz legalább 2 órát a kreatív projekteden és érj el egy konkrét mérföldkövet: fejezz be egy fejezetet, készíts el egy szekciót vagy véglegesíts egy részt.', 'Vidd jelentősen előre a kreatív projektedet: tervezés, megvalósítás és felülvizsgálat egy ülésben.'],
    category: 'Kreativitás',
    baseDifficulty: 'hard',
    baseTime: 120,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['projekt', 'mérföldkő', 'alkotás'],
    frequency: 'weekly',
    preferenceTag: 'creativity',
  },
  {
    id: 'pref_c_new_technique',
    titles: ['Új kreatív technika elsajátítás', 'Kreatív kísérlet', 'Művészeti felfedezés'],
    descriptions: ['Tanulj meg és próbálj ki egy teljesen új kreatív technikát: akvarellezés, digitális rajz, kreatív írási módszer, zenei stílus — valami amit még nem próbáltál.', 'Merülj el egy ismeretlen kreatív területen: nézz tutoriálokat, gyakorolj és készíts egy kész alkotást az új technikával.'],
    category: 'Kreativitás',
    baseDifficulty: 'hard',
    baseTime: 90,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['új technika', 'kísérlet', 'tanulás'],
    frequency: 'weekly',
    preferenceTag: 'creativity',
  },
  {
    id: 'pref_c_publish_share',
    titles: ['Alkotás publikálás és visszajelzés', 'Kreatív munka megosztás', 'Közönség előtt bemutatkozás'],
    descriptions: ['Készíts el egy teljes alkotást, oszd meg nyilvánosan (social media, blog, portfolio) és kérj legalább 3 embertől részletes visszajelzést.', 'Fejezz be egy kreatív munkát és mutasd be: írd meg a leírást, készítsd elő a bemutatót és oszd meg a közönségeddel.'],
    category: 'Kreativitás',
    baseDifficulty: 'hard',
    baseTime: 60,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['publikálás', 'megosztás', 'visszajelzés'],
    frequency: 'weekly',
    preferenceTag: 'creativity',
  },

  // ── HOME (Otthoni rend) ─────────────────────────────────

  // --- Home Daily: simple routines ---
  {
    id: 'pref_ho_make_bed',
    titles: ['Ágyazás', 'Reggeli rendrakás', 'Szoba gyors rendezés'],
    descriptions: ['Kezdd a napot ágyazással és a hálószoba gyors rendbe tételével.', 'Reggel vesd be az ágyat és pakold el ami nem a helyén van a szobádban.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['ágyazás', 'reggel', 'rend'],
    frequency: 'daily',
    preferenceTag: 'home',
  },
  {
    id: 'pref_ho_dishes_clean',
    titles: ['Konyhai rend', 'Mosogatás elvégzés', 'Munkalap tisztítás'],
    descriptions: ['Tartsd tisztán a konyhát: mosogass el és töröld le a munkalapot.', 'Ne hagyd a mosatlant estére — mosogass el és hozd rendbe a konyhát.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['konyha', 'mosogatás', 'tisztaság'],
    frequency: 'daily',
    preferenceTag: 'home',
  },
  {
    id: 'pref_ho_evening_reset',
    titles: ['Esti lakás reset', 'Gyors rendrakás', '10 perces pakolás'],
    descriptions: ['Este 10 percben hozd rendbe a lakást: pakolj el, vidd ki a szemetet.', 'Végezz egy gyors reset-et lefekvés előtt hogy reggel rendezett lakásba ébredj.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['reset', 'este', 'rendrakás'],
    frequency: 'daily',
    preferenceTag: 'home',
  },
  {
    id: 'pref_ho_declutter_3',
    titles: ['3 tárgy selejtezés', 'Mini kipakolás', 'Felesleg csökkentés'],
    descriptions: ['Keress 3 tárgyat amit kidobhatsz, eladhatsz vagy elajándékozhatsz.', 'Szabadulj meg 3 felesleges dologtól — egy kicsi lépés a rendezett otthon felé.'],
    category: 'Szervezés',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['selejtezés', 'kipakolás', 'felesleg'],
    frequency: 'daily',
    preferenceTag: 'home',
  },

  // --- Home Weekly: complex challenges ---
  {
    id: 'pref_ho_deep_clean_room',
    titles: ['Szoba alapos takarítás', 'Mélytisztítás', 'Nagytakarítás egy szobában'],
    descriptions: ['Végezz alapos nagytakarítást egy szobában: portörlés, porszívózás, felmosás, ablakok, és minden felület tisztítása.', 'Válassz egy szobát és takarítsd ki teljesen: bútorok mögött is, szekrények teteje, ablakok, és szervezd újra a tárgyakat.'],
    category: 'Szervezés',
    baseDifficulty: 'hard',
    baseTime: 90,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['nagytakarítás', 'mélytisztítás', 'szoba'],
    frequency: 'weekly',
    preferenceTag: 'home',
  },
  {
    id: 'pref_ho_organize_space',
    titles: ['Tároló terület újraszervezés', 'Szekrény/fiók rendezés', 'Otthoni rendszerezési projekt'],
    descriptions: ['Válassz egy szekrényt, gardróbot vagy tároló területet és rendezd teljesen újra: pakolj ki mindent, selejtezz, és szervezd logikusan vissza.', 'Rendezz újra egy teljes tároló területet: címkézés, kategorizálás, felesleg eltávolítás és új rendszer kialakítás.'],
    category: 'Szervezés',
    baseDifficulty: 'hard',
    baseTime: 90,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['rendezés', 'szekrény', 'szervezés'],
    frequency: 'weekly',
    preferenceTag: 'home',
  },
  {
    id: 'pref_ho_home_maintenance',
    titles: ['Otthoni karbantartási nap', 'Háztartási javítások', 'Otthon fejlesztési projekt'],
    descriptions: ['Végezd el az összes halogatott háztartási feladatot: csöpögő csap, kilazult kilincs, foltok a falon — listázd ki és javítsd meg amit tudsz.', 'Tartsd karban az otthonod: végezz el legalább 3 régóta halogatott javítási vagy karbantartási feladatot.'],
    category: 'Szervezés',
    baseDifficulty: 'hard',
    baseTime: 120,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['karbantartás', 'javítás', 'otthon'],
    frequency: 'weekly',
    preferenceTag: 'home',
  },

  // ── MENTAL (Mentális jólét) ─────────────────────────────

  // --- Mental Daily: simple routines ---
  {
    id: 'pref_m_breathing',
    titles: ['Légzőgyakorlat', 'Tudatos lélegzés', 'Box breathing'],
    descriptions: ['Végezz 5 perces légzőgyakorlatot: 4 mp belégzés, 4 mp tartás, 4 mp kilégzés.', 'Gyakorold a tudatos légzést — segít a stressz csökkentésében és a fókuszban.'],
    category: 'Egészség',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['légzés', 'tudatos', 'relaxáció'],
    frequency: 'daily',
    preferenceTag: 'mental',
  },
  {
    id: 'pref_m_gratitude_3',
    titles: ['3 dolog amiért hálás vagy', 'Hálanapló', 'Pozitív fókusz'],
    descriptions: ['Írj le 3 dolgot amiért ma hálás vagy — gyakorold a pozitív szemléletet.', 'Találd meg a mai nap 3 pozitívumát és jegyezd le őket.'],
    category: 'Fejlődés',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['hála', 'pozitív', 'napló'],
    frequency: 'daily',
    preferenceTag: 'mental',
  },
  {
    id: 'pref_m_screen_break',
    titles: ['Képernyőszünet', 'Digitális pihenő', 'Szem pihentetés'],
    descriptions: ['Tarts 10 perces képernyőszünetet: nézz ki az ablakon, sétálj egyet, nyújtózz.', 'Pihentesd a szemed és az elméd: hagyj 10 percet képernyő nélkül.'],
    category: 'Egészség',
    baseDifficulty: 'easy',
    baseTime: 10,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['képernyő', 'szünet', 'pihenés'],
    frequency: 'daily',
    preferenceTag: 'mental',
  },
  {
    id: 'pref_m_mindful_moment',
    titles: ['Mindfulness pillanat', 'Jelenlét gyakorlás', 'Tudatos jelenlét'],
    descriptions: ['Állj meg 5 percre és figyelj a jelenre: mit hallasz, látsz, érzel?', 'Gyakorold a tudatos jelenlétet: 5 percig csak figyeld a környezetedet ítélkezés nélkül.'],
    category: 'Fejlődés',
    baseDifficulty: 'easy',
    baseTime: 5,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['mindfulness', 'jelenlét', 'tudatos'],
    frequency: 'daily',
    preferenceTag: 'mental',
  },

  // --- Mental Weekly: complex challenges ---
  {
    id: 'pref_m_full_digital_detox',
    titles: ['Teljes digitális detox nap', 'Képernyőmentes nap', 'Offline kihívás'],
    descriptions: ['Tölts egy teljes napot (vagy legalább 8 órát) képernyők nélkül: olvasd, sétálj, sportolj, beszélgess, főzz — fedezd fel az offline létet.', 'Vállalj egy teljes digitális detox kihívást: telefonok, laptop, TV kikapcsolva — csak te és a valós világ egy egész napra.'],
    category: 'Egészség',
    baseDifficulty: 'hard',
    baseTime: 480,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['detox', 'offline', 'képernyő'],
    frequency: 'weekly',
    preferenceTag: 'mental',
  },
  {
    id: 'pref_m_emotional_journal',
    titles: ['Részletes érzelmi napló', 'Heti önreflexiós írás', 'Mély érzelmi feldolgozás'],
    descriptions: ['Végezz részletes heti érzelmi visszatekintést: írd le napról napra mit éreztél, miért, mi váltotta ki, hogyan reagáltál, és mit tennél másképp. Keress mintákat.', 'Készíts mély önreflexiós naplót: elemezd az elmúlt hét érzelmi hullámvölgyeit, azonosítsd a triggereket és dolgozz ki stratégiákat a jobb kezelésükre.'],
    category: 'Fejlődés',
    baseDifficulty: 'hard',
    baseTime: 60,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['érzelem', 'napló', 'önreflexió'],
    frequency: 'weekly',
    preferenceTag: 'mental',
  },
  {
    id: 'pref_m_self_care_day',
    titles: ['Önápolási nap tervezés', 'Mentális wellness program', 'Teljes regeneráció'],
    descriptions: ['Tervezz és valósíts meg egy komplett önápolási napot: meditáció, fürdő, olvasás, természetjárás, kreatív tevékenység — legalább 3 jóléti aktivitás.', 'Szánj egy teljes napot a mentális egészségedre: készíts programot ami feltölt — mozgás, pihenés, kedvenc tevékenységek és teljes kikapcsolódás.'],
    category: 'Fejlődés',
    baseDifficulty: 'hard',
    baseTime: 120,
    personas: ['student', 'worker', 'selfdev', 'freelancer', 'organizer'],
    keywords: ['önápolás', 'wellness', 'regeneráció'],
    frequency: 'weekly',
    preferenceTag: 'mental',
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
  interests?: string[];
  questFrequency?: 'low' | 'medium' | 'high';
}

export function generateDailyQuests(options: GenerateOptions): Omit<Quest, 'id'>[] {
  const { persona, level, quests, lists, uid, date, interests = [], questFrequency = 'medium' } = options;
  const rng = createRng(`daily-${uid}-${date}`);
  const dayOfWeek = new Date(date).getDay();

  // ── Persona pool (templates WITHOUT preferenceTag) ──
  const personaPool = TEMPLATES.filter((t) => {
    if (t.frequency !== 'daily') return false;
    if (!t.personas.includes(persona)) return false;
    if (t.preferenceTag) return false;
    if (t.dayPreference && !t.dayPreference.includes(dayOfWeek)) return false;
    return true;
  });

  const habitWeights = analyzeUserHabits(lists);
  const recentTitles = getRecentQuestTitles(quests, 7);

  // ── Select persona quests (frequency-aware base count) ──
  const targetDailyCount = questFrequency === 'low' ? 3 : questFrequency === 'high' ? 5 : 4;
  const personaTarget = Math.max(2, Math.min(4, targetDailyCount - Math.min(1, interests.length)));
  const personaScores = personaPool.map((t) => {
    let score = 1;
    score += (habitWeights[t.category] || 1) * 0.3;
    if (t.titles.some((title) => recentTitles.has(title.toLowerCase()))) score *= 0.15;
    score += rng() * 0.6;
    return score;
  });
  const selectedPersona = weightedSelect(personaPool, personaScores, rng, personaTarget);

  // Ensure category variety within persona group
  if (selectedPersona.length >= 2) {
    const cats = new Set(selectedPersona.map((t) => t.category));
    if (cats.size < 2) {
      const lastIdx = selectedPersona.length - 1;
      const alt = personaPool.find(
        (t) => t.category !== selectedPersona[lastIdx].category && !selectedPersona.includes(t) && !t.titles.some((ti) => recentTitles.has(ti.toLowerCase()))
      );
      if (alt) selectedPersona[lastIdx] = alt;
    }
  }

  // ── Select preference quests: 1 per interest group ──
  // Each selected interest gets exactly 1 daily quest so the user progresses in all areas
  const selectedPrefWithGroup: { template: QuestTemplate; group: string }[] = [];
  for (const interest of interests) {
    const groupPool = TEMPLATES.filter((t) => {
      if (t.frequency !== 'daily') return false;
      if (!t.personas.includes(persona)) return false;
      if (t.preferenceTag !== interest) return false;
      if (t.dayPreference && !t.dayPreference.includes(dayOfWeek)) return false;
      return true;
    });
    if (groupPool.length === 0) continue;

    const scores = groupPool.map((t) => {
      let score = 1;
      score += (habitWeights[t.category] || 1) * 0.3;
      if (t.titles.some((title) => recentTitles.has(title.toLowerCase()))) score *= 0.15;
      score += rng() * 0.6;
      return score;
    });
    const picked = weightedSelect(groupPool, scores, rng, 1);
    if (picked.length > 0) {
      selectedPrefWithGroup.push({ template: picked[0], group: interest });
    }
  }

  // ── Map templates to quest objects ──
  const personaQuests: Omit<Quest, 'id'>[] = selectedPersona.map((template) => {
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
      questSource: 'persona' as const,
    };
  });

  const prefQuests: Omit<Quest, 'id'>[] = selectedPrefWithGroup.map(({ template, group }) => {
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
      questSource: 'preference' as const,
      preferenceGroup: group,
    };
  });

  const combined = [...personaQuests, ...prefQuests];
  return combined.slice(0, targetDailyCount);
}

export function generateWeeklyQuests(options: GenerateOptions): Omit<Quest, 'id'>[] {
  const { persona, level, quests, lists, uid, date, interests = [] } = options;
  const rng = createRng(`weekly-${uid}-${date}`);
  const weeklyDueDate = getLocalSundayOfWeek(date);

  // ── Persona pool (no preferenceTag) ──
  const personaAll = TEMPLATES.filter((t) => {
    if (t.frequency !== 'weekly') return false;
    if (!t.personas.includes(persona)) return false;
    if (t.preferenceTag) return false;
    return true;
  });
  const personaProgress = personaAll.filter((t) => t.trackingType);
  const personaRegular = personaAll.filter((t) => !t.trackingType);

  const habitWeights = analyzeUserHabits(lists);
  const recentTitles = getRecentQuestTitles(quests, 14);

  const scoreTemplates = (templates: QuestTemplate[]) =>
    templates.map((t) => {
      let score = 1;
      score += (habitWeights[t.category] || 1) * 0.3;
      if (t.titles.some((title) => recentTitles.has(title.toLowerCase()))) score *= 0.15;
      score += rng() * 0.6;
      return score;
    });

  // ── Persona weekly (1 progress + 2 regular = 3) ──
  let selPersonaProgress: QuestTemplate[] = [];
  if (personaProgress.length > 0) {
    selPersonaProgress = weightedSelect(personaProgress, scoreTemplates(personaProgress), rng, 1);
  }
  const regCount = selPersonaProgress.length > 0 ? 2 : 3;
  const selPersonaRegular = weightedSelect(personaRegular, scoreTemplates(personaRegular), rng, regCount);
  const selPersona = [...selPersonaProgress, ...selPersonaRegular];

  // ── Preference weekly: 1 per interest group ──
  const selectedPrefWithGroup: { template: QuestTemplate; group: string }[] = [];
  for (const interest of interests) {
    const groupPool = TEMPLATES.filter((t) => {
      if (t.frequency !== 'weekly') return false;
      if (!t.personas.includes(persona)) return false;
      if (t.preferenceTag !== interest) return false;
      return true;
    });
    if (groupPool.length === 0) continue;

    const scores = scoreTemplates(groupPool);
    const picked = weightedSelect(groupPool, scores, rng, 1);
    if (picked.length > 0) {
      selectedPrefWithGroup.push({ template: picked[0], group: interest });
    }
  }

  // ── Map persona templates to quest objects ──
  const personaQuests: Omit<Quest, 'id'>[] = selPersona.map((template) => {
    const titleIdx = Math.floor(rng() * template.titles.length);
    const descIdx = Math.floor(rng() * template.descriptions.length);
    const difficulty = scaleDifficulty(template.baseDifficulty, level);
    const rewards = calculateRewards(difficulty, level);

    const targetCount = template.baseTargetCount
      ? Math.floor(template.baseTargetCount + Math.floor(level / 5) * 2)
      : undefined;

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
      questSource: 'persona' as const,
    };

    if (template.trackingType && targetCount) {
      quest.trackingType = template.trackingType;
      quest.targetCount = targetCount;
      quest.currentProgress = 0;
    }

    return quest;
  });

  // ── Map preference templates to quest objects (1 per interest) ──
  const prefQuests: Omit<Quest, 'id'>[] = selectedPrefWithGroup.map(({ template, group }) => {
    const titleIdx = Math.floor(rng() * template.titles.length);
    const descIdx = Math.floor(rng() * template.descriptions.length);
    const difficulty = scaleDifficulty(template.baseDifficulty, level);
    const rewards = calculateRewards(difficulty, level);

    const targetCount = template.baseTargetCount
      ? Math.floor(template.baseTargetCount + Math.floor(level / 5) * 2)
      : undefined;

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
      questSource: 'preference' as const,
      preferenceGroup: group,
    };

    if (template.trackingType && targetCount) {
      quest.trackingType = template.trackingType;
      quest.targetCount = targetCount;
      quest.currentProgress = 0;
    }

    return quest;
  });

  return [...personaQuests, ...prefQuests];
}
