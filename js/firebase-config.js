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
                return snapshot.val();
            } else {
                // Create new user with default data
                const defaultUserData = {
                    group: null,
                    level: 1,
                    xp: 0,
                    streak: 0,
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

    // Update user streak
    async updateStreak(streak) {
        return await this.updateUserField('streak', streak);
    }

    // Update user XP
    async updateXP(xp) {
        return await this.updateUserField('xp', xp);
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
}

// Export for use in other modules
window.FirebaseService = FirebaseService;
window.FirebaseServiceModule = FirebaseService;
window.firebaseConfig = firebaseConfig;
window.initializeFirebase = initializeFirebase; 