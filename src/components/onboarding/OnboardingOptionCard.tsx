import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface OnboardingOptionCardProps {
  label: string;
  description?: string;
  icon?: ReactNode;
  selected?: boolean;
  onClick: () => void;
}

export default function OnboardingOptionCard({
  label,
  description,
  icon,
  selected = false,
  onClick,
}: OnboardingOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border p-4 text-left transition-all',
        selected ? 'border-primary/50 bg-primary/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
      )}
    >
      <div className="flex items-start gap-3">
        {icon ? <div className="mt-0.5 text-primary">{icon}</div> : null}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">{label}</p>
          {description ? <p className="text-xs text-text-muted mt-1">{description}</p> : null}
        </div>
      </div>
    </button>
  );
}
