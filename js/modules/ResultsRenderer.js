// ResultsRenderer.js - Valós Firebase adatokkal működő eredmények renderer
// Modern UI, valós adatlogika, reszponzív design

window.ResultsRenderer = (function() {
    'use strict';

    let activityChart = null;
    let currentTimeRange = 7; // 7 vagy 30 nap

    /**
     * Fő renderelő függvény
     */
    function renderResultsTab(userStats, activityData, badges) {
        console.log('Rendering results tab with real data:', { userStats, activityData, badges });
        
        const resultsContent = document.getElementById('results-content');
        if (!resultsContent) {
            console.error('Results content container not found');
            return;
        }

        // Clear existing content
        resultsContent.innerHTML = '';

        // Ha nincs adat, motiváló üzenet megjelenítése
        if (!userStats || Object.keys(userStats).length === 0) {
            resultsContent.appendChild(renderEmptyState());
            return;
        }

        // Render all sections
        resultsContent.appendChild(renderLevelXPSection(userStats));
        resultsContent.appendChild(renderActivityChartSection(activityData));
        resultsContent.appendChild(renderBadgeCollectionSection(badges, userStats));
        resultsContent.appendChild(renderActivityStatsSection(activityData));

        // Initialize chart after DOM is ready
        setTimeout(() => {
            initializeActivityChart(activityData);
        }, 100);
    }

    /**
     * Üres állapot megjelenítése
     */
    function renderEmptyState() {
        const section = document.createElement('div');
        section.className = 'flex flex-col items-center justify-center py-16 px-6 text-center';
        
        section.innerHTML = `
            <div class="text-6xl mb-6">🌟</div>
            <h2 class="text-2xl font-bold text-donezy-orange mb-4">Kezdj el ma!</h2>
            <p class="text-secondary mb-8 max-w-md">
                Még nincs adatod. Kezdj el használni az alkalmazást, és nyomon követjük a haladásodat!
            </p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div class="bg-donezy-card p-4 rounded-lg border border-donezy-accent">
                    <div class="text-2xl mb-2">✅</div>
                    <div class="font-semibold">Feladatok</div>
                    <div class="text-secondary">Hozz létre és teljesíts feladatokat</div>
                </div>
                <div class="bg-donezy-card p-4 rounded-lg border border-donezy-accent">
                    <div class="text-2xl mb-2">📝</div>
                    <div class="font-semibold">Jegyzetek</div>
                    <div class="text-secondary">Írj jegyzeteket és gondolataidat</div>
                </div>
                <div class="bg-donezy-card p-4 rounded-lg border border-donezy-accent">
                    <div class="text-2xl mb-2">🎯</div>
                    <div class="font-semibold">Küldetések</div>
                    <div class="text-secondary">Teljesíts napi küldetéseket</div>
                </div>
            </div>
        `;
        
        return section;
    }

    /**
     * Szint és XP szekció renderelése
     */
    function renderLevelXPSection(userStats) {
        const section = document.createElement('div');
        section.className = 'bg-donezy-card rounded-xl p-6 shadow-lg border border-donezy-accent card-hover mb-8';
        
        const level = userStats?.level || 1;
        const xp = userStats?.xp || 0;
        const streak = userStats?.streak || 0;
        const totalActiveDays = userStats?.totalActiveDays || 0;
        
        // XP progress számítása az új rendszerrel
        const xpRequiredForNextLevel = window.ResultsService ? 
            window.ResultsService.getXPRequiredForLevel(level + 1) : 100;
        const xpInCurrentLevel = window.ResultsService ? 
            window.ResultsService.getXPProgressInCurrentLevel(xp) : 0;
        const progressPercent = Math.min((xpInCurrentLevel / xpRequiredForNextLevel) * 100, 100);

        // Szint rang meghatározása
        const getLevelRank = (level) => {
            if (level >= 20) return { name: 'Mester', icon: '👑', color: 'var(--purple-primary)', bg: 'var(--level-badge-bg-master)' };
            if (level >= 15) return { name: 'Veterán', icon: '⭐', color: 'var(--yellow-primary)', bg: 'var(--level-badge-bg-veteran)' };
            if (level >= 10) return { name: 'Tapasztalt', icon: '🌟', color: 'var(--blue-primary)', bg: 'var(--level-badge-bg-experienced)' };
            if (level >= 5) return { name: 'Kezdő', icon: '🌱', color: 'var(--green-primary)', bg: 'var(--level-badge-bg-beginner)' };
            return { name: 'Újonc', icon: '🌿', color: 'var(--gray-primary)', bg: 'var(--level-badge-bg-novice)' };
        };
        const levelRank = getLevelRank(level);

        section.innerHTML = `
            <div class="level-badge-wrapper mb-6">
                <div class="level-badge-circle" style="background: ${levelRank.bg}; color: ${levelRank.color};">
                    <span class="level-number">${level}</span>
                </div>
                <div class="level-label" style="color: ${levelRank.color};">${levelRank.name}</div>
                <div class="level-subtext">Szint ${level}</div>
            </div>

            <!-- XP Progress Bar -->
            <div class="w-full max-w-xl mx-auto mb-6">
                <div class="flex justify-between items-center mb-1 px-1">
                    <div class="text-sm font-medium text-secondary">XP Progress</div>
                    <div class="text-sm font-bold text-donezy-orange">${Math.round(progressPercent)}%</div>
                </div>
                <div style="width: 100%; height: 18px; background: #23232b; border-radius: 9px; position: relative; overflow: hidden;">
                    <div style="position: absolute; left: 0; top: 0; height: 100%; width: ${progressPercent}%; background: linear-gradient(90deg, #ff9100 0%, #fbbf24 100%); border-radius: 9px;"></div>
                    <div style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; pointer-events: none;">
                        <span style="color: #fff; font-weight: bold; font-size: 13px; text-shadow: 0 1px 4px #000;">${xpInCurrentLevel} / ${xpRequiredForNextLevel} XP</span>
                    </div>
                </div>
                <div class="text-center mt-1">
                    <div class="text-xs text-secondary">
                        Még <span class="font-bold text-donezy-orange">${xpRequiredForNextLevel - xpInCurrentLevel} XP</span> a következő szintig
                    </div>
                </div>
            </div>

            <!-- Teljes XP és statisztikák -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-center text-white">
                    <div class="text-2xl font-bold mb-1">${xp.toLocaleString()}</div>
                    <div class="text-sm opacity-90">Összes XP</div>
                </div>
                <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-center text-white">
                    <div class="text-2xl font-bold mb-1">${level + 1}</div>
                    <div class="text-sm opacity-90">Következő szint</div>
                </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div class="stat-card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700">
                    <div class="text-2xl mb-1">📊</div>
                    <div class="text-lg font-bold text-green-700 dark:text-green-300">${totalActiveDays}</div>
                    <div class="text-xs text-green-600 dark:text-green-400">Aktív nap</div>
                </div>
                <div class="stat-card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-700">
                    <div class="text-2xl mb-1">🔥</div>
                    <div class="text-lg font-bold text-red-700 dark:text-red-300">${streak}</div>
                    <div class="text-xs text-red-600 dark:text-red-400">Sorozat</div>
                </div>
                <div class="stat-card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700">
                    <div class="text-2xl mb-1">✅</div>
                    <div class="text-lg font-bold text-blue-700 dark:text-blue-300">${userStats?.tasksCompleted || 0}</div>
                    <div class="text-xs text-blue-600 dark:text-blue-400">Feladat</div>
                </div>
                <div class="stat-card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-700">
                    <div class="text-2xl mb-1">🎯</div>
                    <div class="text-lg font-bold text-purple-700 dark:text-purple-300">${userStats?.questsCompleted || 0}</div>
                    <div class="text-xs text-purple-600 dark:text-purple-400">Küldetés</div>
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
                    <span class="text-3xl">📈</span>
                    Napi Aktivitás
                </h2>
                <div class="flex gap-2">
                    <button id="chart-7-days" class="px-4 py-2 rounded-lg bg-donezy-orange text-white text-sm font-medium transition-colors">
                        7 nap
                    </button>
                    <button id="chart-30-days" class="px-4 py-2 rounded-lg bg-donezy-accent text-secondary text-sm font-medium transition-colors hover:bg-donezy-orange hover:text-white">
                        30 nap
                    </button>
                </div>
            </div>

            <div class="mb-6">
                <canvas id="activity-chart" width="400" height="200"></canvas>
            </div>

            <div id="activity-stats" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Stats will be populated by JavaScript -->
            </div>
        `;

        // Event listeners for chart buttons
        setTimeout(() => {
            const btn7Days = document.getElementById('chart-7-days');
            const btn30Days = document.getElementById('chart-30-days');
            
            if (btn7Days) {
                btn7Days.addEventListener('click', () => {
                    currentTimeRange = 7;
                    updateChartButtons();
                    updateActivityChart(activityData, 7);
                });
            }
            
            if (btn30Days) {
                btn30Days.addEventListener('click', () => {
                    currentTimeRange = 30;
                    updateChartButtons();
                    updateActivityChart(activityData, 30);
                });
            }
        }, 100);
        
        return section;
    }

    /**
     * XP Progress animáció hozzáadása
     */
    function addXPProgressAnimation() {
        // XP progress bar animáció
        const progressBars = document.querySelectorAll('.bg-gradient-to-r.from-donezy-orange');
        progressBars.forEach(bar => {
            if (bar.style.width && bar.style.width !== '0%') {
                // Animáljuk a progress bart
                const currentWidth = parseFloat(bar.style.width);
                bar.style.width = '0%';
                setTimeout(() => {
                    bar.style.width = currentWidth + '%';
                }, 100);
            }
        });

        // XP kör animáció
        const xpCircles = document.querySelectorAll('.xp-circle-progress');
        xpCircles.forEach(circle => {
            circle.style.animation = 'none';
            setTimeout(() => {
                circle.style.animation = 'xpCircleFill 1.5s ease-out';
            }, 50);
        });

        // Shimmer effekt hozzáadása
        const shimmerElements = document.querySelectorAll('.animate-shimmer');
        shimmerElements.forEach(element => {
            element.style.animation = 'none';
            setTimeout(() => {
                element.style.animation = 'shimmer 2s infinite';
            }, 50);
        });
    }

    /**
     * Szint emelkedés animáció
     */
    function animateLevelUp(oldLevel, newLevel) {
        const levelElement = document.querySelector('.text-6xl.font-black.text-white');
        if (levelElement) {
            // Szint szám animáció
            levelElement.style.animation = 'none';
            levelElement.style.transform = 'scale(1.2)';
            levelElement.style.color = '#fbbf24';
            
            setTimeout(() => {
                levelElement.textContent = newLevel;
                levelElement.style.transform = 'scale(1)';
                levelElement.style.color = '#ffffff';
            }, 300);

            // Konfetti effekt (egyszerű verzió)
            createLevelUpConfetti();
        }
    }

    /**
     * Egyszerű konfetti effekt szint emelkedéshez
     */
    function createLevelUpConfetti() {
        const colors = ['#ff6b35', '#fbbf24', '#10b981', '#3b82f6', '#8b5cf6'];
        const container = document.querySelector('.bg-donezy-card');
        
        if (container) {
            for (let i = 0; i < 20; i++) {
                const confetti = document.createElement('div');
                confetti.style.position = 'absolute';
                confetti.style.width = '8px';
                confetti.style.height = '8px';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.borderRadius = '50%';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.top = '50%';
                confetti.style.pointerEvents = 'none';
                confetti.style.zIndex = '1000';
                confetti.style.animation = `confettiFall ${2 + Math.random() * 2}s linear forwards`;
                
                container.appendChild(confetti);
                
                setTimeout(() => {
                    confetti.remove();
                }, 4000);
            }
        }
    }

    /**
     * Badge gyűjtemény szekció renderelése
     */
    function renderBadgeCollectionSection(badges, userStats) {
        const section = document.createElement('div');
        section.className = 'bg-donezy-card rounded-xl p-6 shadow-lg border border-donezy-accent card-hover mb-8';
        
        const badgeDefinitions = window.ResultsService?.getBadgeDefinitions() || {};
        
        section.innerHTML = `
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-donezy-orange flex items-center gap-3">
                    <span class="text-3xl">🏅</span>
                    Badge Gyűjtemény
                </h2>
                <div class="text-sm text-secondary">
                    ${Object.values(badges).filter(b => b.unlocked).length} / ${Object.keys(badgeDefinitions).length} megszerezve
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="badges-grid">
                ${Object.entries(badgeDefinitions).map(([badgeId, definition]) => {
                    const badge = badges[badgeId] || { unlocked: false, progress: 0 };
                    const isUnlocked = badge.unlocked;
                    const progress = badge.progress || 0;
                    
                    return `
                        <div class="badge-card ${isUnlocked ? 'unlocked' : 'locked'} p-4 rounded-lg border-2 transition-all duration-300 ${
                            isUnlocked 
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                                : 'border-donezy-accent bg-donezy-card'
                        }">
                            <div class="flex items-center gap-3 mb-3">
                                <div class="text-3xl ${isUnlocked ? '' : 'opacity-50'}">${definition.icon}</div>
                                <div class="flex-1">
                                    <div class="font-bold text-sm ${isUnlocked ? 'text-green-700 dark:text-green-300' : 'text-secondary'}">
                                        ${definition.name}
                                    </div>
                                    <div class="text-xs text-secondary">
                                        ${definition.description}
                                    </div>
                                </div>
                            </div>
                            
                            ${!isUnlocked ? `
                                <div class="mb-2">
                                    <div class="flex justify-between text-xs text-secondary mb-1">
                                        <span>Haladás</span>
                                        <span>${progress}%</span>
                                    </div>
                                    <div class="w-full bg-donezy-accent rounded-full h-2">
                                        <div class="bg-donezy-orange h-2 rounded-full transition-all duration-300" style="width: ${progress}%"></div>
                                    </div>
                                </div>
                            ` : `
                                <div class="text-xs text-green-600 dark:text-green-400 font-medium">
                                    ✅ Megszerezve
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
     * Aktivitás statisztikák szekció renderelése
     */
    function renderActivityStatsSection(activityData) {
        const section = document.createElement('div');
        section.className = 'bg-donezy-card rounded-xl p-6 shadow-lg border border-donezy-accent card-hover mb-8';
        
        // Számítsuk ki a statisztikákat
        const stats = calculateActivityStats(activityData);
        
        section.innerHTML = `
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-donezy-orange flex items-center gap-3">
                    <span class="text-3xl">📊</span>
                    Aktivitás Áttekintés
                </h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="text-center">
                    <div class="text-3xl font-bold text-donezy-orange mb-2">${stats.averageDailyTasks}</div>
                    <div class="text-sm text-secondary">Átlagos napi feladat</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold text-purple mb-2">${stats.bestDay}</div>
                    <div class="text-sm text-secondary">Legjobb nap</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold text-green-600 mb-2">${stats.totalTasksCompleted}</div>
                    <div class="text-sm text-secondary">Összes teljesített</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold text-blue-600 mb-2">${stats.totalNotesCreated}</div>
                    <div class="text-sm text-secondary">Összes jegyzet</div>
                </div>
            </div>
        `;
        
        return section;
    }

    /**
     * Aktivitás statisztikák számítása
     */
    function calculateActivityStats(activityData) {
        const days = Object.keys(activityData).length;
        if (days === 0) {
            return {
                averageDailyTasks: 0,
                bestDay: 0,
                totalTasksCompleted: 0,
                totalNotesCreated: 0
            };
        }

        let totalTasksCompleted = 0;
        let totalNotesCreated = 0;
        let bestDay = 0;

        Object.values(activityData).forEach(dayData => {
            totalTasksCompleted += dayData.tasksCompleted || 0;
            totalNotesCreated += dayData.notesCreated || 0;
            
            const dayTotal = (dayData.tasksCompleted || 0) + (dayData.notesCreated || 0);
            if (dayTotal > bestDay) {
                bestDay = dayTotal;
            }
        });

        return {
            averageDailyTasks: Math.round(totalTasksCompleted / days * 10) / 10,
            bestDay,
            totalTasksCompleted,
            totalNotesCreated
        };
    }

    /**
     * Aktivitás grafikon inicializálása
     */
    function initializeActivityChart(activityData) {
        if (typeof Chart === 'undefined') {
            loadChartJS().then(() => {
                createActivityChart(activityData, currentTimeRange);
            });
        } else {
            createActivityChart(activityData, currentTimeRange);
        }
    }

    /**
     * Chart.js betöltése
     */
    async function loadChartJS() {
        if (typeof Chart !== 'undefined') return;

        return new Promise((resolve, reject) => {
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
        if (!ctx) return;

        // Destroy existing chart
        if (activityChart) {
            activityChart.destroy();
        }

        const chartData = prepareActivityChartData(activityData, days);
        
        activityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: 'Létrehozott feladatok',
                        data: chartData.tasksCreated,
                        borderColor: '#f97316',
                        backgroundColor: 'rgba(249, 115, 22, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Teljesített feladatok',
                        data: chartData.tasksCompleted,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#6b7280',
                            usePointStyle: true
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(107, 114, 128, 0.1)'
                        },
                        ticks: {
                            color: '#6b7280'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(107, 114, 128, 0.1)'
                        },
                        ticks: {
                            color: '#6b7280',
                            stepSize: 1
                        }
                    }
                }
            }
        });

        // Update activity stats
        updateActivityStats(chartData);
    }

    /**
     * Grafikon adatok előkészítése
     */
    function prepareActivityChartData(activityData, days) {
        const labels = [];
        const tasksCreated = [];
        const tasksCompleted = [];
        
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            labels.push(formatDate(date));
            
            const dayData = activityData[dateStr] || {};
            tasksCreated.push(dayData.tasksCreated || 0);
            tasksCompleted.push(dayData.tasksCompleted || 0);
        }
        
        return {
            labels,
            tasksCreated,
            tasksCompleted
        };
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
    function updateActivityStats(chartData) {
        const statsContainer = document.getElementById('activity-stats');
        if (!statsContainer) return;

        const totalCreated = chartData.tasksCreated.reduce((sum, val) => sum + val, 0);
        const totalCompleted = chartData.tasksCompleted.reduce((sum, val) => sum + val, 0);
        const completionRate = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;

        statsContainer.innerHTML = `
            <div class="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div class="text-2xl font-bold text-donezy-orange">${totalCreated}</div>
                <div class="text-sm text-secondary">Létrehozott feladat</div>
            </div>
            <div class="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div class="text-2xl font-bold text-green-600">${totalCompleted}</div>
                <div class="text-sm text-secondary">Teljesített feladat</div>
            </div>
            <div class="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div class="text-2xl font-bold text-blue-600">${completionRate}%</div>
                <div class="text-sm text-secondary">Teljesítési arány</div>
            </div>
        `;
    }

    /**
     * Grafikon frissítése
     */
    function updateActivityChart(activityData, days) {
        if (activityChart) {
            const chartData = prepareActivityChartData(activityData, days);
            
            activityChart.data.labels = chartData.labels;
            activityChart.data.datasets[0].data = chartData.tasksCreated;
            activityChart.data.datasets[1].data = chartData.tasksCompleted;
            
            activityChart.update();
            updateActivityStats(chartData);
        }
    }

    /**
     * Chart gombok frissítése
     */
    function updateChartButtons() {
        const btn7Days = document.getElementById('chart-7-days');
        const btn30Days = document.getElementById('chart-30-days');
        
        if (btn7Days && btn30Days) {
            if (currentTimeRange === 7) {
                btn7Days.className = 'px-4 py-2 rounded-lg bg-donezy-orange text-white text-sm font-medium transition-colors';
                btn30Days.className = 'px-4 py-2 rounded-lg bg-donezy-accent text-secondary text-sm font-medium transition-colors hover:bg-donezy-orange hover:text-white';
            } else {
                btn7Days.className = 'px-4 py-2 rounded-lg bg-donezy-accent text-secondary text-sm font-medium transition-colors hover:bg-donezy-orange hover:text-white';
                btn30Days.className = 'px-4 py-2 rounded-lg bg-donezy-orange text-white text-sm font-medium transition-colors';
            }
        }
    }

    // Publikus API
    return {
        renderResultsTab,
        updateActivityChart,
        initializeActivityChart,
        addXPProgressAnimation,
        animateLevelUp,
        createLevelUpConfetti
    };
})();