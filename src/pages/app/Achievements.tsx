import { motion } from 'framer-motion';
import { Trophy, Star, Target, Zap, Award, Crown, Shield, Gem } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

const rarityConfig = {
  common: {
    label: 'Gyakori',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    borderColor: 'border-gray-500/30',
    glowColor: 'shadow-gray-500/20'
  },
  rare: {
    label: 'Ritka',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    glowColor: 'shadow-blue-500/20'
  },
  epic: {
    label: 'Epikus',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
    glowColor: 'shadow-purple-500/20'
  },
  legendary: {
    label: 'Legendás',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/30',
    glowColor: 'shadow-yellow-500/20'
  }
};

export default function Achievements() {
  const { achievements, userStats } = useAppStore();
  
  const unlockedAchievements = achievements.filter(a => a.unlockedAt);
  const lockedAchievements = achievements.filter(a => !a.unlockedAt);
  
  const getProgressPercent = (achievement: any) => {
    if (!achievement.maxProgress) return 100;
    return Math.min((achievement.progress || 0) / achievement.maxProgress * 100, 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center glow-primary">
            <Trophy className="h-10 w-10 text-surface-0" />
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-text-primary mb-2">
            Eredmények
          </h1>
          <p className="text-lg text-text-secondary">
            Ünnepeld sikereidet és érj el új mérföldköveket
          </p>
        </motion.div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">{userStats.level}</div>
            <div className="text-sm text-text-muted">Szint</div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass p-4 text-center">
            <div className="text-2xl font-bold text-warning mb-1">{unlockedAchievements.length}</div>
            <div className="text-sm text-text-muted">Feloldva</div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass p-4 text-center">
            <div className="text-2xl font-bold text-success mb-1">{userStats.totalQuestsCompleted}</div>
            <div className="text-sm text-text-muted">Küldetés</div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass p-4 text-center">
            <div className="text-2xl font-bold text-secondary mb-1">{userStats.streak}</div>
            <div className="text-sm text-text-muted">Sorozat</div>
          </Card>
        </motion.div>
      </div>

      {/* XP Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="glass p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold text-text-primary">
              Szint előrehaladás
            </h2>
            <div className="text-sm text-text-muted">
              {userStats.xp} / {userStats.xpToNextLevel} XP
            </div>
          </div>
          
          <Progress 
            value={(userStats.xp / userStats.xpToNextLevel) * 100} 
            className="h-4 bg-surface-2 mb-2"
          />
          
          <div className="flex justify-between text-sm text-text-muted">
            <span>Szint {userStats.level}</span>
            <span>Szint {userStats.level + 1}</span>
          </div>
        </Card>
      </motion.div>

      {/* Achievements Sections */}
      <div className="space-y-8">
        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <div>
            <h2 className="text-2xl font-heading font-bold text-text-primary mb-6 flex items-center gap-3">
              <Star className="h-6 w-6 text-primary" />
              Feloldott eredmények
            </h2>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {unlockedAchievements.map((achievement, index) => {
                const rarity = rarityConfig[achievement.rarity];
                const IconComponent = LucideIcons[achievement.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
                
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={cn(
                      "glass p-6 hover-lift relative overflow-hidden",
                      rarity.borderColor,
                      "border"
                    )}>
                      {/* Rarity glow effect */}
                      <div className={cn(
                        "absolute inset-0 opacity-20",
                        rarity.bgColor
                      )} />
                      
                      <div className="relative">
                        <div className="flex items-start justify-between mb-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            rarity.bgColor,
                            rarity.borderColor,
                            "border-2"
                          )}>
                            <IconComponent className={cn("h-6 w-6", rarity.color)} />
                          </div>
                          
                          <Badge className={cn(
                            "text-xs",
                            rarity.bgColor,
                            rarity.color,
                            rarity.borderColor
                          )}>
                            {rarity.label}
                          </Badge>
                        </div>
                        
                        <h3 className="font-heading font-semibold text-text-primary mb-2">
                          {achievement.title}
                        </h3>
                        
                        <p className="text-sm text-text-secondary mb-4">
                          {achievement.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-text-muted">
                          <span>Feloldva:</span>
                          <span>{formatDate(achievement.unlockedAt!)}</span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <div>
            <h2 className="text-2xl font-heading font-bold text-text-primary mb-6 flex items-center gap-3">
              <Target className="h-6 w-6 text-text-muted" />
              Folyamatban lévő eredmények
            </h2>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {lockedAchievements.map((achievement, index) => {
                const rarity = rarityConfig[achievement.rarity];
                const IconComponent = LucideIcons[achievement.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
                const progressPercent = getProgressPercent(achievement);
                
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <Card className="glass p-6 hover-lift opacity-75">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-surface-2 border border-white/10 flex items-center justify-center">
                          <IconComponent className="h-6 w-6 text-text-disabled" />
                        </div>
                        
                        <Badge variant="outline" className="text-xs border-white/20 text-text-muted">
                          {rarity.label}
                        </Badge>
                      </div>
                      
                      <h3 className="font-heading font-semibold text-text-primary mb-2">
                        {achievement.title}
                      </h3>
                      
                      <p className="text-sm text-text-secondary mb-4">
                        {achievement.description}
                      </p>
                      
                      {achievement.maxProgress && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-text-muted">
                            <span>Haladás</span>
                            <span>{achievement.progress || 0} / {achievement.maxProgress}</span>
                          </div>
                          <Progress 
                            value={progressPercent} 
                            className="h-2 bg-surface-2"
                          />
                        </div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {achievements.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass p-12 text-center">
              <Trophy className="h-16 w-16 text-text-disabled mx-auto mb-4" />
              <h3 className="text-lg font-heading font-semibold text-text-primary mb-2">
                Még nincsenek eredményeid
              </h3>
              <p className="text-text-muted">
                Kezdj el küldetéseket teljesíteni az első eredmények megszerzéséhez
              </p>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}