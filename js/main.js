// Main JavaScript File - Imports and uses all modular JavaScript files

// Import all modules (these will be loaded via script tags in HTML)
// The modules are designed to be loaded in the correct order:
// 1. FirebaseService.js
// 2. LocalStorageService.js
// 3. DataService.js
// 4. NotificationService.js
// 5. ModalService.js
// 6. TargetAudienceSelector.js (existing)
// 7. FirebaseConfig.js (existing)

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('[PWA] Service Worker registered successfully:', registration);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version available
                            console.log('[PWA] New version available');
                            this.showUpdateNotification();
                        }
                    });
                });
            })
            .catch(registrationError => {
                console.error('[PWA] Service Worker registration failed:', registrationError);
            });
    });
}

// PWA Update Notification
function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-y-full';
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <span>🔄</span>
            <span>Új verzió elérhető!</span>
            <button onclick="window.location.reload()" class="ml-2 bg-white text-blue-600 px-2 py-1 rounded text-sm font-bold">Frissítés</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-y-full');
    }, 100);
    
    // Remove after 10 seconds
    setTimeout(() => {
        notification.classList.add('translate-y-full');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 10000);
}

// Import LevelSystem modul (window fallback, ha nincs ES6 import)
let LevelSystem = window.LevelSystem || {};
let StatAggregator = window.StatAggregator || {};
let ResultsRenderer = window.ResultsRenderer || {};
let ListsService = window.ListsService || {};
let ListsRenderer = window.ListsRenderer || {};
let NotesService = window.NotesService || {};
let NotesRenderer = window.NotesRenderer || {};
let DashboardService = window.DashboardService || {};

// Import Calendar modules
let calendarService = null;
let calendarRenderer = null;
let reminderService = null;

// Main Application Class
class DonezyApp {
    constructor() {
        this.streakCount = 0;
        this.currentTab = 'dashboard';
        this.userGroup = null;
        this.dataService = null;
        this.notificationService = null;
        this.modalService = null;
        this.targetAudienceSelector = null;
        this.dashboardService = null;
        this.motivationalQuotes = [
            "A tudás az egyetlen kincs, amit soha nem vehetnek el tőled.",
            "A siker nem véletlen, hanem következetes erőfeszítés eredménye.",
            "Minden nap egy új lehetőség a fejlődésre.",
            "A kitartás a siker kulcsa.",
            "Ne add fel a céljaidat, csak módosítsd az utat hozzájuk."
        ];
        this.notesInitialized = false;
        this.calendarInitialized = false;
        this.init();
    }

    async init() {
        try {
            // Initialize services
            await this.initializeServices();
            
            // Initialize target audience selector
            await this.initializeTargetAudienceSelector();
            
            // Continue with app initialization only if user has selected a group
            if (this.userGroup) {
                this.updateDateTime();
                this.setupNavigation();
                this.setupEventListeners();
                this.loadUserData();
                
                // Update time every second
                setInterval(() => {
                    this.updateDateTime();
                }, 1000);
            }
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('Hiba történt az alkalmazás indításakor. Kérjük, frissítsd az oldalt.');
        }
    }

    async initializeServices() {
        try {
            // Initialize data service
            if (typeof DataService !== 'undefined') {
                this.dataService = new DataService();
                await this.dataService.init();
                
                // Make dataService available to other modules
                if (!window.app) window.app = {};
                window.app.dataService = this.dataService;
                
                // Check service type using new methods
                const isFirebase = this.dataService.isFirebaseAvailable();
                const isLocalStorage = this.dataService.isLocalStorageFallback();
                const provider = isFirebase ? 'Firebase' : 'Local Storage';
                const status = isFirebase ? 'connected' : 'offline';
                this.updateConnectionStatus(status, provider);
            } else {
                console.error('DataService not available');
                this.updateConnectionStatus('error', 'Service Unavailable');
            }

            // Initialize notification service
            if (typeof NotificationService !== 'undefined') {
                this.notificationService = new NotificationService();
            } else {
                console.error('NotificationService not available');
            }

            // Initialize modal service
            if (typeof ModalService !== 'undefined') {
                this.modalService = new ModalService();
            } else {
                console.error('ModalService not available');
            }

            // Initialize currency service
            if (typeof CurrencyService !== 'undefined') {
                CurrencyService.init();
            } else {
                console.error('CurrencyService not available');
            }

            // Initialize quests service
            if (typeof QuestsService !== 'undefined') {
                await QuestsService.init();
                
                // Initialize quests renderer after service
                if (typeof QuestsRenderer !== 'undefined') {
                    // QuestsRenderer is already an object (IIFE result)
                    window.questsRenderer = QuestsRenderer;
                    console.log('QuestsRenderer initialized');
                } else {
                    console.error('QuestsRenderer not available');
                }
            } else {
                console.error('QuestsService not available');
            }

            // Initialize lists service
            if (typeof ListsService !== 'undefined' && ListsService.init) {
                await ListsService.init();
            } else {
                console.error('ListsService not available');
            }

            // Initialize notes service
            if (typeof NotesService !== 'undefined' && NotesService.init) {
                await NotesService.init();
            } else {
                console.error('NotesService not available');
            }

            // Initialize calendar services
            await this.initializeCalendarServices();
            
            // Initialize dashboard service
            await this.initializeDashboardService();
        } catch (error) {
            console.error('Error initializing services:', error);
        }
    }

    async initializeDashboardService() {
        try {
            if (typeof DashboardService !== 'undefined' && DashboardService.init) {
                // Csak akkor inicializáljuk, ha van bejelentkezett user
                if (window.currentUserId) {
                    this.dashboardService = DashboardService;
                    await this.dashboardService.init(window.currentUserId);
                    this.dashboardService.setupQuickButtons();
                    console.log('DashboardService initialized successfully');
                } else {
                    console.warn('Nincs bejelentkezett felhasználó, a dashboard nem inicializálódik.');
                }
            } else {
                console.error('DashboardService not available');
            }
        } catch (error) {
            console.error('Error initializing dashboard service:', error);
        }
    }

    async initializeCalendarServices() {
        try {
            // Várunk, amíg a Firebase inicializálódik
            let attempts = 0;
            while (attempts < 20) {
                try {
                    // Import calendar modules dynamically
                    const calendarModule = await import('./modules/CalendarService.js');
                    const rendererModule = await import('./modules/CalendarRenderer.js');
                    const reminderModule = await import('./modules/ReminderService.js');
                    
                    calendarService = calendarModule.default;
                    calendarRenderer = rendererModule.default;
                    reminderService = reminderModule.default;
                    
                    // Make calendar services available to other modules
                    if (!window.app) window.app = {};
                    window.app.calendarService = calendarService;
                    window.app.calendarRenderer = calendarRenderer;
                    window.app.reminderService = reminderService;
                    
                    // Csak akkor inicializáljuk a naptárat, ha van bejelentkezett user
                    if (window.currentUserId) {
                        if (typeof calendarRenderer.init === 'function') {
                            await calendarRenderer.init();
                        } else if (typeof calendarRenderer === 'function') {
                            new calendarRenderer();
                        }
                        console.log('Calendar services initialized successfully');
                        this.calendarInitialized = true;
                    } else {
                        console.warn('Nincs bejelentkezett felhasználó, a naptár nem inicializálódik.');
                    }
                    return;
                } catch (error) {
                    if (error.message.includes('Firebase') || error.message.includes('app/no-app')) {
                        console.log('Firebase not ready yet, waiting...');
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        attempts++;
                    } else {
                        throw error;
                    }
                }
            }
            
            console.error('Calendar services initialization timeout');
        } catch (error) {
            console.error('Error initializing calendar services:', error);
        }
    }

    async initializeTargetAudienceSelector() {
        try {
            console.log('Initializing target audience selector...');
            
            // Check if target audience selector is available
            if (typeof TargetAudienceSelector === 'undefined') {
                console.warn('Target audience selector not available');
                this.userGroup = 'student'; // Default fallback
                return;
            }

            console.log('TargetAudienceSelector class found, creating instance...');
            this.targetAudienceSelector = new TargetAudienceSelector();
            
            // Initialize the selector
            console.log('Initializing selector with data service...');
            await this.targetAudienceSelector.init(this.dataService);
            
            // Get user group
            this.userGroup = await this.dataService.getUserGroup();
            console.log('Final user group:', this.userGroup);
            
        } catch (error) {
            console.error('Error initializing target audience selector:', error);
            this.userGroup = 'student'; // Default fallback
        }
    }

    updateDateTime() {
        const now = new Date();
        
        // Update date
        const dateOptions = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
        };
        const dateString = now.toLocaleDateString('hu-HU', dateOptions);
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            dateElement.textContent = dateString;
        }
        
        // Update time
        const timeOptions = { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        };
        const timeString = now.toLocaleTimeString('hu-HU', timeOptions);
        const timeElement = document.getElementById('current-time');
        if (timeElement) {
            timeElement.textContent = timeString;
        }
    }

    setupNavigation() {
        console.log('Setting up navigation...');
        
        // Get all navigation tabs (desktop only now)
        const navTabs = document.querySelectorAll('.nav-tab[data-tab]');
        console.log('Found navigation tabs:', navTabs.length);
        
        navTabs.forEach((tab, index) => {
            const tabName = tab.getAttribute('data-tab');
            console.log(`Tab ${index}: ${tabName} - ${tab.className}`);
            
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = tab.getAttribute('data-tab');
                console.log('Tab clicked:', targetTab);
                this.switchTab(targetTab);
            });
        });

        // Set initial active tab
        console.log('Setting initial active tab: dashboard');
        this.switchTab('dashboard');
    }

    switchTab(tabName) {
        console.log('Switching to tab:', tabName);
        
        // Update current tab
        this.currentTab = tabName;

        // Remove active class from all desktop tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Add active class to selected desktop tab
        document.querySelectorAll(`.nav-tab[data-tab="${tabName}"]`).forEach(tab => {
            tab.classList.add('active');
        });

        // Update mobile navigation active state
        document.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        document.querySelectorAll(`.mobile-nav-link[data-tab="${tabName}"]`).forEach(link => {
            link.classList.add('active');
        });
        
        // Hide all content sections by removing active class
        document.querySelectorAll('.content-section, .dashboard-section').forEach(section => {
            section.classList.remove('active');
            console.log('Hiding section:', section.id);
        });
        
        // Show the selected section by adding active class
        let targetSection = null;
        
        if (tabName === 'dashboard') {
            targetSection = document.getElementById('dashboard-student');
        } else if (tabName === 'results') {
            targetSection = document.getElementById('results-section');
        } else if (tabName === 'missions') {
            targetSection = document.getElementById('missions-section');
        } else if (tabName === 'lists') {
            targetSection = document.getElementById('lists-section');
        } else if (tabName === 'notes') {
            targetSection = document.getElementById('notes-section');
        } else if (tabName === 'calendar') {
            targetSection = document.getElementById('calendar-section');
        }
        
        if (targetSection) {
            targetSection.classList.add('active');
            console.log('Showing section:', targetSection.id);
        } else {
            console.error('Target section not found for tab:', tabName);
        }
        
        // Call render functions after showing section
        if (tabName === 'results') {
            this.renderResultsTab();
        } else if (tabName === 'missions') {
            this.renderQuestsTab();
        } else if (tabName === 'lists') {
            this.renderListsTab();
        } else if (tabName === 'notes') {
            if (!this.notesInitialized && window.NotesService && window.NotesService.init) {
                window.NotesService.init().then(() => {
                    if (window.NotesRenderer) {
                        window.NotesRenderer.renderNotesTab(window.NotesService.getAllNotes());
                    }
                });
                this.notesInitialized = true;
            } else if (window.NotesRenderer && window.NotesService) {
                window.NotesRenderer.renderNotesTab(window.NotesService.getAllNotes());
            }
        } else if (tabName === 'calendar') {
            // Naptár inicializálása, ha még nem történt meg
            if (!this.calendarInitialized) {
                console.log('Calendar not initialized yet, waiting...');
                // Várunk egy kicsit, hogy a modulok betöltődjenek
                setTimeout(() => {
                    if (calendarRenderer) {
                        console.log('Calendar renderer found, initializing...');
                        // A CalendarRenderer automatikusan inicializálódik
                    } else {
                        console.error('Calendar renderer not available');
                    }
                }, 1000);
            } else if (calendarRenderer) {
                console.log('Calendar already initialized');
            }
        }

        // Update page title
        this.updatePageTitle(tabName);
    }

    updatePageTitle(tabName) {
        const titles = {
            'dashboard': 'Dashboard - Tanulmányi Központ',
            'results': 'Eredmények',
            'missions': 'Küldetések',
            'lists': 'Listák',
            'notes': 'Jegyzetfüzet',
            'calendar': 'Naptár'
        };

        const title = titles[tabName] || 'Donezy';
        document.title = `${title} - Donezy`;
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Quick action button
        document.getElementById('quick-action-btn')?.addEventListener('click', () => {
            this.showQuickActionModal('Gyors tevékenység', 'task');
        });

        // Theme toggle
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Profile menu
        this.setupProfileMenu();

        // Quest progress tracking
        this.setupQuestProgressTracking();
        
        // Mobile navigation
        this.setupMobileNavigation();
        
        console.log('Event listeners setup completed!');
    }

    /**
     * Beállítja a küldetések progress követését
     */
    setupQuestProgressTracking() {
        // Progress frissítés amikor a felhasználó tevékenységet végez
        const updateQuestProgress = async () => {
            if (window.QuestsService && window.QuestsService.updateQuestProgressAutomatically) {
                try {
                    await window.QuestsService.updateQuestProgressAutomatically();
                    // Ha a küldetések tab aktív, frissítjük a megjelenítést
                    if (this.currentTab === 'missions') {
                        await this.renderQuestsTab();
                    }
                } catch (error) {
                    console.error('Error updating quest progress:', error);
                }
            }
        };

        // Figyeljük a DOM változásokat, hogy észleljük a felhasználó tevékenységeit
        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            
            mutations.forEach((mutation) => {
                // Ha új lista vagy teendő lett hozzáadva
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Lista létrehozás
                            if (node.classList && node.classList.contains('list-card')) {
                                shouldUpdate = true;
                            }
                            // Teendő hozzáadás
                            if (node.classList && node.classList.contains('task-row')) {
                                shouldUpdate = true;
                            }
                            // Jegyzet létrehozás
                            if (node.classList && node.classList.contains('note-card')) {
                                shouldUpdate = true;
                            }
                        }
                    });
                }
                
                // Ha teendő státusza változott (checked/unchecked)
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.classList && target.classList.contains('task-checkbox')) {
                        shouldUpdate = true;
                    }
                }
            });
            
            if (shouldUpdate) {
                updateQuestProgress();
            }
        });

        // Figyeljük a DOM változásokat
        observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class']
            });
        }
        
    /**
     * Beállítja a mobil navigációt
     */
    setupMobileNavigation() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
        const mobileMenuClose = document.getElementById('mobile-menu-close');
        const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
        const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
        const mobileSettings = document.getElementById('mobile-settings');
        const mobileHelp = document.getElementById('mobile-help');
        const mobileChangeTargetGroupBtn = document.getElementById('mobile-change-target-group-btn');

        // Hamburger menü megnyitása
        mobileMenuToggle?.addEventListener('click', () => {
            this.openMobileMenu();
        });

        // Mobil menü bezárása X gombbal
        mobileMenuClose?.addEventListener('click', () => {
            this.closeMobileMenu();
        });

        // Mobil menü bezárása háttérre kattintással
        mobileMenuOverlay?.addEventListener('click', (e) => {
            if (e.target === mobileMenuOverlay) {
                this.closeMobileMenu();
            }
        });

        // Mobil navigációs linkek kezelése
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = link.getAttribute('data-tab');
                
                // Aktív állapot frissítése
                mobileNavLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Tab váltás
                this.switchTab(targetTab);
                
                // Mobil menü bezárása
                this.closeMobileMenu();
            });
        });

        // Mobil téma váltás
        mobileThemeToggle?.addEventListener('click', () => {
            this.toggleTheme();
            // Haptic feedback (ha elérhető)
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        });

        // Mobil beállítások
        mobileSettings?.addEventListener('click', () => {
            this.showNotification('Beállítások megnyitása...', 'info');
            this.closeMobileMenu();
            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        });

        // Mobil súgó
        mobileHelp?.addEventListener('click', () => {
            this.showNotification('Súgó megnyitása...', 'info');
            this.closeMobileMenu();
            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        });

        // Mobil célcsoport váltás
        mobileChangeTargetGroupBtn?.addEventListener('click', () => {
            this.showTargetAudienceSelector();
            this.closeMobileMenu();
            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        });

        // ESC billentyűvel bezárás
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileMenuOverlay?.classList.contains('active')) {
                this.closeMobileMenu();
            }
        });

        // Swipe gesture támogatás (opcionális)
        this.setupMobileSwipeGestures();

        // Mobile menu footer actions
        document.querySelectorAll('.mobile-footer-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            switch(action) {
              case 'theme-toggle':
                // Toggle theme functionality
                console.log('Theme toggle clicked');
                break;
              case 'settings':
                // Settings functionality
                console.log('Settings clicked');
                break;
              case 'help':
                // Help functionality
                console.log('Help clicked');
                break;
            }
          });
        });

        // Mobile logout button
        document.getElementById('mobile-logout-btn').addEventListener('click', function() {
          if (typeof window.donezyLogout === 'function') {
            window.donezyLogout();
          } else {
            console.log('Logout functionality not available');
          }
        });

        // Desktop logout button
        document.getElementById('desktop-logout-btn').addEventListener('click', function() {
          if (typeof window.donezyLogout === 'function') {
            window.donezyLogout();
          } else {
            console.log('Logout functionality not available');
          }
        });

        console.log('Mobile navigation setup completed!');
    }

    /**
     * Beállítja a mobil swipe gesture-öket
     */
    setupMobileSwipeGestures() {
        const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
        let startX = 0;
        let startY = 0;
        let isDragging = false;

        mobileMenuOverlay?.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isDragging = true;
        });

        mobileMenuOverlay?.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const deltaX = currentX - startX;
            const deltaY = currentY - startY;

            // Csak vízszintes swipe-ot figyeljük
            if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 50) {
                this.closeMobileMenu();
                isDragging = false;
            }
        });

        mobileMenuOverlay?.addEventListener('touchend', () => {
            isDragging = false;
        });
    }

    /**
     * Megnyitja a mobil menüt
     */
    openMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
        
        if (mobileMenuToggle && mobileMenuOverlay) {
            mobileMenuToggle.classList.add('active');
            mobileMenuOverlay.classList.add('active');
            document.body.classList.add('mobile-menu-open');
            document.body.style.overflow = 'hidden'; // Scroll letiltása
            console.log('Mobile menu opened');
        }
    }

    /**
     * Bezárja a mobil menüt
     */
    closeMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
        
        if (mobileMenuToggle && mobileMenuOverlay) {
            mobileMenuToggle.classList.remove('active');
            mobileMenuOverlay.classList.remove('active');
            document.body.classList.remove('mobile-menu-open');
            document.body.style.overflow = ''; // Scroll visszaállítása
            console.log('Mobile menu closed');
        }
    }

    /**
     * Lekéri a csoport információit
     */
    getGroupInfo(groupId) {
        const groupInfoMap = {
            'student': {
                name: 'Tanuló',
                icon: '👨‍🎓',
                description: 'Iskolai tanulók számára'
            },
            'freelancer': {
                name: 'Freelancer',
                icon: '💼',
                description: 'Szabadúszók számára'
            },
            'employee': {
                name: 'Alkalmazott',
                icon: '👔',
                description: 'Munkahelyi felhasználók számára'
            },
            'entrepreneur': {
                name: 'Vállalkozó',
                icon: '🚀',
                description: 'Vállalkozók számára'
            }
        };

        return groupInfoMap[groupId] || {
            name: 'Ismeretlen csoport',
            icon: '👤',
            description: 'Nincs leírás'
        };
    }

    setupCheckboxListeners() {
        // Add event listeners to checkboxes in lists section
        const checkboxes = document.querySelectorAll('.custom-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const textElement = e.target.nextElementSibling;
                if (e.target.checked) {
                    textElement.classList.add('line-through', 'text-gray-400');
                    textElement.classList.remove('text-gray-300');
                } else {
                    textElement.classList.remove('line-through', 'text-gray-400');
                    textElement.classList.add('text-gray-300');
                }
            });
        });
    }

    toggleTheme() {
        // Dummy theme toggle functionality
        this.showNotification('Téma váltás funkció később lesz elérhető!', 'info');
    }

    showQuickActionModal(title, type) {
        if (this.modalService) {
            this.modalService.showQuickActionModal(title, type, (data) => {
                this.saveItem(type, data);
            });
        } else {
            // Fallback to old modal implementation
            this.showLegacyModal(title, type);
        }
    }

    showLegacyModal(title, type) {
        // Legacy modal implementation for fallback
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop';
        modalOverlay.id = 'modal-overlay';

        const modalContent = document.createElement('div');
        modalContent.className = 'bg-donezy-card rounded-lg p-6 shadow-lg border border-donezy-accent max-w-md w-full mx-4 fade-in';
        
        const icon = type === 'task' ? '✅' : type === 'note' ? '📝' : '📅';
        
        modalContent.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-donezy-orange">${icon} ${title}</h3>
                <button id="close-modal" class="text-gray-400 hover:text-white text-2xl transition-colors duration-200">&times;</button>
            </div>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Cím</label>
                    <input type="text" id="modal-title" class="w-full bg-donezy-accent border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-donezy-orange transition-colors duration-200">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Leírás</label>
                    <textarea id="modal-description" rows="3" class="w-full bg-donezy-accent border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-donezy-orange transition-colors duration-200"></textarea>
                </div>
                <div class="flex space-x-3">
                    <button id="save-item" class="flex-1 bg-donezy-orange hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 btn-hover-effect">
                        Mentés
                    </button>
                    <button id="cancel-item" class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 btn-hover-effect">
                        Mégse
                    </button>
                </div>
            </div>
        `;

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        // Add event listeners for modal
        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancel-item').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('save-item').addEventListener('click', () => {
            const title = document.getElementById('modal-title').value.trim();
            const description = document.getElementById('modal-description').value.trim();
            this.saveItem(type, { 'modal-title': title, 'modal-description': description });
        });

        // Close modal when clicking overlay
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                this.closeModal();
            }
        });

        // Focus on title input
        document.getElementById('modal-title').focus();
    }

    closeModal() {
        if (this.modalService) {
            this.modalService.closeAllModals();
        } else {
            // Legacy modal close
            const modalOverlay = document.getElementById('modal-overlay');
            if (modalOverlay) {
                modalOverlay.remove();
            }
        }
    }

    async saveItem(type, data) {
        const title = data['modal-title'] || data.title || '';
        const description = data['modal-description'] || data.description || '';

        if (!title) {
            this.showError('Kérjük, adjon meg egy címet!');
            return;
        }

        try {
            // Save to data service
            if (this.dataService) {
                const itemId = await this.dataService.saveItem(type, title, description);
                if (itemId) {
                    this.closeModal();
                    this.showSuccess(`${type === 'task' ? 'Feladat' : type === 'note' ? 'Jegyzet' : 'Esemény'} sikeresen hozzáadva!`);
                    
                    // Update streak counter
                    this.streakCount++;
                    await this.updateStreakCounter();
                } else {
                    this.showError('Hiba történt a mentés során. Kérjük, próbáld újra.');
                }
            } else {
                // Fallback to local notification
                this.closeModal();
                this.showSuccess(`${type === 'task' ? 'Feladat' : type === 'note' ? 'Jegyzet' : 'Esemény'} sikeresen hozzáadva!`);
                this.streakCount++;
                this.updateStreakCounter();
            }
        } catch (error) {
            console.error('Error saving item:', error);
            this.showError('Hiba történt a mentés során. Kérjük, próbáld újra.');
        }
    }

    showNotification(message, type = 'info') {
        if (this.notificationService) {
            this.notificationService.showNotification(message, type);
        } else {
            // Fallback notification
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    showError(message) {
        if (this.notificationService) {
            this.notificationService.showError(message);
        } else {
            console.error(message);
        }
    }

    showSuccess(message) {
        if (this.notificationService) {
            this.notificationService.showSuccess(message);
        } else {
            console.log(`SUCCESS: ${message}`);
        }
    }

    async updateStreakCounter() {
        const streakElement = document.getElementById('streak-counter');
        if (streakElement) {
            streakElement.textContent = `${this.streakCount} napos sorozat`;
        }

        // Save to data service if available
        if (this.dataService) {
            await this.dataService.updateStreak(this.streakCount);
        }
    }

    async loadUserData() {
        try {
            console.log('Loading user data...');
            
            // Load user data from data service
            const userData = await this.dataService.getUserData();
            if (userData) {
                this.streakCount = userData.streak || 0;
                console.log('User data loaded:', userData);
            }
            
            // Load user items
            const userItems = await this.dataService.getUserItems();
            this.renderUserItems(userItems);
            
            // Set current user ID for calendar services
            if (calendarService && this.dataService.getCurrentUserId) {
                const userId = this.dataService.getCurrentUserId();
                calendarService.setCurrentUser(userId);
                console.log('Calendar service user set to:', userId);
            }
            
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    renderUserItems(items) {
        // Render user items in appropriate sections
        const tasks = items.filter(item => item.type === 'task');
        const notes = items.filter(item => item.type === 'note');
        const events = items.filter(item => item.type === 'event');

        // Update lists section
        this.renderTasks(tasks);
        
        // Update notes section
        this.renderNotes(notes);
        
        // Update calendar section
        this.renderEvents(events);
    }

    renderTasks(tasks) {
        const tasksContainer = document.getElementById('urgent-tasks');
        if (!tasksContainer) return;
        
        if (tasks.length === 0) {
            tasksContainer.innerHTML = `
                <div class="bg-donezy-accent rounded-lg p-3 fade-in">
                    <p class="text-gray-300">Nincs sürgős feladat!</p>
                </div>
            `;
            return;
        }

        tasksContainer.innerHTML = tasks.slice(0, 3).map(task => `
            <div class="bg-donezy-accent rounded-lg p-3 fade-in card-hover ${task.completed ? '' : 'pulse-urgent'}">
                <div class="flex justify-between items-center">
                    <p class="font-medium text-white ${task.completed ? 'line-through text-gray-400' : ''}">${task.title}</p>
                    <span class="text-red-400">🔥</span>
                </div>
            </div>
        `).join('');
    }

    renderNotes(notes) {
        // This would update the notes section with real data
        console.log('Rendering notes:', notes);
    }

    renderEvents(events) {
        // --- DashboardService kezeli a #today-events szekciót, ezért ezt a részt eltávolítjuk vagy kikommenteljük ---
        // function renderEvents(events) {
        //     const eventsContainer = document.getElementById('today-events');
        //     if (!eventsContainer) return;
        //     if (events.length === 0) {
        //         eventsContainer.innerHTML = `
        //             <div class="bg-donezy-accent rounded-lg p-3 fade-in">
        //                 <p class="text-gray-300">Nincs mai esemény</p>
        //             </div>
        //         `;
        //         return;
        //     }
        //     eventsContainer.innerHTML = events.slice(0, 3).map(event => `
        //         <div class="bg-donezy-accent rounded-lg p-3 fade-in card-hover">
        //             <div class="flex justify-between items-center">
        //                 <div>
        //                     <p class="font-medium text-white">${event.title}</p>
        //                     <p class="text-sm text-gray-400">${new Date(event.createdAt).toLocaleTimeString('hu-HU', {hour: '2-digit', minute: '2-digit'})}</p>
        //                 </div>
        //                 <span class="text-2xl">📅</span>
        //             </div>
        //         </div>
        //     `).join('');
        // }
    }

    loadDummyData() {
        // Load dummy events
        const dummyEvents = [
            { title: 'Matematika óra', time: '10:00', type: 'class' },
            { title: 'Projekt beadás', time: '14:00', type: 'deadline' }
        ];

        this.renderEvents(dummyEvents);

        // Load dummy urgent tasks
        const dummyUrgentTasks = [
            { title: 'Házi feladat elkészítése', priority: 'high' },
            { title: 'Vizsga felkészülés', priority: 'high' }
        ];

        this.renderUrgentTasks(dummyUrgentTasks);
    }

    renderUrgentTasks(tasks) {
        const tasksContainer = document.getElementById('urgent-tasks');
        if (!tasksContainer) return;
        
        if (tasks.length === 0) {
            tasksContainer.innerHTML = `
                <div class="bg-donezy-accent rounded-lg p-3 fade-in">
                    <p class="text-gray-300">Nincs sürgős feladat!</p>
                </div>
            `;
            return;
        }

        tasksContainer.innerHTML = tasks.map(task => `
            <div class="bg-donezy-accent rounded-lg p-3 fade-in card-hover pulse-urgent">
                <div class="flex justify-between items-center">
                    <p class="font-medium text-white">${task.title}</p>
                    <span class="text-red-400">🔥</span>
                </div>
            </div>
        `).join('');
    }

    // Set user group (called by target audience selector)
    setUserGroup(group) {
        this.userGroup = group;
        console.log(`User group set to: ${group}`);
        
        // Update profile menu content
        this.updateProfileMenuContent();
    }

    // Initialize app after group selection
    initializeAppAfterGroupSelection() {
        console.log('Initializing app after group selection...');
        
        // Initialize the main app components
        this.updateDateTime();
        this.setupEventListeners();
        this.loadUserData();
        
        // Update time every second
        setInterval(() => {
            this.updateDateTime();
        }, 1000);
        
        console.log('App initialization completed!');
    }

    // Public methods to access app instance
    getCurrentTab() {
        return this.currentTab;
    }

    getStreakCount() {
        return this.streakCount;
    }

    getUserGroup() {
        return this.userGroup;
    }

    updateConnectionStatus(status, provider) {
        const statusElement = document.getElementById('connection-status');
        if (!statusElement) return;

        const indicator = statusElement.querySelector('div');
        const text = statusElement.querySelector('span');

        // Remove existing classes
        statusElement.classList.remove('bg-green-500', 'bg-red-500', 'bg-gray-500');
        indicator.classList.remove('bg-green-400', 'bg-red-400', 'bg-gray-400');

        switch (status) {
            case 'connected':
                statusElement.classList.add('bg-green-500');
                indicator.classList.add('bg-green-400');
                text.textContent = `${provider} ✓`;
                break;
            case 'offline':
                statusElement.classList.add('bg-gray-500');
                indicator.classList.add('bg-gray-400');
                text.textContent = `${provider} (offline)`;
                break;
            case 'error':
                statusElement.classList.add('bg-red-500');
                indicator.classList.add('bg-red-400');
                text.textContent = `${provider} ✗`;
                break;
            default:
                statusElement.classList.add('bg-gray-500');
                indicator.classList.add('bg-gray-400');
                text.textContent = 'Kapcsolat...';
        }
    }

    // Setup profile menu functionality
    setupProfileMenu() {
        console.log('Setting up profile menu...');
        
        const profileBtn = document.getElementById('profile-menu-btn');
        const profileDropdown = document.getElementById('profile-dropdown');
        const changeTargetGroupBtn = document.getElementById('change-target-group-btn');

        console.log('Profile elements found:', {
            profileBtn: !!profileBtn,
            profileDropdown: !!profileDropdown,
            changeTargetGroupBtn: !!changeTargetGroupBtn
        });

        if (profileBtn && profileDropdown) {
            console.log('Adding profile menu event listeners...');
            
            // Simple click handler for profile button
            profileBtn.onclick = (e) => {
                console.log('Profile button clicked!');
                e.stopPropagation();
                e.preventDefault();
                
                // Simple toggle logic
                if (profileDropdown.style.display === 'block') {
                    console.log('Hiding dropdown...');
                    profileDropdown.style.display = 'none';
                } else {
                    console.log('Showing dropdown...');
                    profileDropdown.style.display = 'block';
                    profileDropdown.classList.add('dropdown-animate-in');
                    this.updateProfileMenuContent();
                }
            };

            // Change target group button
            if (changeTargetGroupBtn) {
                changeTargetGroupBtn.onclick = (e) => {
                    console.log('Change target group button clicked!');
                    e.stopPropagation();
                    this.showTargetAudienceSelector();
                    profileDropdown.style.display = 'none';
                };
            }
            
            // Simple click outside handler
            document.onclick = (e) => {
                if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
                    if (profileDropdown.style.display === 'block') {
                        console.log('Clicking outside, closing dropdown...');
                        profileDropdown.style.display = 'none';
                    }
                }
            };
            
            console.log('Profile menu setup completed!');
        } else {
            console.error('Profile menu elements not found!');
        }
    }

    // Update profile menu content
    updateProfileMenuContent() {
        // Update desktop profile menu
        const currentTargetGroup = document.getElementById('current-target-group');
        const currentGroupIcon = document.getElementById('current-group-icon');

        if (currentTargetGroup && currentGroupIcon) {
            const groupInfo = this.getGroupInfo(this.userGroup);
                    currentTargetGroup.textContent = groupInfo.name;
                    currentGroupIcon.textContent = groupInfo.icon;
        }

        // Update mobile target group display
        const mobileCurrentTargetGroup = document.getElementById('mobile-current-target-group');
        const mobileCurrentGroupIcon = document.getElementById('mobile-current-group-icon');
        
        if (mobileCurrentTargetGroup && mobileCurrentGroupIcon) {
            const groupInfo = this.getGroupInfo(this.userGroup);
            mobileCurrentTargetGroup.textContent = groupInfo.name;
            mobileCurrentGroupIcon.textContent = groupInfo.icon;
        }
    }

    // Show target audience selector from profile menu
    showTargetAudienceSelector() {
        console.log('Showing target audience selector from profile menu...');
        
        if (this.targetAudienceSelector) {
            this.targetAudienceSelector.showSelector();
        } else {
            console.error('Target audience selector not available');
            this.showError('Hiba: Célcsoport-választó nem elérhető');
        }
    }

    // Test functions for debugging
    testProfileMenu() {
        console.log('=== Testing Profile Menu ===');
        
        const profileBtn = document.getElementById('profile-menu-btn');
        const profileDropdown = document.getElementById('profile-dropdown');
        
        console.log('Profile button:', profileBtn);
        console.log('Profile dropdown:', profileDropdown);
        
        if (profileBtn && profileDropdown) {
            console.log('Profile elements found, testing click...');
            profileBtn.click();
        } else {
            console.error('Profile elements not found!');
        }
    }

    testShowDropdown() {
        console.log('=== Testing Direct Dropdown Show ===');
        
        const profileDropdown = document.getElementById('profile-dropdown');
        if (profileDropdown) {
            console.log('Directly showing dropdown...');
            profileDropdown.style.display = 'block';
            profileDropdown.classList.add('dropdown-animate-in');
            this.updateProfileMenuContent();
            console.log('Dropdown should now be visible!');
        } else {
            console.error('Profile dropdown not found!');
        }
    }

    testTargetAudienceSelector() {
        console.log('Manually testing target audience selector...');
        
        // Clear localStorage to force selector to show
        localStorage.clear();
        
        // Reinitialize the target audience selector
        if (this.targetAudienceSelector) {
            this.targetAudienceSelector.showSelector();
        } else {
            console.error('Target audience selector not available');
        }
    }

    debugLocalStorage() {
        console.log('=== LocalStorage Debug ===');
        const userId = localStorage.getItem('donezy_user_id');
        console.log('User ID:', userId);
        
        if (userId) {
            const userData = localStorage.getItem(`donezy_user_${userId}`);
            console.log('User data:', userData);
            if (userData) {
                console.log('Parsed user data:', JSON.parse(userData));
            }
        }
        
        console.log('All localStorage keys:', Object.keys(localStorage));
        console.log('=== End Debug ===');
    }

    testGroupSelection(groupId) {
        console.log(`Testing group selection for: ${groupId}`);
        
        if (this.dataService) {
            this.dataService.saveUserGroup(groupId).then(success => {
                console.log('Group selection test result:', success);
                if (success) {
                    this.setUserGroup(groupId);
                    this.initializeAppAfterGroupSelection();
                }
            });
        } else {
            console.error('Data service not available for testing');
        }
    }

    async renderResultsTab() {
        console.log('Rendering results tab...');
        
        // 1. Lekérjük a user itemeket és userData-t
        let items = [];
        let userData = {};
        if (this.dataService) {
            try {
                items = await this.dataService.getUserItems();
                userData = await this.dataService.getUserData();
                console.log('User items:', items);
                console.log('User data:', userData);
            } catch (e) {
                console.error('Nem sikerült betölteni a user adatokat:', e);
            }
        }
        // 2. Stat aggregálás
        let stats = (window.StatAggregator && window.StatAggregator.aggregateStats) ? window.StatAggregator.aggregateStats(items, userData) : {};
        console.log('Stats:', stats);
        // 3. Szint/XP progress
        let xpInfo = (window.LevelSystem && window.LevelSystem.getXPForNextLevel) ? window.LevelSystem.getXPForNextLevel(stats.xp || 0) : { currentLevel: 1, currentLevelXP: 0, nextLevelXP: 100, xpToNext: 100, progress: 0 };
        console.log('XP info:', xpInfo);
        // 4. Badge-ek (nem ellenőrizzük az új achievement-eket automatikusan)
        let badges = (window.LevelSystem && window.LevelSystem.getUserBadges) ? window.LevelSystem.getUserBadges(stats, false) : [];
        console.log('Badges:', badges);
        // 5. Összegzés
        let summaryLines = (window.LevelSystem && window.LevelSystem.getSummaryLines) ? window.LevelSystem.getSummaryLines(stats) : [];
        console.log('Summary lines:', summaryLines);
        // 6. Renderelés
        if (window.ResultsRenderer && window.ResultsRenderer.renderResultsTab) {
            console.log('Calling ResultsRenderer.renderResultsTab...');
            window.ResultsRenderer.renderResultsTab(stats, badges, xpInfo, summaryLines);
        } else {
            console.error('ResultsRenderer not available or renderResultsTab method missing');
        }
    }

    async renderQuestsTab() {
        console.log('Rendering quests tab...');
        
        if (window.QuestsService && window.questsRenderer) {
            try {
                const quests = window.QuestsService.getQuests();
                console.log('Quests:', quests);
                console.log('Calling questsRenderer.renderQuestsTab...');
                await window.questsRenderer.renderQuestsTab(quests);
                console.log('questsRenderer.renderQuestsTab called successfully');
            } catch (error) {
                console.error('Error rendering quests tab:', error);
            }
        } else {
            console.error('QuestsService or questsRenderer not available');
            console.log('QuestsService available:', !!window.QuestsService);
            console.log('questsRenderer available:', !!window.questsRenderer);
        }
    }

    async renderListsTab() {
        console.log('Rendering lists tab...');
        
        if (window.ListsService && window.ListsRenderer) {
            try {
                const lists = window.ListsService.getAllLists();
                console.log('Lists:', lists);
                console.log('Calling ListsRenderer.renderListsTab...');
                window.ListsRenderer.renderListsTab(lists);
                console.log('ListsRenderer.renderListsTab called successfully');
            } catch (error) {
                console.error('Error rendering lists tab:', error);
            }
        } else {
            console.error('ListsService or ListsRenderer not available');
            console.log('ListsService available:', !!window.ListsService);
            console.log('ListsRenderer available:', !!window.ListsRenderer);
        }
    }
}

// Initialize the application when DOM is loaded
window.addEventListener('donezy-authenticated', () => {
  if (!window.donezyApp) {
    window.donezyApp = new DonezyApp();
  } else if (typeof window.donezyApp.init === 'function') {
    window.donezyApp.init();
  }
});

async function showDashboardForUser(userId) {
  try {
    const userRef = firebase.database().ref(`users/${userId}`);
    const snapshot = await userRef.once('value');
    const userData = snapshot.val();
    const role = userData && userData.role ? userData.role : 'student';

    // Hide all dashboard sections
    document.querySelectorAll('.dashboard-section').forEach(div => div.classList.add('hidden'));

    // Show the correct dashboard
    if (role === 'student') {
      document.getElementById('dashboard-student').classList.remove('hidden');
      const title = document.getElementById('dashboard-title');
      if (title) title.textContent = '📊 Dashboard – Tanulmányi Központ';
    } else if (role === 'freelancer') {
      document.getElementById('dashboard-freelancer').classList.remove('hidden');
    } else {
      // Későbbi célcsoportokhoz
    }
    
    // Initialize dashboard service for the logged-in user
    if (window.donezyApp && window.donezyApp.initializeDashboardService) {
      await window.donezyApp.initializeDashboardService();
    }
  } catch (err) {
    console.error('Dashboard role error:', err);
  }
} 