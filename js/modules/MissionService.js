// MissionService.js - Küldetés kezelés, generálás, követés (AI-ra előkészített)

class MissionService {
    constructor() {
        this.missions = new Map();
        this.userId = null;
        this.dataService = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            // Wait for app and data service to be available
            let attempts = 0;
            while (!window.app && attempts < 40) {
                await new Promise(resolve => setTimeout(resolve, 250));
                attempts++;
            }
            
            if (!window.app) {
                console.error('MissionService: App not available after waiting');
                return false;
            }

            // Wait for data service to be initialized
            attempts = 0;
            while ((!window.app.dataService || !window.app.dataService.isInitialized) && attempts < 40) {
                await new Promise(resolve => setTimeout(resolve, 250));
                attempts++;
            }

            if (!window.app.dataService || !window.app.dataService.isInitialized) {
                console.error('MissionService: DataService not initialized after waiting');
                return false;
            }

            // Get user ID with proper priority
            this.userId = this.getCurrentUserId();
            
            if (!this.userId) {
                console.error('MissionService: No authenticated user ID available');
                return false;
            }

            // Get data service
            this.dataService = window.app.dataService;
            
            // Load existing missions
            await this.loadMissions();
            
            // Generate new missions if needed
            await this.generateDailyMissions();
            
            this.isInitialized = true;
            console.log('MissionService initialized successfully for user:', this.userId);
            return true;
        } catch (error) {
            console.error('MissionService init error:', error);
            return false;
        }
    }

    // Get current user ID with proper priority
    getCurrentUserId() {
        // First priority: Firebase Auth current user
        if (window.firebase && window.firebase.auth) {
            const user = window.firebase.auth().currentUser;
            if (user && user.uid) {
                return user.uid;
            }
        }
        
        // Second priority: window.currentUserId (set by auth.js)
        if (window.currentUserId) {
            return window.currentUserId;
        }
        
        // Third priority: DataService
        if (window.app && window.app.dataService) {
            const userId = window.app.dataService.getCurrentUserId();
            if (userId && !userId.startsWith('user_')) {
                return userId;
            }
        }
        
        console.warn('MissionService: No authenticated user ID available');
        return null;
    }

    async loadMissions() {
        try {
            const today = this.getTodayString();
            const missionPath = `users/${this.userId}/quests/${today}`;
            
            let missions = {};
            if (this.dataService.isFirebaseAvailable() && this.userId) {
                try {
                    const snapshot = await firebase.database().ref(missionPath).once('value');
                    missions = snapshot.val() || {};
                } catch (firebaseError) {
                    console.warn('Firebase missions access failed, using localStorage:', firebaseError.message);
                    const stored = localStorage.getItem(`missions_${this.userId}_${today}`);
                    missions = stored ? JSON.parse(stored) : {};
                }
            } else {
                const stored = localStorage.getItem(`missions_${this.userId}_${today}`);
                missions = stored ? JSON.parse(stored) : {};
            }

            // Convert to Map for easier access
            this.missions.clear();
            Object.keys(missions).forEach(key => {
                this.missions.set(key, missions[key]);
            });

            console.log(`Loaded ${this.missions.size} missions for ${today}`);
        } catch (error) {
            console.error('Error loading missions:', error);
        }
    }

    async saveMissions() {
        try {
            const today = this.getTodayString();
            const missionPath = `users/${this.userId}/quests/${today}`;
            
            const missionsObj = {};
            this.missions.forEach((mission, key) => {
                missionsObj[key] = mission;
            });

            if (this.dataService.isFirebaseAvailable() && this.userId) {
                try {
                    await firebase.database().ref(missionPath).set(missionsObj);
                } catch (firebaseError) {
                    console.warn('Firebase missions save failed, using localStorage:', firebaseError.message);
                    localStorage.setItem(`missions_${this.userId}_${today}`, JSON.stringify(missionsObj));
                }
            } else {
                localStorage.setItem(`missions_${this.userId}_${today}`, JSON.stringify(missionsObj));
            }
        } catch (error) {
            console.error('Error saving missions:', error);
        }
    }

    async generateDailyMissions() {
        try {
            const today = this.getTodayString();
            
            // Check if missions already exist for today
            if (this.missions.size > 0) {
                console.log(`Missions already exist for today (${this.missions.size} missions)`);
                return;
            }

            // Double-check with database to prevent duplicates
            const existingMissions = await this.loadMissionsFromDatabase(today);
            if (existingMissions && Object.keys(existingMissions).length > 0) {
                console.log(`Missions already exist in database for today (${Object.keys(existingMissions).length} missions)`);
                // Load existing missions into the map
                this.missions.clear();
                Object.keys(existingMissions).forEach(key => {
                    this.missions.set(key, existingMissions[key]);
                });
                return;
            }

            console.log('Generating new missions for today...');
            
            // Generate missions based on user data
            const missions = await this.generateQuests();
            
            // Add to missions map
            missions.forEach((mission, index) => {
                const missionId = `quest_${Date.now()}_${index}`;
                this.missions.set(missionId, {
                    ...mission,
                    id: missionId,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                });
            });

            // Save to database
            await this.saveMissions();
            
            console.log(`Generated ${missions.length} new missions for ${today}`);
            
            // Dispatch event for UI update
            this.dispatchMissionUpdate();
        } catch (error) {
            console.error('Error generating daily missions:', error);
        }
    }

    // Helper method to load missions from database without updating the map
    async loadMissionsFromDatabase(date) {
        try {
            const missionPath = `users/${this.userId}/quests/${date}`;
            
            if (this.dataService.isFirebaseAvailable() && this.userId) {
                try {
                    const snapshot = await firebase.database().ref(missionPath).once('value');
                    return snapshot.val() || {};
                } catch (firebaseError) {
                    console.warn('Firebase missions access failed:', firebaseError.message);
                    const stored = localStorage.getItem(`missions_${this.userId}_${date}`);
                    return stored ? JSON.parse(stored) : {};
                }
            } else {
                const stored = localStorage.getItem(`missions_${this.userId}_${date}`);
                return stored ? JSON.parse(stored) : {};
            }
        } catch (error) {
            console.error('Error loading missions from database:', error);
            return {};
        }
    }

    async generateQuests() {
        // Pseudo-AI logic - később cserélhető valódi AI-ra
        let missions = [];
        
        try {
            // Get user data for mission generation
            const userData = await this.dataService.getUserData();
            const userItems = await this.dataService.getUserItems();
            
            // Analyze user activity patterns
            const stats = this.analyzeUserActivity(userItems, userData);
            
            // Generate missions based on analysis
            missions.push(...this.generateTaskBasedMissions(stats));
            missions.push(...this.generateListBasedMissions(stats));
            missions.push(...this.generateNoteBasedMissions(stats));
            missions.push(...this.generateCalendarBasedMissions(stats));
            missions.push(...this.generateStreakBasedMissions(stats));
            
            // Add some random missions for variety
            missions.push(...this.generateRandomMissions(stats));

            // DUPLIKÁCIÓK KISZŰRÉSE (title, type, goal alapján)
            const seen = new Set();
            missions = missions.filter(m => {
                const key = `${m.title}|${m.type}|${m.goal}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
            // Limit to 5-8 missions per day
            return missions.slice(0, Math.min(8, Math.max(5, missions.length)));
            
        } catch (error) {
            console.error('Error generating quests:', error);
            // Fallback missions
            return this.getFallbackMissions();
        }
    }

    analyzeUserActivity(userItems, userData) {
        const stats = {
            totalTasks: 0,
            completedTasks: 0,
            totalLists: 0,
            totalNotes: 0,
            totalEvents: 0,
            streakDays: userData.streak || 0,
            level: userData.level || 1,
            xp: userData.xp || 0,
            lastActivity: userData.lastActivity || Date.now()
        };

        // Count items by type
        userItems.forEach(item => {
            switch (item.type) {
                case 'task':
                    stats.totalTasks++;
                    if (item.completed) stats.completedTasks++;
                    break;
                case 'list':
                    stats.totalLists++;
                    break;
                case 'note':
                    stats.totalNotes++;
                    break;
                case 'event':
                    stats.totalEvents++;
                    break;
            }
        });

        return stats;
    }

    generateTaskBasedMissions(stats) {
        const missions = [];
        
        // Create tasks mission
        if (stats.totalTasks < 10) {
            missions.push({
                title: `Hozz létre ${Math.max(3, 5 - stats.totalTasks)} új feladatot!`,
                description: 'Legyél produktív és készíts új feladatokat a listáidhoz!',
                type: 'daily',
                goal: Math.max(3, 5 - stats.totalTasks),
                progress: 0,
                xp: 30,
                status: 'active',
                category: 'tasks',
                trackingKey: 'tasks_created'
            });
        }

        // Complete tasks mission
        if (stats.completedTasks < stats.totalTasks * 0.7) {
            missions.push({
                title: `Teljesíts ${Math.max(2, Math.ceil(stats.totalTasks * 0.3))} feladatot!`,
                description: 'Fejezd be a megkezdett feladataidat!',
                type: 'daily',
                goal: Math.max(2, Math.ceil(stats.totalTasks * 0.3)),
                progress: 0,
                xp: 40,
                status: 'active',
                category: 'tasks',
                trackingKey: 'tasks_completed'
            });
        }

        return missions;
    }

    generateListBasedMissions(stats) {
        const missions = [];
        
        if (stats.totalLists < 5) {
            missions.push({
                title: `Hozz létre ${Math.max(1, 3 - stats.totalLists)} új listát!`,
                description: 'Szervezd meg a feladataidat listákba!',
                type: 'daily',
                goal: Math.max(1, 3 - stats.totalLists),
                progress: 0,
                xp: 25,
                status: 'active',
                category: 'lists',
                trackingKey: 'lists_created'
            });
        }

        return missions;
    }

    generateNoteBasedMissions(stats) {
        const missions = [];
        
        if (stats.totalNotes < 10) {
            missions.push({
                title: `Írj ${Math.max(1, 3 - stats.totalNotes)} jegyzetet!`,
                description: 'Jegyezd fel a fontos gondolataidat!',
                type: 'daily',
                goal: Math.max(1, 3 - stats.totalNotes),
                progress: 0,
                xp: 20,
                status: 'active',
                category: 'notes',
                trackingKey: 'notes_created'
            });
        }

        return missions;
    }

    generateCalendarBasedMissions(stats) {
        const missions = [];
        
        if (stats.totalEvents < 5) {
            missions.push({
                title: 'Adj hozzá 1 eseményt a naptáradhoz!',
                description: 'Tervezd meg a napjaidat!',
                type: 'daily',
                goal: 1,
                progress: 0,
                xp: 15,
                status: 'active',
                category: 'calendar',
                trackingKey: 'events_created'
            });
        }

        return missions;
    }

    generateStreakBasedMissions(stats) {
        const missions = [];
        
        if (stats.streakDays < 7) {
            missions.push({
                title: `Légy aktív ${Math.max(1, 3 - stats.streakDays)} napon keresztül!`,
                description: 'Építs fel egy aktív szokást!',
                type: 'weekly',
                goal: Math.max(1, 3 - stats.streakDays),
                progress: stats.streakDays,
                xp: 50,
                status: 'active',
                category: 'streak',
                trackingKey: 'streak_days'
            });
        }

        return missions;
    }

    generateRandomMissions(stats) {
        const randomMissions = [
            {
                title: 'Változtasd meg a témát!',
                description: 'Próbáld ki az alkalmazás különböző témáit!',
                type: 'daily',
                goal: 1,
                progress: 0,
                xp: 10,
                status: 'active',
                category: 'system',
                trackingKey: 'theme_changed'
            },
            {
                title: 'Nézd meg az eredményeidet!',
                description: 'Ellenőrizd a fejlődésedet az eredmények oldalon!',
                type: 'daily',
                goal: 1,
                progress: 0,
                xp: 5,
                status: 'active',
                category: 'system',
        
            }
        ];

        return randomMissions.slice(0, 1); // Return 1 random mission
    }

    getFallbackMissions() {
        return [
            {
                title: 'Hozz létre 3 feladatot!',
                description: 'Kezdj el használni az alkalmazást!',
                type: 'daily',
                goal: 3,
                progress: 0,
                xp: 30,
                status: 'active',
                category: 'tasks',
                trackingKey: 'tasks_created'
            },
            {
                title: 'Írj 1 jegyzetet!',
                description: 'Jegyezd fel a gondolataidat!',
                type: 'daily',
                goal: 1,
                progress: 0,
                xp: 20,
                status: 'active',
                category: 'notes',
                trackingKey: 'notes_created'
            }
        ];
    }

    async updateMissionProgress(activityType, amount = 1) {
        try {
            let updated = false;
            
            this.missions.forEach((mission, missionId) => {
                if (mission.status === 'active' && mission.trackingKey === activityType) {
                    const oldProgress = mission.progress;
                    mission.progress = Math.min(mission.goal, mission.progress + amount);
                    mission.updatedAt = Date.now();
                    
                    // Check if mission is completed
                    if (mission.progress >= mission.goal && mission.status === 'active') {
                        mission.status = 'completed';
                        this.completeMission(missionId, mission);
                    }
                    
                    if (oldProgress !== mission.progress) {
                        updated = true;
                    }
                }
            });

            if (updated) {
                await this.saveMissions();
                this.dispatchMissionUpdate();
            }
        } catch (error) {
            console.error('Error updating mission progress:', error);
        }
    }

    async completeMission(missionId, mission) {
        try {
            console.log(`Mission completed: ${mission.title}`);
            
            // Award XP
            if (window.LevelSystem && window.LevelSystem.addXP) {
                await window.LevelSystem.addXP(mission.xp, `Küldetés teljesítve: ${mission.title}`);
            }
            
            // Award essence
            if (window.CurrencyService && window.CurrencyService.addEssence) {
                const essenceReward = Math.floor(mission.xp / 10); // 1 essence per 10 XP
                await window.CurrencyService.addEssence(essenceReward, `Küldetés: ${mission.title}`);
            }
            
            // Log activity for ResultsService
            if (window.ResultsService && window.ResultsService.logActivity) {
                await window.ResultsService.logActivity('quest_completed', { missionId, title: mission.title });
            }
            
            // Show completion notification
            if (window.NotificationService && window.NotificationService.showSuccess) {
                window.NotificationService.showSuccess(
                    `Küldetés teljesítve! +${mission.xp} XP`,
                    mission.title
                );
            }
            
        } catch (error) {
            console.error('Error completing mission:', error);
        }
    }

    getMissions() {
        return Array.from(this.missions.values());
    }

    getMissionsByStatus(status) {
        return this.getMissions().filter(mission => mission.status === status);
    }

    getActiveMissions() {
        return this.getMissionsByStatus('active');
    }

    getCompletedMissions() {
        return this.getMissionsByStatus('completed');
    }

    getExpiredMissions() {
        return this.getMissionsByStatus('expired');
    }

    getTodayString() {
        return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    dispatchMissionUpdate() {
        // Dispatch custom event for UI updates
        const event = new CustomEvent('missions-updated', {
            detail: {
                missions: this.getMissions(),
                active: this.getActiveMissions(),
                completed: this.getCompletedMissions()
            }
        });
        window.dispatchEvent(event);
    }

    // Public API methods for other services to call
    static async trackActivity(activityType, amount = 1) {
        if (window.missionService && window.missionService.isInitialized) {
            await window.missionService.updateMissionProgress(activityType, amount);
        }
    }
}

// Make available globally
window.MissionService = MissionService; 