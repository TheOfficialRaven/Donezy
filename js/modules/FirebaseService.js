// FirebaseService Module
// Uses the global FirebaseService class from firebase-config.js

class FirebaseServiceModule {
    constructor() {
        // Use the global FirebaseService class
        if (window.FirebaseService) {
            this.firebaseService = new window.FirebaseService();
        } else {
            console.error('FirebaseService not available');
            this.firebaseService = null;
        }
    }

    async init() {
        if (this.firebaseService) {
            return await this.firebaseService.init();
        }
        return false;
    }

    async getUserData() {
        if (this.firebaseService) {
            return await this.firebaseService.getUserData();
        }
        return null;
    }

    async saveUserData(userData) {
        if (this.firebaseService) {
            return await this.firebaseService.saveUserData(userData);
        }
        return false;
    }

    async updateUserField(field, value) {
        if (this.firebaseService) {
            return await this.firebaseService.updateUserField(field, value);
        }
        return false;
    }

    async saveUserGroup(group) {
        if (this.firebaseService) {
            return await this.firebaseService.saveUserGroup(group);
        }
        return false;
    }

    async getUserGroup() {
        if (this.firebaseService) {
            return await this.firebaseService.getUserGroup();
        }
        return null;
    }

    async updateStreak(streak) {
        if (this.firebaseService) {
            return await this.firebaseService.updateStreak(streak);
        }
        return false;
    }

    async updateXP(xp) {
        if (this.firebaseService) {
            return await this.firebaseService.updateXP(xp);
        }
        return false;
    }

    async saveItem(type, title, description) {
        if (this.firebaseService) {
            return await this.firebaseService.saveItem(type, title, description);
        }
        return null;
    }

    async getUserItems() {
        if (this.firebaseService) {
            return await this.firebaseService.getUserItems();
        }
        return [];
    }

    async testConnection() {
        if (this.firebaseService) {
            return await this.firebaseService.testConnection();
        }
        return false;
    }

    getConnectionStatus() {
        if (this.firebaseService) {
            return this.firebaseService.getConnectionStatus();
        }
        return { connected: false, status: 'not_available' };
    }

    logActivity(action, data = {}) {
        if (this.firebaseService) {
            this.firebaseService.logActivity(action, data);
        }
    }
}

// Export for use in other modules
window.FirebaseServiceModule = FirebaseServiceModule; 