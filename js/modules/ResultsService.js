// ResultsService.js - Valós Firebase-integrációval működő eredmények szolgáltatás
// XP rendszer, streak számláló, valós adatlogika

window.ResultsService = (function() {
    'use strict';

    let isInitialized = false;
    let currentUser = null;
    let userStats = null;
    let activityData = {};
    let badges = {};
    let realtimeListeners = [];

    // XP rendszer konfiguráció
    const XP_CONFIG = {
        TASK_CREATED: 5,
        TASK_COMPLETED: 10,
        NOTE_CREATED: 5,
        EVENT_CREATED: 5,
        QUEST_COMPLETED: 20,
        XP_PER_LEVEL: 6400
    };

    // Badge definíciók
    const BADGE_DEFINITIONS = {
        task_master: {
            id: 'task_master',
            name: 'Feladat-mester',
            description: 'Teljesíts 50 feladatot',
            icon: '✅',
            condition: 'tasksCompleted >= 50',
            category: 'tasks',
            rarity: 'common'
        },
        note_taker: {
            id: 'note_taker',
            name: 'Jegyzetelő',
            description: 'Hozz létre 20 jegyzetet',
            icon: '📝',
            condition: 'notesCreated >= 20',
            category: 'notes',
            rarity: 'common'
        },
        streak_7: {
            id: 'streak_7',
            name: 'Heti Hős',
            description: '7 napos sorozat',
            icon: '🔥',
            condition: 'streak >= 7',
            category: 'streak',
            rarity: 'rare'
        },
        streak_30: {
            id: 'streak_30',
            name: 'Havi Mester',
            description: '30 napos sorozat',
            icon: '⭐',
            condition: 'streak >= 30',
            category: 'streak',
            rarity: 'epic'
        },
        quest_master: {
            id: 'quest_master',
            name: 'Küldetésvadász',
            description: 'Teljesíts 10 küldetést',
            icon: '🎯',
            condition: 'questsCompleted >= 10',
            category: 'quests',
            rarity: 'rare'
        },
        level_5: {
            id: 'level_5',
            name: 'Tapasztalt',
            description: 'Érj el 5. szintet',
            icon: '🌟',
            condition: 'level >= 5',
            category: 'level',
            rarity: 'rare'
        },
        level_10: {
            id: 'level_10',
            name: 'Veterán',
            description: 'Érj el 10. szintet',
            icon: '👑',
            condition: 'level >= 10',
            category: 'level',
            rarity: 'epic'
        },
        daily_grinder: {
            id: 'daily_grinder',
            name: 'Napi Grinder',
            description: '100 aktív nap',
            icon: '💎',
            condition: 'totalActiveDays >= 100',
            category: 'activity',
            rarity: 'legendary'
        }
    };

    /**
     * Szolgáltatás inicializálása
     */
    async function init() {
        if (isInitialized) return true;

        try {
            console.log('Initializing ResultsService with real Firebase integration...');
            
            // Várjunk az app inicializálására
            await waitForAppInitialization();
            
            // Felhasználó azonosítása
            currentUser = getCurrentUser();
            if (!currentUser) {
                console.error('No authenticated user found');
                return false;
            }

            // Valós adatok betöltése
            await loadUserStats();
            await loadActivityData();
            await loadBadges();
            
            // Valós időben frissítések beállítása
            setupRealtimeUpdates();
            
            isInitialized = true;
            console.log('ResultsService initialized successfully with real data');
            return true;
        } catch (error) {
            console.error('Error initializing ResultsService:', error);
            return false;
        }
    }

    /**
     * App inicializálására várás
     */
    async function waitForAppInitialization() {
        let attempts = 0;
        while (!window.app && attempts < 40) {
            await new Promise(resolve => setTimeout(resolve, 250));
            attempts++;
        }
        
        if (!window.app) {
            throw new Error('App not initialized after 10 seconds');
        }

        // Várjunk a DataService teljes inicializálására
        attempts = 0;
        while ((!window.app.dataService || !window.app.dataService.isInitialized) && attempts < 40) {
            await new Promise(resolve => setTimeout(resolve, 250));
            attempts++;
        }

        if (!window.app.dataService || !window.app.dataService.isInitialized) {
            throw new Error('DataService not initialized after 10 seconds');
        }
    }

    /**
     * Jelenlegi felhasználó lekérése
     */
    function getCurrentUser() {
        if (window.app && window.app.dataService) {
            const userId = window.app.dataService.getCurrentUserId();
            if (userId) {
                console.log('Current user ID:', userId);
                return userId;
            }
        }
        
        // Fallback: próbáljuk meg a Firebase auth-ból
        if (window.firebase && window.firebase.auth) {
            const user = window.firebase.auth().currentUser;
            if (user) {
                console.log('Current user from Firebase auth:', user.uid);
                return user.uid;
            }
        }
        
        console.warn('No user ID available');
        return null;
    }

    /**
     * Felhasználó statisztikák betöltése Firebase-ből
     */
    async function loadUserStats() {
        try {
            const database = getDatabase();
            const userId = currentUser;
            
            if (!database || !userId) {
                console.warn('Database or user not available, using fallback stats');
                // Fallback: alapértelmezett értékek
                userStats = {
                    xp: 0,
                    level: 1,
                    streak: 0,
                    lastActivityDate: null,
                    totalActiveDays: 0,
                    tasksCompleted: 0,
                    notesCreated: 0,
                    questsCompleted: 0,
                    eventsCreated: 0,
                    lastUpdated: new Date().toISOString()
                };
                return userStats;
            }

            const userRef = database.ref(`users/${userId}/stats`);
            const snapshot = await userRef.once('value');
            
            if (snapshot.exists()) {
                userStats = snapshot.val();
                console.log('User stats loaded from Firebase:', userStats);
            } else {
                // Új felhasználó - alapértelmezett értékek
                    userStats = {
                    xp: 0,
                    level: 1,
                    streak: 0,
                    lastActivityDate: null,
                    totalActiveDays: 0,
                    tasksCompleted: 0,
                    notesCreated: 0,
                    questsCompleted: 0,
                    eventsCreated: 0,
                    lastUpdated: new Date().toISOString()
                };
                
                // Mentés Firebase-be
                await userRef.set(userStats);
                console.log('Created new user stats:', userStats);
            }
            
            return userStats;
        } catch (error) {
            console.error('Error loading user stats:', error);
            // Fallback: alapértelmezett értékek
            userStats = {
                xp: 0,
                level: 1,
                streak: 0,
                lastActivityDate: null,
                totalActiveDays: 0,
                tasksCompleted: 0,
                notesCreated: 0,
                questsCompleted: 0,
                eventsCreated: 0,
                lastUpdated: new Date().toISOString()
            };
            return userStats;
        }
    }

    /**
     * Napi aktivitás adatok betöltése
     */
    async function loadActivityData() {
        try {
            const database = getDatabase();
            const userId = currentUser;
            
            if (!database || !userId) {
                console.warn('Database or user not available, using empty activity data');
                activityData = {};
                return activityData;
            }

            const activityRef = database.ref(`users/${userId}/dailyActivity`);
                        const snapshot = await activityRef.once('value');
                        
                        if (snapshot.exists()) {
                activityData = snapshot.val();
                console.log('Activity data loaded from Firebase:', activityData);
            } else {
                            activityData = {};
                console.log('No activity data found, starting fresh');
            }
            
            return activityData;
        } catch (error) {
            console.error('Error loading activity data:', error);
            // Fallback: üres aktivitás adatok
            activityData = {};
            return activityData;
        }
    }

    /**
     * Badge-ek betöltése
     */
    async function loadBadges() {
        try {
            const database = getDatabase();
            const userId = currentUser;
            
            if (!database || !userId) {
                console.warn('Database or user not available, using default badges');
                // Fallback: alapértelmezett badge struktúra
                badges = {};
                Object.keys(BADGE_DEFINITIONS).forEach(badgeId => {
                    badges[badgeId] = {
                        unlocked: false,
                        progress: 0,
                        unlockedAt: null
                    };
                });
                    return badges;
            }

            const badgesRef = database.ref(`users/${userId}/badges`);
            const snapshot = await badgesRef.once('value');
            
            if (snapshot.exists()) {
                badges = snapshot.val();
                console.log('Badges loaded from Firebase:', badges);
            } else {
                // Új felhasználó - minden badge zárolt
                badges = {};
                Object.keys(BADGE_DEFINITIONS).forEach(badgeId => {
                        badges[badgeId] = {
                            unlocked: false,
                        progress: 0,
                        unlockedAt: null
                        };
                    });
                
                await badgesRef.set(badges);
                console.log('Created new badges structure:', badges);
            }
            
            return badges;
        } catch (error) {
            console.error('Error loading badges:', error);
            // Fallback: alapértelmezett badge struktúra
                badges = {};
            Object.keys(BADGE_DEFINITIONS).forEach(badgeId => {
                badges[badgeId] = {
                    unlocked: false,
                    progress: 0,
                    unlockedAt: null
                };
            });
            return badges;
        }
    }

    /**
     * Valós időben frissítések beállítása
     */
    function setupRealtimeUpdates() {
        const database = getDatabase();
        const userId = currentUser;
        
        if (!database || !userId) return;

        // Felhasználó statisztikák figyelése
        const statsRef = database.ref(`users/${userId}/stats`);
        const statsListener = statsRef.on('value', (snapshot) => {
                            if (snapshot.exists()) {
                userStats = snapshot.val();
                console.log('User stats updated in real-time:', userStats);
                                triggerResultsUpdate();
                            }
                        });
        realtimeListeners.push({ ref: statsRef, listener: statsListener });

        // Napi aktivitás figyelése
        const activityRef = database.ref(`users/${userId}/dailyActivity`);
        const activityListener = activityRef.on('value', (snapshot) => {
                            if (snapshot.exists()) {
                                activityData = snapshot.val();
                console.log('Activity data updated in real-time:', activityData);
                                triggerResultsUpdate();
                            }
                        });
        realtimeListeners.push({ ref: activityRef, listener: activityListener });

        // Badge-ek figyelése
        const badgesRef = database.ref(`users/${userId}/badges`);
        const badgesListener = badgesRef.on('value', (snapshot) => {
            if (snapshot.exists()) {
                badges = snapshot.val();
                console.log('Badges updated in real-time:', badges);
                triggerResultsUpdate();
            }
        });
        realtimeListeners.push({ ref: badgesRef, listener: badgesListener });
    }

    /**
     * Database referencia lekérése
     */
    function getDatabase() {
        if (window.app && window.app.dataService) {
            const currentService = window.app.dataService.getCurrentService();
            if (currentService && currentService.database) {
                console.log('Database reference obtained from DataService');
                return currentService.database;
            }
        }
        
        // Fallback: próbáljuk meg közvetlenül a Firebase-ból
        if (window.firebase && window.firebase.database) {
            console.log('Database reference obtained from Firebase directly');
            return window.firebase.database();
        }
        
        console.warn('No database reference available');
        return null;
    }

    /**
     * Tevékenység naplózása és XP hozzáadása
     */
    async function logActivity(action, data = {}) {
        try {
            const database = getDatabase();
            const userId = currentUser;
            
            if (!database || !userId) {
                console.warn('Cannot log activity: database or user not available, skipping...');
                return;
            }

            const today = new Date().toISOString().split('T')[0];
            const now = new Date().toISOString();
            
            // XP kiszámítása
            let xpGained = 0;
            switch (action) {
                case 'task_created':
                    xpGained = XP_CONFIG.TASK_CREATED;
                    break;
                case 'task_completed':
                    xpGained = XP_CONFIG.TASK_COMPLETED;
                    break;
                case 'note_created':
                    xpGained = XP_CONFIG.NOTE_CREATED;
                    break;
                case 'event_created':
                    xpGained = XP_CONFIG.EVENT_CREATED;
                    break;
                case 'quest_completed':
                    xpGained = XP_CONFIG.QUEST_COMPLETED;
                    break;
            }

            // Napi aktivitás frissítése
            const activityRef = database.ref(`users/${userId}/dailyActivity/${today}`);
            const activitySnapshot = await activityRef.once('value');
            const currentActivity = activitySnapshot.exists() ? activitySnapshot.val() : {
                    tasksCreated: 0,
                    tasksCompleted: 0,
                notesCreated: 0,
                eventsCreated: 0,
                    questsCompleted: 0,
                xpGained: 0,
                lastUpdated: now
            };

            // Tevékenység frissítése
                switch (action) {
                    case 'task_created':
                    currentActivity.tasksCreated++;
                        break;
                    case 'task_completed':
                    currentActivity.tasksCompleted++;
                        break;
                    case 'note_created':
                    currentActivity.notesCreated++;
                        break;
                case 'event_created':
                    currentActivity.eventsCreated++;
                        break;
                case 'quest_completed':
                    currentActivity.questsCompleted++;
                        break;
                }
                
            currentActivity.xpGained += xpGained;
            currentActivity.lastUpdated = now;
                
            // Napi aktivitás mentése
                await activityRef.set(currentActivity);
                
            // Felhasználó statisztikák frissítése
            await updateUserStats(action, xpGained, today);
                
            console.log(`Activity logged: ${action}, XP gained: ${xpGained}`);
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }

    /**
     * Felhasználó statisztikák frissítése
     */
    async function updateUserStats(action, xpGained, today) {
        try {
            const database = getDatabase();
            const userId = currentUser;
            
            if (!database || !userId) return;

            const statsRef = database.ref(`users/${userId}/stats`);
            const snapshot = await statsRef.once('value');
            const currentStats = snapshot.exists() ? snapshot.val() : userStats;

            // XP és szint frissítése
            let newXP = currentStats.xp + xpGained;
            let newLevel = currentStats.level;
            
            // Szintlépés ellenőrzése
            while (newXP >= XP_CONFIG.XP_PER_LEVEL) {
                newXP -= XP_CONFIG.XP_PER_LEVEL;
                newLevel++;
            }

            // Streak frissítése
            let newStreak = currentStats.streak;
            let newTotalActiveDays = currentStats.totalActiveDays;
            
            if (currentStats.lastActivityDate !== today) {
                // Új nap
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];
                
                if (currentStats.lastActivityDate === yesterdayStr) {
                    // Sorozat folytatása
                    newStreak++;
                } else {
                    // Sorozat megszakadása
                    newStreak = 1;
                }
                
                newTotalActiveDays++;
            }

            // Statisztikák frissítése
            const updatedStats = {
                ...currentStats,
                xp: newXP,
                level: newLevel,
                streak: newStreak,
                totalActiveDays: newTotalActiveDays,
                lastActivityDate: today,
                lastUpdated: new Date().toISOString()
            };

            // Tevékenység-specifikus statisztikák
            switch (action) {
                case 'task_completed':
                    updatedStats.tasksCompleted++;
                    break;
                case 'note_created':
                    updatedStats.notesCreated++;
                    break;
                case 'quest_completed':
                    updatedStats.questsCompleted++;
                    break;
                case 'event_created':
                    updatedStats.eventsCreated++;
                    break;
            }

            // Mentés Firebase-be
            await statsRef.set(updatedStats);
            userStats = updatedStats;

            // Badge-ek ellenőrzése
            await checkAndUpdateBadges(updatedStats);

            console.log('User stats updated:', updatedStats);
        } catch (error) {
            console.error('Error updating user stats:', error);
        }
    }

    /**
     * Badge-ek ellenőrzése és frissítése
     */
    async function checkAndUpdateBadges(userStats) {
        try {
            const database = getDatabase();
            const userId = currentUser;
            
            if (!database || !userId) return;

            const badgesRef = database.ref(`users/${userId}/badges`);
            let hasChanges = false;
            const updatedBadges = { ...badges };

            Object.entries(BADGE_DEFINITIONS).forEach(([badgeId, definition]) => {
                const currentBadge = updatedBadges[badgeId] || { unlocked: false, progress: 0 };
                
                if (!currentBadge.unlocked) {
                    const progress = calculateBadgeProgress(definition.condition, userStats);
                    const isUnlocked = evaluateBadgeCondition(definition.condition, userStats);
                    
                    if (isUnlocked && !currentBadge.unlocked) {
                        updatedBadges[badgeId] = {
                            unlocked: true,
                            progress: 100,
                            unlockedAt: new Date().toISOString()
                        };
                        hasChanges = true;
                        
                        // Badge megszerzési értesítés
                        showBadgeUnlockNotification(definition);
                    } else if (progress !== currentBadge.progress) {
                        updatedBadges[badgeId] = {
                            ...currentBadge,
                            progress: progress
                        };
                        hasChanges = true;
                    }
                }
            });

            if (hasChanges) {
                await badgesRef.set(updatedBadges);
                badges = updatedBadges;
                console.log('Badges updated:', updatedBadges);
            }
        } catch (error) {
            console.error('Error checking badges:', error);
        }
    }

    /**
     * Badge feltétel kiértékelése
     */
    function evaluateBadgeCondition(condition, userStats) {
        try {
            // Egyszerű feltétel kiértékelés
            const parts = condition.split(' ');
            const stat = parts[0];
            const operator = parts[1];
            const value = parseInt(parts[2]);
            
            const statValue = userStats[stat] || 0;
            
            switch (operator) {
                case '>=':
                    return statValue >= value;
                case '>':
                    return statValue > value;
                case '<=':
                    return statValue <= value;
                case '<':
                    return statValue < value;
                case '==':
                    return statValue === value;
                default:
                    return false;
            }
        } catch (error) {
            console.error('Error evaluating badge condition:', error);
            return false;
        }
    }

    /**
     * Badge haladás kiszámítása
     */
    function calculateBadgeProgress(condition, userStats) {
        try {
            const parts = condition.split(' ');
            const stat = parts[0];
            const operator = parts[1];
            const targetValue = parseInt(parts[2]);
            
            const statValue = userStats[stat] || 0;
            
            if (operator === '>=' || operator === '>') {
                return Math.min(Math.round((statValue / targetValue) * 100), 100);
            }
            
            return 0;
        } catch (error) {
            console.error('Error calculating badge progress:', error);
            return 0;
        }
    }

    /**
     * Badge megszerzési értesítés
     */
    function showBadgeUnlockNotification(badgeDefinition) {
        // NotificationService használata, ha elérhető
        if (window.NotificationService) {
            window.NotificationService.show({
                title: '🎉 Új Badge!',
                message: `${badgeDefinition.name} - ${badgeDefinition.description}`,
                type: 'success',
                duration: 5000
            });
        } else {
            // Egyszerű alert fallback
            alert(`🎉 Új Badge: ${badgeDefinition.name} - ${badgeDefinition.description}`);
        }
    }

    /**
     * Eredmények frissítésének kiváltása
     */
    function triggerResultsUpdate() {
        if (window.ResultsRenderer) {
            window.ResultsRenderer.renderResultsTab(userStats, activityData, badges);
        }
    }

    /**
     * Szolgáltatás tisztítása
     */
    function cleanup() {
        // Realtime listener-ek törlése
        realtimeListeners.forEach(({ ref, listener }) => {
            if (ref && listener) {
                ref.off('value', listener);
            }
        });
        realtimeListeners = [];
        
        isInitialized = false;
        console.log('ResultsService cleaned up');
    }

    // Publikus API
    return {
        init,
        cleanup,
        logActivity,
        getUserStats: () => userStats,
        getActivityData: () => activityData,
        getBadges: () => badges,
        getBadgeDefinitions: () => BADGE_DEFINITIONS,
        get isInitialized() { return isInitialized; },
        refresh: async () => {
            await loadUserStats();
            await loadActivityData();
            await loadBadges();
            triggerResultsUpdate();
        }
    };
})(); 