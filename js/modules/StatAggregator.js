// StatAggregator.js - Felhasználói statisztikák aggregálása

/**
 * items: [{type: 'task'|'note'|'list', completed: bool, createdAt: ISOString, ...}]
 * userData: {level, xp, streak, ...}
 */
function aggregateStats(items, userData = {}) {
  const stats = {
    listsCreated: 0,
    notesCreated: 0,
    tasksCompleted: 0,
    completionPercent: 0,
    bestStreak: userData.streak || 0,
    totalDays: 0,
    avgPerDay: 0,
    featuresUsed: 0,
    level: userData.level || 1,
    xp: userData.xp || 0
  };
  const daySet = new Set();
  let totalTasks = 0, completedTasks = 0;
  let features = new Set();
  items.forEach(item => {
    if (item.type === 'list') stats.listsCreated++;
    if (item.type === 'note') stats.notesCreated++;
    if (item.type === 'task') {
      totalTasks++;
      if (item.completed) completedTasks++;
      stats.tasksCompleted++;
    }
    if (item.createdAt) {
      const day = item.createdAt.split('T')[0];
      daySet.add(day);
    }
    features.add(item.type);
  });
  stats.completionPercent = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  stats.totalDays = daySet.size;
  stats.avgPerDay = items.length ? +(items.length / (daySet.size || 1)).toFixed(1) : 0;
  stats.featuresUsed = features.size;
  return stats;
}

// Globális export window-ra
window.StatAggregator = { aggregateStats }; 