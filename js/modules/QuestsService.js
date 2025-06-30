// QuestsService.js - Küldetések kezelése és szinkronizálása
window.QuestsService = (function() {
    'use strict';

    // Quest típusok
    const QUEST_TYPES = {
        DAILY: 'daily',
        WEEKLY: 'weekly',
        UNIQUE: 'unique'
    };

    // Quest állapotok
    const QUEST_STATUS = {
        AVAILABLE: 'available',
        ACCEPTED: 'accepted',
        COMPLETED: 'completed',
        EXPIRED: 'expired'
    };

    // Dummy küldetések adatai
    const DUMMY_QUESTS = {
        daily: [
            {
                id: 'daily_1',
                title: '📚 Tanulj meg 3 új fogalmat',
                description: 'Ma legalább 3 új fogalmat tanulj meg bármelyik tantárgyból',
                rewardXP: 25,
                rewardEssence: 15,
                status: QUEST_STATUS.AVAILABLE,
                progress: 0,
                goal: 3,
                type: QUEST_TYPES.DAILY,
                createdAt: new Date().toISOString()
            },
            {
                id: 'daily_2',
                title: '📝 Írj egy jegyzetet',
                description: 'Készíts egy új jegyzetet a mai tanultakról',
                rewardXP: 20,
                rewardEssence: 10,
                status: QUEST_STATUS.AVAILABLE,
                progress: 0,
                goal: 1,
                type: QUEST_TYPES.DAILY,
                createdAt: new Date().toISOString()
            },
            {
                id: 'daily_3',
                title: '✅ Teljesíts 2 feladatot',
                description: 'Végezz el legalább 2 feladatot a mai listádból',
                rewardXP: 30,
                rewardEssence: 20,
                status: QUEST_STATUS.AVAILABLE,
                progress: 0,
                goal: 2,
                type: QUEST_TYPES.DAILY,
                createdAt: new Date().toISOString()
            }
        ],
        weekly: [
            {
                id: 'weekly_1',
                title: '🔥 7 napos sorozat',
                description: 'Használd az alkalmazást 7 napig folyamatosan',
                rewardXP: 100,
                rewardEssence: 50,
                status: QUEST_STATUS.AVAILABLE,
                progress: 0,
                goal: 7,
                type: QUEST_TYPES.WEEKLY,
                createdAt: new Date().toISOString()
            },
            {
                id: 'weekly_2',
                title: '📋 Hozz létre 5 listát',
                description: 'Készíts 5 különböző listát a teendőidhez',
                rewardXP: 75,
                rewardEssence: 35,
                status: QUEST_STATUS.AVAILABLE,
                progress: 0,
                goal: 5,
                type: QUEST_TYPES.WEEKLY,
                createdAt: new Date().toISOString()
            }
        ],
        unique: [
            {
                id: 'unique_1',
                title: '🌟 Segíts egy csapattársadnak',
                description: 'Oszd meg a tudásodat és segíts egy másik tanulónak',
                rewardXP: 150,
                rewardEssence: 75,
                status: QUEST_STATUS.AVAILABLE,
                progress: 0,
                goal: 1,
                type: QUEST_TYPES.UNIQUE,
                createdAt: new Date().toISOString()
            }
        ]
    };

    // Jelenlegi küldetések
    let currentQuests = {
        daily: [],
        weekly: [],
        unique: []
    };

    /**
     * Inicializálja a QuestsService-t
     */
    async function init() {
        await loadQuests();
        console.log('QuestsService initialized');
    }

    /**
     * Betölti a küldetéseket Firebase-ből vagy localStorage-ból
     */
    async function loadQuests() {
        try {
            // Try Firebase first through DataService
            if (window.app && window.app.dataService) {
                const userData = await window.app.dataService.getUserData();
                if (userData && userData.quests) {
                    currentQuests = userData.quests;
                    console.log('Quests loaded from Firebase:', Object.keys(currentQuests).length, 'quest types');
                    // Javítsuk a régi státuszokat
                    await fixQuestStatuses();
                    return;
                }
            }
            
            // Fallback to localStorage
            const storedQuests = localStorage.getItem('quests');
            if (storedQuests) {
                currentQuests = JSON.parse(storedQuests);
                console.log('Quests loaded from localStorage (fallback):', Object.keys(currentQuests).length, 'quest types');
                // Javítsuk a régi státuszokat
                await fixQuestStatuses();
            } else {
                currentQuests = JSON.parse(JSON.stringify(DUMMY_QUESTS));
                await saveQuests();
                console.log('Default quests saved to localStorage (fallback)');
            }
        } catch (error) {
            console.error('Error loading quests:', error);
            // Fallback to localStorage on error
            const storedQuests = localStorage.getItem('quests');
            if (storedQuests) {
                currentQuests = JSON.parse(storedQuests);
                console.log('Quests loaded from localStorage (fallback):', Object.keys(currentQuests).length, 'quest types');
                // Javítsuk a régi státuszokat
                await fixQuestStatuses();
            }
        }
    }

    /**
     * Javítja a régi státuszokat (undefined, ACTIVE → AVAILABLE)
     */
    async function fixQuestStatuses() {
        let needsUpdate = false;
        
        // Végigmegyünk az összes küldetés típuson
        Object.keys(currentQuests).forEach(type => {
            if (Array.isArray(currentQuests[type])) {
                currentQuests[type].forEach(quest => {
                    // Ha a státusz undefined, ACTIVE vagy nem létezik, javítsuk AVAILABLE-re
                    if (!quest.status || quest.status === 'ACTIVE' || quest.status === 'active' || quest.status === undefined) {
                        quest.status = QUEST_STATUS.AVAILABLE;
                        needsUpdate = true;
                        console.log(`Fixed quest status: ${quest.title} -> AVAILABLE`);
                    }
                });
            }
        });
        
        // Ha változtatás történt, mentjük
        if (needsUpdate) {
            await saveQuests();
            console.log('Quest statuses fixed and saved');
        }
    }

    /**
     * Elmenti a küldetéseket Firebase-be vagy localStorage-ba
     */
    async function saveQuests() {
        try {
            // Try Firebase first through DataService
            if (window.app && window.app.dataService) {
                const success = await window.app.dataService.updateUserField('quests', currentQuests);
                if (success) {
                    console.log('Quests saved to Firebase');
                    return;
                }
            }
            
            // Fallback to localStorage
            localStorage.setItem('quests', JSON.stringify(currentQuests));
            console.log('Quests saved to localStorage (fallback)');
        } catch (error) {
            console.error('Error saving quests:', error);
            // Fallback to localStorage on error
            localStorage.setItem('quests', JSON.stringify(currentQuests));
        }
    }

    /**
     * Visszaadja az összes küldetést típus szerint
     * @param {string} type - Küldetés típusa (daily, weekly, unique)
     * @returns {Array} - Küldetések listája
     */
    function getQuests(type = null) {
        if (type) {
            return currentQuests[type] || [];
        }
        return currentQuests;
    }

    /**
     * Visszaadja a napi küldetéseket
     * @returns {Array} - Napi küldetések
     */
    function getDailyQuests() {
        return getQuests(QUEST_TYPES.DAILY);
    }

    /**
     * Visszaadja a heti küldetéseket
     * @returns {Array} - Heti küldetések
     */
    function getWeeklyQuests() {
        return getQuests(QUEST_TYPES.WEEKLY);
    }

    /**
     * Visszaadja az egyedi küldetéseket
     * @returns {Array} - Egyedi küldetések
     */
    function getUniqueQuests() {
        return getQuests(QUEST_TYPES.UNIQUE);
    }

    /**
     * Elfogad egy küldetést (available → accepted)
     * @param {string} questId - Küldetés azonosítója
     * @param {string} type - Küldetés típusa
     */
    async function acceptQuest(questId, type) {
        try {
            const quests = currentQuests[type];
            const questIndex = quests.findIndex(q => q.id === questId);
            if (questIndex === -1) throw new Error('Quest not found');
            const quest = quests[questIndex];
            if (quest.status !== QUEST_STATUS.AVAILABLE) throw new Error('Quest not available for acceptance');
            quest.status = QUEST_STATUS.ACCEPTED;
            quest.acceptedAt = new Date().toISOString();
            await saveQuests();
            if (window.NotificationService && window.NotificationService.showSuccess) {
                window.NotificationService.showSuccess('Küldetés elfogadva!', 'Küldetés');
            }
            return { success: true, quest };
        } catch (error) {
            console.error('Error accepting quest:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Teljesít egy küldetést (csak accepted státusz esetén)
     * @param {string} questId - Küldetés azonosítója
     * @param {string} type - Küldetés típusa
     * @returns {Object} - Teljesítés eredménye
     */
    async function completeQuest(questId, type) {
        try {
            const quests = currentQuests[type];
            const questIndex = quests.findIndex(q => q.id === questId);
            if (questIndex === -1) throw new Error('Quest not found');
            let quest = quests[questIndex];
            if (quest.status !== QUEST_STATUS.ACCEPTED) throw new Error('Quest must be accepted before completion');
            
            // Automatikusan frissítjük a progresset a teljesítés előtt
            await updateQuestProgressAutomatically();
            
            // Frissített quest objektum lekérése
            quest = currentQuests[type][questIndex];
            
            // Ellenőrizzük, hogy a progress elérte-e a célt
            if (quest.progress < quest.goal) {
                throw new Error(`Quest progress (${quest.progress}/${quest.goal}) not sufficient for completion`);
            }
            
            quest.status = QUEST_STATUS.COMPLETED;
            quest.completedAt = new Date().toISOString();
            await saveQuests();
            // Jutalmak kiosztása
            let rewards = { xp: quest.rewardXP, essence: quest.rewardEssence };
            if (window.LevelSystem && window.LevelSystem.addXP) {
                await window.LevelSystem.addXP(quest.rewardXP, `Küldetés: ${quest.title}`);
            }
            if (window.CurrencyService) await window.CurrencyService.addEssence(quest.rewardEssence, `Küldetés: ${quest.title}`);
            if (window.NotificationService && window.NotificationService.showSuccess) {
                try {
                    window.NotificationService.showSuccess(`Küldetés teljesítve! +${quest.rewardXP} XP, +${quest.rewardEssence} 💎 Essence`, 'Küldetés sikeres!');
                } catch (error) { console.warn('Notification error:', error); }
            }
            console.log(`Quest completed: ${quest.title}`, rewards);
            return { success: true, quest, rewards };
        } catch (error) {
            console.error('Error completing quest:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Frissíti a küldetések progressét
     * @param {string} questId - Küldetés azonosítója
     * @param {string} type - Küldetés típusa
     * @param {number} progress - Új progress érték
     */
    async function updateQuestProgress(questId, type, progress) {
        try {
            const quests = currentQuests[type];
            const questIndex = quests.findIndex(q => q.id === questId);
            
            if (questIndex !== -1) {
                const quest = quests[questIndex];
                quest.progress = Math.min(progress, quest.goal);
                
                // Ha elérte a célt, automatikusan teljesített
                if (quest.progress >= quest.goal && quest.status === QUEST_STATUS.ACCEPTED) {
                    await completeQuest(questId, type);
                } else {
                    await saveQuests();
                }
            }
        } catch (error) {
            console.error('Error updating quest progress:', error);
        }
    }

    /**
     * Új küldetés hozzáadása
     * @param {Object} questData - Küldetés adatai
     * @param {string} type - Küldetés típusa
     */
    async function addQuest(questData, type) {
        try {
            const newQuest = {
                id: `${type}_${Date.now()}`,
                ...questData,
                type: type,
                status: QUEST_STATUS.AVAILABLE,
                progress: 0,
                createdAt: new Date().toISOString()
            };

            currentQuests[type].push(newQuest);
            await saveQuests();
            
            console.log(`New quest added: ${newQuest.title}`);
            return newQuest;
        } catch (error) {
            console.error('Error adding quest:', error);
            return null;
        }
    }

    /**
     * Napi küldetések frissítése (célcsoport és személyre szabott logika)
     */
    async function refreshDailyQuests() {
        let userGroup = 'student';
        try {
            if (window.DataService && window.DataService.getUserGroup) {
                userGroup = await window.DataService.getUserGroup();
            } else if (window.TargetAudienceSelector && window.TargetAudienceSelector.getUserGroup) {
                userGroup = await window.TargetAudienceSelector.getUserGroup();
            }
        } catch (e) {
            console.warn('Nem sikerült lekérni a célcsoportot, alapértelmezett: student', e);
        }
        let generatedQuests = [];
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        if (userGroup === 'student') {
            const timetable = [
                { subject: 'Matematika', time: '08:00' },
                { subject: 'Történelem', time: '10:00' },
                { subject: 'Fizika', time: '12:00' }
            ];
            const notes = [
                { subject: 'Matematika', title: 'Deriválás', date: dateStr },
                { subject: 'Fizika', title: 'Newton törvényei', date: dateStr }
            ];
            if (timetable.length > 0) {
                generatedQuests.push({
                    id: `daily_${dateStr}_1`,
                    title: `Tanulj 45 percet: ${timetable[0].subject}`,
                    description: `Készülj fel a(z) ${timetable[0].subject} órára legalább 45 percig!`,
                    rewardXP: 20,
                    rewardEssence: 10,
                    status: QUEST_STATUS.AVAILABLE,
                    progress: 0,
                    goal: 1,
                    type: QUEST_TYPES.DAILY,
                    createdAt: today.toISOString(),
                    group: userGroup,
                    date: dateStr,
                    source: 'auto'
                });
            }
            if (notes.length > 0) {
                generatedQuests.push({
                    id: `daily_${dateStr}_2`,
                    title: `Készíts jegyzetet: ${notes[0].subject}`,
                    description: `Írj egy rövid összefoglalót a(z) ${notes[0].subject} óráról/jegyzetből!`,
                    rewardXP: 15,
                    rewardEssence: 8,
                    status: QUEST_STATUS.AVAILABLE,
                    progress: 0,
                    goal: 1,
                    type: QUEST_TYPES.DAILY,
                    createdAt: today.toISOString(),
                    group: userGroup,
                    date: dateStr,
                    source: 'auto'
                });
            }
            generatedQuests.push({
                id: `daily_${dateStr}_3`,
                title: 'Teljesíts 2 feladatot',
                description: 'Végezz el legalább 2 feladatot a mai teendőid közül!',
                rewardXP: 18,
                rewardEssence: 7,
                status: QUEST_STATUS.AVAILABLE,
                progress: 0,
                goal: 2,
                type: QUEST_TYPES.DAILY,
                createdAt: today.toISOString(),
                group: userGroup,
                date: dateStr,
                source: 'auto'
            });
        } else {
            generatedQuests = JSON.parse(JSON.stringify(DUMMY_QUESTS.daily)).map(q => ({ ...q, status: QUEST_STATUS.AVAILABLE }));
        }
        currentQuests.daily = generatedQuests;
        await saveQuests();
        console.log('Daily quests refreshed (célcsoportos)');
    }

    /**
     * Heti küldetések frissítése
     */
    async function refreshWeeklyQuests() {
        currentQuests.weekly = JSON.parse(JSON.stringify(DUMMY_QUESTS.weekly));
        await saveQuests();
        console.log('Weekly quests refreshed');
    }

    /**
     * Automatikusan frissíti a küldetések progressét valós adatok alapján
     */
    async function updateQuestProgressAutomatically() {
        try {
            // Minden küldetés típusra végigmegyünk
            Object.keys(currentQuests).forEach(type => {
                currentQuests[type].forEach(quest => {
                    // Csak accepted státuszú küldetések progressét frissítjük
                    if (quest.status === QUEST_STATUS.ACCEPTED) {
                        const newProgress = calculateQuestProgress(quest);
                        if (newProgress !== quest.progress) {
                            quest.progress = newProgress;
                            console.log(`Quest progress updated: ${quest.title} -> ${newProgress}/${quest.goal}`);
                        }
                    }
                });
            });
            
            // Mentjük a változásokat
            await saveQuests();
        } catch (error) {
            console.error('Error updating quest progress automatically:', error);
        }
    }

    /**
     * Kiszámítja egy küldetés valós progress értékét
     * @param {Object} quest - Küldetés objektum
     * @returns {number} - Progress érték
     */
    function calculateQuestProgress(quest) {
        try {
            // Küldetés típus alapján számítjuk a progresset
            switch (quest.type) {
                case QUEST_TYPES.DAILY:
                    return calculateDailyQuestProgress(quest);
                case QUEST_TYPES.WEEKLY:
                    return calculateWeeklyQuestProgress(quest);
                case QUEST_TYPES.UNIQUE:
                    return calculateUniqueQuestProgress(quest);
                default:
                    return quest.progress || 0;
            }
        } catch (error) {
            console.error('Error calculating quest progress:', error);
            return quest.progress || 0;
        }
    }

    /**
     * Napi küldetések progress számítása
     */
    function calculateDailyQuestProgress(quest) {
        const title = quest.title.toLowerCase();
        const description = quest.description.toLowerCase();
        
        console.log(`Calculating progress for quest: "${quest.title}"`);
        console.log(`Title contains 'lista': ${title.includes('lista')}`);
        console.log(`Title contains 'feladat': ${title.includes('feladat')}`);
        console.log(`Title contains 'jegyzet': ${title.includes('jegyzet')}`);
        
        // Lista létrehozás küldetés
        if (title.includes('lista') || description.includes('lista')) {
            if (window.ListsService) {
                const lists = window.ListsService.getActiveLists();
                const progress = Math.min(lists.length, quest.goal);
                console.log(`List quest progress: ${lists.length} lists found, progress: ${progress}/${quest.goal}`);
                return progress;
            }
        }
        
        // Teendő teljesítés küldetés
        if (title.includes('feladat') || title.includes('teendő') || description.includes('feladat') || description.includes('teendő')) {
            if (window.ListsService) {
                const lists = window.ListsService.getAllLists();
                let completedTasks = 0;
                Object.values(lists || {}).forEach(list => {
                    if (list && list.tasks) {
                        Object.values(list.tasks).forEach(task => {
                            if (task && task.done) completedTasks++;
                        });
                    }
                });
                const progress = Math.min(completedTasks, quest.goal);
                console.log(`Task quest progress: ${completedTasks} completed tasks found, progress: ${progress}/${quest.goal}`);
                return progress;
            }
        }
        
        // Jegyzet létrehozás küldetés
        if (title.includes('jegyzet') || description.includes('jegyzet')) {
            if (window.NotesService) {
                const notes = window.NotesService.getAllNotes();
                const progress = Math.min(Object.keys(notes).length, quest.goal);
                console.log(`Note quest progress: ${Object.keys(notes).length} notes found, progress: ${progress}/${quest.goal}`);
                return progress;
            }
        }
        
        // Tanulási idő küldetés (dummy - később AI alapú)
        if (title.includes('tanulj') || title.includes('perc') || description.includes('tanulj')) {
            // Egyelőre dummy progress, később AI alapú követés
            console.log(`Study quest progress: dummy progress ${quest.progress || 0}/${quest.goal}`);
            return quest.progress || 0;
        }
        
        console.log(`No matching quest type found, returning current progress: ${quest.progress || 0}/${quest.goal}`);
        return quest.progress || 0;
    }

    /**
     * Heti küldetések progress számítása
     */
    function calculateWeeklyQuestProgress(quest) {
        const title = quest.title.toLowerCase();
        const description = quest.description.toLowerCase();
        
        // 7 napos sorozat küldetés
        if (title.includes('sorozat') || title.includes('nap') || description.includes('nap')) {
            // Egyelőre dummy progress, később streak alapú
            return quest.progress || 0;
        }
        
        // Lista létrehozás küldetés
        if (title.includes('lista') || description.includes('lista')) {
            if (window.ListsService) {
                const lists = window.ListsService.getActiveLists();
                return Math.min(lists.length, quest.goal);
            }
        }
        
        return quest.progress || 0;
    }

    /**
     * Egyedi küldetések progress számítása
     */
    function calculateUniqueQuestProgress(quest) {
        const title = quest.title.toLowerCase();
        const description = quest.description.toLowerCase();
        
        // Segítségnyújtás küldetés (dummy - később AI alapú)
        if (title.includes('segíts') || description.includes('segíts')) {
            return quest.progress || 0;
        }
        
        return quest.progress || 0;
    }

    // Public API
    return {
        init,
        getQuests,
        getDailyQuests,
        getWeeklyQuests,
        getUniqueQuests,
        acceptQuest,
        completeQuest,
        updateQuestProgress,
        updateQuestProgressAutomatically,
        addQuest,
        refreshDailyQuests,
        refreshWeeklyQuests,
        fixQuestStatuses,
        forceUpdateQuestProgress: updateQuestProgressAutomatically,
        QUEST_TYPES,
        QUEST_STATUS
    };
})(); 