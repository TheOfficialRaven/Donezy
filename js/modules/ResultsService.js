// ResultsService.js - Eredmények adatok kezelése és Firebase szinkronizálás
// Dinamikus adatfrissítés és AI-kész adatstruktúra

window.ResultsService = (function() {
    'use strict';

    let isInitialized = false;
    let activityData = {};
    let userStats = {};
    let badges = {};

    /**
     * Szolgáltatás inicializálása
     */
    async function init() {
        if (isInitialized) return true;

        try {
            console.log('Initializing ResultsService...');
            
            // Load user data and activity
            await loadUserStats();
            await loadActivityData();
            await loadBadges();
            
            // Set up real-time updates
            setupRealtimeUpdates();
            
            isInitialized = true;
            console.log('ResultsService initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing ResultsService:', error);
            return false;
        }
    }

    /**
     * Felhasználó statisztikák betöltése
     */
    async function loadUserStats() {
        try {
            // Wait for app to be initialized
            let attempts = 0;
            while (!window.app && attempts < 10) {
                console.log('Waiting for app to be initialized...');
                await new Promise(resolve => setTimeout(resolve, 500));
                attempts++;
            }

            if (window.app && window.app.dataService) {
                const userData = await window.app.dataService.getUserData();
                if (userData) {
                    userStats = {
                        level: userData.level || 1,
                        xp: userData.xp || 0,
                        currentStreak: userData.currentStreak || 0,
                        totalActiveDays: userData.totalActiveDays || 0,
                        questsCompleted: userData.questsCompleted || 0,
                        totalQuests: userData.totalQuests || 0,
                        tasksCompleted: userData.tasksCompleted || 0,
                        notesCreated: userData.notesCreated || 0,
                        listsCreated: userData.listsCreated || 0,
                        lastActive: userData.lastActive || new Date().toISOString()
                    };
                    
                    // Calculate XP for next level
                    userStats.xpToNextLevel = calculateXPToNextLevel(userStats.level, userStats.xp);
                    
                    console.log('User stats loaded from service:', userStats);
                    return userStats;
                }
            }
            
            // Fallback to demo stats for testing
            userStats = generateDemoUserStats();
            console.log('Generated demo user stats for testing:', userStats);
            return userStats;
        } catch (error) {
            console.error('Error loading user stats:', error);
            userStats = generateDemoUserStats();
            return userStats;
        }
    }

    /**
     * Demo felhasználói statisztikák generálása teszteléshez
     */
    function generateDemoUserStats() {
        const level = 5;
        const xp = 1250;
        const xpToNext = calculateXPToNextLevel(level, xp);
        
        return {
            level: level,
            xp: xp,
            xpToNextLevel: xpToNext,
            currentStreak: 7,
            totalActiveDays: 23,
            questsCompleted: 8,
            totalQuests: 12,
            tasksCompleted: 45,
            notesCreated: 12,
            listsCreated: 6,
            lastActive: new Date().toISOString()
        };
    }

    /**
     * Aktivitás adatok betöltése
     */
    async function loadActivityData() {
        try {
            // Wait for app to be initialized
            let attempts = 0;
            while (!window.app && attempts < 10) {
                console.log('Waiting for app to be initialized for activity data...');
                await new Promise(resolve => setTimeout(resolve, 500));
                attempts++;
            }

            if (window.app && window.app.dataService && window.app.dataService.isFirebaseAvailable()) {
                const currentService = window.app.dataService.getCurrentService();
                if (currentService && currentService.database) {
                    const userId = window.app.dataService.getCurrentUserId();
                    if (userId) {
                        // Get activity log for the last 30 days
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        const startDate = thirtyDaysAgo.toISOString().split('T')[0];
                        const today = new Date().toISOString().split('T')[0];
                        
                        const activityRef = currentService.database.ref(`users/${userId}/activity_log`);
                        const snapshot = await activityRef.once('value');
                        
                        if (snapshot.exists()) {
                            const allActivity = snapshot.val();
                            activityData = {};
                            
                            // Filter for last 30 days
                            Object.entries(allActivity).forEach(([date, dayData]) => {
                                if (date >= startDate && date <= today) {
                                    activityData[date] = dayData;
                                }
                            });
                            
                            console.log('Activity data loaded from Firebase:', activityData);
                            return activityData;
                        }
                    }
                }
            }
            
            // If no Firebase data, generate some demo data for testing
            activityData = generateDemoActivityData();
            console.log('Generated demo activity data for testing:', activityData);
            return activityData;
        } catch (error) {
            console.error('Error loading activity data:', error);
            activityData = generateDemoActivityData();
            return activityData;
        }
    }

    /**
     * Demo aktivitás adatok generálása teszteléshez
     */
    function generateDemoActivityData() {
        const data = {};
        const today = new Date();
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            // Generate realistic activity data
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const baseActivity = isWeekend ? 2 : 5;
            const randomFactor = Math.random() * 0.8 + 0.2; // 0.2 to 1.0
            
            data[dateStr] = {
                tasksCreated: Math.floor(baseActivity * randomFactor),
                tasksCompleted: Math.floor((baseActivity * randomFactor) * 0.8), // Usually complete 80% of created tasks
                questsCompleted: Math.floor((baseActivity * randomFactor) / 3),
                notesCreated: Math.floor((baseActivity * randomFactor) / 2),
                listsCreated: Math.floor((baseActivity * randomFactor) / 4),
                minutesActive: Math.floor(baseActivity * randomFactor * 20),
                lastUpdated: date.toISOString()
            };
        }
        
        return data;
    }

    /**
     * Badge-ek betöltése
     */
    async function loadBadges() {
        try {
            // Wait for app to be initialized
            let attempts = 0;
            while (!window.app && attempts < 10) {
                console.log('Waiting for app to be initialized for badges...');
                await new Promise(resolve => setTimeout(resolve, 500));
                attempts++;
            }

            if (window.app && window.app.dataService && window.app.dataService.isFirebaseAvailable()) {
                // Get badges from Firebase
                const firebaseBadges = await window.app.dataService.getBadges();
                
                if (firebaseBadges && Object.keys(firebaseBadges).length > 0) {
                    badges = firebaseBadges;
                    console.log('Badges loaded from Firebase:', badges);
                    return badges;
                }
            }
            
            // If no Firebase badges, check and generate based on current user stats
            if (window.ResultsRenderer && window.ResultsRenderer.checkAndUpdateBadges) {
                badges = window.ResultsRenderer.checkAndUpdateBadges(userStats);
                console.log('Generated badges from user stats:', badges);
                return badges;
            } else {
                console.warn('ResultsRenderer not available for badge generation');
                // Generate basic badges structure
                badges = {};
                if (window.ResultsRenderer && window.ResultsRenderer.BADGE_DEFINITIONS) {
                    Object.keys(window.ResultsRenderer.BADGE_DEFINITIONS).forEach(badgeId => {
                        badges[badgeId] = {
                            id: badgeId,
                            unlocked: false,
                            progress: 0
                        };
                    });
                }
                return badges;
            }
        } catch (error) {
            console.error('Error loading badges:', error);
            if (window.ResultsRenderer && window.ResultsRenderer.checkAndUpdateBadges) {
                badges = window.ResultsRenderer.checkAndUpdateBadges(userStats);
            } else {
                badges = {};
            }
            return badges;
        }
    }

    /**
     * Valós idejű frissítések beállítása
     */
    function setupRealtimeUpdates() {
        try {
            if (window.app && window.app.dataService && window.app.dataService.isFirebaseAvailable()) {
                const currentService = window.app.dataService.getCurrentService();
                if (currentService && currentService.database) {
                    const userId = window.app.dataService.getCurrentUserId();
                    if (userId) {
                        // Listen for user data changes
                        const userRef = currentService.database.ref(`users/${userId}`);
                        userRef.on('value', async (snapshot) => {
                            if (snapshot.exists()) {
                                const userData = snapshot.val();
                                await updateUserStats(userData);
                                await updateBadges();
                                triggerResultsUpdate();
                            }
                        });

                        // Listen for activity changes
                        const activityRef = currentService.database.ref(`users/${userId}/activity_log`);
                        activityRef.on('value', async (snapshot) => {
                            if (snapshot.exists()) {
                                activityData = snapshot.val();
                                triggerResultsUpdate();
                            }
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error setting up realtime updates:', error);
        }
    }

    /**
     * Felhasználó statisztikák frissítése
     */
    async function updateUserStats(userData) {
        userStats = {
            level: userData.level || 1,
            xp: userData.xp || 0,
            currentStreak: userData.currentStreak || 0,
            totalActiveDays: userData.totalActiveDays || 0,
            questsCompleted: userData.questsCompleted || 0,
            totalQuests: userData.totalQuests || 0,
            tasksCompleted: userData.tasksCompleted || 0,
            notesCreated: userData.notesCreated || 0,
            listsCreated: userData.listsCreated || 0,
            lastActive: userData.lastActive || new Date().toISOString()
        };
        
        userStats.xpToNextLevel = calculateXPToNextLevel(userStats.level, userStats.xp);
    }

    /**
     * Badge-ek frissítése
     */
    async function updateBadges() {
        const newBadges = window.ResultsRenderer.checkAndUpdateBadges(userStats);
        
        // Check for newly unlocked badges
        Object.entries(newBadges).forEach(([badgeId, badge]) => {
            const oldBadge = badges[badgeId];
            if (badge.unlocked && (!oldBadge || !oldBadge.unlocked)) {
                // New badge unlocked!
                showBadgeUnlockNotification(badgeId);
            }
        });
        
        badges = newBadges;
        
        // Save badges to Firebase
        await saveBadges();
    }

    /**
     * Badge-ek mentése Firebase-be
     */
    async function saveBadges() {
        try {
            if (window.app && window.app.dataService && window.app.dataService.isFirebaseAvailable()) {
                // Save each badge individually
                for (const [badgeId, badgeData] of Object.entries(badges)) {
                    await window.app.dataService.saveBadge(badgeId, badgeData);
                }
                console.log('Badges saved to Firebase');
            }
        } catch (error) {
            console.error('Error saving badges:', error);
        }
    }

    /**
     * Aktivitás naplózása
     */
    async function logActivity(action, data = {}) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const userId = window.app.dataService.getCurrentUserId();
            
            if (userId && window.app.dataService.isFirebaseAvailable()) {
                const currentService = window.app.dataService.getCurrentService();
                if (currentService && currentService.database) {
                    const activityRef = currentService.database.ref(`users/${userId}/activity_log/${today}`);
                
                // Get current day's activity
                const snapshot = await activityRef.once('value');
                const currentActivity = snapshot.exists() ? snapshot.val() : {
                    tasksCreated: 0,
                    tasksCompleted: 0,
                    questsCompleted: 0,
                    notesCreated: 0,
                    listsCreated: 0,
                    minutesActive: 0,
                    lastUpdated: new Date().toISOString()
                };
                
                // Update activity based on action
                switch (action) {
                    case 'task_created':
                        currentActivity.tasksCreated = (currentActivity.tasksCreated || 0) + 1;
                        break;
                    case 'task_completed':
                        currentActivity.tasksCompleted = (currentActivity.tasksCompleted || 0) + 1;
                        // Also log to completed tasks
                        await window.app.dataService.logCompletedTask(data);
                        break;
                    case 'quest_completed':
                        currentActivity.questsCompleted = (currentActivity.questsCompleted || 0) + 1;
                        break;
                    case 'note_created':
                        currentActivity.notesCreated = (currentActivity.notesCreated || 0) + 1;
                        break;
                    case 'list_created':
                        currentActivity.listsCreated = (currentActivity.listsCreated || 0) + 1;
                        break;
                    case 'session_start':
                        currentActivity.minutesActive = (currentActivity.minutesActive || 0) + (data.minutes || 1);
                        break;
                }
                
                currentActivity.lastUpdated = new Date().toISOString();
                
                // Save updated activity
                await activityRef.set(currentActivity);
                
                // Update local activity data
                activityData[today] = currentActivity;
                
                console.log('Activity logged:', action, data);
                }
            }
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }

    /**
     * XP számítása következő szinthez
     */
    function calculateXPToNextLevel(currentLevel, currentXP) {
        const currentLevelXP = getXPForLevel(currentLevel);
        const nextLevelXP = getXPForLevel(currentLevel + 1);
        const xpInCurrentLevel = Math.max(0, currentXP - currentLevelXP);
        const xpNeededForNext = nextLevelXP - currentLevelXP;
        return Math.max(0, xpNeededForNext - xpInCurrentLevel);
    }

    /**
     * XP számítása szinthez
     */
    function getXPForLevel(level) {
        // Exponential XP curve: 100, 200, 400, 800, 1600, etc.
        return Math.floor(100 * Math.pow(2, level - 1));
    }

    /**
     * Badge feloldás értesítés megjelenítése
     */
    function showBadgeUnlockNotification(badgeId) {
        try {
            const badgeDef = window.ResultsRenderer?.BADGE_DEFINITIONS?.[badgeId];
            if (badgeDef) {
                const notification = `
                    <div class="fixed top-4 right-4 bg-gradient-to-r from-donezy-orange to-orange-hover text-white p-4 rounded-lg shadow-lg z-50 transform transition-all duration-300 animate-slide-in">
                        <div class="flex items-center gap-3">
                            <div class="text-2xl">${badgeDef.icon}</div>
                            <div>
                                <div class="font-bold">${badgeDef.name} feloldva!</div>
                                <div class="text-sm opacity-90">${badgeDef.description}</div>
                            </div>
                        </div>
                    </div>
                `;
                
                document.body.insertAdjacentHTML('beforeend', notification);
                
                // Remove notification after 5 seconds
                setTimeout(() => {
                    const notificationEl = document.querySelector('.animate-slide-in');
                    if (notificationEl) {
                        notificationEl.remove();
                    }
                }, 5000);
            }
        } catch (error) {
            console.error('Error showing badge notification:', error);
        }
    }

    /**
     * Eredmények frissítésének kiváltása
     */
    function triggerResultsUpdate() {
        if (window.ResultsRenderer && window.ResultsRenderer.renderResultsTab) {
            window.ResultsRenderer.renderResultsTab(userStats, activityData, badges);
        }
    }

    /**
     * Adatok lekérése
     */
    function getUserStats() {
        return userStats;
    }

    function getActivityData() {
        return activityData;
    }

    function getBadges() {
        return badges;
    }

    /**
     * Szolgáltatás újraindítása
     */
    async function refresh() {
        isInitialized = false;
        return await init();
    }

    // Public API
    return {
        init,
        refresh,
        getUserStats,
        getActivityData,
        getBadges,
        logActivity,
        triggerResultsUpdate
    };
})(); 