import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

export default function PreferencesSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="glass p-5 border-white/5 space-y-4">
      <div>
        <h3 className="text-lg font-heading font-semibold text-text-primary">{title}</h3>
        <p className="text-sm text-text-muted mt-1">{description}</p>
      </div>
      {children}
    </Card>
  );
}
