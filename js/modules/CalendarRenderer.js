// CalendarRenderer.js
// Modern havi naptárnézet Donezy-hez

import calendarService from './CalendarService.js';
import reminderService from './ReminderService.js';

class CalendarRenderer {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.events = [];
        this.categories = [
            { id: 'tanulás', name: 'Tanulás', color: 'bg-blue-500', textColor: 'text-blue-100' },
            { id: 'vizsga', name: 'Vizsga', color: 'bg-red-500', textColor: 'text-red-100' },
            { id: 'személyes', name: 'Személyes', color: 'bg-green-500', textColor: 'text-green-100' },
            { id: 'munka', name: 'Munka', color: 'bg-purple-500', textColor: 'text-purple-100' },
            { id: 'egészség', name: 'Egészség', color: 'bg-pink-500', textColor: 'text-pink-100' }
        ];
        this.init();
    }

    // Inicializálás
    async init() {
        this.container = document.getElementById('calendar-section');
        if (!this.container) {
            console.error('Calendar section nem található');
            return;
        }

        // Felhasználó beállítása (ha van)
        if (window.currentUserId) {
            calendarService.setCurrentUser(window.currentUserId);
        }

        this.render();
        this.loadEvents();
    }

    // Fő renderelés
    render() {
        this.container.innerHTML = `
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-donezy-orange mb-4 flex items-center gap-2">
                    <span class="text-2xl">📅</span>
                    Naptár
                </h1>
            </div>
            
            <!-- Naptár kontrollok -->
            <div class="bg-donezy-card rounded-xl p-6 shadow-lg border border-donezy-accent mb-6">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <button id="prev-month" class="bg-donezy-accent hover:bg-donezy-orange text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            ← Előző
                        </button>
                        <h2 id="current-month" class="text-xl font-bold text-white"></h2>
                        <button id="next-month" class="bg-donezy-accent hover:bg-donezy-orange text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            Következő →
                        </button>
                    </div>
                    <button id="today-btn" class="bg-donezy-orange hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        Ma
                    </button>
                </div>
            </div>

            <!-- Naptár grid -->
            <div class="bg-donezy-card rounded-xl p-6 shadow-lg border border-donezy-accent">
                <!-- Napok fejléce -->
                <div class="grid grid-cols-7 gap-1 mb-2">
                    <div class="text-center text-gray-400 font-semibold p-2">H</div>
                    <div class="text-center text-gray-400 font-semibold p-2">K</div>
                    <div class="text-center text-gray-400 font-semibold p-2">Sze</div>
                    <div class="text-center text-gray-400 font-semibold p-2">Cs</div>
                    <div class="text-center text-gray-400 font-semibold p-2">P</div>
                    <div class="text-center text-gray-400 font-semibold p-2">Szo</div>
                    <div class="text-center text-gray-400 font-semibold p-2">V</div>
                </div>
                
                <!-- Naptár rács -->
                <div id="calendar-grid" class="grid grid-cols-7 gap-1">
                    <!-- JS tölti be -->
                </div>
            </div>
            <div id="calendar-day-events" class="mt-8"></div>

            <!-- Esemény hozzáadás modal -->
            <div id="event-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
                <div class="bg-donezy-card rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-donezy-accent">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-bold text-donezy-orange">Új esemény</h3>
                        <button id="close-event-modal" class="text-gray-400 hover:text-white text-2xl">&times;</button>
                    </div>
                    
                    <form id="event-form" class="space-y-4">
                        <div>
                            <label class="block text-gray-300 text-sm font-bold mb-2">Cím *</label>
                            <input type="text" id="event-title" required 
                                   class="w-full bg-donezy-accent border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-donezy-orange">
                        </div>
                        
                        <div>
                            <label class="block text-gray-300 text-sm font-bold mb-2">Leírás</label>
                            <textarea id="event-description" rows="3"
                                      class="w-full bg-donezy-accent border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-donezy-orange"></textarea>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-gray-300 text-sm font-bold mb-2">Dátum *</label>
                                <input type="date" id="event-date" required
                                       class="w-full bg-donezy-accent border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-donezy-orange">
                            </div>
                            <div>
                                <label class="block text-gray-300 text-sm font-bold mb-2">Idő *</label>
                                <input type="time" id="event-time" required
                                       class="w-full bg-donezy-accent border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-donezy-orange">
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-gray-300 text-sm font-bold mb-2">Kategória *</label>
                            <select id="event-category" required
                                    class="w-full bg-donezy-accent border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-donezy-orange">
                                <option value="">Válassz kategóriát...</option>
                                ${this.categories.map(cat => 
                                    `<option value="${cat.id}">${cat.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div class="space-y-3">
                            <label class="flex items-center">
                                <input type="checkbox" id="event-reminder" class="mr-2">
                                <span class="text-gray-300">Emlékeztető</span>
                            </label>
                            
                            <div id="reminder-options" class="hidden space-y-2 ml-6">
                                <label class="flex items-center">
                                    <input type="radio" name="reminder-time" value="15" class="mr-2">
                                    <span class="text-gray-300">15 perccel előtte</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="radio" name="reminder-time" value="30" class="mr-2">
                                    <span class="text-gray-300">30 perccel előtte</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="radio" name="reminder-time" value="60" class="mr-2">
                                    <span class="text-gray-300">1 órával előtte</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="radio" name="reminder-time" value="1440" class="mr-2">
                                    <span class="text-gray-300">1 nappal előtte</span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="flex gap-3 pt-4">
                            <button type="submit" class="flex-1 bg-donezy-orange hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                                Mentés
                            </button>
                            <button type="button" id="cancel-event" class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                                Mégse
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        this.attachEventListeners();
        this.updateMonthDisplay();
        this.renderCalendarGrid();
    }

    // Event listeners csatlakoztatása
    attachEventListeners() {
        // Naptár navigáció
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.updateMonthDisplay();
            this.renderCalendarGrid();
            this.loadEvents();
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.updateMonthDisplay();
            this.renderCalendarGrid();
            this.loadEvents();
        });

        document.getElementById('today-btn').addEventListener('click', () => {
            this.currentDate = new Date();
            this.updateMonthDisplay();
            this.renderCalendarGrid();
            this.loadEvents();
        });

        // Modal kezelés
        document.getElementById('close-event-modal').addEventListener('click', () => {
            this.hideEventModal();
        });

        document.getElementById('cancel-event').addEventListener('click', () => {
            this.hideEventModal();
        });

        // Emlékeztető checkbox
        document.getElementById('event-reminder').addEventListener('change', (e) => {
            const reminderOptions = document.getElementById('reminder-options');
            reminderOptions.classList.toggle('hidden', !e.target.checked);
        });

        // Esemény form
        document.getElementById('event-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEvent();
        });
    }

    // Hónap megjelenítés frissítése
    updateMonthDisplay() {
        const monthNames = [
            'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
            'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'
        ];
        
        const monthElement = document.getElementById('current-month');
        monthElement.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
    }

    // Naptár rács renderelése
    renderCalendarGrid() {
        const grid = document.getElementById('calendar-grid');
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Hónap első napja és utolsó napja
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Hónap első napjának napja (0 = vasárnap, 1 = hétfő, ... 6 = szombat)
        let firstDayOfWeek = firstDay.getDay();
        if (firstDayOfWeek === 0) firstDayOfWeek = 7;
        
        let html = '';
        // Üres cellák a hónap első napja előtt
        for (let i = 1; i < firstDayOfWeek; i++) {
            html += `<div class="bg-gray-800 rounded-lg p-2 min-h-[110px] h-24 w-24 text-gray-500 text-sm"></div>`;
        }
        
        // Aktuális hónap napjai
        const today = new Date();
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            const isToday = date.toDateString() === today.toDateString();
            const dateString = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const dayEvents = this.events.filter(event => event.date === dateString);
            const isSelected = this.selectedDate === dateString;
            // Színes pötty, ha van esemény
            let eventDot = '';
            if (dayEvents.length > 0) {
                // Több kategória esetén az első esemény kategóriájának színét használjuk
                const cat = this.categories.find(cat => cat.id === dayEvents[0].category);
                eventDot = `<span class='absolute top-2 left-2 w-3 h-3 rounded-full ${cat ? cat.color : 'bg-donezy-orange'} border-2 border-white'></span>`;
            }
            html += `
                <div class="relative bg-donezy-accent rounded-lg p-3 min-h-[110px] h-24 w-24 cursor-pointer hover:bg-donezy-orange/20 transition-colors ${isToday ? 'ring-2 ring-donezy-orange' : ''} ${isSelected ? 'ring-4 ring-donezy-orange' : ''} flex flex-col justify-between items-end select-none" 
                     data-date="${dateString}">
                    ${eventDot}
                    <div class="text-right text-lg font-bold ${isToday ? 'text-donezy-orange' : 'text-white'}">${day}</div>
                    <div class="mt-1 w-full space-y-1">
                        ${dayEvents.slice(0, 2).map(event => `
                            <div class="text-xs p-1 rounded ${this.getCategoryColor(event.category)} truncate" title="${event.title}">
                                ${event.time} ${event.title}
                            </div>
                        `).join('')}
                        ${dayEvents.length > 2 ? `<div class="text-xs text-gray-400">+${dayEvents.length - 2} további</div>` : ''}
                    </div>
                </div>
            `;
        }
        // Következő hónap napjai (7 oszlop teljesítéséhez)
        const totalCells = Math.ceil((firstDayOfWeek - 1 + lastDay.getDate()) / 7) * 7;
        const remainingCells = totalCells - (firstDayOfWeek - 1 + lastDay.getDate());
        for (let i = 0; i < remainingCells; i++) {
            html += `<div class="bg-gray-800 rounded-lg p-2 min-h-[110px] h-24 w-24 text-gray-500 text-sm"></div>`;
        }
        grid.innerHTML = html;
        // Nap kattintás események
        grid.querySelectorAll('[data-date]').forEach(cell => {
            cell.addEventListener('click', () => {
                this.selectedDate = cell.dataset.date;
                this.renderCalendarGrid(); // Kiemelés frissítése
                this.renderSelectedDayEvents(); // Események listázása
            });
        });
        // Ha van kiválasztott nap, események listázása
        this.renderSelectedDayEvents();
    }

    // Új szekció: kiválasztott nap eseményei a naptár alatt
    renderSelectedDayEvents() {
        let container = document.getElementById('calendar-day-events');
        if (!container) return;
        container.innerHTML = '';
        if (!this.selectedDate) {
            container.innerHTML = `<div class='text-center text-gray-400 italic'>Válassz egy napot az események megtekintéséhez.</div>`;
            return;
        }
        const events = this.events.filter(e => e.date === this.selectedDate);
        // Hozzáad gomb HTML
        const addBtn = `<button id="add-event-btn" class="mb-4 bg-donezy-orange hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-colors w-full text-lg flex items-center justify-center gap-2"><span>➕</span> Esemény hozzáadása</button>`;
        let eventsHtml = '';
        if (events.length === 0) {
            eventsHtml = `<div class='text-center text-gray-400 italic'>Nincs esemény erre a napra.</div>`;
        } else {
            eventsHtml = `
                <ul class='space-y-4'>
                    ${events.map(event => `
                        <li class='flex flex-col md:flex-row md:items-center md:gap-6 bg-donezy-accent rounded-lg p-4'>
                            <div class='flex items-center gap-3 mb-2 md:mb-0'>
                                <span class='inline-block w-3 h-3 rounded-full ${this.getCategoryColor(event.category)}'></span>
                                <span class='font-bold text-lg text-white'>${event.title}</span>
                                <span class='text-sm text-gray-400 ml-2'>${event.time}</span>
                            </div>
                            <div class='flex-1 text-gray-300'>${event.description ? event.description : ''}</div>
                            <span class='ml-auto px-2 py-1 rounded ${this.getCategoryColor(event.category)} text-xs'>${this.categories.find(cat => cat.id === event.category)?.name || ''}</span>
                        </li>
                    `).join('')}
                </ul>
            `;
        }
        container.innerHTML = `
            <div class='bg-donezy-card rounded-xl p-6 shadow-lg border border-donezy-accent'>
                <h3 class='text-xl font-bold text-donezy-orange mb-4 flex items-center gap-2'>
                    <span>📅</span> Események: <span class='ml-2 text-white'>${this.selectedDate}</span>
                </h3>
                ${addBtn}
                ${eventsHtml}
            </div>
        `;
        // Gomb eseménykezelő
        const addEventBtn = document.getElementById('add-event-btn');
        if (addEventBtn) {
            addEventBtn.addEventListener('click', () => {
                this.showEventModal();
            });
        }
    }

    // Kategória szín lekérése
    getCategoryColor(categoryId) {
        const category = this.categories.find(cat => cat.id === categoryId);
        return category ? `${category.color} ${category.textColor}` : 'bg-gray-500 text-gray-100';
    }

    // Események betöltése
    async loadEvents() {
        try {
            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth() + 1;
            this.events = await calendarService.getEventsForMonth(year, month);
            this.renderCalendarGrid();
        } catch (error) {
            console.error('Hiba az események betöltésekor:', error);
        }
    }

    // Esemény modal megjelenítése
    showEventModal() {
        const modal = document.getElementById('event-modal');
        const dateInput = document.getElementById('event-date');
        
        // Kiválasztott dátum beállítása
        if (this.selectedDate) {
            dateInput.value = this.selectedDate;
        }
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // Fókusz az első inputra
        document.getElementById('event-title').focus();
    }

    // Esemény modal elrejtése
    hideEventModal() {
        const modal = document.getElementById('event-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        
        // Form reset
        document.getElementById('event-form').reset();
        document.getElementById('reminder-options').classList.add('hidden');
    }

    // Esemény mentése
    async saveEvent() {
        try {
            const formData = {
                title: document.getElementById('event-title').value,
                description: document.getElementById('event-description').value,
                date: document.getElementById('event-date').value,
                time: document.getElementById('event-time').value,
                category: document.getElementById('event-category').value,
                reminderEnabled: document.getElementById('event-reminder').checked,
                reminderTime: null
            };

            // Emlékeztető idő kiszámítása
            if (formData.reminderEnabled) {
                const reminderTimeRadio = document.querySelector('input[name="reminder-time"]:checked');
                if (reminderTimeRadio) {
                    const offsetMinutes = parseInt(reminderTimeRadio.value);
                    const eventDateTime = new Date(`${formData.date}T${formData.time}`);
                    const reminderTime = new Date(eventDateTime.getTime() - (offsetMinutes * 60 * 1000));
                    formData.reminderTime = reminderTime.toISOString();
                }
            }

            await calendarService.addEvent(formData);
            
            this.hideEventModal();
            this.loadEvents();
            
            // Sikeres mentés üzenet
            this.showNotification('Esemény sikeresen mentve!', 'success');
            
        } catch (error) {
            console.error('Hiba az esemény mentésekor:', error);
            this.showNotification('Hiba az esemény mentésekor!', 'error');
        }
    }

    // Értesítés megjelenítése
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-600' : 
            type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        } text-white`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }

    // Felhasználó beállítása
    setCurrentUser(userId) {
        calendarService.setCurrentUser(userId);
    }
}

// Singleton instance
const calendarRenderer = new CalendarRenderer();
export default calendarRenderer; 