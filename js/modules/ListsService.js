// ListsService.js - Listák és teendők kezelése
window.ListsService = (function() {
    'use strict';

    // Lista állapotok
    const LIST_STATUS = {
        ACTIVE: 'active',
        ARCHIVED: 'archived',
        DELETED: 'deleted'
    };

    // Teendő állapotok
    const TASK_STATUS = {
        PENDING: 'pending',
        COMPLETED: 'completed'
    };

    // Dummy listák adatai
    const DUMMY_LISTS = {
        'list_1': {
            id: 'list_1',
            title: '📚 Tanulás',
            description: 'Napi tanulási feladatok',
            status: LIST_STATUS.ACTIVE,
            priority: 'high',
            pinned: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tasks: {
                'task_1': {
                    id: 'task_1',
                    name: 'Matematika házi feladat',
                    done: false,
                    pinned: false,
                    createdAt: new Date().toISOString()
                },
                'task_2': {
                    id: 'task_2',
                    name: 'Angol szótár tanulás',
                    done: true,
                    pinned: false,
                    createdAt: new Date().toISOString()
                },
                'task_3': {
                    id: 'task_3',
                    name: 'Projekt dokumentáció',
                    done: false,
                    pinned: false,
                    createdAt: new Date().toISOString()
                }
            }
        },
        'list_2': {
            id: 'list_2',
            title: '🛒 Bevásárlás',
            description: 'Heti bevásárlólista',
            status: LIST_STATUS.ACTIVE,
            priority: 'medium',
            pinned: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tasks: {
                'task_4': {
                    id: 'task_4',
                    name: 'Kenyér',
                    done: false,
                    pinned: false,
                    createdAt: new Date().toISOString()
                },
                'task_5': {
                    id: 'task_5',
                    name: 'Tej',
                    done: true,
                    pinned: false,
                    createdAt: new Date().toISOString()
                },
                'task_6': {
                    id: 'task_6',
                    name: 'Gyümölcsök',
                    done: false,
                    pinned: false,
                    createdAt: new Date().toISOString()
                },
                'task_7': {
                    id: 'task_7',
                    name: 'Hús',
                    done: false,
                    pinned: false,
                    createdAt: new Date().toISOString()
                }
            }
        }
    };

    // Jelenlegi listák
    let currentLists = {};

    /**
     * Inicializálja a ListsService-t
     */
    async function init() {
        await loadLists();
        console.log('ListsService initialized');
    }

    /**
     * Betölti a listákat Firebase-ből vagy localStorage-ból
     */
    async function loadLists() {
        try {
            // Try Firebase first through DataService
            if (window.app && window.app.dataService) {
                const userData = await window.app.dataService.getUserData();
                if (userData && userData.lists) {
                    currentLists = userData.lists;
                    return;
                }
            }
            
            // Fallback to localStorage
            const storedLists = localStorage.getItem('lists');
            if (storedLists) {
                currentLists = JSON.parse(storedLists);
            }
        } catch (error) {
            console.error('Error loading lists:', error);
            // Fallback to localStorage on error
            const storedLists = localStorage.getItem('lists');
            if (storedLists) {
                currentLists = JSON.parse(storedLists);
            }
        }
    }

    /**
     * Elmenti a listákat Firebase-be vagy localStorage-ba
     */
    async function saveLists() {
        try {
            // Try Firebase first through DataService
            if (window.app && window.app.dataService) {
                const success = await window.app.dataService.updateUserField('lists', currentLists);
                if (success) {
                    console.log('Lists saved to Firebase');
                    return;
                }
            }
            
            // Fallback to localStorage
            localStorage.setItem('lists', JSON.stringify(currentLists));
            console.log('Lists saved to localStorage (fallback)');
        } catch (error) {
            console.error('Error saving lists:', error);
            // Fallback to localStorage on error
            localStorage.setItem('lists', JSON.stringify(currentLists));
        }
    }

    /**
     * Visszaadja az összes listát
     * @returns {Object} - Listák objektuma
     */
    function getAllLists() {
        return currentLists;
    }

    /**
     * Visszaadja az aktív listákat
     * @returns {Array} - Aktív listák tömbje
     */
    function getActiveLists() {
        return Object.values(currentLists).filter(list => list.status === LIST_STATUS.ACTIVE);
    }

    /**
     * Visszaadja egy listát ID alapján
     * @param {string} listId - Lista azonosítója
     * @returns {Object|null} - Lista objektum vagy null
     */
    function getList(listId) {
        return currentLists[listId] || null;
    }

    /**
     * Létrehoz egy új listát
     * @param {string} title - Lista címe
     * @param {string} description - Lista leírása
     * @param {string} priority - Prioritás (low, medium, high)
     * @returns {Object} - Létrehozott lista
     */
    async function createList(title, description = '', priority = 'medium') {
        try {
            const listId = `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const newList = {
                id: listId,
                title: title,
                description: description,
                status: LIST_STATUS.ACTIVE,
                priority: priority,
                pinned: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                tasks: {}
            };

            currentLists[listId] = newList;
            await saveLists();

            // XP és Essence jutalom lista létrehozásért
            if (window.app && window.app.levelSystem) {
                window.app.levelSystem.addXP(10);
            }
            if (window.app && window.app.currencyService) {
                window.app.currencyService.addEssence(5);
            }

            console.log('List created:', listId);
            return newList;
        } catch (error) {
            console.error('Error creating list:', error);
            return null;
        }
    }

    /**
     * Frissít egy listát
     * @param {string} listId - Lista azonosítója
     * @param {Object} updates - Frissítendő mezők
     * @returns {boolean} - Sikeres volt-e a frissítés
     */
    async function updateList(listId, updates) {
        try {
            if (!currentLists[listId]) {
                throw new Error('List not found');
            }

            currentLists[listId] = {
                ...currentLists[listId],
                ...updates,
                updatedAt: new Date().toISOString()
            };

            await saveLists();
            console.log(`List updated: ${listId}`);
            return true;
        } catch (error) {
            console.error('Error updating list:', error);
            return false;
        }
    }

    /**
     * Töröl egy listát
     * @param {string} listId - Lista azonosítója
     * @returns {boolean} - Sikeres volt-e a törlés
     */
    async function deleteList(listId) {
        try {
            if (!currentLists[listId]) {
                throw new Error('List not found');
            }

            delete currentLists[listId];
            await saveLists();

            console.log(`List deleted: ${listId}`);
            return true;
        } catch (error) {
            console.error('Error deleting list:', error);
            return false;
        }
    }

    /**
     * Hozzáad egy teendőt egy listához
     * @param {string} listId - Lista azonosítója
     * @param {string} taskName - Teendő neve
     * @returns {Object|null} - Létrehozott teendő
     */
    async function addTask(listId, taskName) {
        try {
            if (!currentLists[listId]) {
                throw new Error('List not found');
            }

            const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const newTask = {
                id: taskId,
                name: taskName,
                done: false,
                pinned: false,
                createdAt: new Date().toISOString()
            };

            currentLists[listId].tasks[taskId] = newTask;
            currentLists[listId].updatedAt = new Date().toISOString();

            await saveLists();

            console.log(`Task added to list ${listId}: ${taskName}`);
            return newTask;
        } catch (error) {
            console.error('Error adding task:', error);
            return null;
        }
    }

    /**
     * Frissít egy teendőt
     * @param {string} listId - Lista azonosítója
     * @param {string} taskId - Teendő azonosítója
     * @param {Object} updates - Frissítendő mezők
     * @returns {boolean} - Sikeres volt-e a frissítés
     */
    async function updateTask(listId, taskId, updates) {
        try {
            if (!currentLists[listId] || !currentLists[listId].tasks[taskId]) {
                throw new Error('Task not found');
            }

            currentLists[listId].tasks[taskId] = {
                ...currentLists[listId].tasks[taskId],
                ...updates
            };
            currentLists[listId].updatedAt = new Date().toISOString();

            await saveLists();

            // Ha a teendő teljesítve lett, adjunk jutalmat
            if (updates.done === true) {
                if (window.LevelSystem && window.LevelSystem.addXP) {
                    await window.LevelSystem.addXP(5, `Teendő teljesítés: ${currentLists[listId].tasks[taskId].name}`);
                }
                if (window.CurrencyService) {
                    await window.CurrencyService.addEssence(2, `Teendő teljesítés: ${currentLists[listId].tasks[taskId].name}`);
                }
            }

            console.log(`Task updated: ${taskId}`);
            return true;
        } catch (error) {
            console.error('Error updating task:', error);
            return false;
        }
    }

    /**
     * Töröl egy teendőt
     * @param {string} listId - Lista azonosítója
     * @param {string} taskId - Teendő azonosítója
     * @returns {boolean} - Sikeres volt-e a törlés
     */
    async function deleteTask(listId, taskId) {
        try {
            if (!currentLists[listId] || !currentLists[listId].tasks[taskId]) {
                throw new Error('Task not found');
            }

            delete currentLists[listId].tasks[taskId];
            currentLists[listId].updatedAt = new Date().toISOString();

            await saveLists();

            console.log(`Task deleted: ${taskId}`);
            return true;
        } catch (error) {
            console.error('Error deleting task:', error);
            return false;
        }
    }

    /**
     * Vált egy teendő teljesítési állapotát
     * @param {string} listId - Lista azonosítója
     * @param {string} taskId - Teendő azonosítója
     * @returns {boolean} - Sikeres volt-e a váltás
     */
    async function toggleTask(listId, taskId) {
        try {
            if (!currentLists[listId] || !currentLists[listId].tasks[taskId]) {
                throw new Error('Task not found');
            }

            const currentStatus = currentLists[listId].tasks[taskId].done;
            const newStatus = !currentStatus;

            return await updateTask(listId, taskId, { done: newStatus });
        } catch (error) {
            console.error('Error toggling task:', error);
            return false;
        }
    }

    /**
     * Visszaadja a listák statisztikáit
     * @returns {Object} - Statisztikák
     */
    function getListsStats() {
        const lists = Object.values(currentLists);
        const totalLists = lists.length;
        const activeLists = lists.filter(list => list.status === LIST_STATUS.ACTIVE).length;
        
        let totalTasks = 0;
        let completedTasks = 0;
        
        lists.forEach(list => {
            const tasks = Object.values(list.tasks);
            totalTasks += tasks.length;
            completedTasks += tasks.filter(task => task.done).length;
        });

        return {
            totalLists,
            activeLists,
            totalTasks,
            completedTasks,
            completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        };
    }

    /**
     * Visszaadja az összes használt kategóriát (egyedi, abc-sorrendben)
     * @returns {Array<string>}
     */
    function getAllCategories() {
        const categories = Object.values(currentLists)
            .map(list => (list.category || '').trim())
            .filter(cat => cat.length > 0);
        return Array.from(new Set(categories)).sort((a, b) => a.localeCompare(b, 'hu'));
    }

    /**
     * Keresés/szűrés listák és teendők között
     * @param {Object} options - { searchText, category }
     * @returns {Array} - Szűrt listák tömbje
     */
    function filterLists({ searchText = '', category = '' } = {}) {
        let lists = Object.values(currentLists);
        if (category && category.trim() !== '') {
            lists = lists.filter(list => (list.category || '').toLowerCase() === category.trim().toLowerCase());
        }
        if (searchText && searchText.trim() !== '') {
            const text = searchText.trim().toLowerCase();
            lists = lists.filter(list => {
                const inTitle = (list.title || '').toLowerCase().includes(text);
                const inCategory = (list.category || '').toLowerCase().includes(text);
                const inTasks = Object.values(list.tasks || {}).some(task => (task.name || '').toLowerCase().includes(text));
                return inTitle || inCategory || inTasks;
            });
        }
        return lists;
    }

    /**
     * Újratölti a listákat Firebase-ből
     */
    async function reloadLists() {
        await loadLists();
        console.log('Lists reloaded from Firebase');
    }

    /**
     * Vált egy lista kitűzési állapotát
     * @param {string} listId - Lista azonosítója
     * @returns {boolean} - Sikeres volt-e a váltás
     */
    async function toggleListPin(listId) {
        try {
            if (!currentLists[listId]) {
                throw new Error('List not found');
            }

            currentLists[listId].pinned = !currentLists[listId].pinned;
            currentLists[listId].updatedAt = new Date().toISOString();

            await saveLists();

            console.log(`List pin toggled: ${listId}, pinned: ${currentLists[listId].pinned}`);
            return true;
        } catch (error) {
            console.error('Error toggling list pin:', error);
            return false;
        }
    }

    /**
     * Vált egy teendő kitűzési állapotát
     * @param {string} listId - Lista azonosítója
     * @param {string} taskId - Teendő azonosítója
     * @returns {boolean} - Sikeres volt-e a váltás
     */
    async function toggleTaskPin(listId, taskId) {
        try {
            if (!currentLists[listId] || !currentLists[listId].tasks[taskId]) {
                throw new Error('Task not found');
            }

            currentLists[listId].tasks[taskId].pinned = !currentLists[listId].tasks[taskId].pinned;
            currentLists[listId].updatedAt = new Date().toISOString();

            await saveLists();

            console.log(`Task pin toggled: ${taskId}, pinned: ${currentLists[listId].tasks[taskId].pinned}`);
            return true;
        } catch (error) {
            console.error('Error toggling task pin:', error);
            return false;
        }
    }

    // Public API
    return {
        init,
        getAllLists,
        getActiveLists,
        getList,
        createList,
        updateList,
        deleteList,
        addTask,
        updateTask,
        deleteTask,
        toggleTask,
        toggleListPin,
        toggleTaskPin,
        getListsStats,
        getAllCategories,
        filterLists,
        reloadLists,
        LIST_STATUS,
        TASK_STATUS
    };
})(); 