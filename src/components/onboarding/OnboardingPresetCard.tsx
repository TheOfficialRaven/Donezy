import type { OnboardingPreset } from '@/lib/onboarding';
import { cn } from '@/lib/utils';

interface OnboardingPresetCardProps {
  preset: OnboardingPreset;
  selected: boolean;
  onSelect: () => void;
}

export default function OnboardingPresetCard({ preset, selected, onSelect }: OnboardingPresetCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-xl border p-3 text-left transition-all',
        selected ? 'border-primary/50 bg-primary/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
      )}
    >
      <p className="text-sm font-semibold text-text-primary">{preset.label}</p>
      <p className="text-xs text-text-muted mt-1">{preset.description}</p>
    </button>
  );
}
