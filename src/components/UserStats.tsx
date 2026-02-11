import { motion } from 'framer-motion';
import { Zap, Gem } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { Progress } from '@/components/ui/progress';

export default function UserStats() {
  const { userStats } = useAppStore();
  
  const xpProgress = (userStats.xp / userStats.xpToNextLevel) * 100;

  return (
    <div className="flex items-center gap-4">
      {/* XP Progress Ring */}
      <motion.div 
        className="relative"
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 400 }}
      >
        <div className="w-12 h-12 rounded-full bg-surface-1 border-2 border-primary/30 flex items-center justify-center relative overflow-hidden">
          <div 
            className="absolute inset-0 rounded-full border-2 border-primary"
            style={{
              background: `conic-gradient(from 0deg, hsl(var(--primary)) 0%, hsl(var(--primary)) ${xpProgress}%, transparent ${xpProgress}%, transparent 100%)`,
              mask: 'radial-gradient(circle closest-side, transparent 65%, black 66%)',
              WebkitMask: 'radial-gradient(circle closest-side, transparent 65%, black 66%)'
            }}
          />
          <span className="text-xs font-bold text-text-primary z-10">
            {userStats.level}
          </span>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="hidden sm:flex flex-col gap-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-text-primary">
              {userStats.xp.toLocaleString()}
            </span>
            <span className="text-xs text-text-muted">
              / {userStats.xpToNextLevel.toLocaleString()} XP
            </span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Gem className="h-4 w-4 text-secondary" />
            <span className="text-sm font-medium text-text-primary">
              {userStats.essence.toLocaleString()}
            </span>
          </div>
        </div>
        
        <Progress 
          value={xpProgress} 
          className="w-32 h-1.5 bg-surface-2"
        />
      </div>

      {/* Mobile - Compact view */}
      <div className="sm:hidden flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Gem className="h-4 w-4 text-secondary" />
          <span className="text-sm font-medium text-text-primary">
            {userStats.essence}
          </span>
        </div>
      </div>
    </div>
  );
}