// Firebase Configuration for Donezy Application
// Using Firebase CDN for compatibility with regular script loading

// Firebase configuration - Real project
const firebaseConfig = {
    apiKey: "AIzaSyBu25SFdGZLJzMjbcT_jd8_Vput6E7vYR4",
    authDomain: "donezy-82cdb.firebaseapp.com",
    databaseURL: "https://donezy-82cdb-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "donezy-82cdb",
    storageBucket: "donezy-82cdb.firebasestorage.app",
    messagingSenderId: "960038081983",
    appId: "1:960038081983:web:afb9627c4d88572b24bd0a",
    measurementId: "G-YEKELDTEQK"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
// Do not call firebase.database() or firebase.auth() here, just initialize the app.

// Initialize Firebase (will be called after Firebase SDK is loaded)
let app, database, analytics;

// Function to initialize Firebase when SDK is available
function initializeFirebase() {
    if (typeof firebase !== 'undefined') {
        try {
            app = firebase.initializeApp(firebaseConfig);
            database = firebase.database();
            analytics = firebase.analytics();
            console.log('Firebase initialized successfully');
            return true;
        } catch (error) {
            console.error('Firebase initialization error:', error);
            return false;
        }
    } else {
        console.warn('Firebase SDK not loaded yet');
        return false;
    }
}

// Firebase Database Service Class
class FirebaseService {
    constructor() {
        this.database = null;
        this.analytics = null;
        this.currentUserId = this.getCurrentUserId();
        this.initialized = false;
    }

    // Initialize Firebase connection
    async init() {
        if (typeof firebase === 'undefined') {
            console.log('Firebase not available, using local storage fallback');
            return false;
        }

        try {
            if (!app) {
                initializeFirebase();
            }
            
            if (app && database) {
                this.database = database;
                this.analytics = analytics;
                this.initialized = true;
                console.log('FirebaseService initialized successfully');
                return true;
            } else {
                console.log('Firebase initialization failed, using local storage fallback');
                return false;
            }
        } catch (error) {
            console.error('FirebaseService init error:', error);
            return false;
        }
    }

    // Get current user ID from Firebase auth or fallback
    getCurrentUserId() {
        // First try to get from window.currentUserId (set by auth.js)
        if (window.currentUserId) {
            return window.currentUserId;
        }
        
        // Fallback to localStorage for demo/offline mode
        let userId = localStorage.getItem('donezy_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('donezy_user_id', userId);
        }
        return userId;
    }

    // Get user data from Firebase
    async getUserData() {
        if (!this.initialized) {
            console.warn('Firebase not initialized');
            return null;
        }

        try {
            const userRef = this.database.ref(`users/${this.currentUserId}`);
            const snapshot = await userRef.once('value');
            
            if (snapshot.exists()) {
                const userData = snapshot.val();
                
                // Ensure progress object exists
                if (!userData.progress) {
                    userData.progress = {
                        xp: userData.xp || 0,
                        level: userData.level || 1,
                        currency: userData.essence || 50
                    };
                    await this.updateUserField('progress', userData.progress);
                }
                
                // Ensure currency field exists (for backward compatibility)
                if (userData.essence === undefined) {
                    userData.essence = userData.progress.currency || 50;
                    await this.updateUserField('essence', userData.essence);
                }
                
                return userData;
            } else {
                // Create new user with default data
                const defaultUserData = {
                    group: null,
                    level: 1,
                    xp: 0,
                    essence: 50,
                    streak: 0,
                    progress: {
                        xp: 0,
                        level: 1,
                        currency: 50
                    },
                    createdAt: new Date().toISOString(),
                    lastActive: new Date().toISOString()
                };
                
                await this.saveUserData(defaultUserData);
                return defaultUserData;
            }
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }

    // Save user data to Firebase
    async saveUserData(userData) {
        if (!this.initialized) {
            console.warn('Firebase not initialized');
            return false;
        }

        try {
            const userRef = this.database.ref(`users/${this.currentUserId}`);
            await userRef.set({
                ...userData,
                lastActive: new Date().toISOString()
            });
            return true;
        } catch (error) {
            console.error('Error saving user data:', error);
            return false;
        }
    }

    // Update specific user field
    async updateUserField(field, value) {
        if (!this.initialized) {
            console.warn('Firebase not initialized');
            return false;
        }

        try {
            const userRef = this.database.ref(`users/${this.currentUserId}/${field}`);
            await userRef.set(value);
            return true;
        } catch (error) {
            console.error(`Error updating user field ${field}:`, error);
            return false;
        }
    }

    // Save user's target group
    async saveUserGroup(group) {
        const success = await this.updateUserField('group', group);
        
        // Track analytics event
        if (this.analytics && success) {
            try {
                this.analytics.logEvent('user_group_selected', {
                    group: group,
                    user_id: this.currentUserId
                });
            } catch (error) {
                console.warn('Analytics error:', error);
            }
        }
        
        return success;
    }

    // Get user's target group
    async getUserGroup() {
        const userData = await this.getUserData();
        return userData ? userData.group : null;
    }

    // Update user streak with real logic
    async updateStreak(streak) {
        return await this.updateUserField('streak', streak);
    }

    // Update streak with automatic logic
    async updateStreakWithLogic() {
        try {
            const userData = await this.getUserData();
            const today = new Date().toISOString().split('T')[0];
            const lastActiveDate = userData.lastActiveDate || null;
            const currentStreak = userData.currentStreak || 0;
            
            let newStreak = currentStreak;
            let shouldUpdate = false;
            
            // Check if user was active today
            const wasActiveToday = await this.checkUserActivityToday();
            
            if (wasActiveToday) {
                if (lastActiveDate === today) {
                    // Already updated today, no change needed
                    return currentStreak;
                } else if (lastActiveDate === this.getYesterdayDate()) {
                    // User was active yesterday, continue streak
                    newStreak = currentStreak + 1;
                    shouldUpdate = true;
                } else {
                    // User was not active yesterday, reset streak
                    newStreak = 1;
                    shouldUpdate = true;
                }
            }
            
            if (shouldUpdate) {
                await this.updateUserField('currentStreak', newStreak);
                await this.updateUserField('lastActiveDate', today);
                await this.updateUserField('lastActive', new Date().toISOString());
            }
            
            return newStreak;
        } catch (error) {
            console.error('Error updating streak with logic:', error);
            return 0;
        }
    }

    // Check if user was active today
    async checkUserActivityToday() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const activityRef = this.database.ref(`users/${this.currentUserId}/activity_log/${today}`);
            const snapshot = await activityRef.once('value');
            
            if (snapshot.exists()) {
                const activity = snapshot.val();
                return activity.tasksCreated > 0 || activity.notesCreated > 0 || activity.listsCreated > 0;
            }
            
            return false;
        } catch (error) {
            console.error('Error checking user activity today:', error);
            return false;
        }
    }

    // Get yesterday's date in YYYY-MM-DD format
    getYesterdayDate() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    }

    // Log completed task
    async logCompletedTask(taskData = {}) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const completedTasksRef = this.database.ref(`users/${this.currentUserId}/completedTasks/${today}`);
            
            // Get current day's completed tasks
            const snapshot = await completedTasksRef.once('value');
            const currentTasks = snapshot.exists() ? snapshot.val() : { count: 0, tasks: [] };
            
            // Add new completed task
            currentTasks.count = (currentTasks.count || 0) + 1;
            currentTasks.tasks.push({
                id: taskData.id || `task_${Date.now()}`,
                title: taskData.title || 'Completed Task',
                completedAt: new Date().toISOString(),
                ...taskData
            });
            
            // Save updated completed tasks
            await completedTasksRef.set(currentTasks);
            
            // Update activity log
            await this.logActivity('task_completed', taskData);
            
            return true;
        } catch (error) {
            console.error('Error logging completed task:', error);
            return false;
        }
    }

    // Get completed tasks for a specific date range
    async getCompletedTasks(startDate, endDate) {
        try {
            const tasksRef = this.database.ref(`users/${this.currentUserId}/completedTasks`);
            const snapshot = await tasksRef.once('value');
            
            if (snapshot.exists()) {
                const allTasks = snapshot.val();
                const filteredTasks = {};
                
                Object.entries(allTasks).forEach(([date, dayData]) => {
                    if (date >= startDate && date <= endDate) {
                        filteredTasks[date] = dayData;
                    }
                });
                
                return filteredTasks;
            }
            
            return {};
        } catch (error) {
            console.error('Error getting completed tasks:', error);
            return {};
        }
    }

    // Save badge data
    async saveBadge(badgeId, badgeData) {
        try {
            const badgesRef = this.database.ref(`users/${this.currentUserId}/badges/${badgeId}`);
            await badgesRef.set({
                ...badgeData,
                lastUpdated: new Date().toISOString()
            });
            return true;
        } catch (error) {
            console.error('Error saving badge:', error);
            return false;
        }
    }

    // Get all badges for user
    async getBadges() {
        try {
            const badgesRef = this.database.ref(`users/${this.currentUserId}/badges`);
            const snapshot = await badgesRef.once('value');
            
            if (snapshot.exists()) {
                return snapshot.val();
            }
            
            return {};
        } catch (error) {
            console.error('Error getting badges:', error);
            return {};
        }
    }

    // Update badge progress
    async updateBadgeProgress(badgeId, progress) {
        try {
            const badgeRef = this.database.ref(`users/${this.currentUserId}/badges/${badgeId}`);
            await badgeRef.update({
                progress: progress,
                lastUpdated: new Date().toISOString()
            });
            return true;
        } catch (error) {
            console.error('Error updating badge progress:', error);
            return false;
        }
    }

    // Update user XP
    async updateXP(xp) {
        const success = await this.updateUserField('xp', xp);
        if (success) {
            // Also update progress object
            await this.updateUserField('progress/xp', xp);
        }
        return success;
    }

    // Update user level
    async updateLevel(level) {
        const success = await this.updateUserField('level', level);
        if (success) {
            // Also update progress object
            await this.updateUserField('progress/level', level);
        }
        return success;
    }

    // Update user currency (essence)
    async updateCurrency(currency) {
        const success = await this.updateUserField('essence', currency);
        if (success) {
            // Also update progress object
            await this.updateUserField('progress/currency', currency);
        }
        return success;
    }

    // Update progress object
    async updateProgress(progress) {
        return await this.updateUserField('progress', progress);
    }

    // Get progress data
    async getProgress() {
        const userData = await this.getUserData();
        return userData ? userData.progress : null;
    }

    // Save task/note/event
    async saveItem(type, title, description) {
        if (!this.initialized) {
            console.warn('Firebase not initialized');
            return null;
        }

        try {
            const itemId = `${type}_${Date.now()}`;
            const itemRef = this.database.ref(`users/${this.currentUserId}/items/${itemId}`);
            
            const itemData = {
                id: itemId,
                type: type,
                title: title,
                description: description,
                createdAt: new Date().toISOString(),
                completed: false
            };

            await itemRef.set(itemData);
            
            // Track analytics event
            if (this.analytics) {
                try {
                    this.analytics.logEvent('item_created', {
                        item_type: type,
                        user_id: this.currentUserId
                    });
                } catch (error) {
                    console.warn('Analytics error:', error);
                }
            }
            
            return itemId;
        } catch (error) {
            console.error('Error saving item:', error);
            return null;
        }
    }

    // Get user items
    async getUserItems() {
        if (!this.initialized) {
            console.warn('Firebase not initialized');
            return [];
        }

        try {
            const itemsRef = this.database.ref(`users/${this.currentUserId}/items`);
            const snapshot = await itemsRef.once('value');
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                return Object.values(data || {});
            } else {
                return [];
            }
        } catch (error) {
            console.error('Error getting user items:', error);
            return [];
        }
    }

    // Check if Firebase is connected
    async testConnection() {
        if (!this.initialized) {
            return false;
        }

        try {
            const testRef = this.database.ref('test');
            await testRef.set({ 
                timestamp: Date.now(),
                userId: this.currentUserId,
                test: true
            });
            
            // Clean up test data
            setTimeout(async () => {
                try {
                    await testRef.remove();
                } catch (error) {
                    console.warn('Could not clean up test data:', error);
                }
            }, 1000);
            
            return true;
        } catch (error) {
            console.error('Firebase connection test failed:', error);
            return false;
        }
    }

    // Get connection status
    getConnectionStatus() {
        if (!this.initialized) {
            return { connected: false, status: 'not_initialized' };
        }
        
        try {
            const connectedRef = this.database.ref('.info/connected');
            return { connected: true, status: 'connected' };
        } catch (error) {
            return { connected: false, status: 'error', error: error.message };
        }
    }

    // Log user activity
    logActivity(action, data = {}) {
        if (!this.initialized) {
            return;
        }

        try {
            const activityRef = this.database.ref(`users/${this.currentUserId}/activity/${Date.now()}`);
            activityRef.set({
                action: action,
                data: data,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.warn('Could not log activity:', error);
        }
    }

    // Témák kezelése
    async getThemes() {
        if (!this.initialized) {
            console.warn('Firebase not initialized');
            return null;
        }

        // Check if user is authenticated before accessing themes
        if (!this.currentUserId) {
            console.warn('User not authenticated, skipping themes access');
            return null;
        }

        try {
            const themesRef = this.database.ref('themes');
            const snapshot = await themesRef.once('value');
            
            if (snapshot.exists()) {
                return snapshot.val();
            } else {
                return null;
            }
        } catch (error) {
            if (error.code === 'PERMISSION_DENIED') {
                console.warn('Firebase themes access denied - check database rules for /themes path');
            } else {
                console.error('Error getting themes:', error);
            }
            return null;
        }
    }

    async saveTheme(themeData) {
        if (!this.initialized) {
            console.warn('Firebase not initialized');
            return false;
        }

        try {
            const themeId = themeData.id || `theme_${Date.now()}`;
            const themeRef = this.database.ref(`themes/${themeId}`);
            
            await themeRef.set({
                ...themeData,
                id: themeId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            
            return true;
        } catch (error) {
            console.error('Error saving theme:', error);
            return false;
        }
    }

    async updateTheme(themeId, updates) {
        if (!this.initialized) {
            console.warn('Firebase not initialized');
            return false;
        }

        try {
            const themeRef = this.database.ref(`themes/${themeId}`);
            
            await themeRef.update({
                ...updates,
                updatedAt: new Date().toISOString()
            });
            
            return true;
        } catch (error) {
            console.error('Error updating theme:', error);
            return false;
        }
    }

    async deleteTheme(themeId) {
        if (!this.initialized) {
            console.warn('Firebase not initialized');
            return false;
        }

        try {
            const themeRef = this.database.ref(`themes/${themeId}`);
            await themeRef.remove();
            
            return true;
        } catch (error) {
            console.error('Error deleting theme:', error);
            return false;
        }
    }
}

// Export for use in other modules
window.FirebaseService = FirebaseService;
window.FirebaseServiceModule = FirebaseService;
window.firebaseConfig = firebaseConfig;
window.initializeFirebase = initializeFirebase; 