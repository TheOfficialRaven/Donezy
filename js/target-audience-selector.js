// Target Audience Selector Component for Donezy Application
class TargetAudienceSelector {
    constructor() {
        this.targetGroups = [
            {
                id: 'student',
                name: 'Diák',
                icon: '🎓',
                description: 'Tanulmányi célok és iskolai feladatok kezelése',
                color: 'bg-blue-500',
                hoverColor: 'hover:bg-blue-600',
                borderColor: 'border-blue-500',
                features: ['Házi feladatok', 'Vizsgák', 'Projektek', 'Tanulási célok']
            },
            {
                id: 'self-improver',
                name: 'Önfejlesztő',
                icon: '🚀',
                description: 'Személyes fejlődés és készségek fejlesztése',
                color: 'bg-green-500',
                hoverColor: 'hover:bg-green-600',
                borderColor: 'border-green-500',
                features: ['Készségfejlesztés', 'Olvasási célok', 'Kurzusok', 'Hobbi projektek']
            },
            {
                id: 'freelancer',
                name: 'Freelancer',
                icon: '💼',
                description: 'Projektek és ügyfelek kezelése',
                color: 'bg-purple-500',
                hoverColor: 'hover:bg-purple-600',
                borderColor: 'border-purple-500',
                features: ['Projekt menedzsment', 'Időkövetés', 'Ügyfél kommunikáció', 'Számlázás']
            },
            {
                id: 'worker',
                name: 'Dolgozó',
                icon: '👔',
                description: 'Munkahelyi feladatok és karrier célok',
                color: 'bg-orange-500',
                hoverColor: 'hover:bg-orange-600',
                borderColor: 'border-orange-500',
                features: ['Munkahelyi feladatok', 'Karrier célok', 'Meetingek', 'Projektek']
            },
            {
                id: 'organizer',
                name: 'Rendszerező',
                icon: '📋',
                description: 'Általános produktivitás és szervezés',
                color: 'bg-red-500',
                hoverColor: 'hover:bg-red-600',
                borderColor: 'border-red-500',
                features: ['Teendők', 'Időbeosztás', 'Célok', 'Szokások']
            }
        ];
        
        this.selectedGroup = null;
        this.firebaseService = null;
    }

    // Initialize the selector
    async init(firebaseService) {
        console.log('TargetAudienceSelector initializing...');
        this.firebaseService = firebaseService;
        
        // Check if user has already selected a group
        const userGroup = await this.firebaseService.getUserGroup();
        console.log('Current user group:', userGroup);
        
        if (!userGroup || userGroup === null || userGroup === undefined) {
            console.log('No user group found, showing selector...');
            this.showSelector();
        } else {
            console.log('User group found, loading module...');
            // User has already selected a group, load the appropriate module
            this.loadUserModule(userGroup);
        }
    }

    // Show the target audience selector modal
    showSelector() {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 modal-backdrop';
        modalOverlay.id = 'target-audience-modal';

        const modalContent = document.createElement('div');
        modalContent.className = 'bg-donezy-card rounded-lg p-8 shadow-lg border border-donezy-accent max-w-4xl w-full mx-4 fade-in max-h-[90vh] overflow-y-auto';

        modalContent.innerHTML = `
            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold text-donezy-orange mb-4">Üdvözöl a Donezy-ben! 🎉</h2>
                <p class="text-gray-300 text-lg">Válaszd ki a célcsoportodat, hogy személyre szabott élményt nyújthassunk neked!</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                ${this.targetGroups.map(group => `
                    <div class="target-group-card bg-donezy-accent rounded-lg p-6 border-2 border-transparent cursor-pointer transition-all duration-300 hover:scale-105 card-hover" 
                         data-group-id="${group.id}">
                        <div class="text-center">
                            <div class="text-4xl mb-4">${group.icon}</div>
                            <h3 class="text-xl font-bold text-white mb-2">${group.name}</h3>
                            <p class="text-gray-300 text-sm mb-4">${group.description}</p>
                            
                            <div class="space-y-2">
                                ${group.features.map(feature => `
                                    <div class="flex items-center space-x-2">
                                        <span class="text-xs">✓</span>
                                        <span class="text-xs text-gray-400">${feature}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="mt-4 text-center">
                            <button class="select-group-btn bg-donezy-orange hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 w-full ${group.hoverColor}">
                                Kiválasztás
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="text-center">
                <p class="text-gray-400 text-sm">
                    Később bármikor módosíthatod a beállításokat a profil menüben.
                </p>
            </div>
        `;

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        // Add event listeners
        this.setupEventListeners();
    }

    // Setup event listeners for the selector
    setupEventListeners() {
        const modal = document.getElementById('target-audience-modal');
        
        // Group card selection - make entire card clickable
        const groupCards = modal.querySelectorAll('.target-group-card');
        groupCards.forEach(card => {
            // Add click handler to entire card
            card.addEventListener('click', async (e) => {
                // Don't trigger if clicking on the button (button has its own handler)
                if (e.target.classList.contains('select-group-btn') || e.target.closest('.select-group-btn')) {
                    return;
                }
                
                console.log('Card clicked:', card.getAttribute('data-group-id'));
                
                // Remove active state from all cards
                groupCards.forEach(c => {
                    c.classList.remove('border-donezy-orange', 'bg-donezy-card');
                    c.classList.add('border-transparent', 'bg-donezy-accent');
                });

                // Add active state to clicked card
                card.classList.remove('border-transparent', 'bg-donezy-accent');
                card.classList.add('border-donezy-orange', 'bg-donezy-card');

                // Store selected group
                this.selectedGroup = card.getAttribute('data-group-id');
                console.log('Selected group set to:', this.selectedGroup);
                
                // Auto-select the group after a short delay
                setTimeout(async () => {
                    console.log('Auto-selecting group:', this.selectedGroup);
                    await this.selectGroup(this.selectedGroup);
                }, 300);
            });
        });

        // Select button click - improved with better feedback
        const selectButtons = modal.querySelectorAll('.select-group-btn');
        selectButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                console.log('Button clicked!');
                
                const card = button.closest('.target-group-card');
                let groupId = card ? card.getAttribute('data-group-id') : null;
                
                // Fallback to selected group if button doesn't have group ID
                if (!groupId && this.selectedGroup) {
                    groupId = this.selectedGroup;
                    console.log('Using selected group as fallback:', groupId);
                }
                
                console.log('Select button clicked for group:', groupId);
                console.log('Selected group from instance:', this.selectedGroup);
                
                if (groupId) {
                    // Show immediate feedback
                    button.innerHTML = `
                        <div class="flex items-center justify-center space-x-2">
                            <div class="loading-spinner w-4 h-4"></div>
                            <span>Mentés...</span>
                        </div>
                    `;
                    button.disabled = true;
                    
                    console.log('Calling selectGroup with:', groupId);
                    await this.selectGroup(groupId);
                } else {
                    console.error('No group ID found for button');
                    console.error('Card:', card);
                    console.error('Selected group:', this.selectedGroup);
                    this.showError('Hiba: Nem található a kiválasztott csoport. Kérjük, válassz ki egy csoportot.');
                }
            });
        });

        // Prevent modal close on card click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                // Don't close modal on overlay click - require explicit selection
                return;
            }
        });
    }

    // Handle group selection
    async selectGroup(groupId) {
        console.log(`Selecting group: ${groupId}`);
        
        if (!this.firebaseService) {
            console.error('Firebase service not initialized');
            this.showError('Hiba: Firebase szolgáltatás nem inicializálva');
            return;
        }

        try {
            console.log('Saving group to Firebase/local storage...');
            
            // Save group to Firebase/local storage
            const success = await this.firebaseService.saveUserGroup(groupId);
            console.log('Save result:', success);
            
            if (success) {
                console.log('Group saved successfully, hiding modal...');
                
                // Hide modal with animation
                this.hideModal();
                
                // Show success message
                this.showSuccessMessage(groupId);
                
                // Load the appropriate module
                setTimeout(() => {
                    console.log('Loading user module...');
                    this.loadUserModule(groupId);
                }, 1000);
                
            } else {
                console.error('Failed to save group');
                this.showError('Hiba történt a mentés során. Kérjük, próbáld újra.');
                
                // Reset button state
                this.resetButtonState();
            }
        } catch (error) {
            console.error('Error selecting group:', error);
            this.showError(`Hiba történt a mentés során: ${error.message}`);
            
            // Reset button state
            this.resetButtonState();
        }
    }

    // Reset button state after error
    resetButtonState() {
        const modal = document.getElementById('target-audience-modal');
        if (!modal) return;
        
        const selectButtons = modal.querySelectorAll('.select-group-btn');
        selectButtons.forEach(button => {
            button.innerHTML = 'Kiválasztás';
            button.disabled = false;
        });
    }

    // Hide modal with animation
    hideModal() {
        console.log('Hiding modal...');
        const modal = document.getElementById('target-audience-modal');
        console.log('Modal element:', modal);
        
        if (modal) {
            console.log('Adding fade-out class...');
            modal.classList.add('fade-out');
            
            setTimeout(() => {
                console.log('Removing modal from DOM...');
                modal.remove();
                console.log('Modal removed successfully');
            }, 300);
        } else {
            console.error('Modal element not found!');
        }
    }

    // Show success message
    showSuccessMessage(groupId) {
        const selectedGroup = this.targetGroups.find(g => g.id === groupId);
        const message = `Sikeresen kiválasztottad a "${selectedGroup.name}" célcsoportot!`;
        
        // Create success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-x-full';
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <span>✅</span>
                <span>${message}</span>
            </div>
        `;
        
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

    // Show error message
    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-x-full';
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <span>❌</span>
                <span>${message}</span>
            </div>
        `;
        
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

    // Load user module based on selected group
    loadUserModule(groupId) {
        // For now, we'll just load the student module
        // In the future, this can be expanded to load different modules
        console.log(`Loading module for group: ${groupId}`);
        
        // Update the app to reflect the user's group
        if (window.donezyApp) {
            window.donezyApp.setUserGroup(groupId);
            
            // Update profile menu content
            window.donezyApp.updateProfileMenuContent();
            
            // Initialize the app after group selection
            window.donezyApp.initializeAppAfterGroupSelection();
        }
    }

    // Test method for debugging
    testSelectGroup(groupId) {
        console.log(`Testing group selection for: ${groupId}`);
        this.selectGroup(groupId);
    }

    // Get target group info by ID
    getGroupInfo(groupId) {
        return this.targetGroups.find(g => g.id === groupId);
    }

    // Get all target groups
    getAllGroups() {
        return this.targetGroups;
    }
}

// Export the class
window.TargetAudienceSelector = TargetAudienceSelector; 