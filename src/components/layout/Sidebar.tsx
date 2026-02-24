import { NavLink, useLocation } from 'react-router-dom';
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
  Target,
  Moon,
  Sun,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import DonezyLogo from '@/components/DonezyLogo';
import { usePersonaStore } from '@/stores/usePersonaStore';
import { useThemeStore } from '@/stores/useThemeStore';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  persona?: string; // only show for this persona
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { name: 'Küldetések', href: '/app/quests', icon: Zap },
  { name: 'Listák', href: '/app/lists', icon: CheckSquare },
  { name: 'Szokás Tracker', href: '/app/habits', icon: Activity, persona: 'selfdev' },
  { name: 'Olvasási napló', href: '/app/reading', icon: BookOpen, persona: 'selfdev' },
  { name: 'Napi reflexió', href: '/app/reflection', icon: PenLine, persona: 'selfdev' },
  { name: 'Növekedési célok', href: '/app/growth', icon: Target, persona: 'selfdev' },
  { name: 'Jegyzetek', href: '/app/notes', icon: FileText },
  { name: 'Naptár', href: '/app/calendar', icon: Calendar },
  { name: 'Eredmények', href: '/app/achievements', icon: Trophy },
  { name: 'Bolt', href: '/app/shop', icon: ShoppingBag },
];

export default function Sidebar() {
  const location = useLocation();
  const { currentPersona } = usePersonaStore();
  const { theme, setTheme } = useThemeStore();

  const visibleNav = navigation.filter(
    (item) => !item.persona || item.persona === currentPersona.id
  );

  return (
    <aside className="glass-intense w-64 border-r border-white/10 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3"
        >
          <DonezyLogo className="w-10 h-10" />
          <span className="text-xl font-heading font-bold text-gradient-primary">
            Donezy
          </span>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {visibleNav.map((item, index) => {
          const isActive = location.pathname === item.href || 
            (item.href === '/app/dashboard' && location.pathname === '/app');
          
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <NavLink
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200",
                  "hover:bg-white/5 hover:translate-x-1",
                  isActive 
                    ? "bg-primary/20 text-primary border border-primary/30 glow-primary" 
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* Theme + Settings */}
      <div className="p-4 border-t border-white/10 space-y-1">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 w-full",
            "hover:bg-white/5 text-text-secondary hover:text-text-primary"
          )}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-5 w-5" />
              Világos mód
            </>
          ) : (
            <>
              <Moon className="h-5 w-5" />
              Sötét mód
            </>
          )}
        </button>
        <NavLink
          to="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200",
            "hover:bg-white/5 text-text-secondary hover:text-text-primary"
          )}
        >
          <Settings className="h-5 w-5" />
          Beállítások
        </NavLink>
      </div>
    </aside>
  );
}