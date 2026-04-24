import type { OnboardingResultProfile } from '@/lib/onboarding';

interface OnboardingSummaryProps {
  profile: OnboardingResultProfile | null;
  lines: string[];
}

export default function OnboardingSummary({ profile, lines }: OnboardingSummaryProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <p className="text-sm font-semibold text-text-primary">Rovid osszegzes</p>
      {profile ? (
        <div className="space-y-1 text-xs text-text-secondary">
          <p>Celcsoport: <span className="text-text-primary">{profile.derivedTargetGroup}</span></p>
          <p>Indulo day mode: <span className="text-text-primary">{profile.suggestedInitialDayMode || 'normal'}</span></p>
          <p>Dashboard hangsuly: <span className="text-text-primary">{profile.suggestedDashboardEmphasis}</span></p>
        </div>
      ) : null}
      <ul className="space-y-1">
        {lines.map((line) => (
          <li key={line} className="text-xs text-text-secondary">- {line}</li>
        ))}
      </ul>
    </div>
  );
}
