import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Zap, 
  CheckSquare, 
  FileText, 
  Calendar,
  Activity,
  BookOpen,
  PenLine,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { usePersonaStore } from '@/stores/usePersonaStore';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  persona?: string;
}

const navigation: NavItem[] = [
  { name: 'Home', href: '/app/dashboard', icon: LayoutDashboard },
  { name: 'Küldetések', href: '/app/quests', icon: Zap },
  { name: 'Listák', href: '/app/lists', icon: CheckSquare },
  { name: 'Szokások', href: '/app/habits', icon: Activity, persona: 'selfdev' },
  { name: 'Olvasás', href: '/app/reading', icon: BookOpen, persona: 'selfdev' },
  { name: 'Reflexió', href: '/app/reflection', icon: PenLine, persona: 'selfdev' },
  { name: 'Jegyzetek', href: '/app/notes', icon: FileText },
  { name: 'Naptár', href: '/app/calendar', icon: Calendar },
];

export default function BottomNav() {
  const location = useLocation();
  const { currentPersona } = usePersonaStore();

  const visibleNav = navigation.filter(
    (item) => !item.persona || item.persona === currentPersona.id
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-intense border-t border-white/10 px-2 py-2 safe-area-inset-bottom">
      <div className="flex items-center justify-around">
        {visibleNav.map((item, index) => {
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
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                  isActive 
                    ? "text-primary" 
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5",
                  isActive && "drop-shadow-[0_0_8px_hsl(var(--primary))]"
                )} />
                <span className="text-xs font-medium">{item.name}</span>
              </NavLink>
            </motion.div>
          );
        })}
      </div>
    </nav>
  );
}