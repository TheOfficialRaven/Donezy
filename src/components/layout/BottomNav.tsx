import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Zap,
  CheckSquare,
  FileText,
  Calendar,
  Trophy,
  ShoppingBag,
  Settings,
  Activity,
  BookOpen,
  PenLine,
  MoreHorizontal,
  Moon,
  Sun,
  ChevronRight,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { usePersonaStore } from '@/stores/usePersonaStore';
import { useThemeStore } from '@/stores/useThemeStore';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  persona?: string;
}

const primaryNav: NavItem[] = [
  { name: 'Home', href: '/app/dashboard', icon: LayoutDashboard },
  { name: 'Küldetések', href: '/app/quests', icon: Zap },
  { name: 'Listák', href: '/app/lists', icon: CheckSquare },
  { name: 'Naptár', href: '/app/calendar', icon: Calendar },
];

const secondaryNav: NavItem[] = [
  { name: 'Szokás Tracker', href: '/app/habits', icon: Activity, persona: 'selfdev' },
  { name: 'Olvasási napló', href: '/app/reading', icon: BookOpen, persona: 'selfdev' },
  { name: 'Napi reflexió', href: '/app/reflection', icon: PenLine, persona: 'selfdev' },
  { name: 'Jegyzetek', href: '/app/notes', icon: FileText },
  { name: 'Eredmények', href: '/app/achievements', icon: Trophy },
  { name: 'Bolt', href: '/app/shop', icon: ShoppingBag },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentPersona } = usePersonaStore();
  const { theme, setTheme } = useThemeStore();
  const [moreOpen, setMoreOpen] = useState(false);

  const visibleSecondary = secondaryNav.filter(
    (item) => !item.persona || item.persona === currentPersona.id
  );

  const isMoreActive = [...visibleSecondary, { href: '/settings' }].some(
    (item) => location.pathname === item.href
  );

  const handleNavigate = (href: string) => {
    navigate(href);
    setMoreOpen(false);
  };

  return (
    <>
      {/* Bottom sheet overlay + panel */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 glass-intense rounded-t-2xl border-t border-white/10 max-h-[70vh] overflow-y-auto"
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-text-muted/30" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3">
                <h3 className="text-base font-heading font-semibold text-text-primary">Menü</h3>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/5 text-text-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation items */}
              <div className="px-3 pb-2 space-y-0.5">
                {visibleSecondary.map((item, index) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <motion.button
                      key={item.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => handleNavigate(item.href)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                        isActive
                          ? 'bg-primary/20 text-primary'
                          : 'text-text-secondary hover:bg-white/5 active:bg-white/10'
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="flex-1 text-left font-medium text-sm">{item.name}</span>
                      <ChevronRight className="h-4 w-4 text-text-disabled" />
                    </motion.button>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="mx-5 border-t border-white/10" />

              {/* Settings & Theme */}
              <div className="px-3 py-2 space-y-0.5">
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:bg-white/5 active:bg-white/10 transition-all"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-5 w-5 flex-shrink-0" />
                  ) : (
                    <Moon className="h-5 w-5 flex-shrink-0" />
                  )}
                  <span className="flex-1 text-left font-medium text-sm">
                    {theme === 'dark' ? 'Világos mód' : 'Sötét mód'}
                  </span>
                </button>

                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: visibleSecondary.length * 0.03 + 0.05 }}
                  onClick={() => handleNavigate('/settings')}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                    location.pathname === '/settings'
                      ? 'bg-primary/20 text-primary'
                      : 'text-text-secondary hover:bg-white/5 active:bg-white/10'
                  )}
                >
                  <Settings className="h-5 w-5 flex-shrink-0" />
                  <span className="flex-1 text-left font-medium text-sm">Beállítások</span>
                  <ChevronRight className="h-4 w-4 text-text-disabled" />
                </motion.button>
              </div>

              {/* Safe area spacing at bottom */}
              <div className="h-6" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 glass-intense border-t border-white/10 px-2 py-2 z-30 safe-area-inset-bottom">
        <div className="flex items-center justify-around">
          {primaryNav.map((item, index) => {
            const isActive = location.pathname === item.href ||
              (item.href === '/app/dashboard' && location.pathname === '/app');

            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <NavLink
                  to={item.href}
                  className={cn(
                    'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200',
                    isActive
                      ? 'text-primary'
                      : 'text-text-muted hover:text-text-primary'
                  )}
                >
                  <item.icon className={cn(
                    'h-5 w-5',
                    isActive && 'drop-shadow-[0_0_8px_hsl(var(--primary))]'
                  )} />
                  <span className="text-xs font-medium">{item.name}</span>
                </NavLink>
              </motion.div>
            );
          })}

          {/* More button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: primaryNav.length * 0.05 }}
          >
            <button
              onClick={() => setMoreOpen(true)}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200',
                isMoreActive || moreOpen
                  ? 'text-primary'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <MoreHorizontal className={cn(
                'h-5 w-5',
                (isMoreActive || moreOpen) && 'drop-shadow-[0_0_8px_hsl(var(--primary))]'
              )} />
              <span className="text-xs font-medium">Több</span>
            </button>
          </motion.div>
        </div>
      </nav>
    </>
  );
}
