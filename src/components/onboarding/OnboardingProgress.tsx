interface OnboardingProgressProps {
  step: number;
  totalSteps: number;
  progressPercent: number;
}

export default function OnboardingProgress({ step, totalSteps, progressPercent }: OnboardingProgressProps) {
  return (
    <div className="space-y-2 mb-6">
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>Lepes {Math.min(step + 1, totalSteps)}/{totalSteps}</span>
        <span>{progressPercent}%</span>
      </div>
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progressPercent}%` }} />
      </div>
    </div>
  );
}
