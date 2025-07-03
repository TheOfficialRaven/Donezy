// ResultsRenderer.js - Eredmények tab dinamikus DOM frissítése
// Teljes funkcionalitású, reszponzív eredmények oldal

window.ResultsRenderer = (function() {
  'use strict';

    // Badge definitions - AI-ready structure
    const BADGE_DEFINITIONS = {
        quest_master: {
            id: 'quest_master',
            name: 'Küldetésvadász',
            description: 'Teljesíts 10 napi küldetést!',
            icon: '🎯',
            condition: 'questsCompleted >= 10',
            category: 'quests',
            rarity: 'common'
        },
        list_master: {
            id: 'list_master',
            name: 'Lista-mester',
            description: 'Hozz létre 5 listát!',
            icon: '📝',
            condition: 'listsCreated >= 5',
            category: 'lists',
            rarity: 'common'
        },
        streak_7: {
            id: 'streak_7',
            name: 'Heti Hős',
            description: '7 napos sorozat!',
            icon: '🔥',
            condition: 'currentStreak >= 7',
            category: 'streak',
            rarity: 'rare'
        },
        streak_30: {
            id: 'streak_30',
            name: 'Havi Mester',
            description: '30 napos sorozat!',
            icon: '⭐',
            condition: 'currentStreak >= 30',
            category: 'streak',
            rarity: 'epic'
        },
        task_completer: {
            id: 'task_completer',
            name: 'Feladat-végrehajtó',
            description: 'Teljesíts 50 feladatot!',
            icon: '✅',
            condition: 'tasksCompleted >= 50',
            category: 'tasks',
            rarity: 'common'
        },
        note_taker: {
            id: 'note_taker',
            name: 'Jegyzetelő',
            description: 'Írj 10 jegyzetet!',
            icon: '📔',
            condition: 'notesCreated >= 10',
            category: 'notes',
            rarity: 'common'
        },
        level_5: {
            id: 'level_5',
            name: 'Tapasztalt',
            description: 'Érj el 5. szintet!',
            icon: '🌟',
            condition: 'level >= 5',
            category: 'level',
            rarity: 'rare'
        },
        level_10: {
            id: 'level_10',
            name: 'Veterán',
            description: 'Érj el 10. szintet!',
            icon: '👑',
            condition: 'level >= 10',
            category: 'level',
            rarity: 'epic'
        },
        daily_grinder: {
            id: 'daily_grinder',
            name: 'Napi Grinder',
            description: '100 nap aktív használat!',
            icon: '💎',
            condition: 'totalActiveDays >= 100',
            category: 'activity',
            rarity: 'legendary'
        }
    };

    // Chart.js configuration
    let activityChart = null;

    /**
     * Fő renderelő függvény
     */
    function renderResultsTab(userData, activityData, badges) {
        console.log('Rendering results tab with data:', { userData, activityData, badges });
        
        const resultsContent = document.getElementById('results-content');
        if (!resultsContent) {
            console.error('Results content container not found');
            return;
        }

        // Clear existing content
        resultsContent.innerHTML = '';

        // Render all sections
        resultsContent.appendChild(renderLevelXPSection(userData));
        resultsContent.appendChild(renderActivityChartSection(activityData));
        resultsContent.appendChild(renderBadgeCollectionSection(badges, userData));

        // Initialize chart after DOM is ready
        setTimeout(() => {
            initializeActivityChart(activityData);
        }, 100);
    }

    /**
     * Szint és XP szekció renderelése
     */
    function renderLevelXPSection(userData) {
        const section = document.createElement('div');
        section.className = 'bg-donezy-card rounded-xl p-6 shadow-lg border border-donezy-accent card-hover mb-8';
        
        const level = userData?.level || 1;
        const xp = userData?.xp || 0;
        const xpToNext = userData?.xpToNextLevel || 100;
        const questsCompleted = userData?.questsCompleted || 0;
        const totalQuests = userData?.totalQuests || 0;
        
        // Calculate XP progress
        const currentLevelXP = getXPForLevel(level);
        const nextLevelXP = getXPForLevel(level + 1);
        const xpInCurrentLevel = Math.max(0, xp - currentLevelXP);
        const xpNeededForNext = nextLevelXP - currentLevelXP;
        const progressPercent = xpNeededForNext > 0 ? Math.min((xpInCurrentLevel / xpNeededForNext) * 100, 100) : 100;

        // Calculate quest progress
        const questProgressPercent = totalQuests > 0 ? Math.round((questsCompleted / totalQuests) * 100) : 0;

        section.innerHTML = `
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-donezy-orange flex items-center gap-3">
                    <span class="text-3xl">🌟</span>
                    Szinted & XP
                </h2>
                <div class="text-right">
                    <div class="text-sm text-secondary">Következő szint</div>
                    <div class="text-lg font-bold text-donezy-orange">${level + 1}</div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Current Level -->
                <div class="text-center">
                    <div class="text-5xl font-extrabold text-donezy-orange mb-2" id="level-value">${level}</div>
                    <div class="text-sm text-secondary">Jelenlegi szint</div>
                </div>

                <!-- XP Progress -->
                <div class="flex flex-col justify-center">
                    <div class="flex justify-between text-sm text-secondary mb-2">
                        <span>${xpInCurrentLevel} / ${xpNeededForNext} XP</span>
                        <span>${Math.round(progressPercent)}%</span>
                    </div>
                    <div class="w-full bg-donezy-accent rounded-full h-3 mb-2 overflow-hidden">
                        <div id="xp-progress-bar" class="bg-gradient-to-r from-donezy-orange to-orange-hover h-3 rounded-full transition-all duration-500" style="width: ${progressPercent}%"></div>
                    </div>
                    <div class="text-xs text-secondary text-center">
                        Még ${xpNeededForNext - xpInCurrentLevel} XP a következő szintig
                    </div>
                </div>

                <!-- Quest Progress -->
                <div class="text-center">
                    <div class="text-3xl font-bold text-purple mb-2">${questsCompleted}/${totalQuests}</div>
                    <div class="text-sm text-secondary">Küldetés teljesítve</div>
                    <div class="text-xs text-secondary mt-1">
                        ${questProgressPercent}% teljesítés
                    </div>
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div class="stat-card">
                    <div class="text-2xl mb-1">📊</div>
                    <div class="text-lg font-bold">${userData?.totalActiveDays || 0}</div>
                    <div class="text-xs text-secondary">Aktív nap</div>
                </div>
                <div class="stat-card">
                    <div class="text-2xl mb-1">🔥</div>
                    <div class="text-lg font-bold">${userData?.currentStreak || 0}</div>
                    <div class="text-xs text-secondary">Sorozat</div>
                </div>
                <div class="stat-card">
                    <div class="text-2xl mb-1">✅</div>
                    <div class="text-lg font-bold">${userData?.tasksCompleted || 0}</div>
                    <div class="text-xs text-secondary">Feladat kész</div>
                </div>
                <div class="stat-card">
                    <div class="text-2xl mb-1">📝</div>
                    <div class="text-lg font-bold">${userData?.notesCreated || 0}</div>
                    <div class="text-xs text-secondary">Jegyzet</div>
                </div>
            </div>
        `;

        return section;
    }

    /**
     * Aktivitás grafikon szekció renderelése
     */
    function renderActivityChartSection(activityData) {
        const section = document.createElement('div');
        section.className = 'bg-donezy-card rounded-xl p-6 shadow-lg border border-donezy-accent card-hover mb-8';
        
        section.innerHTML = `
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-donezy-orange flex items-center gap-3">
                    <span class="text-3xl">📊</span>
                    Napi Aktivitás
                </h2>
                <div class="flex gap-2">
                    <button id="chart-7-days" class="px-3 py-1 text-sm bg-donezy-accent text-white rounded-lg hover:bg-donezy-orange transition-colors">7 nap</button>
                    <button id="chart-30-days" class="px-3 py-1 text-sm bg-donezy-accent text-white rounded-lg hover:bg-donezy-orange transition-colors">30 nap</button>
                </div>
            </div>

            <div class="relative">
                <canvas id="activity-chart" width="400" height="200"></canvas>
                <div id="no-activity-message" class="hidden text-center py-8 text-secondary">
                    <div class="text-4xl mb-4">📈</div>
                    <div class="text-lg">Nincs elérhető aktivitás az adott időszakban.</div>
                    <div class="text-sm mt-2">Kezdj el használni az alkalmazást, hogy láthasd az aktivitásod!</div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div class="activity-stat">
                    <div class="text-lg font-bold text-center" id="avg-activity">0</div>
                    <div class="text-xs text-secondary text-center">Átlag/nap</div>
                </div>
                <div class="activity-stat">
                    <div class="text-lg font-bold text-center" id="best-day">0</div>
                    <div class="text-xs text-secondary text-center">Legjobb nap</div>
                </div>
                <div class="activity-stat">
                    <div class="text-lg font-bold text-center" id="total-activity">0</div>
                    <div class="text-xs text-secondary text-center">Összesen</div>
                </div>
            </div>
        `;

        // Add event listeners for chart period buttons
        setTimeout(() => {
            const btn7Days = document.getElementById('chart-7-days');
            const btn30Days = document.getElementById('chart-30-days');
            
            btn7Days?.addEventListener('click', () => {
                btn7Days.classList.add('bg-donezy-orange');
                btn30Days.classList.remove('bg-donezy-orange');
                updateActivityChart(activityData, 7);
            });
            
            btn30Days?.addEventListener('click', () => {
                btn30Days.classList.add('bg-donezy-orange');
                btn7Days.classList.remove('bg-donezy-orange');
                updateActivityChart(activityData, 30);
            });

            // Set default to 7 days
            btn7Days?.classList.add('bg-donezy-orange');
        }, 100);

        return section;
    }

    /**
     * Badge gyűjtemény szekció renderelése
     */
    function renderBadgeCollectionSection(badges, userData) {
        const section = document.createElement('div');
        section.className = 'bg-donezy-card rounded-xl p-6 shadow-lg border border-donezy-accent card-hover';
        
        const unlockedCount = Object.values(badges).filter(badge => badge.unlocked).length;
        const totalCount = Object.keys(BADGE_DEFINITIONS).length;
        
        section.innerHTML = `
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-donezy-orange flex items-center gap-3">
                    <span class="text-3xl">🏅</span>
                    Jutalmak & Elismerések
                </h2>
                <div class="text-right">
                    <div class="text-lg font-bold text-donezy-orange">${unlockedCount}/${totalCount}</div>
                    <div class="text-sm text-secondary">Badge megszerezve</div>
                </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" id="badge-grid">
                ${Object.values(BADGE_DEFINITIONS).map(badgeDef => {
                    const badge = badges[badgeDef.id] || { unlocked: false, progress: 0 };
                    const isUnlocked = badge.unlocked;
                    const progress = badge.progress || 0;
                    
                    return `
                        <div class="badge-card ${isUnlocked ? 'earned' : 'locked'} relative bg-donezy-accent rounded-lg p-4 text-center transition-all duration-300 hover:scale-105 ${isUnlocked ? 'ring-2 ring-green-500' : 'opacity-75'}" data-badge-id="${badgeDef.id}">
                            <div class="badge-icon text-4xl mb-3 ${isUnlocked ? '' : 'grayscale'}">${badgeDef.icon}</div>
                            <div class="badge-title text-sm font-bold mb-1">${badgeDef.name}</div>
                            <div class="badge-desc text-xs opacity-75 mb-3">${badgeDef.description}</div>
                            
                            ${!isUnlocked ? `
                                <div class="progress-container mb-2">
                                    <div class="flex justify-between text-xs text-secondary mb-1">
                                        <span>Haladás</span>
                                        <span>${progress}%</span>
                                    </div>
                                    <div class="w-full bg-gray-700 rounded-full h-2">
                                        <div class="bg-gradient-to-r from-donezy-orange to-orange-hover h-2 rounded-full transition-all duration-500" style="width: ${progress}%"></div>
                                    </div>
                                </div>
                            ` : ''}
                            
                            ${isUnlocked ? `
                                <div class="absolute top-2 right-2 text-green-400">
                                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                    </svg>
                                </div>
                                <div class="text-xs text-green-400 font-medium">Megszerezve!</div>
                            ` : `
                                <div class="absolute top-2 right-2 text-gray-400">
                                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path>
                                    </svg>
                                </div>
                            `}
                        </div>
                    `;
                }).join('')}
          </div>
        `;

        return section;
    }

    /**
     * Aktivitás grafikon inicializálása
     */
    function initializeActivityChart(activityData) {
        console.log('Initializing activity chart with data:', activityData);
        
        const ctx = document.getElementById('activity-chart');
        const noActivityMessage = document.getElementById('no-activity-message');
        
        if (!ctx) {
            console.error('Activity chart canvas not found');
            return;
        }

        // Check if we have any activity data
        if (!activityData || Object.keys(activityData).length === 0) {
            console.log('No activity data available, showing message');
            if (ctx) ctx.style.display = 'none';
            if (noActivityMessage) noActivityMessage.classList.remove('hidden');
            return;
        }

        // Show chart and hide message
        if (ctx) ctx.style.display = 'block';
        if (noActivityMessage) noActivityMessage.classList.add('hidden');

        // Load Chart.js if not already loaded
        if (typeof Chart === 'undefined') {
            loadChartJS().then(() => {
                createActivityChart(activityData);
            });
        } else {
            createActivityChart(activityData);
        }
    }

    /**
     * Chart.js betöltése
     */
    function loadChartJS() {
        return new Promise((resolve, reject) => {
            if (typeof Chart !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Aktivitás grafikon létrehozása
     */
    function createActivityChart(activityData, days = 7) {
        const ctx = document.getElementById('activity-chart');
        const noActivityMessage = document.getElementById('no-activity-message');
        
        if (!ctx) {
            console.error('Activity chart canvas not found');
            return;
        }

        // Destroy existing chart
        if (activityChart) {
            activityChart.destroy();
        }

        const chartData = prepareActivityChartData(activityData, days);
        
        // Check if we have any meaningful data
        const hasData = chartData.completedTasks.some(val => val > 0) || chartData.createdTasks.some(val => val > 0);
        
        if (!hasData) {
            console.log('No meaningful chart data, showing message');
            ctx.style.display = 'none';
            if (noActivityMessage) noActivityMessage.classList.remove('hidden');
            return;
        }

        // Show chart and hide message
        ctx.style.display = 'block';
        if (noActivityMessage) noActivityMessage.classList.add('hidden');
        
        activityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Teljesített feladatok',
                    data: chartData.completedTasks,
                    borderColor: '#f97316',
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#f97316',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }, {
                    label: 'Létrehozott feladatok',
                    data: chartData.createdTasks,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#8b5cf6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#ffffff',
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#f97316',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#ffffff'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#ffffff',
                            stepSize: 1
                        },
                        beginAtZero: true
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });

        // Update stats
        updateActivityStats(chartData.completedTasks);
    }

    /**
     * Grafikon adatok előkészítése
     */
    function prepareActivityChartData(activityData, days) {
        const labels = [];
        const completedTasks = [];
        const createdTasks = [];
        
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            labels.push(formatDate(date));
            
            const dayData = activityData[dateStr];
            if (dayData) {
                completedTasks.push(dayData.tasksCompleted || 0);
                createdTasks.push(dayData.tasksCreated || 0);
            } else {
                completedTasks.push(0);
                createdTasks.push(0);
            }
        }
        
        return { labels, completedTasks, createdTasks };
    }

    /**
     * Dátum formázása
     */
    function formatDate(date) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Ma';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Tegnap';
        } else {
            return date.toLocaleDateString('hu-HU', { 
                month: 'short', 
                day: 'numeric' 
            });
        }
    }

    /**
     * Aktivitás statisztikák frissítése
     */
    function updateActivityStats(data) {
        const avgElement = document.getElementById('avg-activity');
        const bestDayElement = document.getElementById('best-day');
        const totalElement = document.getElementById('total-activity');

        if (avgElement) {
            const avg = data.length > 0 ? Math.round(data.reduce((a, b) => a + b, 0) / data.length) : 0;
            avgElement.textContent = avg;
        }

        if (bestDayElement) {
            const best = data.length > 0 ? Math.max(...data) : 0;
            bestDayElement.textContent = best;
        }

        if (totalElement) {
            const total = data.reduce((a, b) => a + b, 0);
            totalElement.textContent = total;
        }
    }

    /**
     * Aktivitás grafikon frissítése
     */
    function updateActivityChart(activityData, days) {
        if (activityChart) {
            const chartData = prepareActivityChartData(activityData, days);
            
            activityChart.data.labels = chartData.labels;
            activityChart.data.datasets[0].data = chartData.completedTasks;
            activityChart.data.datasets[1].data = chartData.createdTasks;
            activityChart.update();
            
            updateActivityStats(chartData.completedTasks);
        }
    }

    /**
     * XP számítása szinthez
     */
    function getXPForLevel(level) {
        // Exponential XP curve: 100, 200, 400, 800, 1600, etc.
        return Math.floor(100 * Math.pow(2, level - 1));
    }

    /**
     * Badge-ek ellenőrzése és frissítése
     */
    function checkAndUpdateBadges(userData) {
        const currentBadges = {};
        
        Object.entries(BADGE_DEFINITIONS).forEach(([badgeId, badgeDef]) => {
            const isUnlocked = evaluateBadgeCondition(badgeDef.condition, userData);
            const progress = calculateBadgeProgress(badgeDef.condition, userData);
            
            currentBadges[badgeId] = {
                id: badgeId,
                name: badgeDef.name,
                description: badgeDef.description,
                icon: badgeDef.icon,
                category: badgeDef.category,
                rarity: badgeDef.rarity,
                unlocked: isUnlocked,
                progress: progress,
                dateUnlocked: isUnlocked ? new Date().toISOString() : null
            };
        });
        
        return currentBadges;
    }

    /**
     * Badge feltétel kiértékelése
     */
    function evaluateBadgeCondition(condition, userData) {
        try {
            // Replace variables with actual values
            let evalCondition = condition;
            evalCondition = evalCondition.replace(/questsCompleted/g, userData.questsCompleted || 0);
            evalCondition = evalCondition.replace(/listsCreated/g, userData.listsCreated || 0);
            evalCondition = evalCondition.replace(/currentStreak/g, userData.currentStreak || 0);
            evalCondition = evalCondition.replace(/tasksCompleted/g, userData.tasksCompleted || 0);
            evalCondition = evalCondition.replace(/notesCreated/g, userData.notesCreated || 0);
            evalCondition = evalCondition.replace(/level/g, userData.level || 1);
            evalCondition = evalCondition.replace(/totalActiveDays/g, userData.totalActiveDays || 0);
            
            return eval(evalCondition);
        } catch (error) {
            console.error('Error evaluating badge condition:', error);
            return false;
        }
    }

    /**
     * Badge progress számítása
     */
    function calculateBadgeProgress(condition, userData) {
        try {
            // Extract the target value from condition (e.g., ">= 10" -> 10)
            const match = condition.match(/([<>=]+)\s*(\d+)/);
            if (!match) return 0;
            
            const operator = match[1];
            const target = parseInt(match[2]);
            
            // Extract the variable name
            const variableMatch = condition.match(/(\w+)/);
            if (!variableMatch) return 0;
            
            const variable = variableMatch[1];
            const currentValue = userData[variable] || 0;
            
            // Calculate progress percentage
            if (target === 0) return 100;
            
            const progress = Math.min((currentValue / target) * 100, 100);
            return Math.round(progress);
        } catch (error) {
            console.error('Error calculating badge progress:', error);
            return 0;
        }
    }

  // Public API
  return {
        renderResultsTab,
        checkAndUpdateBadges,
        updateActivityChart,
        BADGE_DEFINITIONS
  };
})();