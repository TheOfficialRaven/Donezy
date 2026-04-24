import type { ReactNode } from 'react';

interface OnboardingShellProps {
  children: ReactNode;
  footer: ReactNode;
}

export default function OnboardingShell({ children, footer }: OnboardingShellProps) {
  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-3xl">{children}</div>
      </div>
      <div className="px-4 pb-8 pt-4">
        <div className="max-w-3xl mx-auto">{footer}</div>
      </div>
    </div>
  );
}
