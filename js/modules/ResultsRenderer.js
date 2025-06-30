// ResultsRenderer.js - Eredmények tab DOM frissítése

window.ResultsRenderer = (function() {
  'use strict';

  function renderResultsTab(stats, badges, xpInfo, summaryLines) {
    // Statisztikák
    const elStatLists = document.getElementById('stat-lists');
    if (elStatLists) elStatLists.textContent = stats.listsCreated;
    const elStatNotes = document.getElementById('stat-notes');
    if (elStatNotes) elStatNotes.textContent = stats.notesCreated;
    const elStatTasks = document.getElementById('stat-tasks');
    if (elStatTasks) elStatTasks.textContent = stats.tasksCompleted;
    const elStatCompletion = document.getElementById('stat-completion');
    if (elStatCompletion) elStatCompletion.textContent = stats.completionPercent + '%';
    // Szint/XP
    const elLevelValue = document.getElementById('level-value');
    if (elLevelValue) elLevelValue.textContent = xpInfo.currentLevel;
    const elXpBar = document.getElementById('xp-progress-bar');
    if (elXpBar) elXpBar.style.width = (xpInfo.progress * 100) + '%';
    const elXpText = document.getElementById('xp-text');
    if (elXpText) elXpText.textContent = `${stats.xp} / ${xpInfo.nextLevelXP} XP`;
    const elXpToNext = document.getElementById('xp-to-next');
    if (elXpToNext) elXpToNext.textContent = `Még ${xpInfo.xpToNext} XP a következő szintig!`;
    // Aktivitás
    const elTotalDays = document.getElementById('stat-total-days');
    if (elTotalDays) elTotalDays.textContent = stats.totalDays;
    const elBestStreak = document.getElementById('stat-best-streak');
    if (elBestStreak) elBestStreak.textContent = stats.bestStreak;
    const elAvg = document.getElementById('stat-avg');
    if (elAvg) elAvg.textContent = stats.avgPerDay;
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
          progressBar = `<div class='w-full bg-secondary rounded-full h-2 mt-2 mb-1'><div class='bg-donezy-orange h-2 rounded-full' style='width:${Math.round(badge.progress*100)}%'></div></div>`;
          progressBar += `<div class='text-xs text-secondary text-center'>${badge.value} / ${badge.goal}</div>`;
        }
        // Essence reward display
        const essenceReward = badge.essence ? `<div class=\"absolute bottom-2 right-2 text-xs font-bold text-purple flex items-center gap-1\"><img src=\"imgs/Essence.svg\" alt=\"Essence\" class=\"inline w-4 h-4 align-middle\" style=\"display:inline;vertical-align:middle;\"/> ${badge.essence}</div>` : '';
        return `
          <div class=\"badge-card relative bg-donezy-card rounded-xl p-4 shadow-lg border border-donezy-accent flex flex-col items-center mb-4\">
            <div class=\"text-3xl mb-2\">${iconHTML}</div>
            <div class=\"font-bold text-donezy-orange text-lg mb-1\">${badge.title}</div>
            <div class=\"text-secondary text-sm mb-2 text-center\">${badge.description || ''}</div>
            ${progressBar}
            <div class=\"text-xs text-muted mb-1\">${badge.achieved ? '\ud83c\udfc6 Megszerezve' : ''}</div>
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
