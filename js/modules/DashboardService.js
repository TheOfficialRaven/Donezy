// DashboardService.js
// Firebase integrált dashboard szolgáltatás

window.DashboardService = (function() {
    let currentUserId = null;
    let dataService = null;
    let updateInterval = null;
    let motivationalQuotes = [
        "A tudás az egyetlen kincs, amit nem vehetnek el tőled.",
        "A siker nem véletlen, hanem következetes erőfeszítés eredménye.",
        "Minden nagy út egyetlen lépéssel kezdődik.",
        "A jövő azoké, akik hisznek szép álmuk szépségében.",
        "A tanulás nem véget ér, amíg az utolsó lélegzetet ki nem lélegzed.",
        "A kitartás a siker kulcsa.",
        "Minden nap új lehetőség a fejlődésre.",
        "A célok nélkül az élet csak egy véletlenszerű eseménysorozat.",
        "A legjobb befektetés a tudásba.",
        "A változás a fejlődés jele."
    ];

    // Inicializálás
    async function init(userId) {
        currentUserId = userId;
        dataService = window.app?.dataService;
        
        if (!dataService) {
            console.error('DashboardService: DataService not available');
            return false;
        }

        console.log('DashboardService initialized for user:', userId);
        
        // Első betöltés
        await updateDashboard();
        
        // Automatikus frissítés (30 másodpercenként)
        if (updateInterval) {
            clearInterval(updateInterval);
        }
        
        updateInterval = setInterval(async () => {
            await updateDashboard();
        }, 30000);

        // Idő frissítése (minden másodpercben)
        startTimeUpdate();
        
        return true;
    }

    // Dashboard frissítése
    async function updateDashboard() {
        try {
            await Promise.all([
                updateLevelAndXP(),
                updateStreak(),
                updateTodayEvents(),
                updateUrgentTasks(),
                updateFeaturedItems(),
                updateMotivationalQuote()
            ]);
        } catch (error) {
            console.error('Dashboard update error:', error);
        }
    }

    // Szint és XP frissítése
    async function updateLevelAndXP() {
        try {
            // Loading állapot megjelenítése
            const levelElement = document.getElementById('level-value');
            const progressBar = document.getElementById('xp-progress-bar');
            const xpText = document.getElementById('xp-text');
            const xpToNext = document.getElementById('xp-to-next');
            const essenceElements = document.querySelectorAll('.essence-display');
            
            if (levelElement) levelElement.textContent = '...';
            if (progressBar) {
                progressBar.style.width = '0%';
                progressBar.classList.add('animate-pulse');
            }
            if (xpText) xpText.textContent = 'Betöltés...';
            if (xpToNext) xpToNext.textContent = 'Betöltés...';
            essenceElements.forEach(el => el.textContent = '...');
            
            let userData = {};
            
            // Csak akkor próbáljuk betölteni a valós adatokat, ha van dataService
            if (dataService) {
                userData = await dataService.getUserData();
            }
            
            const xp = userData.xp || 0;
            const level = userData.level || 1;
            const essence = userData.essence || 50;
            
            // XP progress számítása
            const xpInfo = window.LevelSystem?.getXPForNextLevel(xp) || {
                currentLevel: level,
                currentLevelXP: 0,
                nextLevelXP: 100,
                xpToNext: 100,
                progress: 0
            };
            
            // DOM frissítése
            if (levelElement) levelElement.textContent = xpInfo.currentLevel;
            if (progressBar) {
                const progressPercent = xpInfo.progress * 100;
                progressBar.style.width = `${Math.min(100, Math.max(0, progressPercent))}%`;
                progressBar.classList.remove('animate-pulse');
                progressBar.classList.add('animate-pulse');
                setTimeout(() => progressBar.classList.remove('animate-pulse'), 1000);
            }
            if (xpText) xpText.textContent = `${xp} / ${xpInfo.nextLevelXP} XP`;
            if (xpToNext) {
                const remaining = xpInfo.xpToNext;
                xpToNext.textContent = remaining > 0 ? `Még ${remaining} XP a következő szintig!` : 'Szint teljesítve!';
            }
            
            // Essence megjelenítés frissítése
            essenceElements.forEach(el => {
                el.textContent = essence;
                // Animáció hozzáadása
                el.classList.add('essence-counter-animation');
                setTimeout(() => el.classList.remove('essence-counter-animation'), 600);
            });
            
        } catch (error) {
            console.error('Error updating level and XP:', error);
        }
    }

    // Sorozat frissítése
    async function updateStreak() {
        try {
            const streakElement = document.getElementById('streak-counter');
            
            // Loading állapot megjelenítése
            if (streakElement) {
                streakElement.textContent = 'Betöltés...';
                streakElement.classList.remove('text-donezy-orange', 'font-bold');
            }
            
            let streak = 0;
            
            // Csak akkor próbáljuk betölteni a valós adatokat, ha van dataService
            if (dataService) {
                // Use the new real streak logic
                streak = await dataService.updateStreakWithLogic();
            }
            
            if (streakElement) {
                streakElement.textContent = `${streak} napos sorozat`;
                if (streak > 0) {
                    streakElement.classList.add('text-donezy-orange', 'font-bold');
                }
            }
        } catch (error) {
            console.error('Error updating streak:', error);
        }
    }

    // Mai események frissítése
    async function updateTodayEvents() {
        try {
            const eventsContainer = document.getElementById('today-events');
            if (!eventsContainer) return;
            
            // Loading állapot megjelenítése
            eventsContainer.innerHTML = `
                <div class="bg-donezy-accent rounded-lg p-3">
                    <div class="animate-pulse">
                        <div class="h-4 bg-gray-600 rounded mb-2"></div>
                        <div class="h-3 bg-gray-700 rounded"></div>
                    </div>
                </div>
            `;
            
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD formátum
            let events = [];
            
            // Csak akkor próbáljuk betölteni a valós eseményeket, ha van CalendarService
            if (dataService && window.app && window.app.calendarService) {
                try {
                    const calendarService = window.app.calendarService;
                    await calendarService.init();
                    calendarService.setCurrentUser(currentUserId);
                    events = await calendarService.getEventsForDate(today);
                } catch (error) {
                    console.error('Error getting events from CalendarService:', error);
                    events = [];
                }
            }
            
            if (events.length === 0) {
                eventsContainer.innerHTML = `
                    <div class="bg-donezy-accent rounded-lg p-3">
                        <p class="text-gray-300">Nincs mai esemény</p>
                    </div>
                `;
            } else {
                eventsContainer.innerHTML = events.map(event => `
                    <div class="bg-donezy-accent rounded-lg p-3 border-l-4 border-donezy-orange">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <h3 class="font-bold text-white">${event.title}</h3>
                                <p class="text-sm text-gray-300">${event.time}</p>
                                ${event.description ? `<p class="text-xs text-gray-400 mt-1">${event.description}</p>` : ''}
                            </div>
                            <span class="text-xs text-gray-400">${event.category || 'Egyéb'}</span>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error updating today events:', error);
            // Hiba esetén is megjelenítjük az alapértelmezett üzenetet
            const eventsContainer = document.getElementById('today-events');
            if (eventsContainer) {
                eventsContainer.innerHTML = `
                    <div class="bg-donezy-accent rounded-lg p-3">
                        <p class="text-gray-300">Nincs mai esemény</p>
                    </div>
                `;
            }
        }
    }

    // Sürgős feladatok frissítése
    async function updateUrgentTasks() {
        try {
            const tasksContainer = document.getElementById('urgent-tasks');
            if (!tasksContainer) return;
            
            // Loading állapot megjelenítése
            tasksContainer.innerHTML = `
                <div class="bg-donezy-accent rounded-lg p-3">
                    <div class="animate-pulse">
                        <div class="h-4 bg-gray-600 rounded mb-2"></div>
                        <div class="h-3 bg-gray-700 rounded"></div>
                    </div>
                </div>
            `;
            
            let urgentTasks = [];
            
            // Csak akkor próbáljuk betölteni a valós adatokat, ha van dataService
            if (dataService) {
                urgentTasks = await getUrgentTasks();
            }
            
            if (urgentTasks.length === 0) {
                tasksContainer.innerHTML = `
                    <div class="bg-donezy-accent rounded-lg p-3">
                        <p class="text-gray-300">Nincs sürgős feladat!</p>
                    </div>
                `;
            } else {
                tasksContainer.innerHTML = urgentTasks.slice(0, 3).map(task => `
                    <div class="bg-donezy-accent rounded-lg p-3 border-l-4 border-red-500">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <h3 class="font-bold text-white">${task.title}</h3>
                                <p class="text-sm text-gray-300">${task.listName || 'Lista'}</p>
                            </div>
                            <span class="text-xs text-red-400">Sürgős</span>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error updating urgent tasks:', error);
            // Hiba esetén is megjelenítjük az alapértelmezett üzenetet
            const tasksContainer = document.getElementById('urgent-tasks');
            if (tasksContainer) {
                tasksContainer.innerHTML = `
                    <div class="bg-donezy-accent rounded-lg p-3">
                        <p class="text-gray-300">Nincs sürgős feladat!</p>
                    </div>
                `;
            }
        }
    }

    // Kiemelt elemek frissítése
    async function updateFeaturedItems() {
        try {
            const featuredContainer = document.querySelector('#dashboard-student .bg-donezy-card:nth-child(2) .space-y-4');
            if (!featuredContainer) return;
            
            // Loading állapot megjelenítése
            featuredContainer.innerHTML = `
                <div class="bg-donezy-accent rounded-lg p-4">
                    <div class="animate-pulse">
                        <div class="h-4 bg-gray-600 rounded mb-2"></div>
                        <div class="h-3 bg-gray-700 rounded"></div>
                    </div>
                </div>
                <div class="bg-donezy-accent rounded-lg p-4">
                    <div class="animate-pulse">
                        <div class="h-4 bg-gray-600 rounded mb-2"></div>
                        <div class="h-3 bg-gray-700 rounded"></div>
                    </div>
                </div>
            `;
            
            // Csak akkor próbáljuk betölteni a valós adatokat, ha van dataService
            if (!dataService) {
                featuredContainer.innerHTML = `
                    <div class="bg-donezy-accent rounded-lg p-4">
                        <h3 class="font-bold text-donezy-orange mb-2">📝 Nincs kipinelt jegyzet</h3>
                        <p class="text-gray-300 text-sm">Kattints a 📌 gombra egy jegyzeten a kitűzéshez...</p>
                    </div>
                    <div class="bg-donezy-accent rounded-lg p-4">
                        <h3 class="font-bold text-donezy-orange mb-2">✅ Nincs kipinelt feladat</h3>
                        <p class="text-gray-300 text-sm">Kattints a 📌 gombra egy feladaton vagy listán a kitűzéshez...</p>
                    </div>
                `;
                return;
            }
            
            // Valós adatok betöltése
            const [featuredNote, featuredTask] = await Promise.all([
                getFeaturedNote(),
                getFeaturedTask()
            ]);
            
            let html = '';
            
            if (featuredNote) {
                html += `
                    <div class="bg-donezy-accent rounded-lg p-4 card-hover">
                        <h3 class="font-bold text-donezy-orange mb-2">📝 ${featuredNote.title}${featuredNote.pinned ? ' 📍' : ''}</h3>
                        <p class="text-gray-300 text-sm">${featuredNote.content.substring(0, 100)}${featuredNote.content.length > 100 ? '...' : ''}</p>
                    </div>
                `;
            } else {
                html += `
                    <div class="bg-donezy-accent rounded-lg p-4">
                        <h3 class="font-bold text-donezy-orange mb-2">📝 Nincs kipinelt jegyzet</h3>
                        <p class="text-gray-300 text-sm">Kattints a 📌 gombra egy jegyzeten a kitűzéshez...</p>
                    </div>
                `;
            }
            
            if (featuredTask) {
                const pinIndicator = featuredTask.pinned ? ' 📍' : (featuredTask.isFromPinnedList ? ' 📌' : '');
                html += `
                    <div class="bg-donezy-accent rounded-lg p-4 card-hover">
                        <h3 class="font-bold text-donezy-orange mb-2">✅ ${featuredTask.title}${pinIndicator}</h3>
                        <p class="text-gray-300 text-sm">${featuredTask.listName || 'Lista'}</p>
                    </div>
                `;
            } else {
                html += `
                    <div class="bg-donezy-accent rounded-lg p-4">
                        <h3 class="font-bold text-donezy-orange mb-2">✅ Nincs kipinelt feladat</h3>
                        <p class="text-gray-300 text-sm">Kattints a 📌 gombra egy feladaton vagy listán a kitűzéshez...</p>
                    </div>
                `;
            }
            
            featuredContainer.innerHTML = html;
        } catch (error) {
            console.error('Error updating featured items:', error);
            // Hiba esetén is megjelenítjük az alapértelmezett üzeneteket
            const featuredContainer = document.querySelector('#dashboard-student .bg-donezy-card:nth-child(2) .space-y-4');
            if (featuredContainer) {
                featuredContainer.innerHTML = `
                    <div class="bg-donezy-accent rounded-lg p-4">
                        <h3 class="font-bold text-donezy-orange mb-2">📝 Nincs kipinelt jegyzet</h3>
                        <p class="text-gray-300 text-sm">Kattints a 📌 gombra egy jegyzeten a kitűzéshez...</p>
                    </div>
                    <div class="bg-donezy-accent rounded-lg p-4">
                        <h3 class="font-bold text-donezy-orange mb-2">✅ Nincs kipinelt feladat</h3>
                        <p class="text-gray-300 text-sm">Kattints a 📌 gombra egy feladaton vagy listán a kitűzéshez...</p>
                    </div>
                `;
            }
        }
    }

    // Motivációs idézet frissítése
    function updateMotivationalQuote() {
        const quoteElement = document.getElementById('motivational-quote');
        if (quoteElement) {
            const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
            quoteElement.textContent = `"${randomQuote}"`;
        }
    }

    // Idő frissítése
    function startTimeUpdate() {
        function updateTime() {
            const now = new Date();
            const dateElement = document.getElementById('current-date');
            const timeElement = document.getElementById('current-time');
            
            if (dateElement) {
                dateElement.textContent = now.toLocaleDateString('hu-HU', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
            
            if (timeElement) {
                timeElement.textContent = now.toLocaleTimeString('hu-HU', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            }
        }
        
        updateTime();
        setInterval(updateTime, 1000);
    }

    // Segédfüggvények
    async function getEventsForDate(date) {
        try {
            if (!window.CalendarService) return [];
            
            const calendarService = new window.CalendarService();
            await calendarService.init();
            calendarService.setCurrentUser(currentUserId);
            
            return await calendarService.getEventsForDate(date);
        } catch (error) {
            console.error('Error getting events for date:', error);
            return [];
        }
    }

    async function getUrgentTasks() {
        try {
            const userData = await dataService.getUserData();
            const lists = userData.lists || {};
            const urgentTasks = [];
            
            Object.keys(lists).forEach(listId => {
                const list = lists[listId];
                if (list.tasks) {
                    // A tasks objektum, nem tömb, ezért Object.values() vagy Object.keys() kell
                    Object.keys(list.tasks).forEach(taskId => {
                        const task = list.tasks[taskId];
                        if (!task.done && (task.priority === 'high' || task.urgent)) {
                            urgentTasks.push({
                                ...task,
                                id: taskId,
                                title: task.name,
                                listName: list.title,
                                listId: listId
                            });
                        }
                    });
                }
            });
            
            return urgentTasks.sort((a, b) => {
                // Prioritás szerint rendezés
                if (a.priority === 'high' && b.priority !== 'high') return -1;
                if (b.priority === 'high' && a.priority !== 'high') return 1;
                return 0;
            });
        } catch (error) {
            console.error('Error getting urgent tasks:', error);
            return [];
        }
    }

    async function getFeaturedNote() {
        try {
            const userData = await dataService.getUserData();
            const notes = userData.notes || {};
            const noteIds = Object.keys(notes);
            
            if (noteIds.length === 0) return null;
            
            // Csak kipinelt jegyzetek
            const pinnedNotes = noteIds
                .map(id => ({ id, ...notes[id] }))
                .filter(note => note.pinned === true);
            
            if (pinnedNotes.length === 0) return null;
            
            // Ha több kipinelt jegyzet van, akkor a legutóbb módosított
            const featuredNote = pinnedNotes.sort((a, b) => 
                new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
            )[0];
            
            // Ha a jegyzet titkosított, akkor módosítjuk a tartalmat megjelenítéshez
            if (featuredNote.isEncrypted) {
                return {
                    ...featuredNote,
                    content: '[Titkosított jegyzet - jelszó szükséges a megtekintéshez]'
                };
            }
            
            return featuredNote;
        } catch (error) {
            console.error('Error getting featured note:', error);
            return null;
        }
    }

    async function getFeaturedTask() {
        try {
            const userData = await dataService.getUserData();
            const lists = userData.lists || {};
            const allTasks = [];
            
            Object.keys(lists).forEach(listId => {
                const list = lists[listId];
                if (list.tasks) {
                    // A tasks objektum, nem tömb, ezért Object.keys() kell
                    Object.keys(list.tasks).forEach(taskId => {
                        const task = list.tasks[taskId];
                        allTasks.push({
                            ...task,
                            id: taskId,
                            title: task.name,
                            listName: list.title,
                            listId: listId,
                            // Ha a lista kipinelt, akkor a feladat is "kiemelt"
                            isFromPinnedList: list.pinned === true
                        });
                    });
                }
            });
            
            if (allTasks.length === 0) return null;
            
            // Kipinelt feladatok vagy kipinelt listából származó feladatok
            const pinnedTasks = allTasks.filter(task => 
                task.pinned === true || task.isFromPinnedList === true
            );
            
            if (pinnedTasks.length === 0) return null;
            
            // Ha több kipinelt feladat van, akkor a legutóbb hozzáadott
            const sortedTasks = pinnedTasks.sort((a, b) => {
                // Először egyedi kipinelt feladatok, majd lista kipinelt feladatok
                if (a.pinned && !b.pinned) return -1;
                if (b.pinned && !a.pinned) return 1;
                // Majd legutóbb hozzáadott
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            
            return sortedTasks[0];
        } catch (error) {
            console.error('Error getting featured task:', error);
            return null;
        }
    }

    // Gyorsgombok eseménykezelői
    function setupQuickButtons() {
        // Gyors feladat
        const quickTaskBtn = document.getElementById('quick-task-btn');
        if (quickTaskBtn) {
            quickTaskBtn.addEventListener('click', () => {
                showQuickTaskModal();
            });
        }

        // Gyors jegyzet
        const quickNoteBtn = document.getElementById('quick-note-btn');
        if (quickNoteBtn) {
            quickNoteBtn.addEventListener('click', () => {
                showQuickNoteModal();
            });
        }

        // Gyors esemény
        const quickEventBtn = document.getElementById('quick-event-btn');
        if (quickEventBtn) {
            quickEventBtn.addEventListener('click', () => {
                showQuickEventModal();
            });
        }
    }

    // Gyors feladat modal - először választási lehetőség
    function showQuickTaskModal() {
        if (!window.ModalService) {
            console.error('ModalService not available');
            return;
        }

        // Először megkérdezzük, hogy mit szeretne csinálni
        const choiceModalId = window.ModalService.showModal({
            title: 'Feladat hozzáadása',
            icon: '✅',
            fields: [
                {
                    type: 'select',
                    id: 'task-choice',
                    label: 'Mit szeretnél csinálni?',
                    required: true,
                    options: [
                        { value: 'new-list', label: '📝 Új lista létrehozása' },
                        { value: 'existing-list', label: '➕ Meglévő listához hozzáadás' }
                    ]
                }
            ],
            buttons: [
                {
                    text: 'Mégse',
                    action: (data, modalId) => {
                        window.ModalService.closeModal(modalId);
                    },
                    type: 'secondary',
                    id: 'cancel-btn'
                },
                {
                    text: 'Tovább',
                    action: async (data, modalId) => {
                        if (!data['task-choice']) {
                            if (window.app.notificationService) {
                                window.app.notificationService.showError('Kérlek válassz egy lehetőséget!');
                            }
                            return;
                        }

                        window.ModalService.closeModal(modalId);
                        
                        if (data['task-choice'] === 'new-list') {
                            showNewListWithTaskModal();
                        } else {
                            showAddToExistingListModal();
                        }
                    },
                    type: 'primary',
                    id: 'continue-btn'
                }
            ]
        });
    }

    // Új lista létrehozása feladattal
    function showNewListWithTaskModal() {
        if (!window.ModalService) {
            console.error('ModalService not available');
            return;
        }

        window.ModalService.showModal({
            title: 'Új lista létrehozása feladattal',
            icon: '📝',
            fields: [
                {
                    type: 'text',
                    id: 'list-title',
                    label: 'Lista címe',
                    placeholder: 'Írd be a lista címét...',
                    required: true
                },
                {
                    type: 'textarea',
                    id: 'list-description',
                    label: 'Lista leírása (opcionális)',
                    placeholder: 'Rövid leírás a listáról...',
                    rows: 2
                },
                {
                    type: 'select',
                    id: 'list-category',
                    label: 'Lista kategória',
                    required: true,
                    options: [
                        { value: 'work', label: '💼 Munka' },
                        { value: 'otthon', label: '🏠 Otthon' },
                        { value: 'bevásárlás', label: '🛒 Bevásárlás' },
                        { value: 'hobbi', label: '🎨 Hobbi' },
                        { value: 'tanulás', label: '📚 Tanulás' },
                        { value: 'egyéb', label: '📝 Egyéb' }
                    ]
                },
                {
                    type: 'select',
                    id: 'list-priority',
                    label: 'Lista prioritás',
                    required: true,
                    options: [
                        { value: 'low', label: '🟢 Alacsony' },
                        { value: 'medium', label: '🟡 Közepes' },
                        { value: 'high', label: '🔴 Magas' }
                    ]
                },
                {
                    type: 'text',
                    id: 'task-title',
                    label: 'Első feladat címe',
                    placeholder: 'Írd be a feladat címét...',
                    required: true
                },
                {
                    type: 'textarea',
                    id: 'task-description',
                    label: 'Feladat leírása (opcionális)',
                    placeholder: 'Részletes leírás...',
                    rows: 3
                },
                {
                    type: 'select',
                    id: 'task-priority',
                    label: 'Feladat prioritás',
                    required: true,
                    options: [
                        { value: 'low', label: '🟢 Alacsony' },
                        { value: 'medium', label: '🟡 Közepes' },
                        { value: 'high', label: '🔴 Magas' }
                    ]
                }
            ],
            buttons: [
                {
                    text: 'Mégse',
                    action: (data, modalId) => {
                        window.ModalService.closeModal(modalId);
                    },
                    type: 'secondary',
                    id: 'cancel-btn'
                },
                {
                    text: 'Lista létrehozása',
                    action: async (data, modalId) => {
                        // Validáció
                        if (!data['list-title'] || !data['list-category'] || !data['list-priority'] || 
                            !data['task-title'] || !data['task-priority']) {
                            if (window.app.notificationService) {
                                window.app.notificationService.showError('A lista címe, kategóriája, prioritása és a feladat címe, prioritása kötelező!');
                            }
                            return;
                        }
                        
                        try {
                            await createNewListWithTask(data);
                            window.ModalService.closeModal(modalId);
                            
                            // Frissítjük a ListsService cache-ét
                            if (window.ListsService && window.ListsService.reloadLists) {
                                await window.ListsService.reloadLists();
                            }
                            
                            // Frissítjük a dashboard-ot
                            await updateDashboard();
                            
                            // Frissítjük a ListsRenderer-t is
                            if (window.ListsRenderer && window.ListsRenderer.refreshListsDisplay) {
                                window.ListsRenderer.refreshListsDisplay();
                            }
                            
                            // Sikeres üzenet
                            if (window.app.notificationService) {
                                window.app.notificationService.showSuccess('Lista és feladat sikeresen létrehozva!');
                            }
                        } catch (error) {
                            console.error('Error creating list with task:', error);
                            if (window.app.notificationService) {
                                window.app.notificationService.showError('Hiba történt a lista létrehozásakor!');
                            }
                        }
                    },
                    type: 'primary',
                    id: 'create-btn'
                }
            ]
        });
    }

    // Meglévő listához feladat hozzáadása
    async function showAddToExistingListModal() {
        if (!window.ModalService) {
            console.error('ModalService not available');
            return;
        }

        // Lekérjük a meglévő listákat
        let existingLists = [];
        try {
            if (dataService) {
                const userData = await dataService.getUserData();
                const lists = userData.lists || {};
                existingLists = Object.values(lists || {})
                    .filter(list => list && list.status !== 'deleted')
                    .map(list => ({
                        value: list.id,
                        label: `${list.title} (${Object.keys(list.tasks || {}).length} feladat)`
                    }));
            }
        } catch (error) {
            console.error('Error loading lists:', error);
        }

        if (existingLists.length === 0) {
            if (window.app.notificationService) {
                window.app.notificationService.showError('Nincsenek meglévő listák! Kérlek hozz létre egy új listát.');
            }
            return;
        }

        window.ModalService.showModal({
            title: 'Feladat hozzáadása meglévő listához',
            icon: '➕',
            fields: [
                {
                    type: 'select',
                    id: 'selected-list',
                    label: 'Válaszd ki a listát',
                    required: true,
                    options: existingLists
                },
                {
                    type: 'text',
                    id: 'task-title',
                    label: 'Feladat címe',
                    placeholder: 'Írd be a feladat címét...',
                    required: true
                },
                {
                    type: 'textarea',
                    id: 'task-description',
                    label: 'Leírás (opcionális)',
                    placeholder: 'Részletes leírás...',
                    rows: 3
                },
                {
                    type: 'select',
                    id: 'task-priority',
                    label: 'Prioritás',
                    required: true,
                    options: [
                        { value: 'low', label: '🟢 Alacsony' },
                        { value: 'medium', label: '🟡 Közepes' },
                        { value: 'high', label: '🔴 Magas' }
                    ]
                }
            ],
            buttons: [
                {
                    text: 'Mégse',
                    action: (data, modalId) => {
                        window.ModalService.closeModal(modalId);
                    },
                    type: 'secondary',
                    id: 'cancel-btn'
                },
                {
                    text: 'Hozzáadás',
                    action: async (data, modalId) => {
                        // Validáció
                        if (!data['selected-list'] || !data['task-title'] || !data['task-priority']) {
                            if (window.app.notificationService) {
                                window.app.notificationService.showError('A lista kiválasztása, feladat címe és prioritása kötelező!');
                            }
                            return;
                        }
                        
                        try {
                            await addTaskToExistingList(data);
                            window.ModalService.closeModal(modalId);
                            
                            // Frissítjük a ListsService cache-ét
                            if (window.ListsService && window.ListsService.reloadLists) {
                                await window.ListsService.reloadLists();
                            }
                            
                            // Frissítjük a dashboard-ot
                            await updateDashboard();
                            
                            // Frissítjük a ListsRenderer-t is
                            if (window.ListsRenderer && window.ListsRenderer.refreshListsDisplay) {
                                window.ListsRenderer.refreshListsDisplay();
                            }
                            
                            // Sikeres üzenet
                            if (window.app.notificationService) {
                                window.app.notificationService.showSuccess('Feladat sikeresen hozzáadva a listához!');
                            }
                        } catch (error) {
                            console.error('Error adding task to list:', error);
                            if (window.app.notificationService) {
                                window.app.notificationService.showError('Hiba történt a feladat hozzáadásakor!');
                            }
                        }
                    },
                    type: 'primary',
                    id: 'add-btn'
                }
            ]
        });
    }

    // Gyors jegyzet modal
    function showQuickNoteModal() {
        if (!window.ModalService) {
            console.error('ModalService not available');
            return;
        }

        const modalId = window.ModalService.showModal({
            title: 'Gyors jegyzet létrehozása',
            icon: '📝',
            fields: [
                {
                    type: 'text',
                    id: 'note-title',
                    label: 'Jegyzet címe',
                    placeholder: 'Írd be a jegyzet címét...',
                    required: true
                },
                {
                    type: 'textarea',
                    id: 'note-content',
                    label: 'Tartalom',
                    placeholder: 'Írd be a jegyzet tartalmát...',
                    rows: 6,
                    required: true
                },
                {
                    type: 'checkbox',
                    id: 'note-encrypted',
                    label: 'Titkosítás engedélyezése',
                    placeholder: 'Titkosítás engedélyezése',
                    required: false
                },
                {
                    type: 'password',
                    id: 'note-password',
                    label: 'Jelszó (ha titkosított)',
                    placeholder: 'Írd be a jelszót...',
                    required: false
                }
            ],
            buttons: [
                {
                    text: 'Mégse',
                    action: (data, modalId) => {
                        window.ModalService.closeModal(modalId);
                    },
                    type: 'secondary',
                    id: 'cancel-btn'
                },
                {
                    text: 'Létrehozás',
                    action: async (data, modalId) => {
                        // Validáció
                        if (!data['note-title'] || !data['note-content']) {
                            if (window.app.notificationService) {
                                window.app.notificationService.showError('A cím és tartalom megadása kötelező!');
                            }
                            return;
                        }
                        
                        if (data['note-encrypted'] && !data['note-password']) {
                            if (window.app.notificationService) {
                                window.app.notificationService.showError('Titkosítás esetén jelszó megadása kötelező!');
                            }
                            return;
                        }
                        
                        try {
                            await createQuickNote(data);
                            window.ModalService.closeModal(modalId);
                            
                            // Frissítjük a dashboard-ot
                            await updateDashboard();
                            
                            // Frissítjük a ListsRenderer-t is
                            if (window.ListsRenderer && window.ListsRenderer.refreshListsDisplay) {
                                window.ListsRenderer.refreshListsDisplay();
                            }
                            
                            // Sikeres üzenet
                            if (window.app.notificationService) {
                                window.app.notificationService.showSuccess('Jegyzet sikeresen létrehozva!');
                            }
                        } catch (error) {
                            console.error('Error creating note:', error);
                            if (window.app.notificationService) {
                                window.app.notificationService.showError('Hiba történt a jegyzet létrehozásakor!');
                            }
                        }
                    },
                    type: 'primary',
                    id: 'create-btn'
                }
            ]
        });

        // Jelszó mező feltételes megjelenítése
        setTimeout(() => {
            const encryptedCheckbox = document.getElementById('note-encrypted');
            const passwordField = document.getElementById('note-password').closest('div');
            
            if (encryptedCheckbox && passwordField) {
                // Kezdetben elrejtjük a jelszó mezőt
                passwordField.style.display = 'none';
                
                encryptedCheckbox.addEventListener('change', () => {
                    if (encryptedCheckbox.checked) {
                        passwordField.style.display = 'block';
                        document.getElementById('note-password').required = true;
                    } else {
                        passwordField.style.display = 'none';
                        document.getElementById('note-password').required = false;
                        document.getElementById('note-password').value = '';
                    }
                });
            }
        }, 100);
    }

    // Gyors esemény modal
    function showQuickEventModal() {
        if (!window.ModalService) {
            console.error('ModalService not available');
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const modalId = window.ModalService.showModal({
            title: 'Gyors esemény létrehozása',
            icon: '📅',
            fields: [
                {
                    type: 'text',
                    id: 'event-title',
                    label: 'Esemény címe',
                    placeholder: 'Írd be az esemény címét...',
                    required: true
                },
                {
                    type: 'date',
                    id: 'event-date',
                    label: 'Dátum',
                    required: true
                },
                {
                    type: 'time',
                    id: 'event-time',
                    label: 'Idő',
                    required: true
                },
                {
                    type: 'textarea',
                    id: 'event-description',
                    label: 'Leírás (opcionális)',
                    placeholder: 'Részletes leírás...',
                    rows: 3
                },
                {
                    type: 'select',
                    id: 'event-category',
                    label: 'Kategória',
                    required: true,
                    options: [
                        { value: 'tanulás', label: '📚 Tanulás' },
                        { value: 'munka', label: '💼 Munka' },
                        { value: 'hobbi', label: '🎨 Hobbi' },
                        { value: 'egészség', label: '🏃 Egészség' },
                        { value: 'szociális', label: '👥 Szociális' },
                        { value: 'egyéb', label: '📝 Egyéb' }
                    ]
                },
                {
                    type: 'checkbox',
                    id: 'event-reminder',
                    label: 'Emlékeztető engedélyezése',
                    placeholder: 'Emlékeztető engedélyezése',
                    required: false
                },
                {
                    type: 'select',
                    id: 'event-reminder-time',
                    label: 'Emlékeztető időpontja',
                    required: false,
                    options: [
                        { value: '5', label: '5 perccel előtte' },
                        { value: '15', label: '15 perccel előtte' },
                        { value: '30', label: '30 perccel előtte' },
                        { value: '60', label: '1 órával előtte' },
                        { value: '1440', label: '1 nappal előtte' }
                    ]
                }
            ],
            buttons: [
                {
                    text: 'Mégse',
                    action: (data, modalId) => {
                        window.ModalService.closeModal(modalId);
                    },
                    type: 'secondary',
                    id: 'cancel-btn'
                },
                {
                    text: 'Létrehozás',
                    action: async (data, modalId) => {
                        // Validáció
                        if (!data['event-title'] || !data['event-date'] || !data['event-time']) {
                            if (window.app.notificationService) {
                                window.app.notificationService.showError('A cím, dátum és idő megadása kötelező!');
                            }
                            return;
                        }
                        
                        if (data['event-reminder'] && !data['event-reminder-time']) {
                            if (window.app.notificationService) {
                                window.app.notificationService.showError('Emlékeztető esetén időpont megadása kötelező!');
                            }
                            return;
                        }
                        
                        try {
                            await createQuickEvent(data);
                            window.ModalService.closeModal(modalId);
                            
                            // Frissítjük a teljes dashboard-ot
                            if (window.DashboardService && window.DashboardService.updateDashboard) {
                                await window.DashboardService.updateDashboard();
                            }
                            
                            // Frissítjük a ListsRenderer-t is
                            if (window.ListsRenderer && window.ListsRenderer.refreshListsDisplay) {
                                window.ListsRenderer.refreshListsDisplay();
                            }
                            
                            // Sikeres üzenet
                            if (window.app.notificationService) {
                                window.app.notificationService.showSuccess('Esemény sikeresen létrehozva!');
                            }
                        } catch (error) {
                            console.error('Error creating event:', error);
                            if (window.app.notificationService) {
                                window.app.notificationService.showError('Hiba történt az esemény létrehozásakor!');
                            }
                        }
                    },
                    type: 'primary',
                    id: 'create-btn'
                }
            ]
        });

        // Beállítjuk az alapértelmezett értékeket és az emlékeztető mezők feltételes megjelenítését
        setTimeout(() => {
            const dateInput = document.getElementById('event-date');
            const timeInput = document.getElementById('event-time');
            const reminderCheckbox = document.getElementById('event-reminder');
            const reminderTimeField = document.getElementById('event-reminder-time').closest('div');
            
            if (dateInput) dateInput.value = today;
            if (timeInput) timeInput.value = currentTime;
            
            if (reminderCheckbox && reminderTimeField) {
                // Kezdetben elrejtjük az emlékeztető időpont mezőt
                reminderTimeField.style.display = 'none';
                
                reminderCheckbox.addEventListener('change', () => {
                    if (reminderCheckbox.checked) {
                        reminderTimeField.style.display = 'block';
                        document.getElementById('event-reminder-time').required = true;
                    } else {
                        reminderTimeField.style.display = 'none';
                        document.getElementById('event-reminder-time').required = false;
                        document.getElementById('event-reminder-time').value = '';
                    }
                });
            }
        }, 100);
    }

    // Új lista létrehozása feladattal
    async function createNewListWithTask(data) {
        if (!dataService) {
            throw new Error('DataService not available');
        }

        const userData = await dataService.getUserData();
        const lists = userData.lists || {};
        
        // Létrehozzuk az új listát
        const listId = `list_${Date.now()}`;
        const newList = {
            id: listId,
            title: data['list-title'],
            description: data['list-description'] || '',
            category: data['list-category'],
            priority: data['list-priority'],
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tasks: {}
        };

        // Hozzáadjuk az első feladatot
        const taskId = `task_${Date.now()}`;
        const newTask = {
            id: taskId,
            name: data['task-title'],
            description: data['task-description'] || '',
            done: false,
            priority: data['task-priority'],
            category: data['list-category'],
            createdAt: new Date().toISOString()
        };

        newList.tasks[taskId] = newTask;
        lists[listId] = newList;
        
        // Mentjük a változásokat
        await dataService.updateUserField('lists', lists);
        
        // XP jutalom lista és feladat létrehozásért
        if (window.LevelSystem && window.LevelSystem.addXP) {
            await window.LevelSystem.addXP(8, 'Új lista létrehozása feladattal');
        }
    }

    // Feladat hozzáadása meglévő listához
    async function addTaskToExistingList(data) {
        if (!dataService) {
            throw new Error('DataService not available');
        }

        const userData = await dataService.getUserData();
        const lists = userData.lists || {};
        
        const listId = data['selected-list'];
        const list = lists[listId];
        
        if (!list) {
            throw new Error('A kiválasztott lista nem található!');
        }

        // Hozzáadjuk az új feladatot
        const taskId = `task_${Date.now()}`;
        const newTask = {
            id: taskId,
            name: data['task-title'],
            description: data['task-description'] || '',
            done: false,
            priority: data['task-priority'],
            category: list.category || 'egyéb',
            createdAt: new Date().toISOString()
        };

        if (!list.tasks) {
            list.tasks = {};
        }
        
        list.tasks[taskId] = newTask;
        list.updatedAt = new Date().toISOString();
        
        // Mentjük a változásokat
        await dataService.updateUserField('lists', lists);
        
        // XP jutalom feladat hozzáadásért
        if (window.LevelSystem && window.LevelSystem.addXP) {
            await window.LevelSystem.addXP(3, 'Feladat hozzáadása listához');
        }
    }

    // Gyors feladat létrehozása
    async function createQuickTask(data) {
        if (!dataService) {
            throw new Error('DataService not available');
        }

        const userData = await dataService.getUserData();
        const lists = userData.lists || {};
        
        // Keressük vagy hozzuk létre a "Gyors feladatok" listát
        let quickTasksList = null;
        for (const [listId, list] of Object.entries(lists)) {
            if (list.title === 'Gyors feladatok') {
                quickTasksList = { id: listId, ...list };
                break;
            }
        }

        if (!quickTasksList) {
            // Létrehozzuk a "Gyors feladatok" listát
            const newListId = `list_${Date.now()}`;
            quickTasksList = {
                id: newListId,
                title: 'Gyors feladatok',
                category: 'egyéb',
                createdAt: new Date().toISOString(),
                tasks: {}
            };
            lists[newListId] = quickTasksList;
        }

        // Hozzáadjuk az új feladatot
        const taskId = `task_${Date.now()}`;
        const newTask = {
            id: taskId,
            name: data['task-title'],
            description: data['task-description'] || '',
            done: false,
            priority: data['task-priority'],
            category: data['task-category'],
            createdAt: new Date().toISOString()
        };

        if (!quickTasksList.tasks) {
            quickTasksList.tasks = {};
        }
        
        quickTasksList.tasks[taskId] = newTask;
        
        // Mentjük a változásokat
        await dataService.updateUserField('lists', lists);
        
        // XP jutalom
        if (window.LevelSystem && window.LevelSystem.addXP) {
            await window.LevelSystem.addXP(5, 'Gyors feladat létrehozása');
        }
    }

    // Gyors jegyzet létrehozása
    async function createQuickNote(data) {
        if (!dataService) {
            throw new Error('DataService not available');
        }

        const userData = await dataService.getUserData();
        const notes = userData.notes || {};
        
        const noteId = `note_${Date.now()}`;
        const newNote = {
            id: noteId,
            title: data['note-title'],
            content: data['note-content'],
            encrypted: data['note-encrypted'] || false,
            password: data['note-encrypted'] ? data['note-password'] : null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        notes[noteId] = newNote;
        
        // Mentjük a változásokat
        await dataService.updateUserField('notes', notes);
        
        // XP jutalom
        if (window.LevelSystem && window.LevelSystem.addXP) {
            await window.LevelSystem.addXP(3, 'Gyors jegyzet létrehozása');
        }
    }

    // Gyors esemény létrehozása
    async function createQuickEvent(data) {
        if (!window.app || !window.app.calendarService) {
            throw new Error('CalendarService not available');
        }

        const calendarService = window.app.calendarService;
        await calendarService.init();
        calendarService.setCurrentUser(currentUserId);

        const eventData = {
            title: data['event-title'],
            date: data['event-date'],
            time: data['event-time'],
            description: data['event-description'] || '',
            category: data['event-category'],
            reminderEnabled: data['event-reminder'] || false,
            reminderTime: data['event-reminder'] ? data['event-reminder-time'] : null
        };

        await calendarService.addEvent(eventData);
        
        // XP jutalom
        if (window.LevelSystem && window.LevelSystem.addXP) {
            await window.LevelSystem.addXP(4, 'Gyors esemény létrehozása');
        }
    }

    // Tisztítás
    function destroy() {
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
        currentUserId = null;
        dataService = null;
    }

    // Publikus API
    return {
        init,
        updateDashboard,
        updateLevelAndXP,
        updateStreak,
        updateTodayEvents,
        updateUrgentTasks,
        updateFeaturedItems,
        updateMotivationalQuote,
        setupQuickButtons,
        destroy
    };
})(); 