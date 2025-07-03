// CalendarService.js
// Firebase CRUD for calendar events

class CalendarService {
    constructor() {
        this.db = null;
        this.currentUserId = null;
        this.initialized = false;
    }

    // Firebase inicializálása
    async init() {
        try {
            // Ellenőrizzük, hogy a Firebase elérhető-e
            if (typeof firebase === 'undefined') {
                console.warn('Firebase not available');
                return false;
            }

            // Várunk, amíg a Firebase inicializálódik
            let attempts = 0;
            while (attempts < 10) {
                try {
                    this.db = firebase.database();
                    this.initialized = true;
                    console.log('CalendarService Firebase initialized');
                    return true;
                } catch (error) {
                    if (error.code === 'app/no-app') {
                        console.log('Firebase not ready yet, waiting...');
                        await new Promise(resolve => setTimeout(resolve, 500));
                        attempts++;
                    } else {
                        throw error;
                    }
                }
            }
            
            console.error('Firebase initialization timeout');
            return false;
        } catch (error) {
            console.error('CalendarService init error:', error);
            return false;
        }
    }

    // Felhasználó beállítása
    setCurrentUser(userId) {
        this.currentUserId = userId;
    }

    // Esemény hozzáadása
    async addEvent(eventData) {
        if (!this.initialized) {
            await this.init();
        }

        if (!this.currentUserId) {
            throw new Error('Nincs bejelentkezett felhasználó');
        }

        if (!this.db) {
            throw new Error('Firebase adatbázis nem elérhető');
        }

        const eventId = Date.now().toString();
        const eventRef = this.db.ref(`users/${this.currentUserId}/calendar/${eventId}`);
        
        const event = {
            id: eventId,
            date: eventData.date,
            time: eventData.time,
            title: eventData.title,
            description: eventData.description || '',
            category: eventData.category,
            reminderEnabled: eventData.reminderEnabled || false,
            reminderTime: eventData.reminderTime || null,
            createdAt: Date.now()
        };

        await eventRef.set(event);
        
        // Track mission progress
        if (window.MissionService && window.MissionService.trackActivity) {
            await window.MissionService.trackActivity('events_created', 1);
        }
        
        return eventId;
    }

    // Események lekérése egy hónapra
    async getEventsForMonth(year, month) {
        if (!this.initialized) {
            await this.init();
        }

        if (!this.currentUserId) {
            return [];
        }

        if (!this.db) {
            console.warn('Firebase not available, returning empty events');
            return [];
        }

        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
        
        const eventsRef = this.db.ref(`users/${this.currentUserId}/calendar`);

        try {
            const snapshot = await eventsRef.once('value');
            const events = [];
            
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const event = childSnapshot.val();
                    if (event.date >= startDate && event.date <= endDate) {
                        events.push(event);
                    }
                });
            }
            
            return events;
        } catch (error) {
            console.error('Hiba az események lekérésekor:', error);
            return [];
        }
    }

    // Esemény törlése
    async deleteEvent(eventId) {
        if (!this.initialized) {
            await this.init();
        }

        if (!this.currentUserId) {
            throw new Error('Nincs bejelentkezett felhasználó');
        }

        if (!this.db) {
            throw new Error('Firebase adatbázis nem elérhető');
        }

        const eventRef = this.db.ref(`users/${this.currentUserId}/calendar/${eventId}`);
        await eventRef.remove();
    }

    // Esemény frissítése
    async updateEvent(eventId, eventData) {
        if (!this.initialized) {
            await this.init();
        }

        if (!this.currentUserId) {
            throw new Error('Nincs bejelentkezett felhasználó');
        }

        if (!this.db) {
            throw new Error('Firebase adatbázis nem elérhető');
        }

        const eventRef = this.db.ref(`users/${this.currentUserId}/calendar/${eventId}`);
        
        const updatedEvent = {
            ...eventData,
            id: eventId,
            updatedAt: Date.now()
        };

        await eventRef.set(updatedEvent);
    }

    // Események lekérése egy napra
    async getEventsForDate(date) {
        if (!this.initialized) {
            await this.init();
        }

        if (!this.currentUserId) {
            return [];
        }

        if (!this.db) {
            console.warn('Firebase not available, returning empty events');
            return [];
        }

        const eventsRef = this.db.ref(`users/${this.currentUserId}/calendar`);

        try {
            const snapshot = await eventsRef.once('value');
            const events = [];
            
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const event = childSnapshot.val();
                    if (event.date === date) {
                        events.push(event);
                    }
                });
            }
            
            return events.sort((a, b) => a.time.localeCompare(b.time));
        } catch (error) {
            console.error('Hiba az események lekérésekor:', error);
            return [];
        }
    }

    // Emlékeztetőkhöz szükséges események lekérése
    async getUpcomingReminders() {
        if (!this.initialized) {
            await this.init();
        }

        if (!this.currentUserId) {
            return [];
        }

        if (!this.db) {
            console.warn('Firebase not available, returning empty reminders');
            return [];
        }

        const now = new Date();
        const eventsRef = this.db.ref(`users/${this.currentUserId}/calendar`);
        
        try {
            const snapshot = await eventsRef.once('value');
            const events = [];
            
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const event = childSnapshot.val();
                    if (event.reminderEnabled && event.reminderTime) {
                        const reminderTime = new Date(event.reminderTime);
                        if (reminderTime > now) {
                            events.push(event);
                        }
                    }
                });
            }
            
            return events.sort((a, b) => new Date(a.reminderTime) - new Date(b.reminderTime));
        } catch (error) {
            console.error('Hiba az emlékeztetők lekérésekor:', error);
            return [];
        }
    }
}

// Singleton instance
const calendarService = new CalendarService();
export default calendarService; 