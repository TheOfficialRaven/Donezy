import PreferenceOptionGroup, { type PreferenceOption } from './PreferenceOptionGroup';
import { Briefcase, GraduationCap, Layers3, Sparkles, UserRound, ClipboardList } from 'lucide-react';
import type { PreferenceTargetGroup } from '@/lib/preferences/types';

const options: PreferenceOption[] = [
  { value: 'self-development', label: 'Onfejleszto', help: 'Sajat fejlodes, szokasok, fokusz kiegyensulyozasa.', icon: <Sparkles className="h-4 w-4" /> },
  { value: 'student', label: 'Diak', help: 'Tanulas, hataridok, vizsgaidoszak es napi ritmus.', icon: <GraduationCap className="h-4 w-4" /> },
  { value: 'young-professional', label: 'Palyakezdo', help: 'Munkainditas, prioritasok, fejlodesi tempo.', icon: <Briefcase className="h-4 w-4" /> },
  { value: 'freelancer', label: 'Szabaduszo', help: 'Projektvaltogatas, energia- es idomenedzsment.', icon: <Layers3 className="h-4 w-4" /> },
  { value: 'organizer', label: 'Szervezo', help: 'Sok feladat osszefogasa, rendszeresseg es delegalas.', icon: <ClipboardList className="h-4 w-4" /> },
  { value: 'other', label: 'Egyeb', help: 'Altalanos, kesobb finomithato szemelyre szabassal.', icon: <UserRound className="h-4 w-4" /> },
];

export default function TargetGroupSelector({
  value,
  onChange,
}: {
  value: PreferenceTargetGroup;
  onChange: (value: PreferenceTargetGroup) => void;
}) {
  return (
    <PreferenceOptionGroup
      label="Melyik celcsoport all hozzad a legkozelebb?"
      help="Ez kesobb befolyasolja a dashboard hangsulyokat es a javaslatok stilusat."
      value={value}
      options={options}
      onChange={(next) => onChange(next as PreferenceTargetGroup)}
    />
  );
}
