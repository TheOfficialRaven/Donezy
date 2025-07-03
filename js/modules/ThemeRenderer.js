// ThemeRenderer.js - Témaválasztó felület kezelése
window.ThemeRenderer = (function() {
    'use strict';

    let themeSelectorModal = null;
    let currentFilter = 'all';

    /**
     * Inicializálja a ThemeRenderer-t
     */
    async function init() {
        console.log('ThemeRenderer initializing...');
        setupEventListeners();
        console.log('ThemeRenderer initialized');
    }

    /**
     * Event listener-ek beállítása
     */
    function setupEventListeners() {
        // Témaválasztó gomb eseménye
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="open-theme-selector"]')) {
                openThemeSelector();
            }
        });
    }

    /**
     * Megnyitja a témaválasztó felületet
     */
    async function openThemeSelector() {
        try {
            if (!window.ThemeService) {
                console.error('ThemeService not available');
                return;
            }

            // Modal létrehozása
            createThemeSelectorModal();
            
            // Témák betöltése és megjelenítése
            await renderThemes();
            
            // Modal megjelenítése
            showThemeSelectorModal();
            
        } catch (error) {
            console.error('Error opening theme selector:', error);
        }
    }

    /**
     * Létrehozza a témaválasztó modalt
     */
    function createThemeSelectorModal() {
        // Előző modal eltávolítása
        if (themeSelectorModal) {
            themeSelectorModal.remove();
        }

        themeSelectorModal = document.createElement('div');
        themeSelectorModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 theme-selector-modal';
        themeSelectorModal.id = 'theme-selector-modal';

        themeSelectorModal.innerHTML = `
            <div class="bg-donezy-card rounded-xl p-6 shadow-2xl border border-donezy-accent max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden fade-in">
                <!-- Fejléc -->
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-donezy-orange">🎨 Témák</h2>
                    <button class="theme-close-btn text-secondary hover:text-primary text-2xl transition-colors duration-200" data-action="close-theme-selector">&times;</button>
                </div>

                <!-- Szűrők -->
                <div class="flex flex-wrap gap-2 mb-6">
                    <button class="theme-filter-btn bg-donezy-orange text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200" data-filter="all">
                        🌈 Összes
                    </button>
                    <button class="theme-filter-btn bg-donezy-accent text-secondary hover:text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200" data-filter="default">
                        🎯 Alapértelmezett
                    </button>
                    <button class="theme-filter-btn bg-donezy-accent text-secondary hover:text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200" data-filter="level">
                        ⭐ Szinthez kötött
                    </button>
                    <button class="theme-filter-btn bg-donezy-accent text-secondary hover:text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200" data-filter="shop">
                        🛒 Bolt
                    </button>
                    <button class="theme-filter-btn bg-donezy-accent text-secondary hover:text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200" data-filter="event">
                        🎉 Esemény
                    </button>
                </div>

                <!-- Témák grid -->
                <div class="themes-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[60vh] pr-2">
                    <!-- Témák itt jelennek meg -->
                </div>

                <!-- Statisztikák -->
                <div class="mt-6 pt-4 border-t border-donezy-accent">
                    <div class="flex justify-between items-center text-sm text-secondary">
                        <span id="themes-stats">0 téma betöltve</span>
                        <span id="user-stats">Szint: 0 | Essence: 0</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(themeSelectorModal);

        // Event listener-ek hozzáadása
        setupModalEventListeners();
    }

    /**
     * Modal event listener-ek beállítása
     */
    function setupModalEventListeners() {
        // Bezárás gomb
        themeSelectorModal.querySelector('.theme-close-btn').addEventListener('click', closeThemeSelector);
        
        // Háttérre kattintás
        themeSelectorModal.addEventListener('click', (e) => {
            if (e.target === themeSelectorModal) {
                closeThemeSelector();
            }
        });

        // Szűrő gombok
        themeSelectorModal.querySelectorAll('.theme-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                setFilter(filter);
            });
        });

        // ESC billentyű
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && themeSelectorModal) {
                closeThemeSelector();
            }
        });
    }

    /**
     * Megjeleníti a témaválasztó modalt
     */
    function showThemeSelectorModal() {
        if (themeSelectorModal) {
            themeSelectorModal.classList.add('fade-in');
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Bezárja a témaválasztó modalt
     */
    function closeThemeSelector() {
        if (themeSelectorModal) {
            themeSelectorModal.classList.add('fade-out');
            setTimeout(() => {
                if (themeSelectorModal) {
                    themeSelectorModal.remove();
                    themeSelectorModal = null;
                }
                document.body.style.overflow = '';
            }, 200);
        }
    }

    /**
     * Beállítja a szűrőt
     */
    function setFilter(filter) {
        currentFilter = filter;
        
        // Szűrő gombok frissítése
        themeSelectorModal.querySelectorAll('.theme-filter-btn').forEach(btn => {
            const btnFilter = btn.dataset.filter;
            if (btnFilter === filter) {
                btn.classList.remove('bg-donezy-accent', 'text-secondary');
                btn.classList.add('bg-donezy-orange', 'text-white');
            } else {
                btn.classList.remove('bg-donezy-orange', 'text-white');
                btn.classList.add('bg-donezy-accent', 'text-secondary');
            }
        });

        // Témák újra renderelése
        renderThemes();
    }

    /**
     * Rendereli a témákat
     */
    async function renderThemes() {
        try {
            if (!window.ThemeService) return;

            const themes = window.ThemeService.getAvailableThemes();
            const filteredThemes = filterThemes(themes, currentFilter);
            
            const themesGrid = themeSelectorModal.querySelector('.themes-grid');
            themesGrid.innerHTML = filteredThemes.map(theme => renderThemeCard(theme)).join('');

            // Statisztikák frissítése
            updateStats(themes, filteredThemes);

            // Event listener-ek hozzáadása a kártyákhoz
            setupThemeCardEventListeners();

        } catch (error) {
            console.error('Error rendering themes:', error);
        }
    }

    /**
     * Szűri a témákat
     */
    function filterThemes(themes, filter) {
        switch (filter) {
            case 'default':
                return themes.filter(theme => theme.type === 'default');
            case 'level':
                return themes.filter(theme => theme.type === 'level');
            case 'shop':
                return themes.filter(theme => theme.type === 'shop');
            case 'event':
                return themes.filter(theme => theme.type === 'event');
            default:
                return themes;
        }
    }

    /**
     * Rendereli egy téma kártyát
     */
    function renderThemeCard(theme) {
        const isCurrent = theme.isCurrent;
        const isAvailable = theme.isAvailable;
        const isUnlocked = theme.isUnlocked;
        
        // Státusz ikon és szöveg
        let statusIcon = '🔓';
        let statusText = 'Elérhető';
        let statusClass = 'text-success';
        
        if (isCurrent) {
            statusIcon = '✅';
            statusText = 'Aktív';
            statusClass = 'text-donezy-orange';
        } else if (!isAvailable) {
            statusIcon = '🔒';
            statusText = theme.type === 'level' ? `Szint ${theme.requiredLevel}` : `${theme.price} Essence`;
            statusClass = 'text-secondary';
        } else if (isUnlocked) {
            statusIcon = '⭐';
            statusText = 'Feloldva';
            statusClass = 'text-warning';
        }

        // Ár vagy szint megjelenítése
        let requirementText = '';
        if (theme.type === 'shop' && theme.price > 0) {
            requirementText = `<div class="text-xs text-secondary mt-1">💰 ${theme.price} Essence</div>`;
        } else if (theme.type === 'level' && theme.requiredLevel > 0) {
            requirementText = `<div class="text-xs text-secondary mt-1">⭐ Szint ${theme.requiredLevel}</div>`;
        }

        return `
            <div class="theme-card bg-donezy-accent rounded-lg p-4 border border-donezy-accent transition-all duration-300 ${isCurrent ? 'ring-2 ring-donezy-orange' : ''} ${!isAvailable ? 'opacity-60' : 'hover:scale-105'}" 
                 data-theme-id="${theme.id}" data-theme-available="${isAvailable}">
                
                <!-- Előnézet kép -->
                <div class="theme-preview mb-3 relative">
                    <div class="w-full h-24 bg-gradient-to-br from-donezy-orange to-purple-500 rounded-lg flex items-center justify-center">
                        <span class="text-2xl">🎨</span>
                    </div>
                    ${isCurrent ? '<div class="absolute top-2 right-2 bg-donezy-orange text-white px-2 py-1 rounded text-xs font-bold">AKTÍV</div>' : ''}
                </div>

                <!-- Téma információk -->
                <div class="theme-info">
                    <h3 class="font-bold text-primary mb-1">${theme.name}</h3>
                    <p class="text-xs text-secondary mb-2">${theme.description}</p>
                    
                    <!-- Státusz -->
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs ${statusClass}">${statusIcon} ${statusText}</span>
                        ${requirementText}
                    </div>

                    <!-- Műveletek -->
                    <div class="theme-actions">
                        ${isCurrent ? `
                            <button class="w-full bg-donezy-orange text-white px-3 py-2 rounded text-sm font-medium opacity-75 cursor-not-allowed" disabled>
                                ✅ Aktív
                            </button>
                        ` : isAvailable ? `
                            <button class="theme-apply-btn w-full bg-donezy-orange hover:bg-orange-hover text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200" data-theme-id="${theme.id}">
                                🎨 Alkalmazás
                            </button>
                        ` : theme.type === 'shop' ? `
                            <button class="theme-purchase-btn w-full bg-purple hover:bg-purple-hover text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200" data-theme-id="${theme.id}">
                                🛒 Vásárlás (${theme.price})
                            </button>
                        ` : `
                            <button class="w-full bg-secondary text-white px-3 py-2 rounded text-sm font-medium opacity-75 cursor-not-allowed" disabled>
                                🔒 Zárolva
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Event listener-ek beállítása a téma kártyákhoz
     */
    function setupThemeCardEventListeners() {
        // Téma alkalmazás
        themeSelectorModal.querySelectorAll('.theme-apply-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const themeId = e.target.dataset.themeId;
                await applyTheme(themeId);
            });
        });

        // Téma vásárlás
        themeSelectorModal.querySelectorAll('.theme-purchase-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const themeId = e.target.dataset.themeId;
                await purchaseTheme(themeId);
            });
        });
    }

    /**
     * Alkalmaz egy témát
     */
    async function applyTheme(themeId) {
        try {
            if (!window.ThemeService) return;

            const success = await window.ThemeService.applyTheme(themeId);
            if (success) {
                // Sikeres alkalmazás
                if (window.notificationService) {
                    window.notificationService.showSuccess('Téma sikeresen alkalmazva!');
                }
                
                // Témák újra renderelése
                await renderThemes();
                
                // Modal bezárása
                closeThemeSelector();
            } else {
                if (window.notificationService) {
                    window.notificationService.showError('Hiba történt a téma alkalmazásakor!');
                }
            }
        } catch (error) {
            console.error('Error applying theme:', error);
            if (window.notificationService) {
                window.notificationService.showError('Hiba történt a téma alkalmazásakor!');
            }
        }
    }

    /**
     * Vásárol egy témát
     */
    async function purchaseTheme(themeId) {
        try {
            if (!window.ThemeService) return;

            const success = await window.ThemeService.unlockTheme(themeId);
            if (success) {
                // Sikeres vásárlás
                if (window.notificationService) {
                    window.notificationService.showSuccess('Téma sikeresen megvásárolva!');
                }
                
                // Témák újra renderelése
                await renderThemes();
            } else {
                if (window.notificationService) {
                    window.notificationService.showError('Nincs elég Essence a vásárláshoz!');
                }
            }
        } catch (error) {
            console.error('Error purchasing theme:', error);
            if (window.notificationService) {
                window.notificationService.showError('Hiba történt a vásárlás során!');
            }
        }
    }

    /**
     * Frissíti a statisztikákat
     */
    function updateStats(allThemes, filteredThemes) {
        const statsEl = themeSelectorModal.querySelector('#themes-stats');
        const userStatsEl = themeSelectorModal.querySelector('#user-stats');
        
        if (statsEl) {
            statsEl.textContent = `${filteredThemes.length} téma (${allThemes.length} összesen)`;
        }
        
        if (userStatsEl) {
            let userLevel = 0;
            let userEssence = 0;
            
            // Szint lekérdezése ThemeService-ből
            if (window.ThemeService && typeof window.ThemeService.getCurrentUserLevel === 'function') {
                userLevel = window.ThemeService.getCurrentUserLevel();
            }
            
            // Essence lekérdezése ThemeService-ből vagy CurrencyService-ből
            if (window.ThemeService && typeof window.ThemeService.getCurrentUserEssence === 'function') {
                userEssence = window.ThemeService.getCurrentUserEssence();
            } else if (window.CurrencyService && typeof window.CurrencyService.getEssence === 'function') {
                userEssence = window.CurrencyService.getEssence() || 0;
            }
            
            userStatsEl.textContent = `Szint: ${userLevel} | Essence: ${userEssence}`;
        }
    }

    // Public API
    return {
        init,
        openThemeSelector,
        closeThemeSelector
    };
})(); 