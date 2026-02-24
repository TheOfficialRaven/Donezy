export const FOCUS_AREAS = [
  'tudat',
  'test',
  'munka_tanulas',
  'otthon',
  'kapcsolatok',
] as const;

export type FocusArea = (typeof FOCUS_AREAS)[number];
export type FocusAreaSource = 'auto' | 'manual';

export const FOCUS_AREA_LABELS: Record<FocusArea, string> = {
  tudat: 'Tudat',
  test: 'Test',
  munka_tanulas: 'Munka / Tanulás',
  otthon: 'Otthon',
  kapcsolatok: 'Kapcsolatok',
};

const keywordMap: Array<{ area: FocusArea; words: string[] }> = [
  { area: 'tudat', words: ['reflexio', 'naplo', 'olvas', 'medit', 'legzes', 'gondolat'] },
  { area: 'test', words: ['seta', 'futas', 'edzes', 'alvas', 'pihenes', 'mozg'] },
  { area: 'munka_tanulas', words: ['munka', 'tanul', 'projekt', 'vizsga', 'meeting', 'feladat'] },
  { area: 'otthon', words: ['otthon', 'takarit', 'rendszerez', 'haztart', 'bevasarlas'] },
  { area: 'kapcsolatok', words: ['csalad', 'barat', 'partner', 'hivas', 'talalkozo'] },
];

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function inferFocusArea(input: {
  title?: string;
  description?: string;
  category?: string;
  persona?: string;
}): FocusArea {
  const category = normalizeText(input.category || '');
  const persona = normalizeText(input.persona || '');
  const blob = normalizeText([input.title, input.description, input.category].filter(Boolean).join(' '));

  if (category.includes('egeszseg')) return 'test';
  if (category.includes('tanulas') || category.includes('munka')) return 'munka_tanulas';
  if (category.includes('szemelyes') || category.includes('well')) return 'tudat';

  if (persona === 'organizer') return 'otthon';
  if (persona === 'student' || persona === 'worker' || persona === 'freelancer') return 'munka_tanulas';
  if (persona === 'selfdev') return 'tudat';

  for (const entry of keywordMap) {
    if (entry.words.some((word) => blob.includes(word))) {
      return entry.area;
    }
  }

  return 'munka_tanulas';
}

export function coalesceFocusArea<T extends { focusArea?: FocusArea; focusAreaSource?: FocusAreaSource }>(
  item: T,
  fallback: FocusArea
): T & { focusArea: FocusArea; focusAreaSource: FocusAreaSource } {
  return {
    ...item,
    focusArea: item.focusArea || fallback,
    focusAreaSource: item.focusAreaSource || 'auto',
  };
}
