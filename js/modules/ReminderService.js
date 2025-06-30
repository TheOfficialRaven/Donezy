class ReminderService {
    constructor() {
        this.audio = null;
        this.reminderModal = null;
        this.currentReminder = null;
        this.checkInterval = null;
        this.isPlaying = false;
        this.calendarService = null;
        this.init();
    }

    // Inicializálás
    async init() {
        // Web Notifications engedély kérése
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                await Notification.requestPermission();
            }
        }

        // Hang inicializálása
        this.initAudio();
        
        // CalendarService importálása
        await this.initCalendarService();
        
        // Emlékeztető ellenőrzés indítása
        this.startReminderCheck();
    }

    // CalendarService inicializálása
    async initCalendarService() {
        try {
            const calendarModule = await import('./CalendarService.js');
            this.calendarService = calendarModule.default;
            console.log('ReminderService: CalendarService loaded');
        } catch (error) {
            console.error('ReminderService: Error loading CalendarService:', error);
        }
    }

    // Hang inicializálása
    initAudio() {
        this.audio = new Audio();
        this.audio.loop = true;
        // Alapértelmezett hang (később lehet testreszabni)
        this.audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
    }

    // Emlékeztető ellenőrzés indítása
    startReminderCheck() {
        // Minden percben ellenőrizzük
        this.checkInterval = setInterval(() => {
            this.checkReminders();
        }, 60000); // 1 perc

        // Azonnal is ellenőrizzük
        this.checkReminders();
    }

    // Emlékeztetők ellenőrzése
    async checkReminders() {
        try {
            // Várunk, amíg a CalendarService elérhető
            if (!this.calendarService) {
                await this.initCalendarService();
            }
            
            if (!this.calendarService) {
                console.log('ReminderService: CalendarService not available yet');
                return;
            }
            
            const upcomingReminders = await this.calendarService.getUpcomingReminders();
            const now = new Date();

            for (const reminder of upcomingReminders) {
                const reminderTime = new Date(reminder.reminderTime);
                
                // Ha az emlékeztető ideje eljött
                if (reminderTime <= now && !reminder.shown) {
                    await this.showReminder(reminder);
                }
            }
        } catch (error) {
            console.error('Hiba az emlékeztetők ellenőrzésekor:', error);
        }
    }

    // Emlékeztető megjelenítése
    async showReminder(event) {
        // Ha már van aktív emlékeztető, ne jelenjen meg új
        if (this.currentReminder) {
            return;
        }

        this.currentReminder = event;

        // Web Notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('📅 Esemény emlékeztető', {
                body: `${event.title} - ${event.time}`,
                icon: '/imgs/Essence.svg',
                tag: event.id,
                requireInteraction: true
            });
        }

        // Modal megjelenítése
        this.showReminderModal(event);

        // Hang lejátszása
        this.playAlarm();
    }

    // Emlékeztető modal megjelenítése
    showReminderModal(event) {
        // Régi modal eltávolítása
        if (this.reminderModal) {
            document.body.removeChild(this.reminderModal);
        }

        // Új modal létrehozása
        this.reminderModal = document.createElement('div');
        this.reminderModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        this.reminderModal.innerHTML = `
            <div class="bg-donezy-card rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border-2 border-donezy-orange">
                <div class="text-center">
                    <div class="text-4xl mb-4">⏰</div>
                    <h2 class="text-xl font-bold text-donezy-orange mb-2">Esemény emlékeztető</h2>
                    <div class="text-lg font-semibold text-white mb-2">${event.title}</div>
                    <div class="text-secondary mb-4">${event.time} - ${event.date}</div>
                    ${event.description ? `<p class="text-muted mb-4">${event.description}</p>` : ''}
                    <div class="flex gap-2">
                        <button id="reminder-ok" class="flex-1 bg-success hover:bg-success-hover text-white font-bold py-3 px-4 rounded-lg transition-colors">
                            ✅ Oké
                        </button>
                        <button id="reminder-snooze" class="flex-1 bg-info hover:bg-info-hover text-white font-bold py-3 px-4 rounded-lg transition-colors">
                            🔁 Késleltetés 5 perc
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Event listeners
        this.reminderModal.querySelector('#reminder-ok').addEventListener('click', () => {
            this.dismissReminder();
        });

        this.reminderModal.querySelector('#reminder-snooze').addEventListener('click', () => {
            this.snoozeReminder();
        });

        // Modal hozzáadása a DOM-hoz
        document.body.appendChild(this.reminderModal);

        // Modal automatikus fókusz
        this.reminderModal.focus();
    }

    // Hang lejátszása
    playAlarm() {
        if (this.audio && !this.isPlaying) {
            this.isPlaying = true;
            this.audio.play().catch(error => {
                console.error('Hiba a hang lejátszásakor:', error);
                this.isPlaying = false;
            });
        }
    }

    // Hang leállítása
    stopAlarm() {
        if (this.audio && this.isPlaying) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.isPlaying = false;
        }
    }

    // Emlékeztető elutasítása
    dismissReminder() {
        this.stopAlarm();
        
        if (this.reminderModal) {
            document.body.removeChild(this.reminderModal);
            this.reminderModal = null;
        }

        this.currentReminder = null;
    }

    // Emlékeztető késleltetése
    async snoozeReminder() {
        this.stopAlarm();
        
        if (this.reminderModal) {
            document.body.removeChild(this.reminderModal);
            this.reminderModal = null;
        }

        // 5 perccel később újra megjelenítjük
        setTimeout(() => {
            if (this.currentReminder) {
                this.showReminder(this.currentReminder);
            }
        }, 5 * 60 * 1000); // 5 perc

        this.currentReminder = null;
    }

    // Emlékeztető idő kiszámítása
    calculateReminderTime(eventDate, eventTime, reminderOffset) {
        const eventDateTime = new Date(`${eventDate}T${eventTime}`);
        const reminderTime = new Date(eventDateTime.getTime() - reminderOffset);
        return reminderTime.toISOString();
    }

    // Service leállítása
    destroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        
        this.stopAlarm();
        
        if (this.reminderModal) {
            document.body.removeChild(this.reminderModal);
        }
    }
}

// Singleton instance
const reminderService = new ReminderService();
export default reminderService; 