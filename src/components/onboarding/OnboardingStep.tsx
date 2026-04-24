import type { ReactNode } from 'react';

interface OnboardingStepProps {
  title: string;
  description: string;
  children: ReactNode;
}

export default function OnboardingStep({ title, description, children }: OnboardingStepProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-heading font-bold text-text-primary">{title}</h1>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
