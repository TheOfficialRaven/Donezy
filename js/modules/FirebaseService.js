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

    async updateStreakWithLogic() {
        if (this.firebaseService) {
            return await this.firebaseService.updateStreakWithLogic();
        }
        return 0;
    }

    async logCompletedTask(taskData = {}) {
        if (this.firebaseService) {
            return await this.firebaseService.logCompletedTask(taskData);
        }
        return false;
    }

    async getCompletedTasks(startDate, endDate) {
        if (this.firebaseService) {
            return await this.firebaseService.getCompletedTasks(startDate, endDate);
        }
        return {};
    }

    async saveBadge(badgeId, badgeData) {
        if (this.firebaseService) {
            return await this.firebaseService.saveBadge(badgeId, badgeData);
        }
        return false;
    }

    async getBadges() {
        if (this.firebaseService) {
            return await this.firebaseService.getBadges();
        }
        return {};
    }

    async updateBadgeProgress(badgeId, progress) {
        if (this.firebaseService) {
            return await this.firebaseService.updateBadgeProgress(badgeId, progress);
        }
        return false;
    }

    async updateXP(xp) {
        if (this.firebaseService) {
            return await this.firebaseService.updateXP(xp);
        }
        return false;
    }

    async updateLevel(level) {
        if (this.firebaseService) {
            return await this.firebaseService.updateLevel(level);
        }
        return false;
    }

    async updateCurrency(currency) {
        if (this.firebaseService) {
            return await this.firebaseService.updateCurrency(currency);
        }
        return false;
    }

    async getProgress() {
        if (this.firebaseService) {
            return await this.firebaseService.getProgress();
        }
        return null;
    }

    async updateProgress(progress) {
        if (this.firebaseService) {
            return await this.firebaseService.updateProgress(progress);
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

    // Témák kezelése
    async getThemes() {
        if (this.firebaseService) {
            return await this.firebaseService.getThemes();
        }
        return null;
    }

    async saveTheme(themeData) {
        if (this.firebaseService) {
            return await this.firebaseService.saveTheme(themeData);
        }
        return false;
    }

    async updateTheme(themeId, updates) {
        if (this.firebaseService) {
            return await this.firebaseService.updateTheme(themeId, updates);
        }
        return false;
    }

    async deleteTheme(themeId) {
        if (this.firebaseService) {
            return await this.firebaseService.deleteTheme(themeId);
        }
        return false;
    }
}

// Export for use in other modules
window.FirebaseServiceModule = FirebaseServiceModule; 