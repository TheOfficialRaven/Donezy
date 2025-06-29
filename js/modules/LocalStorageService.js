// Local Storage Service Module - Fallback for when Firebase is not available
class LocalStorageService {
    constructor() {
        this.userId = this.getCurrentUserId();
        console.log('LocalStorageService initialized with userId:', this.userId);
    }

    getCurrentUserId() {
        let userId = localStorage.getItem('donezy_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('donezy_user_id', userId);
        }
        return userId;
    }

    async getUserData() {
        const userId = this.getCurrentUserId();
        const data = localStorage.getItem(`donezy_user_${userId}`);
        console.log('getUserData - userId:', userId, 'data:', data);
        
        if (data) {
            try {
                const parsedData = JSON.parse(data);
                console.log('getUserData - parsed data:', parsedData);
                
                // Ensure all required fields exist
                const defaultData = {
                    group: null,
                    level: 1,
                    xp: 0,
                    streak: 0,
                    createdAt: new Date().toISOString(),
                    lastActive: new Date().toISOString()
                };
                
                const completeData = { ...defaultData, ...parsedData };
                console.log('getUserData - complete data:', completeData);
                return completeData;
            } catch (error) {
                console.error('Error parsing user data:', error);
                // Return default data if parsing fails
                const defaultData = {
                    group: null,
                    level: 1,
                    xp: 0,
                    streak: 0,
                    createdAt: new Date().toISOString(),
                    lastActive: new Date().toISOString()
                };
                console.log('getUserData - returning default data after parse error:', defaultData);
                return defaultData;
            }
        } else {
            // No user data exists yet, return default data
            const defaultData = {
                group: null,
                level: 1,
                xp: 0,
                streak: 0,
                createdAt: new Date().toISOString(),
                lastActive: new Date().toISOString()
            };
            console.log('getUserData - returning default data:', defaultData);
            return defaultData;
        }
    }

    async saveUserData(userData) {
        const userId = this.getCurrentUserId();
        localStorage.setItem(`donezy_user_${userId}`, JSON.stringify({
            ...userData,
            lastActive: new Date().toISOString()
        }));
        return true;
    }

    async updateUserField(field, value) {
        const userData = await this.getUserData();
        userData[field] = value;
        return await this.saveUserData(userData);
    }

    async saveUserGroup(group) {
        return await this.updateUserField('group', group);
    }

    async getUserGroup() {
        const userData = await this.getUserData();
        console.log('getUserGroup - userData:', userData);
        
        // Ensure we have valid user data
        if (!userData) {
            console.log('getUserGroup - no user data, returning null');
            return null;
        }
        
        const group = userData.group;
        console.log('getUserGroup - group value:', group);
        
        // Return null for undefined, null, or empty string
        if (group === undefined || group === null || group === '') {
            console.log('getUserGroup - returning null for invalid group value');
            return null;
        }
        
        console.log('getUserGroup - returning group:', group);
        return group;
    }

    async updateStreak(streak) {
        return await this.updateUserField('streak', streak);
    }

    async updateXP(xp) {
        return await this.updateUserField('xp', xp);
    }

    async saveItem(type, title, description) {
        const userId = this.getCurrentUserId();
        const itemId = `${type}_${Date.now()}`;
        const items = JSON.parse(localStorage.getItem(`donezy_items_${userId}`) || '[]');
        
        const itemData = {
            id: itemId,
            type: type,
            title: title,
            description: description,
            createdAt: new Date().toISOString(),
            completed: false
        };
        
        items.push(itemData);
        localStorage.setItem(`donezy_items_${userId}`, JSON.stringify(items));
        return itemId;
    }

    async getUserItems() {
        const userId = this.getCurrentUserId();
        const items = localStorage.getItem(`donezy_items_${userId}`);
        return items ? JSON.parse(items) : [];
    }

    async testConnection() {
        return true; // Local storage is always available
    }

    getConnectionStatus() {
        return {
            connected: false,
            userId: this.getCurrentUserId(),
            projectId: 'local-storage-fallback'
        };
    }

    logActivity(action, data = {}) {
        console.log('Local storage activity:', action, data);
        return true;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocalStorageService;
} else {
    window.LocalStorageService = LocalStorageService;
} 