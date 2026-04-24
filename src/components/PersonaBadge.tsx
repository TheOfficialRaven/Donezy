import {
  Briefcase,
  ClipboardList,
  GraduationCap,
  Layers3,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import type { PreferenceTargetGroup } from '@/lib/preferences/types';

export default function PersonaBadge() {
  const targetGroup = useAppStore((s) => s.userPreferences.targetGroup);
  const profile = getTargetGroupBadgeProfile(targetGroup);

  return (
    <div className="flex items-center gap-2 sm:gap-3 px-1.5 sm:px-3 py-1.5 sm:py-2">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
      >
        <profile.Icon className="h-4 w-4" style={{ color: profile.iconColor }} />
      </div>

      <span className="text-xs font-medium text-text-primary sm:hidden">
        {profile.label}
      </span>

      <div className="hidden sm:flex flex-col items-start">
        <span className="text-sm font-medium text-text-primary">
          {profile.label}
        </span>
        <span className="text-xs text-text-muted">
          {profile.description}
        </span>
      </div>
    </div>
  );
}

function getTargetGroupBadgeProfile(targetGroup: PreferenceTargetGroup) {
  if (targetGroup === 'self-development') {
    return {
      label: 'Onfejleszto',
      description: 'Fejlodes, rutinok es reflexio',
      Icon: Sparkles,
      iconColor: '#A78BFA',
    };
  }
  if (targetGroup === 'student') {
    return {
      label: 'Diak',
      description: 'Tanulas, orarend es hataridok',
      Icon: GraduationCap,
      iconColor: '#4DA3FF',
    };
  }
  if (targetGroup === 'young-professional') {
    return {
      label: 'Palyakezdo',
      description: 'Napi prioritasok es egyensuly',
      Icon: Briefcase,
      iconColor: '#FB7185',
    };
  }
  if (targetGroup === 'freelancer') {
    return {
      label: 'Szabaduszo',
      description: 'Projektek, ugyfelek es fokusz',
      Icon: Layers3,
      iconColor: '#F59E0B',
    };
  }
  if (targetGroup === 'organizer') {
    return {
      label: 'Szervezo',
      description: 'Rend, listak es attekintes',
      Icon: ClipboardList,
      iconColor: '#60A5FA',
    };
  }
  return {
    label: 'Egyeb',
    description: 'Altalanos szemelyre szabott nezet',
    Icon: UserRound,
    iconColor: '#12e2b5',
  };
}
