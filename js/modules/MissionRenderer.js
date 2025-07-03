// MissionRenderer.js - Küldetések megjelenítése, progress bar, XP jelzők

class MissionRenderer {
    constructor() {
        this.missionService = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            // Get mission service
            this.missionService = window.missionService || 
                                 (window.MissionService ? new MissionService() : null);
            
            if (!this.missionService) {
                console.error('MissionRenderer: MissionService not available');
                return false;
            }

            // Initialize mission service if not already done
            if (!this.missionService.isInitialized) {
                await this.missionService.init();
            }

            // Set up event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('MissionRenderer initialized successfully');
            return true;
        } catch (error) {
            console.error('MissionRenderer init error:', error);
            return false;
        }
    }

    setupEventListeners() {
        // Listen for mission updates
        window.addEventListener('missions-updated', (event) => {
            this.renderMissionsTab();
        });

        // Listen for tab changes
        window.addEventListener('tab-changed', (event) => {
            if (event.detail.tab === 'missions') {
                this.renderMissionsTab();
            }
        });
    }

    async renderMissionsTab() {
        try {
            const missionsContainer = document.getElementById('missions-content');
            if (!missionsContainer) {
                console.error('Missions container not found');
                return;
            }

            if (!this.missionService || !this.missionService.isInitialized) {
                missionsContainer.innerHTML = this.getLoadingHTML();
                return;
            }

            const missions = this.missionService.getMissions();
            const activeMissions = this.missionService.getActiveMissions();
            const completedMissions = this.missionService.getCompletedMissions();

            // Get user data for XP display
            let userData = {};
            if (window.app?.dataService) {
                userData = await window.app.dataService.getUserData();
            }

            const html = this.generateMissionsHTML(missions, activeMissions, completedMissions, userData);
            missionsContainer.innerHTML = html;

            // Add event listeners to mission cards
            this.addMissionCardListeners();

        } catch (error) {
            console.error('Error rendering missions tab:', error);
            const missionsContainer = document.getElementById('missions-content');
            if (missionsContainer) {
                missionsContainer.innerHTML = this.getErrorHTML(error);
            }
        }
    }

    generateMissionsHTML(missions, activeMissions, completedMissions, userData) {
        const xpInfo = window.LevelSystem?.getXPForNextLevel ? 
                      window.LevelSystem.getXPForNextLevel(userData.xp || 0) : 
                      { currentLevel: 1, currentLevelXP: 0, nextLevelXP: 100, xpToNext: 100, progress: 0 };

        return `
            <div class="missions-page">
                <!-- Header with XP and Level Info -->
                <div class="missions-header mb-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <h1 class="text-3xl font-bold text-donezy-orange mb-2">⚔️ Küldetések</h1>
                            <p class="text-secondary">Teljesíts küldetéseket és szerezz XP-t!</p>
                        </div>
                        <div class="text-right">
                            <div class="flex items-center space-x-4">
                                <div class="bg-gradient-to-r from-purple to-purple-hover px-4 py-2 rounded-lg border border-purple">
                                    <div class="text-sm text-primary">Essence</div>
                                    <div class="font-bold text-lg">
                                        <img src="imgs/Essence.svg" alt="Essence" class="inline w-5 h-5 align-middle"/> 
                                        ${userData.essence || 50}
                                    </div>
                                </div>
                                <div class="bg-gradient-to-r from-donezy-orange to-orange-hover px-4 py-2 rounded-lg">
                                    <div class="text-sm text-white">Szint ${xpInfo.currentLevel}</div>
                                    <div class="font-bold text-lg text-white">${userData.xp || 0} XP</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Level Progress Bar -->
                    <div class="mt-4">
                        <div class="flex justify-between text-sm text-secondary mb-1">
                            <span>Szint ${xpInfo.currentLevel}</span>
                            <span>${xpInfo.xpToNext} XP a következő szintig</span>
                        </div>
                        <div class="w-full bg-donezy-accent rounded-full h-3">
                            <div class="bg-gradient-to-r from-donezy-orange to-orange-hover h-3 rounded-full transition-all duration-500" 
                                 style="width: ${(xpInfo.progress * 100).toFixed(1)}%"></div>
                        </div>
                    </div>
                </div>

                <!-- Mission Stats -->
                <div class="mission-stats grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="bg-donezy-card p-4 rounded-lg border border-donezy-accent">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-2xl font-bold text-donezy-orange">${activeMissions.length}</div>
                                <div class="text-sm text-secondary">Aktív küldetés</div>
                            </div>
                            <div class="text-3xl">⚔️</div>
                        </div>
                    </div>
                    <div class="bg-donezy-card p-4 rounded-lg border border-donezy-accent">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-2xl font-bold text-green-400">${completedMissions.length}</div>
                                <div class="text-sm text-secondary">Teljesített</div>
                            </div>
                            <div class="text-3xl">✅</div>
                        </div>
                    </div>
                    <div class="bg-donezy-card p-4 rounded-lg border border-donezy-accent">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="text-2xl font-bold text-blue-400">${this.calculateTotalXPReward(activeMissions)}</div>
                                <div class="text-sm text-secondary">XP nyerhető</div>
                            </div>
                            <div class="text-3xl">⭐</div>
                        </div>
                    </div>
                </div>

                <!-- Active Missions -->
                <div class="missions-section mb-8">
                    <h2 class="text-xl font-bold text-white mb-4 flex items-center">
                        <span class="mr-2">⚔️</span>
                        Aktív Küldetések
                        <span class="ml-2 text-sm text-secondary">(${activeMissions.length})</span>
                    </h2>
                    
                    ${activeMissions.length > 0 ? 
                        `<div class="missions-grid">
                            ${activeMissions.map(mission => this.renderMissionCard(mission)).join('')}
                        </div>` :
                        `<div class="text-center py-8 text-secondary">
                            <div class="text-4xl mb-2">🎯</div>
                            <p>Nincs aktív küldetés</p>
                            <p class="text-sm">A küldetések naponta frissülnek</p>
                        </div>`
                    }
                </div>

                <!-- Completed Missions -->
                ${completedMissions.length > 0 ? `
                    <div class="missions-section">
                        <h2 class="text-xl font-bold text-white mb-4 flex items-center">
                            <span class="mr-2">✅</span>
                            Teljesített Küldetések
                            <span class="ml-2 text-sm text-secondary">(${completedMissions.length})</span>
                        </h2>
                        
                        <div class="missions-grid">
                            ${completedMissions.map(mission => this.renderMissionCard(mission)).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Mission Tips -->
                <div class="mission-tips mt-8 bg-donezy-card p-4 rounded-lg border border-donezy-accent">
                    <h3 class="text-lg font-bold text-donezy-orange mb-2">💡 Tippek</h3>
                    <ul class="text-sm text-secondary space-y-1">
                        <li>• A küldetések naponta frissülnek</li>
                        <li>• Teljesítsd a napi küldetéseket a maximális XP-ért</li>
                        <li>• A heti küldetések több XP-t adnak</li>
                        <li>• Minden teljesített küldetés Essence-t is ad</li>
                    </ul>
                </div>
            </div>
        `;
    }

    renderMissionCard(mission) {
        const progressPercentage = Math.min(100, (mission.progress / mission.goal) * 100);
        const isCompleted = mission.status === 'completed';
        const isActive = mission.status === 'active';
        const isFailed = mission.status === 'expired' || mission.status === 'failed';
        const statusIcon = isCompleted ? '✅' : isActive ? '⚔️' : '❌';
        const statusText = isCompleted ? 'Kész' : isActive ? 'Aktív' : 'Lejárt';
        const statusClass = isCompleted ? 'completed' : isFailed ? 'failed' : '';
        const typeBadge = mission.type === 'daily' ? 'badge-daily' : mission.type === 'weekly' ? 'badge-weekly' : 'badge-challenge';
        const typeName = this.getTypeName(mission.type);
        const categoryIcon = this.getCategoryIcon(mission.category);
        const categoryName = this.getCategoryName(mission.category);
        // Tooltip for XP
        const xpTooltip = `<span class='tooltip'><span class='mission-reward'><img src="imgs/Essence.svg" alt="Essence" class="essence" style="width:1.1em;vertical-align:middle;"/>+${mission.xp} XP</span><span class='tooltip-content'>XP-t kapsz a küldetés teljesítéséért</span></span>`;
        // Confetti animation for completed
        const confetti = isCompleted ? `<div class="confetti"></div>` : '';
        return `
            <div class="mission-card ${statusClass}" data-mission-id="${mission.id}">
                ${confetti}
                <div class="flex items-start justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <span class="badge ${typeBadge}" title="${typeName}">${typeName}</span>
                        <span class="text-xl" title="${categoryName}">${categoryIcon}</span>
                    </div>
                    <div class="mission-reward">${xpTooltip}</div>
                </div>
                <div class="mission-title">${mission.title}</div>
                <div class="mission-desc">${mission.description}</div>
                <div class="mission-progress">
                    <div class="flex justify-between text-xs mb-1">
                        <span>Haladás</span>
                        <span class="font-bold ${isCompleted ? 'text-green-400' : 'text-donezy-orange'}">${mission.progress}/${mission.goal}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-bar-inner" style="width: ${progressPercentage}%"></div>
                    </div>
                </div>
                <div class="flex items-center justify-between mt-2 text-xs text-secondary">
                    <span>Frissítve: ${this.formatTime(mission.updatedAt)}</span>
                    <span class="mission-status ${isCompleted ? 'completed' : ''}"><span class="mission-status-icon">${statusIcon}</span>${statusText}</span>
                </div>
            </div>
        `;
    }

    getTypeIcon(type) {
        const icons = {
            'daily': '📅',
            'weekly': '📊',
            'challenge': '🏆'
        };
        return icons[type] || '📋';
    }

    getTypeName(type) {
        const names = {
            'daily': 'Napi',
            'weekly': 'Heti',
            'challenge': 'Kihívás'
        };
        return names[type] || 'Küldetés';
    }

    getCategoryIcon(category) {
        const icons = {
            'tasks': '📋',
            'lists': '📝',
            'notes': '📄',
            'calendar': '📅',
            'streak': '🔥',
            'system': '⚙️'
        };
        return icons[category] || '🎯';
    }

    getCategoryName(category) {
        const names = {
            'tasks': 'Feladatok',
            'lists': 'Listák',
            'notes': 'Jegyzetek',
            'calendar': 'Naptár',
            'streak': 'Sorozat',
            'system': 'Rendszer'
        };
        return names[category] || 'Általános';
    }

    calculateTotalXPReward(missions) {
        return missions.reduce((total, mission) => total + mission.xp, 0);
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Most';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}p`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}ó`;
        return date.toLocaleDateString('hu-HU');
    }

    addMissionCardListeners() {
        const missionCards = document.querySelectorAll('.mission-card');
        missionCards.forEach(card => {
            card.addEventListener('click', () => {
                const missionId = card.dataset.missionId;
                this.showMissionDetails(missionId);
            });
        });
    }

    showMissionDetails(missionId) {
        const mission = this.missionService.missions.get(missionId);
        if (!mission) return;

        const modalContent = `
            <div class="mission-details-modal">
                <div class="text-center mb-4">
                    <div class="text-4xl mb-2">${this.getCategoryIcon(mission.category)}</div>
                    <h2 class="text-xl font-bold text-white">${mission.title}</h2>
                    <p class="text-secondary">${mission.description}</p>
                </div>
                
                <div class="space-y-4">
                    <div class="flex justify-between items-center p-3 bg-donezy-accent rounded-lg">
                        <span class="text-secondary">Típus:</span>
                        <span class="font-bold">${this.getTypeName(mission.type)}</span>
                    </div>
                    
                    <div class="flex justify-between items-center p-3 bg-donezy-accent rounded-lg">
                        <span class="text-secondary">Haladás:</span>
                        <span class="font-bold">${mission.progress}/${mission.goal}</span>
                    </div>
                    
                    <div class="flex justify-between items-center p-3 bg-donezy-accent rounded-lg">
                        <span class="text-secondary">XP Jutalom:</span>
                        <span class="font-bold text-donezy-orange">+${mission.xp} XP</span>
                    </div>
                    
                    <div class="flex justify-between items-center p-3 bg-donezy-accent rounded-lg">
                        <span class="text-secondary">Státusz:</span>
                        <span class="font-bold ${mission.status === 'completed' ? 'text-green-400' : 'text-donezy-orange'}">
                            ${mission.status === 'completed' ? 'Teljesítve' : 'Aktív'}
                        </span>
                    </div>
                </div>
            </div>
        `;

        if (window.modalService && window.modalService.showModal) {
            window.modalService.showModal('Küldetés Részletei', modalContent);
        } else {
            alert(`Küldetés: ${mission.title}\n${mission.description}\nHaladás: ${mission.progress}/${mission.goal}`);
        }
    }

    getLoadingHTML() {
        return `
            <div class="flex flex-col items-center justify-center min-h-[400px]">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-donezy-orange mb-4"></div>
                <p class="text-secondary">Küldetések betöltése...</p>
            </div>
        `;
    }

    getErrorHTML(error) {
        return `
            <div class="flex flex-col items-center justify-center min-h-[400px] text-red-400">
                <div class="text-4xl mb-4">❌</div>
                <h2 class="text-xl font-bold mb-2">Hiba történt</h2>
                <p class="text-center max-w-md text-secondary">
                    Nem sikerült betölteni a küldetéseket.<br>
                    Kérjük, próbáld újra később.
                </p>
                <button onclick="location.reload()" class="mt-4 bg-donezy-orange hover:bg-orange-hover text-white px-4 py-2 rounded-lg transition">
                    Újrapróbálkozás
                </button>
            </div>
        `;
    }
}

// Make available globally
window.MissionRenderer = MissionRenderer; 