// LevelSystem.js - XP, szint, badge, statisztika logika (moduláris, újrafelhasználható)

const LEVEL_XP_TABLE = [0, 100, 250, 500, 900, 1400, 2000, 2700, 3500, 4400]; // szintenkénti XP

function getLevelFromXP(xp) {
  let level = 1;
  for (let i = 1; i < LEVEL_XP_TABLE.length; i++) {
    if (xp < LEVEL_XP_TABLE[i]) return level;
    level = i + 1;
  }
  return level;
}

function getXPForNextLevel(xp) {
  const level = getLevelFromXP(xp);
  const currentLevelXP = LEVEL_XP_TABLE[level - 1] || 0;
  const nextLevelXP = LEVEL_XP_TABLE[level] || (currentLevelXP + 1000);
  return {
    currentLevel: level,
    currentLevelXP,
    nextLevelXP,
    xpToNext: Math.max(0, nextLevelXP - xp),
    progress: Math.min(1, (xp - currentLevelXP) / (nextLevelXP - currentLevelXP))
  };
}

/**
 * XP hozzáadása a felhasználóhoz
 * @param {number} amount - Hozzáadandó XP mennyisége
 * @param {string} reason - XP hozzáadásának oka
 */
async function addXP(amount, reason = '') {
  if (amount <= 0) return;
  
  try {
    // Get current user data through DataService
    let userData = {};
    if (window.app && window.app.dataService) {
      userData = await window.app.dataService.getUserData();
    } else if (window.currentUserId && window.FirebaseService) {
      userData = await window.FirebaseService.getUserData();
    } else if (window.LocalStorageService) {
      const localStorageService = new window.LocalStorageService();
      userData = await localStorageService.getUserData();
    }
    
    const oldXP = userData.xp || 0;
    const oldLevel = getLevelFromXP(oldXP);
    const newXP = oldXP + amount;
    const newLevel = getLevelFromXP(newXP);
    
    // Update XP through DataService
    if (window.app && window.app.dataService) {
      await window.app.dataService.updateXP(newXP);
      // Also update level if it changed
      if (newLevel > oldLevel) {
        await window.app.dataService.updateUserField('level', newLevel);
      }
      console.log(`XP added: +${amount} (${oldXP} → ${newXP})`);
    } else if (window.currentUserId && window.FirebaseService) {
      await window.FirebaseService.updateXP(newXP);
      // Also update level if it changed
      if (newLevel > oldLevel) {
        await window.FirebaseService.updateLevel(newLevel);
      }
      console.log(`XP added: +${amount} (${oldXP} → ${newXP})`);
    } else if (window.LocalStorageService) {
      const localStorageService = new window.LocalStorageService();
      await localStorageService.updateXP(newXP);
      // Also update level if it changed
      if (newLevel > oldLevel) {
        await localStorageService.updateUserField('level', newLevel);
      }
      console.log(`XP added (localStorage): +${amount} (${oldXP} → ${newXP})`);
    }
    
    // Show XP animation
    if (window.NotificationService && window.NotificationService.showXPAnimation) {
      try {
        window.NotificationService.showXPAnimation(amount, reason);
      } catch (error) {
        console.warn('XP animation error:', error);
        // Fallback to regular notification
        if (window.NotificationService.showInfo) {
          window.NotificationService.showInfo(`+${amount} XP${reason ? ` - ${reason}` : ''}`, 'XP nyert!');
        }
      }
    }
    
    // Check for level up
    if (newLevel > oldLevel) {
      const levelUpMessage = `🎉 Szint emelkedés! ${oldLevel} → ${newLevel}`;
      console.log(levelUpMessage);
      
      // Show level up animation
      if (window.NotificationService && window.NotificationService.showLevelUpAnimation) {
        try {
          window.NotificationService.showLevelUpAnimation(oldLevel, newLevel);
        } catch (error) {
          console.warn('Level up animation error:', error);
          // Fallback to regular notification
          if (window.NotificationService.showSuccess) {
            window.NotificationService.showSuccess(levelUpMessage, 'Szint emelkedés!');
          }
        }
      }
      
      // Trigger ResultsRenderer level up animation
      if (window.ResultsRenderer && window.ResultsRenderer.animateLevelUp) {
        try {
          window.ResultsRenderer.animateLevelUp(oldLevel, newLevel);
        } catch (error) {
          console.warn('ResultsRenderer level up animation error:', error);
        }
      }
      
      // Award essence for level up
      if (window.CurrencyService && window.CurrencyService.addEssence) {
        const essenceReward = newLevel * 10; // 10 essence per level
        try {
          await window.CurrencyService.addEssence(essenceReward, `Szint emelkedés: ${oldLevel} → ${newLevel}`);
        } catch (error) {
          console.error('Error awarding essence for level up:', error);
        }
      }
    }
    
    // Trigger ResultsRenderer XP progress animation
    if (window.ResultsRenderer && window.ResultsRenderer.addXPProgressAnimation) {
      try {
        window.ResultsRenderer.addXPProgressAnimation();
      } catch (error) {
        console.warn('ResultsRenderer XP progress animation error:', error);
      }
    }
    
  } catch (error) {
    console.error('Error adding XP:', error);
  }
}

// Egyedi SVG badge ikonok (inline string)
const SVG_ICONS = {
  target: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="18" fill="#fff3" stroke="#ff9100" stroke-width="3"/><circle cx="20" cy="20" r="12" fill="#fff6" stroke="#ff9100" stroke-width="2"/><circle cx="20" cy="20" r="6" fill="#ff9100"/><circle cx="20" cy="20" r="2" fill="#fff"/></svg>`,
  star: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="20,5 24,16 36,16 26,23 30,35 20,28 10,35 14,23 4,16 16,16" fill="#ffd700" stroke="#ff9100" stroke-width="2"/></svg>`,
  trophy: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="12" y="28" width="16" height="6" rx="2" fill="#ff9100"/><rect x="16" y="34" width="8" height="3" rx="1.5" fill="#ffd700"/><ellipse cx="20" cy="16" rx="10" ry="8" fill="#ffd700" stroke="#ff9100" stroke-width="2"/><path d="M10 16 Q4 20 10 24" stroke="#ff9100" stroke-width="2" fill="none"/><path d="M30 16 Q36 20 30 24" stroke="#ff9100" stroke-width="2" fill="none"/></svg>`,
  fire: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 36c8-6 8-14 0-24C12 22 12 30 20 36z" fill="#ff9100" stroke="#ffea00" stroke-width="2"/><circle cx="20" cy="30" r="4" fill="#fff3"/></svg>`,
  crown: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="28" width="20" height="6" rx="2" fill="#ffd700"/><polygon points="12,28 20,10 28,28" fill="#ff9100" stroke="#ffd700" stroke-width="2"/><circle cx="20" cy="10" r="2" fill="#fff"/><circle cx="12" cy="28" r="2" fill="#fff"/><circle cx="28" cy="28" r="2" fill="#fff"/></svg>`,
  book: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="10" width="24" height="20" rx="4" fill="#fff3" stroke="#ff9100" stroke-width="2"/><rect x="12" y="14" width="16" height="12" rx="2" fill="#ff9100"/><line x1="20" y1="14" x2="20" y2="26" stroke="#fff" stroke-width="2"/></svg>`,
  explore: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="18" fill="#fff3" stroke="#7f5fff" stroke-width="3"/><polygon points="20,8 24,32 20,28 16,32" fill="#7f5fff"/></svg>`
};

// Pipeline badgeek (több tier, mindegyikhez egyedi SVG, szint, leírás, cél, essence jutalom)
const BADGE_PIPELINES = [
  {
    id: 'first-task',
    title: 'Első lépés',
    pipeline: [
      { level: 1, goal: 1, desc: 'Teljesítsd az első feladatod', icon: SVG_ICONS.target, essence: 5 }
    ]
  },
  {
    id: 'task-master',
    title: 'Feladat mester',
    pipeline: [
      { level: 1, goal: 10, desc: 'Teljesíts 10 feladatot', icon: SVG_ICONS.star, essence: 10 },
      { level: 2, goal: 50, desc: 'Teljesíts 50 feladatot', icon: SVG_ICONS.star, essence: 25 },
      { level: 3, goal: 100, desc: 'Teljesíts 100 feladatot', icon: SVG_ICONS.star, essence: 50 }
    ]
  },
  {
    id: 'list-creator',
    title: 'Lista készítő',
    pipeline: [
      { level: 1, goal: 3, desc: 'Hozz létre 3 listát', icon: SVG_ICONS.book, essence: 15 },
      { level: 2, goal: 10, desc: 'Hozz létre 10 listát', icon: SVG_ICONS.book, essence: 30 }
    ]
  },
  {
    id: 'note-creator',
    title: 'Jegyzet készítő',
    pipeline: [
      { level: 1, goal: 5, desc: 'Írj 5 jegyzetet', icon: SVG_ICONS.book, essence: 15 },
      { level: 2, goal: 20, desc: 'Írj 20 jegyzetet', icon: SVG_ICONS.book, essence: 40 }
    ]
  },
  {
    id: 'level-up',
    title: 'Szint emelkedés',
    pipeline: [
      { level: 1, goal: 2, desc: 'Érj el 2. szintet', icon: SVG_ICONS.trophy, essence: 20 },
      { level: 2, goal: 5, desc: 'Érj el 5. szintet', icon: SVG_ICONS.trophy, essence: 50 },
      { level: 3, goal: 10, desc: 'Érj el 10. szintet', icon: SVG_ICONS.trophy, essence: 100 }
    ]
  },
  {
    id: 'streak',
    title: 'Kitartó',
    pipeline: [
      { level: 1, goal: 3, desc: '3 napos sorozat', icon: SVG_ICONS.fire, essence: 10 },
      { level: 2, goal: 7, desc: '7 napos sorozat', icon: SVG_ICONS.fire, essence: 25 },
      { level: 3, goal: 30, desc: '30 napos sorozat', icon: SVG_ICONS.fire, essence: 100 }
    ]
  },
  {
    id: 'legend',
    title: 'Legenda',
    pipeline: [
      { level: 1, goal: 7, desc: '7 napos sorozat', icon: SVG_ICONS.crown, essence: 25 },
      { level: 2, goal: 30, desc: '30 napos sorozat', icon: SVG_ICONS.crown, essence: 100 }
    ]
  },
  {
    id: 'explorer',
    title: 'Felfedező',
    pipeline: [
      { level: 1, goal: 5, desc: 'Próbáld ki az összes funkciót', icon: SVG_ICONS.explore, essence: 20 }
    ]
  }
];

// A user stat alapján visszaadja a badge gridet: minden badge-hez a következő elérendő tier-t, a már elérteket színesen, az aktuálisat progress-szel, a következőt szürkével
function getUserBadges(stats, checkForNewAchievements = false) {
  return BADGE_PIPELINES.map(badge => {
    let achievedLevel = 0;
    let progress = 0;
    let currentTier = badge.pipeline[0];
    // Stat alapján eldöntjük, melyik tiernél tart
    for (let i = 0; i < badge.pipeline.length; i++) {
      const tier = badge.pipeline[i];
      let value = 0;
      switch (badge.id) {
        case 'first-task': value = stats.tasksCompleted || 0; break;
        case 'task-master': value = stats.tasksCompleted || 0; break;
        case 'list-creator': value = stats.listsCreated || 0; break;
        case 'note-creator': value = stats.notesCreated || 0; break;
        case 'level-up': value = stats.level || 1; break;
        case 'streak': value = stats.bestStreak || 0; break;
        case 'legend': value = stats.bestStreak || 0; break;
        case 'explorer': value = stats.featuresUsed || 0; break;
        default: value = 0;
      }
      if (value >= tier.goal) {
        achievedLevel = tier.level;
        currentTier = tier;
      } else {
        progress = value / tier.goal;
        currentTier = tier;
        break;
      }
    }
    
    // Check if we just achieved a new tier and award essence (only if explicitly requested)
    const currentValue = (() => {
      switch (badge.id) {
        case 'first-task': return stats.tasksCompleted || 0;
        case 'task-master': return stats.tasksCompleted || 0;
        case 'list-creator': return stats.listsCreated || 0;
        case 'note-creator': return stats.notesCreated || 0;
        case 'level-up': return stats.level || 1;
        case 'streak': return stats.bestStreak || 0;
        case 'legend': return stats.bestStreak || 0;
        case 'explorer': return stats.featuresUsed || 0;
        default: return 0;
      }
    })();
    
    // Check if we just achieved this tier and award essence (only if explicitly requested)
    if (checkForNewAchievements && achievedLevel >= currentTier.level && currentValue >= currentTier.goal) {
      checkAndAwardEssence(badge.id, currentTier.level, currentTier.essence);
    }
    
    // Megjelenítéshez:
    return {
      id: badge.id,
      title: badge.title + (currentTier.level > 1 ? ` ${currentTier.level}` : ''),
      desc: currentTier.desc,
      icon: currentTier.icon,
      achieved: achievedLevel >= currentTier.level,
      achievedLevel,
      currentLevel: currentTier.level,
      goal: currentTier.goal,
      progress,
      value: currentValue,
      essence: currentTier.essence
    };
  });
}

// Check if we should award essence for a newly achieved badge tier
function checkAndAwardEssence(badgeId, tierLevel, essenceAmount) {
  // Create a unique key for this achievement
  const achievementKey = `${badgeId}_tier_${tierLevel}`;
  
  // Check if we already awarded this tier
  const awarded = localStorage.getItem(`essence_awarded_${achievementKey}`);
  if (awarded) return;
  
  // Award essence if CurrencyService is available
  if (window.CurrencyService) {
    window.CurrencyService.addEssence(essenceAmount, `Badge: ${badgeId} Tier ${tierLevel}`);
    
    // Mark as awarded
    localStorage.setItem(`essence_awarded_${achievementKey}`, 'true');
  }
}

function getSummaryLines(stats) {
  return [
    `Teljesítés: ${stats.completionPercent}% (${stats.tasksCompleted} feladat)`,
    `${stats.listsCreated} aktív lista készítve`,
    `Kezdő díj: sorozatod ma!`,
    `Szint: ${stats.level}.  ${stats.xp} XP összesen`,
  ];
}

function getDummyStats() {
  return {
    listsCreated: 3,
    notesCreated: 2,
    tasksCompleted: 12,
    completionPercent: 80,
    level: 5,
    xp: 409,
    bestStreak: 3,
    totalDays: 8,
    avgPerDay: 1.5,
    featuresUsed: 6
  };
}

// Check for new achievements and award essence
function checkForNewAchievements(stats) {
  return getUserBadges(stats, true);
}

// Globális export window-ra, hogy main.js-ből is elérhető legyen
window.LevelSystem = {
  getLevelFromXP,
  getXPForNextLevel,
  BADGE_PIPELINES,
  getUserBadges,
  checkForNewAchievements,
  getSummaryLines,
  getDummyStats,
  addXP
}; 