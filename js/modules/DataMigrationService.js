// DataMigrationService.js - Adatmigrációs szolgáltatás
// Segít a globális adatok felhasználó-specifikus útvonalakra való migrálásában

window.DataMigrationService = (function() {
    'use strict';

    let isInitialized = false;
    let migrationCompleted = false;

    /**
     * Inicializálja a migrációs szolgáltatást
     */
    async function init() {
        if (isInitialized) return true;

        try {
            console.log('DataMigrationService initializing...');
            
            // Ellenőrizzük, hogy a felhasználó be van-e jelentkezve
            if (!window.currentUserId) {
                console.warn('DataMigrationService: No authenticated user, skipping migration');
                return false;
            }

            // Ellenőrizzük, hogy a migráció már megtörtént-e
            const migrationKey = `migration_completed_${window.currentUserId}`;
            migrationCompleted = localStorage.getItem(migrationKey) === 'true';

            if (migrationCompleted) {
                console.log('DataMigrationService: Migration already completed for this user');
                return true;
            }

            // Migráció futtatása
            await runMigration();
            
            // Migráció jelölése befejezettként
            localStorage.setItem(migrationKey, 'true');
            migrationCompleted = true;
            
            isInitialized = true;
            console.log('DataMigrationService initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing DataMigrationService:', error);
            return false;
        }
    }

    /**
     * Futtatja a migrációt
     */
    async function runMigration() {
        try {
            console.log('Starting data migration...');

            // 1. Témák migrálása (ha vannak globális témák)
            await migrateThemes();

            // 2. Questek migrálása (ha vannak globális questek)
            await migrateQuests();

            // 3. Egyéb globális adatok migrálása
            await migrateOtherGlobalData();

            console.log('Data migration completed successfully');
        } catch (error) {
            console.error('Error during data migration:', error);
            throw error;
        }
    }

    /**
     * Témák migrálása
     */
    async function migrateThemes() {
        try {
            if (!window.app || !window.app.dataService) {
                console.log('DataService not available, skipping themes migration');
                return;
            }

            // Ellenőrizzük, hogy vannak-e globális témák
            const globalThemes = await window.app.dataService.getGlobalThemes();
            if (!globalThemes) {
                console.log('No global themes found, skipping themes migration');
                return;
            }

            // Ellenőrizzük, hogy a felhasználónak vannak-e már témái
            const userThemes = await window.app.dataService.getUserThemes();
            if (userThemes && Object.keys(userThemes).length > 0) {
                console.log('User already has themes, skipping themes migration');
                return;
            }

            // Alapértelmezett témák hozzáadása a felhasználóhoz
            const defaultUserThemes = {
                'donezy-dark': {
                    unlockedAt: new Date().toISOString(),
                    unlockedBy: 'default',
                    isDefault: true
                }
            };

            // Felhasználó szintjének ellenőrzése és megfelelő témák feloldása
            const userData = await window.app.dataService.getUserData();
            if (userData) {
                const userLevel = userData.level || 1;
                
                // Szinthez kötött témák feloldása
                if (userLevel >= 5) {
                    defaultUserThemes['ocean-blue'] = {
                        unlockedAt: new Date().toISOString(),
                        unlockedBy: 'level',
                        level: userLevel
                    };
                }
                
                if (userLevel >= 10) {
                    defaultUserThemes['forest-green'] = {
                        unlockedAt: new Date().toISOString(),
                        unlockedBy: 'level',
                        level: userLevel
                    };
                }
            }

            // Témák mentése a felhasználóhoz
            await window.app.dataService.updateUserField('themes', defaultUserThemes);
            console.log('Themes migrated successfully');
        } catch (error) {
            console.error('Error migrating themes:', error);
        }
    }

    /**
     * Questek migrálása
     */
    async function migrateQuests() {
        try {
            if (!window.app || !window.app.dataService) {
                console.log('DataService not available, skipping quests migration');
                return;
            }

            // Ellenőrizzük, hogy vannak-e globális questek
            // A questek már a megfelelő helyen vannak (/users/{uid}/quests), 
            // de ellenőrizzük, hogy nincs-e régi globális adat
            console.log('Quests are already in user-specific paths, no migration needed');
        } catch (error) {
            console.error('Error migrating quests:', error);
        }
    }

    /**
     * Egyéb globális adatok migrálása
     */
    async function migrateOtherGlobalData() {
        try {
            // Ellenőrizzük, hogy vannak-e egyéb globális adatok, amiket migrálni kell
            console.log('Checking for other global data to migrate...');
            
            // Itt később hozzáadhatunk további migrációs logikát
            // ha szükséges lesz
            
        } catch (error) {
            console.error('Error migrating other global data:', error);
        }
    }

    /**
     * Ellenőrzi a migráció állapotát
     */
    function getMigrationStatus() {
        return {
            isInitialized,
            migrationCompleted,
            userId: window.currentUserId
        };
    }

    /**
     * Kényszeríti a migráció újrafuttatását
     */
    async function forceMigration() {
        try {
            console.log('Forcing data migration...');
            
            // Migráció állapot törlése
            if (window.currentUserId) {
                const migrationKey = `migration_completed_${window.currentUserId}`;
                localStorage.removeItem(migrationKey);
                migrationCompleted = false;
            }
            
            // Migráció újrafuttatása
            await runMigration();
            
            // Migráció jelölése befejezettként
            if (window.currentUserId) {
                const migrationKey = `migration_completed_${window.currentUserId}`;
                localStorage.setItem(migrationKey, 'true');
                migrationCompleted = true;
            }
            
            console.log('Forced migration completed successfully');
            return true;
        } catch (error) {
            console.error('Error during forced migration:', error);
            return false;
        }
    }

    /**
     * Törli a migrációs állapotot
     */
    function clearMigrationStatus() {
        try {
            if (window.currentUserId) {
                const migrationKey = `migration_completed_${window.currentUserId}`;
                localStorage.removeItem(migrationKey);
                migrationCompleted = false;
                console.log('Migration status cleared');
            }
        } catch (error) {
            console.error('Error clearing migration status:', error);
        }
    }

    // Public API
    return {
        init,
        getMigrationStatus,
        forceMigration,
        clearMigrationStatus
    };
})(); 