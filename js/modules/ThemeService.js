// ThemeService.js - Témák kezelése és alkalmazása
window.ThemeService = (function() {
    'use strict';

    // Téma állapotok
    const THEME_STATUS = {
        AVAILABLE: 'available',
        LOCKED: 'locked',
        PURCHASED: 'purchased'
    };

    // Téma típusok
    const THEME_TYPES = {
        DEFAULT: 'default',
        LEVEL: 'level',
        SHOP: 'shop',
        EVENT: 'event'
    };

    // Alapértelmezett témák
    const DEFAULT_THEMES = {
        'donezy-dark': {
            id: 'donezy-dark',
            name: 'Donezy Sötét',
            description: 'Az eredeti Donezy sötét témája',
            previewImage: 'imgs/themes/donezy-dark-preview.png',
            type: THEME_TYPES.DEFAULT,
            unlockedBy: 'default',
            price: 0,
            requiredLevel: 0,
            cssVariables: {
                '--donezy-orange': '#ff6b35',
                '--donezy-card': '#16213e',
                '--donezy-accent': '#0f3460',
                '--donezy-bg': '#1a1a2e',
                '--text-primary': '#ffffff',
                '--text-secondary': '#9ca3af',
                '--bg-primary': '#1a1a2e',
                '--bg-secondary': '#16213e',
                '--bg-card': '#16213e'
            },
            className: 'theme-donezy-dark'
        },
        'ocean-blue': {
            id: 'ocean-blue',
            name: 'Óceán Kék',
            description: 'Nyugodt óceán kék színek',
            previewImage: 'imgs/themes/ocean-blue-preview.png',
            type: THEME_TYPES.LEVEL,
            unlockedBy: 'level',
            price: 0,
            requiredLevel: 5,
            cssVariables: {
                '--donezy-orange': '#3b82f6',
                '--donezy-card': '#1e3a8a',
                '--donezy-accent': '#1e40af',
                '--donezy-bg': '#0f172a',
                '--text-primary': '#f8fafc',
                '--text-secondary': '#cbd5e1',
                '--bg-primary': '#0f172a',
                '--bg-secondary': '#1e3a8a',
                '--bg-card': '#1e3a8a'
            },
            className: 'theme-ocean-blue'
        },
        'forest-green': {
            id: 'forest-green',
            name: 'Erdő Zöld',
            description: 'Természetes erdő zöld színek',
            previewImage: 'imgs/themes/forest-green-preview.png',
            type: THEME_TYPES.LEVEL,
            unlockedBy: 'level',
            price: 0,
            requiredLevel: 10,
            cssVariables: {
                '--donezy-orange': '#10b981',
                '--donezy-card': '#064e3b',
                '--donezy-accent': '#065f46',
                '--donezy-bg': '#022c22',
                '--text-primary': '#f0fdf4',
                '--text-secondary': '#bbf7d0',
                '--bg-primary': '#022c22',
                '--bg-secondary': '#064e3b',
                '--bg-card': '#064e3b'
            },
            className: 'theme-forest-green'
        },
        'sunset-purple': {
            id: 'sunset-purple',
            name: 'Naplemente Lila',
            description: 'Dramatikus naplemente lila színek',
            previewImage: 'imgs/themes/sunset-purple-preview.png',
            type: THEME_TYPES.SHOP,
            unlockedBy: 'shop',
            price: 100,
            requiredLevel: 0,
            cssVariables: {
                '--donezy-orange': '#8b5cf6',
                '--donezy-card': '#581c87',
                '--donezy-accent': '#6b21a8',
                '--donezy-bg': '#2e1065',
                '--text-primary': '#faf5ff',
                '--text-secondary': '#ddd6fe',
                '--bg-primary': '#2e1065',
                '--bg-secondary': '#581c87',
                '--bg-card': '#581c87'
            },
            className: 'theme-sunset-purple'
        },
        'midnight-gold': {
            id: 'midnight-gold',
            name: 'Éjfél Arany',
            description: 'Luxus éjfél arany színek',
            previewImage: 'imgs/themes/midnight-gold-preview.png',
            type: THEME_TYPES.SHOP,
            unlockedBy: 'shop',
            price: 250,
            requiredLevel: 0,
            cssVariables: {
                '--donezy-orange': '#f59e0b',
                '--donezy-card': '#92400e',
                '--donezy-accent': '#a16207',
                '--donezy-bg': '#451a03',
                '--text-primary': '#fef3c7',
                '--text-secondary': '#fde68a',
                '--bg-primary': '#451a03',
                '--bg-secondary': '#92400e',
                '--bg-card': '#92400e'
            },
            className: 'theme-midnight-gold'
        },
        'neon-pink': {
            id: 'neon-pink',
            name: 'Neon Rózsaszín',
            description: 'Vibráló neon rózsaszín színek',
            previewImage: 'imgs/themes/neon-pink-preview.png',
            type: THEME_TYPES.EVENT,
            unlockedBy: 'event',
            price: 0,
            requiredLevel: 15,
            cssVariables: {
                '--donezy-orange': '#ec4899',
                '--donezy-card': '#831843',
                '--donezy-accent': '#9d174d',
                '--donezy-bg': '#500724',
                '--text-primary': '#fdf2f8',
                '--text-secondary': '#fce7f3',
                '--bg-primary': '#500724',
                '--bg-secondary': '#831843',
                '--bg-card': '#831843'
            },
            className: 'theme-neon-pink'
        }
    };

    // Jelenlegi állapot
    let currentTheme = 'donezy-dark';
    let availableThemes = {};
    let userThemes = {};
    let userLevel = 0;
    let userEssence = 0;

    /**
     * Inicializálja a ThemeService-t
     */
    async function init() {
        try {
            console.log('ThemeService initializing...');
            
            // Témák betöltése Firebase-ből vagy alapértelmezett értékek használata
            await loadThemes();
            
            // Felhasználó témáinak betöltése
            await loadUserThemes();
            
            // Aktuális téma alkalmazása
            await applyTheme(currentTheme);
            
            // Automatikus frissítés beállítása
            setupAutoRefresh();
            
            console.log('ThemeService initialized');
        } catch (error) {
            console.error('Error initializing ThemeService:', error);
        }
    }

    /**
     * Automatikus frissítés beállítása
     */
    function setupAutoRefresh() {
        // Frissítés minden 30 másodpercben
        setInterval(async () => {
            try {
                if (window.app && window.app.dataService) {
                    const userData = await window.app.dataService.getUserData();
                    if (userData) {
                        userLevel = userData.level || userLevel;
                        userEssence = userData.essence || userEssence;
                    }
                }
            } catch (error) {
                console.warn('Error auto-refreshing user stats:', error);
            }
        }, 30000); // 30 másodperc
    }

    /**
     * Betölti a témákat Firebase-ből
     */
    async function loadThemes() {
        try {
            // Try Firebase first
            if (window.app && window.app.dataService && window.app.dataService.isFirebaseAvailable()) {
                const themes = await window.app.dataService.getThemes();
                if (themes) {
                    availableThemes = { ...DEFAULT_THEMES, ...themes };
                    console.log('Themes loaded from Firebase');
                    return;
                }
            }
            
            // Fallback to default themes
            availableThemes = DEFAULT_THEMES;
            console.log('Using default themes (Firebase not available or no themes found)');
        } catch (error) {
            console.warn('Firebase themes access denied or unavailable, using default themes:', error.message);
            // Use default themes when Firebase access is denied
            availableThemes = DEFAULT_THEMES;
            
            // Don't show notification for permission errors as it's expected behavior
            // The error is already handled gracefully by falling back to default themes
        }
    }

    /**
     * Betölti a felhasználó témáit
     */
    async function loadUserThemes() {
        try {
            // Try Firebase first
            if (window.app && window.app.dataService) {
                const userData = await window.app.dataService.getUserData();
                if (userData) {
                    currentTheme = userData.currentTheme || 'donezy-dark';
                    userThemes = userData.unlockedThemes || {};
                    userLevel = userData.level || 0;
                    userEssence = userData.essence || 0;
                    return;
                }
            }
            
            // Fallback to localStorage
            const storedTheme = localStorage.getItem('donezy-current-theme');
            const storedThemes = localStorage.getItem('donezy-unlocked-themes');
            
            if (storedTheme) currentTheme = storedTheme;
            if (storedThemes) userThemes = JSON.parse(storedThemes);
            
            // Get user level and essence from other services
            if (window.app && window.app.dataService) {
                const userData = await window.app.dataService.getUserData();
                if (userData) {
                    userLevel = userData.level || 0;
                    userEssence = userData.essence || 0;
                }
            } else if (window.CurrencyService && typeof window.CurrencyService.getEssence === 'function') {
                userEssence = window.CurrencyService.getEssence() || 0;
            }
        } catch (error) {
            console.error('Error loading user themes:', error);
        }
    }

    /**
     * Elmenti a felhasználó témáit
     */
    async function saveUserThemes() {
        try {
            // Try Firebase first
            if (window.app && window.app.dataService) {
                await window.app.dataService.updateUserField('currentTheme', currentTheme);
                await window.app.dataService.updateUserField('unlockedThemes', userThemes);
                return;
            }
            
            // Fallback to localStorage
            localStorage.setItem('donezy-current-theme', currentTheme);
            localStorage.setItem('donezy-unlocked-themes', JSON.stringify(userThemes));
        } catch (error) {
            console.error('Error saving user themes:', error);
        }
    }

    /**
     * Alkalmaz egy témát
     */
    async function applyTheme(themeId) {
        try {
            const theme = availableThemes[themeId];
            if (!theme) {
                console.error('Theme not found:', themeId);
                return false;
            }

            // CSS változók alkalmazása
            const root = document.documentElement;
            
            // Előző téma osztály eltávolítása
            root.classList.remove(...Object.values(availableThemes).map(t => t.className));
            
            // Új téma osztály hozzáadása
            root.classList.add(theme.className);
            
            // CSS változók beállítása
            Object.entries(theme.cssVariables).forEach(([property, value]) => {
                root.style.setProperty(property, value);
            });

            currentTheme = themeId;
            await saveUserThemes();
            
            // Track mission progress for theme changes
            if (window.MissionService && window.MissionService.trackActivity) {
                await window.MissionService.trackActivity('theme_changed', 1);
            }
            
            console.log('Theme applied:', themeId);
            return true;
        } catch (error) {
            console.error('Error applying theme:', error);
            return false;
        }
    }

    /**
     * Ellenőrzi, hogy egy téma elérhető-e
     */
    function isThemeAvailable(themeId) {
        const theme = availableThemes[themeId];
        if (!theme) return false;

        // Alapértelmezett téma mindig elérhető
        if (theme.type === THEME_TYPES.DEFAULT) return true;

        // Már feloldott téma
        if (userThemes[themeId]) return true;

        // Szinthez kötött téma
        if (theme.type === THEME_TYPES.LEVEL && userLevel >= theme.requiredLevel) {
            return true;
        }

        // Boltban vásárolható téma
        if (theme.type === THEME_TYPES.SHOP && userEssence >= theme.price) {
            return true;
        }

        return false;
    }

    /**
     * Felold egy témát
     */
    async function unlockTheme(themeId) {
        try {
            const theme = availableThemes[themeId];
            if (!theme) return false;

            // Szinthez kötött téma automatikus feloldása
            if (theme.type === THEME_TYPES.LEVEL && userLevel >= theme.requiredLevel) {
                userThemes[themeId] = {
                    unlockedAt: new Date().toISOString(),
                    unlockedBy: 'level',
                    level: userLevel
                };
                await saveUserThemes();
                return true;
            }

            // Boltban vásárolható téma
            if (theme.type === THEME_TYPES.SHOP && userEssence >= theme.price) {
                if (window.CurrencyService) {
                    const success = await window.CurrencyService.spendEssence(theme.price, `Téma vásárlás: ${theme.name}`);
                    if (success) {
                        userEssence -= theme.price;
                        userThemes[themeId] = {
                            unlockedAt: new Date().toISOString(),
                            unlockedBy: 'shop',
                            price: theme.price
                        };
                        await saveUserThemes();
                        return true;
                    }
                }
            }

            return false;
        } catch (error) {
            console.error('Error unlocking theme:', error);
            return false;
        }
    }

    /**
     * Visszaadja az összes elérhető témát
     */
    function getAvailableThemes() {
        return Object.values(availableThemes).map(theme => ({
            ...theme,
            isAvailable: isThemeAvailable(theme.id),
            isUnlocked: !!userThemes[theme.id],
            isCurrent: theme.id === currentTheme
        }));
    }

    /**
     * Visszaadja az aktuális témát
     */
    function getCurrentTheme() {
        return availableThemes[currentTheme];
    }

    /**
     * Frissíti a felhasználó szintjét és Essence-jét
     */
    function updateUserStats(level, essence) {
        userLevel = level || userLevel;
        userEssence = essence || userEssence;
    }

    /**
     * Visszaadja a felhasználó aktuális szintjét
     */
    function getCurrentUserLevel() {
        return userLevel;
    }

    /**
     * Visszaadja a felhasználó aktuális Essence mennyiségét
     */
    function getCurrentUserEssence() {
        return userEssence;
    }

    /**
     * Megnyitja a témaválasztó felületet
     */
    function openThemeSelector() {
        if (window.ThemeRenderer) {
            window.ThemeRenderer.openThemeSelector();
        } else {
            console.error('ThemeRenderer not available');
        }
    }

    // Public API
    return {
        init,
        applyTheme,
        unlockTheme,
        getAvailableThemes,
        getCurrentTheme,
        updateUserStats,
        getCurrentUserLevel,
        getCurrentUserEssence,
        openThemeSelector,
        THEME_STATUS,
        THEME_TYPES
    };
})(); 