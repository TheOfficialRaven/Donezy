import * as LucideIcons from 'lucide-react';
import { usePersonaStore } from '@/stores/usePersonaStore';
import { useThemeStore } from '@/stores/useThemeStore';

export default function PersonaBadge() {
  const currentPersona = usePersonaStore((s) => s.currentPersona);
  const { theme } = useThemeStore();
  const isLight = theme === 'light';
  const IconComponent = LucideIcons[currentPersona.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;

  return (
    <div className="flex items-center gap-2 sm:gap-3 px-1.5 sm:px-3 py-1.5 sm:py-2">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${currentPersona.color}, ${isLight ? currentPersona.color : currentPersona.color + '88'})`,
          boxShadow: isLight
            ? `0 2px 8px ${currentPersona.color}50, 0 0 0 1px ${currentPersona.color}30`
            : `0 0 20px ${currentPersona.color}40`,
        }}
      >
        <IconComponent className="h-4 w-4 text-white" />
      </div>

      <span className="text-xs font-medium text-text-primary sm:hidden">
        {currentPersona.label}
      </span>

      <div className="hidden sm:flex flex-col items-start">
        <span className="text-sm font-medium text-text-primary">
          {currentPersona.label}
        </span>
        <span className="text-xs text-text-muted">
          {currentPersona.description}
        </span>
      </div>
    </div>
  );
}
