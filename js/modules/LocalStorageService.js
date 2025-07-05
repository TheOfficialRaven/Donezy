// Local Storage Service Module - Fallback for when Firebase is not available
class LocalStorageService {
    constructor() {
        this.userId = this.getCurrentUserId();
        this.isReady = true; // LocalStorage is always ready
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

    // Get ready status
    getReadyStatus() {
        return this.isReady;
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
                    currentStreak: 0,
                    totalActiveDays: 0,
                    questsCompleted: 0,
                    totalQuests: 0,
                    tasksCompleted: 0,
                    notesCreated: 0,
                    listsCreated: 0,
                    createdAt: new Date().toISOString(),
                    lastActive: new Date().toISOString(),
                    lastActiveDate: new Date().toISOString().split('T')[0]
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
                    currentStreak: 0,
                    totalActiveDays: 0,
                    questsCompleted: 0,
                    totalQuests: 0,
                    tasksCompleted: 0,
                    notesCreated: 0,
                    listsCreated: 0,
                    createdAt: new Date().toISOString(),
                    lastActive: new Date().toISOString(),
                    lastActiveDate: new Date().toISOString().split('T')[0]
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
                currentStreak: 0,
                totalActiveDays: 0,
                questsCompleted: 0,
                totalQuests: 0,
                tasksCompleted: 0,
                notesCreated: 0,
                listsCreated: 0,
                createdAt: new Date().toISOString(),
                lastActive: new Date().toISOString(),
                lastActiveDate: new Date().toISOString().split('T')[0]
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
        return await this.updateUserField('currentStreak', streak);
    }

    async updateStreakWithLogic() {
        try {
            const userData = await this.getUserData();
            const today = new Date().toISOString().split('T')[0];
            const lastActiveDate = userData.lastActiveDate || null;
            const currentStreak = userData.currentStreak || 0;
            
            let newStreak = currentStreak;
            let shouldUpdate = false;
            
            // Check if user was active today (simplified for localStorage)
            const wasActiveToday = true; // Assume active for localStorage
            
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

    getYesterdayDate() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    }

    async logCompletedTask(taskData = {}) {
        try {
            const userId = this.getCurrentUserId();
            const today = new Date().toISOString().split('T')[0];
            const completedTasksKey = `donezy_completed_tasks_${userId}`;
            
            // Get current day's completed tasks
            const allCompletedTasks = JSON.parse(localStorage.getItem(completedTasksKey) || '{}');
            const currentTasks = allCompletedTasks[today] || { count: 0, tasks: [] };
            
            // Add new completed task
            currentTasks.count = (currentTasks.count || 0) + 1;
            currentTasks.tasks.push({
                id: taskData.id || `task_${Date.now()}`,
                title: taskData.title || 'Completed Task',
                completedAt: new Date().toISOString(),
                ...taskData
            });
            
            // Save updated completed tasks
            allCompletedTasks[today] = currentTasks;
            localStorage.setItem(completedTasksKey, JSON.stringify(allCompletedTasks));
            
            return true;
        } catch (error) {
            console.error('Error logging completed task:', error);
            return false;
        }
    }

    async getCompletedTasks(startDate, endDate) {
        try {
            const userId = this.getCurrentUserId();
            const completedTasksKey = `donezy_completed_tasks_${userId}`;
            const allTasks = JSON.parse(localStorage.getItem(completedTasksKey) || '{}');
            
            const filteredTasks = {};
            Object.entries(allTasks).forEach(([date, dayData]) => {
                if (date >= startDate && date <= endDate) {
                    filteredTasks[date] = dayData;
                }
            });
            
            return filteredTasks;
        } catch (error) {
            console.error('Error getting completed tasks:', error);
            return {};
        }
    }

    async saveBadge(badgeId, badgeData) {
        try {
            const userId = this.getCurrentUserId();
            const badgesKey = `donezy_badges_${userId}`;
            const badges = JSON.parse(localStorage.getItem(badgesKey) || '{}');
            
            badges[badgeId] = {
                ...badgeData,
                lastUpdated: new Date().toISOString()
            };
            
            localStorage.setItem(badgesKey, JSON.stringify(badges));
            return true;
        } catch (error) {
            console.error('Error saving badge:', error);
            return false;
        }
    }

    async getBadges() {
        try {
            const userId = this.getCurrentUserId();
            const badgesKey = `donezy_badges_${userId}`;
            const badges = JSON.parse(localStorage.getItem(badgesKey) || '{}');
            return badges;
        } catch (error) {
            console.error('Error getting badges:', error);
            return {};
        }
    }

    async updateBadgeProgress(badgeId, progress) {
        try {
            const userId = this.getCurrentUserId();
            const badgesKey = `donezy_badges_${userId}`;
            const badges = JSON.parse(localStorage.getItem(badgesKey) || '{}');
            
            if (badges[badgeId]) {
                badges[badgeId].progress = progress;
                badges[badgeId].lastUpdated = new Date().toISOString();
                localStorage.setItem(badgesKey, JSON.stringify(badges));
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error updating badge progress:', error);
            return false;
        }
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

    // Témák kezelése - fallback methods
    async getThemes() {
        // Return null for local storage - themes are handled by ThemeService defaults
        return null;
    }

    async saveTheme(themeData) {
        // Store theme in localStorage for local storage mode
        const themes = JSON.parse(localStorage.getItem('donezy_themes') || '{}');
        themes[themeData.id] = themeData;
        localStorage.setItem('donezy_themes', JSON.stringify(themes));
        return true;
    }

    async updateTheme(themeId, updates) {
        const themes = JSON.parse(localStorage.getItem('donezy_themes') || '{}');
        if (themes[themeId]) {
            themes[themeId] = { ...themes[themeId], ...updates };
            localStorage.setItem('donezy_themes', JSON.stringify(themes));
            return true;
        }
        return false;
    }

    async deleteTheme(themeId) {
        const themes = JSON.parse(localStorage.getItem('donezy_themes') || '{}');
        if (themes[themeId]) {
            delete themes[themeId];
            localStorage.setItem('donezy_themes', JSON.stringify(themes));
            return true;
        }
        return false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocalStorageService;
} else {
    window.LocalStorageService = LocalStorageService;
} 