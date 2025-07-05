// Data Service Factory Module
// Creates and manages data service instances

class DataService {
    constructor() {
        this.firebaseService = null;
        this.localStorageService = null;
        this.currentService = null;
        this.isInitialized = false;
        this.isReady = false;
    }

    async init() {
        try {
            console.log('Initializing DataService...');
            
            // Initialize Firebase service first
            if (window.FirebaseServiceModule) {
                this.firebaseService = new window.FirebaseServiceModule();
                const firebaseConnected = await this.firebaseService.init();
                
                if (firebaseConnected) {
                    console.log('Firebase connection successful');
                    this.currentService = this.firebaseService;
                    this.isInitialized = true;
                    this.isReady = this.firebaseService.isReady !== undefined ? this.firebaseService.isReady : true;
                    console.log('DataService Firebase ready status:', {
                        firebaseServiceIsReady: this.firebaseService.isReady,
                        dataServiceIsReady: this.isReady
                    });
                    return true;
                } else {
                    console.log('Firebase connection failed, falling back to local storage');
                }
            } else {
                console.log('FirebaseServiceModule not available');
            }

            // Fallback to LocalStorage service
            if (window.LocalStorageService) {
                this.localStorageService = new window.LocalStorageService();
                this.currentService = this.localStorageService;
                this.isInitialized = true;
                this.isReady = this.localStorageService.isReady !== undefined ? this.localStorageService.isReady : true;
                console.log('DataService LocalStorage ready status:', {
                    localStorageServiceIsReady: this.localStorageService.isReady,
                    dataServiceIsReady: this.isReady
                });
                console.log('Using LocalStorage service');
                return true;
            } else {
                console.error('No data service available');
                return false;
            }
        } catch (error) {
            console.error('Error initializing DataService:', error);
            return false;
        }
    }

    // Get the current active service
    getCurrentService() {
        return this.currentService;
    }

    // Check if Firebase is available
    isFirebaseAvailable() {
        return this.firebaseService && this.currentService === this.firebaseService;
    }

    // Check if LocalStorage is being used
    isLocalStorageFallback() {
        return this.localStorageService && this.currentService === this.localStorageService;
    }

    // Get ready status
    getReadyStatus() {
        if (this.currentService && this.currentService.getReadyStatus) {
            return this.currentService.getReadyStatus();
        }
        return this.isReady;
    }

    // Get connection status
    getConnectionStatus() {
        if (this.currentService) {
            return this.currentService.getConnectionStatus();
        }
        return { connected: false, status: 'not_initialized' };
    }

    // Delegate all data operations to the current service
    async getUserData() {
        if (this.currentService) {
            return await this.currentService.getUserData();
        }
        return null;
    }

    async saveUserData(userData) {
        if (this.currentService) {
            return await this.currentService.saveUserData(userData);
        }
        return false;
    }

    async updateUserField(field, value) {
        if (this.currentService) {
            return await this.currentService.updateUserField(field, value);
        }
        return false;
    }

    async saveUserGroup(group) {
        if (this.currentService) {
            return await this.currentService.saveUserGroup(group);
        }
        return false;
    }

    async getUserGroup() {
        if (this.currentService) {
            return await this.currentService.getUserGroup();
        }
        return null;
    }

    async updateStreak(streak) {
        if (this.currentService) {
            return await this.currentService.updateStreak(streak);
        }
        return false;
    }

    async updateStreakWithLogic() {
        if (this.currentService) {
            return await this.currentService.updateStreakWithLogic();
        }
        return 0;
    }

    async updateXP(xp) {
        if (this.currentService) {
            return await this.currentService.updateXP(xp);
        }
        return false;
    }

    async updateLevel(level) {
        if (this.currentService) {
            return await this.currentService.updateLevel(level);
        }
        return false;
    }

    async updateCurrency(currency) {
        if (this.currentService) {
            return await this.currentService.updateCurrency(currency);
        }
        return false;
    }

    async getProgress() {
        if (this.currentService) {
            return await this.currentService.getProgress();
        }
        return null;
    }

    async updateProgress(progress) {
        if (this.currentService) {
            return await this.currentService.updateProgress(progress);
        }
        return false;
    }

    async saveItem(type, title, description) {
        if (this.currentService) {
            const result = await this.currentService.saveItem(type, title, description);
            
            // Log activity for ResultsService
            if (result && window.ResultsService && window.ResultsService.logActivity) {
                switch (type) {
                    case 'task':
                        await window.ResultsService.logActivity('task_created', { title, description });
                        break;
                    case 'note':
                        await window.ResultsService.logActivity('note_created', { title, description });
                        break;
                    case 'event':
                        await window.ResultsService.logActivity('event_created', { title, description });
                        break;
                }
            }
            
            return result;
        }
        return null;
    }

    async getUserItems() {
        if (this.currentService) {
            return await this.currentService.getUserItems();
        }
        return [];
    }

    async testConnection() {
        if (this.currentService) {
            return await this.currentService.testConnection();
        }
        return false;
    }

    logActivity(action, data = {}) {
        if (this.currentService) {
            this.currentService.logActivity(action, data);
        }
    }

    // Get current user ID
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
        
        // Third priority: Current service
        if (this.currentService && this.currentService.getCurrentUserId) {
            return this.currentService.getCurrentUserId();
        }
        
        // Fallback to localStorage (only for demo/offline mode)
        let userId = localStorage.getItem('donezy_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('donezy_user_id', userId);
        }
        return userId;
    }

    // Témák kezelése
    async getThemes() {
        if (this.currentService) {
            return await this.currentService.getThemes();
        }
        return null;
    }

    async getGlobalThemes() {
        if (this.currentService && this.currentService.getGlobalThemes) {
            return await this.currentService.getGlobalThemes();
        }
        return null;
    }

    async getUserThemes() {
        if (this.currentService && this.currentService.getUserThemes) {
            return await this.currentService.getUserThemes();
        }
        return {};
    }

    async saveTheme(themeData) {
        if (this.currentService) {
            return await this.currentService.saveTheme(themeData);
        }
        return false;
    }

    async saveUserTheme(themeData) {
        if (this.currentService && this.currentService.saveUserTheme) {
            return await this.currentService.saveUserTheme(themeData);
        }
        return false;
    }

    async updateTheme(themeId, updates) {
        if (this.currentService) {
            return await this.currentService.updateTheme(themeId, updates);
        }
        return false;
    }

    async updateUserTheme(themeId, updates) {
        if (this.currentService && this.currentService.updateUserTheme) {
            return await this.currentService.updateUserTheme(themeId, updates);
        }
        return false;
    }

    async deleteTheme(themeId) {
        if (this.currentService) {
            return await this.currentService.deleteTheme(themeId);
        }
        return false;
    }

    async deleteUserTheme(themeId) {
        if (this.currentService && this.currentService.deleteUserTheme) {
            return await this.currentService.deleteUserTheme(themeId);
        }
        return false;
    }

    async logCompletedTask(taskData = {}) {
        if (this.currentService) {
            const result = await this.currentService.logCompletedTask(taskData);
            
            // Log activity for ResultsService
            if (result && window.ResultsService && window.ResultsService.logActivity) {
                await window.ResultsService.logActivity('task_completed', taskData);
            }
            
            return result;
        }
        return false;
    }

    async getCompletedTasks(startDate, endDate) {
        if (this.currentService) {
            return await this.currentService.getCompletedTasks(startDate, endDate);
        }
        return {};
    }

    async saveBadge(badgeId, badgeData) {
        if (this.currentService) {
            return await this.currentService.saveBadge(badgeId, badgeData);
        }
        return false;
    }

    async getBadges() {
        if (this.currentService) {
            return await this.currentService.getBadges();
        }
        return {};
    }

    async updateBadgeProgress(badgeId, progress) {
        if (this.currentService) {
            return await this.currentService.updateBadgeProgress(badgeId, progress);
        }
        return false;
    }
}

// Export for use in other modules
window.DataService = DataService; 