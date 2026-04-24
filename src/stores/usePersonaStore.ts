import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Persona {
  id: string;
  name: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  colorHSL: string; // raw HSL values for CSS variable (e.g. "213 100% 65%")
  colorGlowHSL: string; // lighter glow variant
  iconColor: string;
  colorClass: string;
  heroTitle: string;
  heroSubtitle: string;
  dashboardModules: string[];
  questPresets: string[];
}

export const personas: Persona[] = [
  {
    id: 'student',
    name: 'student',
    label: 'Diák',
    description: 'Tanulás, vizsgák és projektek szervezése',
    icon: 'GraduationCap',
    color: '#12e2b5',
    colorHSL: '167 85% 48%',
    colorGlowHSL: '167 85% 60%',
    iconColor: '#4DA3FF',
    colorClass: 'persona-student',
    heroTitle: 'Tanulási célok elérése játékosan',
    heroSubtitle: 'Szervezd meg tanulásod, kövesd nyomon haladásod, érj el új szinteket.',
    dashboardModules: ['schedule', 'exams', 'study-quests', 'progress', 'notes'],
    questPresets: ['study-session', 'exam-prep', 'project-milestone', 'reading-goal']
  },
  {
    id: 'worker',
    name: 'worker',
    label: 'Dolgozó fiatal',
    description: 'Munkák, meetingek és karrier célok',
    icon: 'Briefcase',
    color: '#12e2b5',
    colorHSL: '167 85% 48%',
    colorGlowHSL: '167 85% 60%',
    iconColor: '#FB7185',
    colorClass: 'persona-worker',
    heroTitle: 'Hatékony munkanap, egyensúlyban',
    heroSubtitle: 'Fókuszálj a lényegre, tartsd szem előtt céljaidat, épülj fel minden nap.',
    dashboardModules: ['daily-focus', 'meetings', 'pomodoro', 'break-reminder', 'goals'],
    questPresets: ['daily-focus', 'meeting-prep', 'skill-learning', 'network-building']
  },
  {
    id: 'selfdev',
    name: 'selfdev',
    label: 'Önfejlesztő',
    description: 'Szokások, olvasás és személyes növekedés',
    icon: 'Target',
    color: '#12e2b5',
    colorHSL: '167 85% 48%',
    colorGlowHSL: '167 85% 60%',
    iconColor: '#A78BFA',
    colorClass: 'persona-selfdev',
    heroTitle: 'Fejlődés minden nap egy lépéssel',
    heroSubtitle: 'Építs új szokásokat, olvasd magad, reflektálj és növekedj.',
    dashboardModules: ['habits', 'daily-challenge', 'reading', 'reflection', 'growth'],
    questPresets: ['habit-building', 'reading-goal', 'meditation', 'journaling']
  },
  {
    id: 'freelancer',
    name: 'freelancer',
    label: 'Freelancer',
    description: 'Projektek, ügyfelek és bevételek',
    icon: 'Zap',
    color: '#12e2b5',
    colorHSL: '167 85% 48%',
    colorGlowHSL: '167 85% 60%',
    iconColor: '#F59E0B',
    colorClass: 'persona-freelancer',
    heroTitle: 'Szabadúszó sikerek nyomon követése',
    heroSubtitle: 'Menedzseld ügyfeleidet, projektjeidet és növeld bevételeidet.',
    dashboardModules: ['clients', 'deadlines', 'invoicing', 'pipeline', 'income'],
    questPresets: ['client-outreach', 'project-delivery', 'skill-upgrade', 'invoice-chase']
  },
  {
    id: 'organizer',
    name: 'organizer',
    label: 'Rendszerező',
    description: 'Háztartás, pénzügyek és családi teendők',
    icon: 'Home',
    color: '#12e2b5',
    colorHSL: '167 85% 48%',
    colorGlowHSL: '167 85% 60%',
    iconColor: '#60A5FA',
    colorClass: 'persona-organizer',
    heroTitle: 'Otthoni harmónia és rend',
    heroSubtitle: 'Szervezd meg családod életét, háztartásod és pénzügyeidet.',
    dashboardModules: ['household', 'finances', 'shopping', 'family', 'projects'],
    questPresets: ['household-task', 'budget-review', 'family-activity', 'decluttering']
  }
];

interface PersonaState {
  currentPersona: Persona;
  setPersona: (persona: Persona) => void;
}

/**
 * Applies the persona's color as the global --primary CSS variable
 * so the entire UI theme adapts to the selected persona.
 * Falls back to the canonical persona definition if colorHSL is missing
 * (e.g. data loaded from localStorage before the field existed).
 */
export function applyPersonaTheme(persona: Persona) {
  // Look up canonical persona to ensure we have colorHSL values
  const canonical = personas.find((p) => p.id === persona.id) || personas[0];
  const hsl = persona.colorHSL || canonical.colorHSL;
  const glowHSL = persona.colorGlowHSL || canonical.colorGlowHSL;

  const root = document.documentElement;
  root.style.setProperty('--primary', hsl);
  root.style.setProperty('--primary-glow', glowHSL);
  root.style.setProperty('--ring', hsl);
}

export const usePersonaStore = create<PersonaState>()(
  persist(
    (set) => ({
      currentPersona: personas[0], // Default to student
      setPersona: (persona) => {
        applyPersonaTheme(persona);
        set({ currentPersona: persona });
      },
    }),
    {
      name: 'donezy-persona',
    }
  )
);
