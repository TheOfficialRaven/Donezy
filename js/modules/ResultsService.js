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

    // XP rendszer konfiguráció - fokozatosan növekvő XP szükséglet
    const XP_CONFIG = {
        TASK_CREATED: 5,
        TASK_COMPLETED: 10,
        NOTE_CREATED: 5,
        EVENT_CREATED: 5,
        QUEST_COMPLETED: 20,
        // Fokozatosan növekvő XP szükséglet (MMORPG stílus)
        BASE_XP: 100,  // 1. szinthez szükséges XP
        XP_MULTIPLIER: 1.5  // Minden szinthez 1.5x több XP
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

        // Várjunk az autentikált felhasználóra
        attempts = 0;
        while (!getCurrentUser() && attempts < 40) {
            await new Promise(resolve => setTimeout(resolve, 250));
            attempts++;
        }

        if (!getCurrentUser()) {
            throw new Error('No authenticated user available after 10 seconds');
        }
    }

    /**
     * Jelenlegi felhasználó lekérése
     */
    function getCurrentUser() {
        // First priority: Firebase Auth current user
        if (window.firebase && window.firebase.auth) {
            const user = window.firebase.auth().currentUser;
            if (user && user.uid) {
                console.log('Current user from Firebase auth:', user.uid);
                return user.uid;
            }
        }
        
        // Second priority: window.currentUserId (set by auth.js)
        if (window.currentUserId) {
            console.log('Current user from window.currentUserId:', window.currentUserId);
            return window.currentUserId;
        }
        
        // Third priority: DataService
        if (window.app && window.app.dataService) {
            const userId = window.app.dataService.getCurrentUserId();
            if (userId && !userId.startsWith('user_')) {
                console.log('Current user ID from DataService:', userId);
                return userId;
            }
        }
        
        console.warn('No authenticated user ID available');
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
                userStats = getDefaultUserStats();
                return userStats;
            }

            // LocalStorage eset kezelése
            if (database === 'localStorage') {
                console.log('Loading user stats from LocalStorage...');
                const userData = await window.app.dataService.getUserData();
                if (userData) {
                    // Konvertáljuk a DataService adatokat ResultsService formátumra
                    userStats = {
                        xp: userData.xp || 0,
                        level: userData.level || 1,
                        streak: userData.currentStreak || 0,
                        lastActivityDate: userData.lastActiveDate || null,
                        totalActiveDays: userData.totalActiveDays || 0,
                        tasksCompleted: userData.tasksCompleted || 0,
                        notesCreated: userData.notesCreated || 0,
                        questsCompleted: userData.questsCompleted || 0,
                        eventsCreated: userData.eventsCreated || 0,
                        lastUpdated: userData.lastActive || new Date().toISOString()
                    };
                    console.log('User stats loaded from LocalStorage:', userStats);
                } else {
                    userStats = getDefaultUserStats();
                }
                return userStats;
            }

            // Firebase eset
            const userRef = database.ref(`users/${userId}/stats`);
            const snapshot = await userRef.once('value');
            
            if (snapshot.exists()) {
                userStats = snapshot.val();
                console.log('User stats loaded from Firebase:', userStats);
            } else {
                // Új felhasználó - alapértelmezett értékek
                userStats = getDefaultUserStats();
                
                // Mentés Firebase-be
                await userRef.set(userStats);
                console.log('Created new user stats:', userStats);
            }
            
            return userStats;
        } catch (error) {
            console.error('Error loading user stats:', error);
            userStats = getDefaultUserStats();
            return userStats;
        }
    }

    function getDefaultUserStats() {
        return {
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

            // LocalStorage eset kezelése
            if (database === 'localStorage') {
                console.log('Loading activity data from LocalStorage...');
                // LocalStorage esetén egyszerű aktivitás adatok generálása
                const today = new Date().toISOString().split('T')[0];
                activityData = {
                    [today]: {
                        tasksCreated: 0,
                        tasksCompleted: 0,
                        notesCreated: 0,
                        eventsCreated: 0,
                        questsCompleted: 0,
                        xpGained: 0,
                        lastUpdated: new Date().toISOString()
                    }
                };
                console.log('Activity data generated for LocalStorage:', activityData);
                return activityData;
            }

            // Firebase eset
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
                badges = getDefaultBadges();
                return badges;
            }

            // LocalStorage eset kezelése
            if (database === 'localStorage') {
                console.log('Loading badges from LocalStorage...');
                // LocalStorage esetén alapértelmezett badge struktúra
                badges = getDefaultBadges();
                console.log('Badges loaded for LocalStorage:', badges);
                return badges;
            }

            // Firebase eset
            const badgesRef = database.ref(`users/${userId}/badges`);
            const snapshot = await badgesRef.once('value');
            
            if (snapshot.exists()) {
                badges = snapshot.val();
                console.log('Badges loaded from Firebase:', badges);
            } else {
                // Új felhasználó - minden badge zárolt
                badges = getDefaultBadges();
                
                await badgesRef.set(badges);
                console.log('Created new badges structure:', badges);
            }
            
            return badges;
        } catch (error) {
            console.error('Error loading badges:', error);
            badges = getDefaultBadges();
            return badges;
        }
    }

    function getDefaultBadges() {
        const defaultBadges = {};
        Object.keys(BADGE_DEFINITIONS).forEach(badgeId => {
            defaultBadges[badgeId] = {
                unlocked: false,
                progress: 0,
                unlockedAt: null
            };
        });
        return defaultBadges;
    }

    /**
     * XP szükséglet kiszámítása egy adott szinthez
     */
    function getXPRequiredForLevel(level) {
        if (level <= 1) return 0;
        return Math.round(XP_CONFIG.BASE_XP * Math.pow(XP_CONFIG.XP_MULTIPLIER, level - 2));
    }

    /**
     * Teljes XP kiszámítása egy adott szinthez
     */
    function getTotalXPForLevel(level) {
        if (level <= 1) return 0;
        let totalXP = 0;
        for (let i = 2; i <= level; i++) {
            totalXP += getXPRequiredForLevel(i);
        }
        return totalXP;
    }

    /**
     * Szint kiszámítása a teljes XP alapján
     */
    function calculateLevelFromXP(totalXP) {
        if (totalXP < getXPRequiredForLevel(2)) return 1;
        
        let level = 1;
        let accumulatedXP = 0;
        
        while (accumulatedXP <= totalXP) {
            level++;
            accumulatedXP += getXPRequiredForLevel(level);
        }
        
        return level - 1;
    }

    /**
     * XP progress az aktuális szintben
     */
    function getXPProgressInCurrentLevel(totalXP) {
        const currentLevel = calculateLevelFromXP(totalXP);
        const xpForCurrentLevel = getTotalXPForLevel(currentLevel);
        return totalXP - xpForCurrentLevel;
    }

    /**
     * LocalStorage felhasználó statisztikák frissítése
     */
    async function updateUserStatsLocalStorage(action, xpGained, today) {
        try {
            if (!window.app || !window.app.dataService) {
                console.warn('DataService not available for LocalStorage update');
                return;
            }

            // Jelenlegi felhasználó adatok lekérése
            const userData = await window.app.dataService.getUserData();
            if (!userData) {
                console.warn('No user data available for LocalStorage update');
                return;
            }

            // XP és szint frissítése
            let newXP = (userData.xp || 0) + xpGained;
            let newLevel = calculateLevelFromXP(newXP);

            // Streak frissítése
            let newStreak = userData.currentStreak || 0;
            let newTotalActiveDays = userData.totalActiveDays || 0;
            
            if (userData.lastActiveDate !== today) {
                // Új nap
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];
                
                if (userData.lastActiveDate === yesterdayStr) {
                    // Sorozat folytatása
                    newStreak++;
                } else {
                    // Sorozat megszakadása
                    newStreak = 1;
                }
                
                newTotalActiveDays++;
            }

            // Frissített adatok
            const updatedUserData = {
                ...userData,
                xp: newXP,
                level: newLevel,
                currentStreak: newStreak,
                totalActiveDays: newTotalActiveDays,
                lastActiveDate: today,
                lastActive: new Date().toISOString()
            };

            // Tevékenység-specifikus statisztikák
            switch (action) {
                case 'task_completed':
                    updatedUserData.tasksCompleted = (userData.tasksCompleted || 0) + 1;
                    break;
                case 'note_created':
                    updatedUserData.notesCreated = (userData.notesCreated || 0) + 1;
                    break;
                case 'quest_completed':
                    updatedUserData.questsCompleted = (userData.questsCompleted || 0) + 1;
                    break;
                case 'event_created':
                    updatedUserData.eventsCreated = (userData.eventsCreated || 0) + 1;
                    break;
            }

            // Mentés LocalStorage-be
            await window.app.dataService.saveUserData(updatedUserData);
            
            // ResultsService adatok frissítése
            userStats = {
                xp: updatedUserData.xp,
                level: updatedUserData.level,
                streak: updatedUserData.currentStreak,
                lastActivityDate: updatedUserData.lastActiveDate,
                totalActiveDays: updatedUserData.totalActiveDays,
                tasksCompleted: updatedUserData.tasksCompleted || 0,
                notesCreated: updatedUserData.notesCreated || 0,
                questsCompleted: updatedUserData.questsCompleted || 0,
                eventsCreated: updatedUserData.eventsCreated || 0,
                lastUpdated: updatedUserData.lastActive
            };

            console.log('LocalStorage user stats updated:', userStats);
            
            // Eredmények frissítése
            triggerResultsUpdate();
        } catch (error) {
            console.error('Error updating LocalStorage user stats:', error);
        }
    }

    /**
     * Valós időben frissítések beállítása
     */
    function setupRealtimeUpdates() {
        const database = getDatabase();
        const userId = currentUser;
        
        if (!database || !userId) return;

        // LocalStorage eset kezelése - nincs valós időben frissítés
        if (database === 'localStorage') {
            console.log('LocalStorage mode - no real-time updates needed');
            return;
        }

        // Firebase eset - valós időben frissítések
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
            
            // Ha nincs database, de van currentService, akkor LocalStorage-t használunk
            if (currentService && window.app.dataService.isLocalStorageFallback()) {
                console.log('Using LocalStorage fallback for ResultsService');
                return 'localStorage';
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

            // LocalStorage eset kezelése
            if (database === 'localStorage') {
                console.log(`Activity logged in LocalStorage: ${action}, XP gained: ${xpGained}`);
                // LocalStorage esetén csak frissítjük a felhasználó adatait
                await updateUserStatsLocalStorage(action, xpGained, today);
                return;
            }

            // Firebase eset
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
            let newLevel = calculateLevelFromXP(newXP);

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
        const message = `🎉 Új Badge: ${badgeDefinition.name} - ${badgeDefinition.description}`;
        
        // Próbáljuk meg a különböző NotificationService referenciákat
        if (window.NotificationService && window.NotificationService.showSuccess) {
            // Statikus metódus
            window.NotificationService.showSuccess(message, 5000);
        } else if (window.notificationService && window.notificationService.showSuccess) {
            // Példány metódus
            window.notificationService.showSuccess(message, 5000);
        } else if (window.app && window.app.notificationService && window.app.notificationService.showSuccess) {
            // App notification service
            window.app.notificationService.showSuccess(message, 5000);
        } else {
            // Egyszerű alert fallback
            alert(message);
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
        getXPRequiredForLevel,
        getTotalXPForLevel,
        calculateLevelFromXP,
        getXPProgressInCurrentLevel,
        get isInitialized() { return isInitialized; },
        refresh: async () => {
            await loadUserStats();
            await loadActivityData();
            await loadBadges();
            triggerResultsUpdate();
        },
        // Debug függvény az XP rendszer teszteléséhez
        debugXP: () => {
            console.log('=== XP Rendszer Debug ===');
            for (let level = 1; level <= 10; level++) {
                const xpRequired = getXPRequiredForLevel(level);
                const totalXP = getTotalXPForLevel(level);
                console.log(`Szint ${level}: ${xpRequired} XP szükséges, összesen: ${totalXP} XP`);
            }
        }
    };
})(); 