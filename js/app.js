// Donezy Application - Main JavaScript File with Navigation System and Firebase Integration
class DonezyApp {
    constructor() {
        this.streakCount = 0;
        this.currentTab = 'dashboard';
        this.userGroup = null;
        this.firebaseService = null;
        this.targetAudienceSelector = null;
        this.motivationalQuotes = [
            "A tudás az egyetlen kincs, amit soha nem vehetnek el tőled.",
            "A siker nem véletlen, hanem következetes erőfeszítés eredménye.",
            "Minden nap egy új lehetőség a fejlődésre.",
            "A kitartás a siker kulcsa.",
            "Ne add fel a céljaidat, csak módosítsd az utat hozzájuk."
        ];
        this.init();
    }

    async init() {
        try {
            // Initialize Firebase service
            await this.initializeFirebase();
            
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

    async initializeFirebase() {
        try {
            // Check if Firebase is available
            if (typeof FirebaseService === 'undefined') {
                console.warn('Firebase service not available, using local storage fallback');
                this.firebaseService = this.createLocalStorageFallback();
                this.updateConnectionStatus('offline', 'Local Storage');
            } else {
                this.firebaseService = new FirebaseService();
                
                // Test Firebase connection
                const isConnected = await this.firebaseService.testConnection();
                if (!isConnected) {
                    console.warn('Firebase connection failed, using local storage fallback');
                    this.firebaseService = this.createLocalStorageFallback();
                    this.updateConnectionStatus('offline', 'Local Storage');
                } else {
                    this.updateConnectionStatus('connected', 'Firebase');
                }
            }
        } catch (error) {
            console.error('Error initializing Firebase:', error);
            this.firebaseService = this.createLocalStorageFallback();
            this.updateConnectionStatus('offline', 'Local Storage');
        }
    }

    createLocalStorageFallback() {
        // Create a local storage fallback when Firebase is not available
        const self = this;
        return {
            getCurrentUserId: function() {
                let userId = localStorage.getItem('donezy_user_id');
                if (!userId) {
                    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                    localStorage.setItem('donezy_user_id', userId);
                }
                return userId;
            },
            getUserData: async function() {
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
            },
            saveUserData: async function(userData) {
                const userId = this.getCurrentUserId();
                localStorage.setItem(`donezy_user_${userId}`, JSON.stringify({
                    ...userData,
                    lastActive: new Date().toISOString()
                }));
                return true;
            },
            updateUserField: async function(field, value) {
                const userData = await this.getUserData();
                userData[field] = value;
                return await this.saveUserData(userData);
            },
            saveUserGroup: async function(group) {
                return await this.updateUserField('group', group);
            },
            getUserGroup: async function() {
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
            },
            updateStreak: async function(streak) {
                return await this.updateUserField('streak', streak);
            },
            updateXP: async function(xp) {
                return await this.updateUserField('xp', xp);
            },
            saveItem: async function(type, title, description) {
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
            },
            getUserItems: async function() {
                const userId = this.getCurrentUserId();
                const items = localStorage.getItem(`donezy_items_${userId}`);
                return items ? JSON.parse(items) : [];
            },
            testConnection: async function() {
                return true; // Local storage is always available
            },
            getConnectionStatus: function() {
                return {
                    connected: false,
                    userId: this.getCurrentUserId(),
                    projectId: 'local-storage-fallback'
                };
            },
            logActivity: function(action, data = {}) {
                console.log('Local storage activity:', action, data);
                return true;
            }
        };
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
            console.log('Initializing selector with firebase service...');
            await this.targetAudienceSelector.init(this.firebaseService);
            
            // Get user group
            this.userGroup = await this.firebaseService.getUserGroup();
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
        // Get all navigation tabs (desktop and mobile)
        const navTabs = document.querySelectorAll('[data-tab]');
        
        navTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = tab.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });

        // Set initial active tab
        this.switchTab('dashboard');
    }

    switchTab(tabName) {
        // Update current tab
        this.currentTab = tabName;

        // Remove active class from all tabs
        const allTabs = document.querySelectorAll('[data-tab]');
        allTabs.forEach(tab => {
            tab.classList.remove('active');
        });

        // Add active class to clicked tab and its mobile counterpart
        const activeTabs = document.querySelectorAll(`[data-tab="${tabName}"]`);
        activeTabs.forEach(tab => {
            tab.classList.add('active');
        });

        // Hide all content sections
        const allSections = document.querySelectorAll('.content-section');
        allSections.forEach(section => {
            section.classList.remove('active');
        });

        // Show target content section
        const targetSection = document.getElementById(`${tabName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update page title based on tab
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
        
        // Quick action buttons
        document.getElementById('quick-task-btn')?.addEventListener('click', () => {
            this.showQuickActionModal('Új feladat hozzáadása', 'task');
        });

        document.getElementById('quick-note-btn')?.addEventListener('click', () => {
            this.showQuickActionModal('Új jegyzet létrehozása', 'note');
        });

        document.getElementById('quick-event-btn')?.addEventListener('click', () => {
            this.showQuickActionModal('Új esemény hozzáadása', 'event');
        });

        // Profile menu functionality
        console.log('Setting up profile menu...');
        this.setupProfileMenu();

        // Theme toggle
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Checkbox functionality for lists
        this.setupCheckboxListeners();
        
        console.log('Event listeners setup completed!');
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
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop';
        modalOverlay.id = 'modal-overlay';

        // Create modal content
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
            this.saveItem(type);
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
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            modalOverlay.remove();
        }
    }

    async saveItem(type) {
        const title = document.getElementById('modal-title').value.trim();
        const description = document.getElementById('modal-description').value.trim();

        if (!title) {
            alert('Kérjük, adjon meg egy címet!');
            return;
        }

        try {
            // Save to Firebase/local storage
            if (this.firebaseService) {
                const itemId = await this.firebaseService.saveItem(type, title, description);
                if (itemId) {
                    this.closeModal();
                    this.showNotification(`${type === 'task' ? 'Feladat' : type === 'note' ? 'Jegyzet' : 'Esemény'} sikeresen hozzáadva!`, 'success');
                    
                    // Update streak counter
                    this.streakCount++;
                    await this.updateStreakCounter();
                } else {
                    this.showError('Hiba történt a mentés során. Kérjük, próbáld újra.');
                }
            } else {
                // Fallback to local notification
                this.closeModal();
                this.showNotification(`${type === 'task' ? 'Feladat' : type === 'note' ? 'Jegyzet' : 'Esemény'} sikeresen hozzáadva!`, 'success');
                this.streakCount++;
                this.updateStreakCounter();
            }
        } catch (error) {
            console.error('Error saving item:', error);
            this.showError('Hiba történt a mentés során. Kérjük, próbáld újra.');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 bg-${type === 'success' ? 'green' : 'blue'}-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-x-full`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-x-full';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }

    async updateStreakCounter() {
        const streakElement = document.getElementById('streak-counter');
        if (streakElement) {
            streakElement.textContent = `${this.streakCount} napos sorozat`;
        }

        // Save to Firebase if available
        if (this.firebaseService) {
            await this.firebaseService.updateStreak(this.streakCount);
        }
    }

    async loadUserData() {
        try {
            if (this.firebaseService) {
                // Load user data from Firebase
                const userData = await this.firebaseService.getUserData();
                if (userData) {
                    this.streakCount = userData.streak || 0;
                    this.updateStreakCounter();
                }

                // Load user items
                const userItems = await this.firebaseService.getUserItems();
                this.renderUserItems(userItems);
            } else {
                // Load dummy data
                this.loadDummyData();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            this.loadDummyData();
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
        this.setupNavigation();
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

    // Test function to manually test profile menu
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

    // Test function to directly show dropdown
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

    // Test function to manually show target audience selector
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

    // Debug function to check localStorage
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

    // Test function to simulate group selection
    testGroupSelection(groupId) {
        console.log(`Testing group selection for: ${groupId}`);
        
        if (this.firebaseService) {
            this.firebaseService.saveUserGroup(groupId).then(success => {
                console.log('Group selection test result:', success);
                if (success) {
                    this.setUserGroup(groupId);
                    this.initializeAppAfterGroupSelection();
                }
            });
        } else {
            console.error('Firebase service not available for testing');
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
        const currentTargetGroup = document.getElementById('current-target-group');
        const currentGroupIcon = document.getElementById('current-group-icon');

        if (currentTargetGroup && currentGroupIcon) {
            const userGroup = this.getUserGroup();
            console.log('Updating profile menu with user group:', userGroup);

            if (userGroup) {
                // Get group info from target audience selector
                const groupInfo = this.targetAudienceSelector?.getGroupInfo(userGroup);
                
                if (groupInfo) {
                    currentTargetGroup.textContent = groupInfo.name;
                    currentGroupIcon.textContent = groupInfo.icon;
                } else {
                    currentTargetGroup.textContent = 'Ismeretlen csoport';
                    currentGroupIcon.textContent = '👤';
                }
            } else {
                currentTargetGroup.textContent = 'Nincs kiválasztva';
                currentGroupIcon.textContent = '❓';
            }
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
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.donezyApp = new DonezyApp();
}); 