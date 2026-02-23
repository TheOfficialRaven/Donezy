import { useState } from 'react';
import { Plus, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PersonaBadge from '@/components/PersonaBadge';
import UserStats from '@/components/UserStats';
import QuickAddDialog from '@/components/dialogs/QuickAddDialog';
import { useThemeStore } from '@/stores/useThemeStore';

export default function Header() {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const { theme, setTheme } = useThemeStore();

  return (
    <header className="glass border-b border-white/10 px-2 sm:px-4 md:px-6 py-2 sm:py-3 min-w-0">
      <div className="flex items-center justify-between gap-1 sm:gap-2 min-w-0">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-shrink">
          <PersonaBadge />
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <UserStats />

          {/* Theme Toggle */}
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 text-text-secondary hover:text-text-primary hover:bg-white/5"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Világos mód' : 'Sötét mód'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Quick Add */}
          <Button
            className="bg-primary hover:bg-primary/90 text-surface-0 px-3 sm:px-4 h-9 sm:h-10"
            onClick={() => setQuickAddOpen(true)}
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Gyors hozzáadás</span>
          </Button>
        </div>
      </div>

      <QuickAddDialog open={quickAddOpen} onOpenChange={setQuickAddOpen} />
    </header>
  );
}
