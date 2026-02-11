import { useState } from 'react';
import { Search, Plus, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PersonaSwitcher from '@/components/PersonaSwitcher';
import UserStats from '@/components/UserStats';
import QuickAddDialog from '@/components/dialogs/QuickAddDialog';

export default function Header() {
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <header className="glass border-b border-white/10 px-2 sm:px-4 md:px-6 py-2 sm:py-3 min-w-0">
      <div className="flex items-center justify-between gap-1 sm:gap-2 min-w-0">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-shrink">
          <PersonaSwitcher />

          {/* Search */}
          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              placeholder="Keresés... (Ctrl+K)"
              className="pl-10 w-64 bg-surface-1/50 border-white/10 text-text-primary placeholder:text-text-muted"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-surface-2/50 px-1.5 font-mono text-xs text-text-muted">
                <Command className="h-3 w-3" />K
              </kbd>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
          <UserStats />

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
