// ResultsRenderer.js - Eredmények tab DOM frissítése

window.ResultsRenderer = (function() {
  'use strict';

  function renderResultsTab(stats, badges, xpInfo, summaryLines) {
    // Statisztikák
    document.getElementById('stat-lists').textContent = stats.listsCreated;
    document.getElementById('stat-notes').textContent = stats.notesCreated;
    document.getElementById('stat-tasks').textContent = stats.tasksCompleted;
    document.getElementById('stat-completion').textContent = stats.completionPercent + '%';
    // Szint/XP
    document.getElementById('level-value').textContent = xpInfo.currentLevel;
    document.getElementById('xp-progress-bar').style.width = (xpInfo.progress * 100) + '%';
    document.getElementById('xp-text').textContent = `${stats.xp} / ${xpInfo.nextLevelXP} XP`;
    document.getElementById('xp-to-next').textContent = `Még ${xpInfo.xpToNext} XP a következő szintig!`;
    // Aktivitás
    document.getElementById('stat-total-days').textContent = stats.totalDays;
    document.getElementById('stat-best-streak').textContent = stats.bestStreak;
    document.getElementById('stat-avg').textContent = stats.avgPerDay;
    // Dummy grafikon
    const graph = document.getElementById('activity-graph');
    if (graph) {
      graph.innerHTML = '';
      for (let i = 0; i < stats.totalDays; i++) {
        const h = 16 + Math.round(Math.random() * 48);
        graph.innerHTML += `<div class='bg-donezy-orange rounded w-3 mx-0.5' style='height:${h}px;'></div>`;
      }
    }
    // Badge grid
    const badgeGrid = document.getElementById('badge-grid');
    if (badgeGrid) {
      badgeGrid.innerHTML = badges.map(badge => {
        const isSVG = badge.icon && badge.icon.startsWith('<svg');
        const iconHTML = isSVG ? badge.icon : `<span class='badge-icon'>${badge.icon}</span>`;
        let progressBar = '';
        if (!badge.achieved && badge.goal > 1) {
          progressBar = `<div class='w-full bg-gray-700 rounded-full h-2 mt-2 mb-1'><div class='bg-donezy-orange h-2 rounded-full' style='width:${Math.round(badge.progress*100)}%'></div></div>`;
          progressBar += `<div class='text-xs text-gray-300 text-center'>${badge.value} / ${badge.goal}</div>`;
        }
        // Essence reward display
        const essenceReward = badge.essence ? `<div class="absolute bottom-2 right-2 text-xs font-bold text-purple-400 flex items-center gap-1"><img src="imgs/Essence.svg" alt="Essence" class="inline w-4 h-4 align-middle" style="display:inline;vertical-align:middle;"/> ${badge.essence}</div>` : '';
        return `
          <div class="badge-card relative bg-donezy-card rounded-xl p-4 shadow-lg border border-donezy-accent flex flex-col items-center mb-4">
            <div class="text-3xl mb-2">${iconHTML}</div>
            <div class="font-bold text-donezy-orange text-lg mb-1">${badge.title}</div>
            <div class="text-gray-300 text-sm mb-2 text-center">${badge.description || ''}</div>
            ${progressBar}
            <div class="text-xs text-gray-400 mb-1">${badge.achieved ? '🏆 Megszerezve' : ''}</div>
            ${essenceReward}
          </div>
        `;
      }).join('');
    }
    // Summary lines (if any)
    const summaryContainer = document.getElementById('results-summary');
    if (summaryContainer && Array.isArray(summaryLines)) {
      summaryContainer.innerHTML = summaryLines.map(line => `<div>${line}</div>`).join('');
    }
  }

  // Public API
  return {
    renderResultsTab
  };
})();
