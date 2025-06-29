// Data Service Factory Module
// Creates and manages data service instances

class DataService {
    constructor() {
        this.firebaseService = null;
        this.localStorageService = null;
        this.currentService = null;
        this.isInitialized = false;
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

    async updateXP(xp) {
        if (this.currentService) {
            return await this.currentService.updateXP(xp);
        }
        return false;
    }

    async saveItem(type, title, description) {
        if (this.currentService) {
            return await this.currentService.saveItem(type, title, description);
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
}

// Export for use in other modules
window.DataService = DataService; 