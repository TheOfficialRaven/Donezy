// QuestsRenderer.js - Küldetések UI renderelése
window.QuestsRenderer = (function() {
    'use strict';

    // Jelenlegi aktív tab
    let currentTab = 'daily';

    /**
     * Rendereli a küldetések tabot
     * @param {Object} quests - Küldetések adatai
     */
    async function renderQuestsTab(quests) {
        console.log('QuestsRenderer.renderQuestsTab called with:', quests);
        
        // Automatikusan frissítjük a progresset a valós adatok alapján
        if (window.QuestsService && window.QuestsService.updateQuestProgressAutomatically) {
            await window.QuestsService.updateQuestProgressAutomatically();
            // Frissített adatok lekérése
            quests = window.QuestsService.getQuests();
        }
        
        // Új UI: nincs quest-tabs, csak quest-content
        const contentContainer = document.getElementById('quest-content');
        
        console.log('quest-content element:', contentContainer);
        
        if (!contentContainer) {
            console.error('quest-content element not found!');
            return;
        }
        
        renderQuestContent(quests);
        setupQuestEventListeners();
        setupAutoRefresh();
        
        console.log('QuestsRenderer.renderQuestsTab completed successfully');
    }

    /**
     * Rendereli a küldetések tartalmát
     * @param {Object} quests - Küldetések adatai
     */
    function renderQuestContent(quests) {
        const contentContainer = document.getElementById('quest-content');
        if (!contentContainer) return;

        // Rendereli az összes tab tartalmát
        contentContainer.innerHTML = `
            <div id="quest-content-daily" class="quest-content active">
                ${renderQuestGrid(quests.daily || [], 'daily')}
            </div>
            <div id="quest-content-weekly" class="quest-content">
                ${renderQuestGrid(quests.weekly || [], 'weekly')}
            </div>
            <div id="quest-content-unique" class="quest-content">
                ${renderQuestGrid(quests.unique || [], 'unique')}
            </div>
        `;
    }

    /**
     * Rendereli egy küldetés gridet
     * @param {Array} quests - Küldetések listája
     * @param {string} type - Küldetés típusa
     * @returns {string} - HTML string
     */
    function renderQuestGrid(quests, type) {
        if (quests.length === 0) {
            return `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">🎯</div>
                    <h3 class="text-xl font-bold text-donezy-orange mb-2">Nincsenek küldetések</h3>
                    <p class="text-gray-400">Várj a következő küldetésekre!</p>
                </div>
            `;
        }

        return `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${quests.map(quest => renderQuestCard(quest, type)).join('')}
            </div>
        `;
    }

    /**
     * Rendereli egy küldetés kártyát
     * @param {Object} quest - Küldetés adatai
     * @param {string} type - Küldetés típusa
     * @returns {string} - HTML string
     */
    function renderQuestCard(quest, type) {
        const isAvailable = quest.status === 'available';
        const isAccepted = quest.status === 'accepted';
        const isCompleted = quest.status === 'completed';
        const progressPercent = quest.goal > 1 ? (quest.progress / quest.goal) * 100 : 0;
        // Ikon, típus badge, XP badge, idő badge
        const iconMap = {
            'szervezés': '🗂️',
            'ismétlés': '🔁',
            'tanulás': '📚',
            'koncentráció': '🧠',
            'alapértelmezett': '🎯'
        };
        let questTypeLabel = 'alapértelmezett';
        if (quest.title.toLowerCase().includes('szervez')) questTypeLabel = 'szervezés';
        else if (quest.title.toLowerCase().includes('ismét')) questTypeLabel = 'ismétlés';
        else if (quest.title.toLowerCase().includes('tanul')) questTypeLabel = 'tanulás';
        else if (quest.title.toLowerCase().includes('koncentr')) questTypeLabel = 'koncentráció';
        const icon = iconMap[questTypeLabel] || iconMap['alapértelmezett'];
        // XP badge
        const xpBadge = `<span class="bg-orange-600 text-white px-2 py-1 rounded text-xs font-bold ml-2">⭐ ${quest.rewardXP} XP</span>`;
        // Essence badge (kép ikon)
        const essenceBadge = `<span class="bg-purple-700 text-white px-2 py-1 rounded text-xs font-bold ml-2 flex items-center gap-1"><img src="imgs/Essence.svg" alt="Essence" class="inline w-4 h-4 align-middle" style="display:inline;vertical-align:middle;"/> ${quest.rewardEssence}</span>`;
        // Idő badge (ha van)
        const timeMatch = quest.description.match(/(\d+\s*perc)/i);
        const timeBadge = timeMatch ? `<span class="bg-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-medium ml-2">⏱️ ${timeMatch[1]}</span>` : '';
        // Status badge
        let statusBadge = '';
        if (isCompleted) {
            statusBadge = '<span class="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">✅ Teljesítve</span>';
        } else if (isAccepted) {
            statusBadge = '<span class="bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">⏳ Folyamatban</span>';
        } else if (isAvailable) {
            statusBadge = '<span class="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">🆕 Új</span>';
        } else {
            statusBadge = '<span class="bg-gray-600 text-white px-2 py-1 rounded text-xs font-medium">⏰ Lejárt</span>';
        }
        // Progress bar
        let progressBar = '';
        if (quest.goal > 1 && !isCompleted) {
            const isProgressComplete = quest.progress >= quest.goal;
            const progressColor = isProgressComplete ? 'bg-green-500' : 'bg-donezy-orange';
            progressBar = `
                <div class="w-full bg-gray-700 rounded-full h-2 mb-2">
                    <div class="${progressColor} h-2 rounded-full transition-all duration-300" style="width: ${progressPercent}%"></div>
                </div>
                <p class="text-xs text-gray-400 mb-3">
                    ${quest.progress} / ${quest.goal} teljesítve
                    ${isProgressComplete ? ' <span class=\"text-green-400\">✅ Kész!</span>' : ''}
                </p>
            `;
        }
        // Action button
        let actionButton = '';
        if (isCompleted) {
            actionButton = `
                <button class="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-lg opacity-75 cursor-not-allowed" disabled>
                    ✅ Kész
                </button>
            `;
        } else if (isAccepted) {
            const canComplete = quest.progress >= quest.goal;
            if (canComplete) {
                actionButton = `
                    <button class="quest-complete-btn w-full bg-donezy-orange hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                            data-quest-id="${quest.id}" data-quest-type="${type}">
                        ✅ Teljesítés
                    </button>
                `;
            } else {
                actionButton = `
                    <button class="w-full bg-gray-600 text-white font-bold py-2 px-4 rounded-lg opacity-75 cursor-not-allowed" disabled>
                        ⏳ Még nem teljesíthető (${quest.progress}/${quest.goal})
                    </button>
                `;
            }
        } else if (isAvailable) {
            actionButton = `
                <button class="quest-accept-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                        data-quest-id="${quest.id}" data-quest-type="${type}">
                    ➕ Elfogadás
                </button>
            `;
        } else {
            actionButton = `
                <button class="w-full bg-gray-600 text-white font-bold py-2 px-4 rounded-lg opacity-75 cursor-not-allowed" disabled>
                    ⏰ Lejárt
                </button>
            `;
        }
        return `
          <div class="quest-card bg-donezy-card rounded-xl p-6 shadow-lg border border-donezy-accent flex flex-col relative transition-all duration-200 hover:border-donezy-orange min-h-[320px]">
            <!-- Status badge overlay -->
            <div class="absolute top-4 right-4 z-10">${statusBadge}</div>
            <!-- Icon -->
            <div class="flex flex-col items-center mb-3 mt-2">
              <span class="text-4xl mb-2">${icon}</span>
              <span class="font-bold text-donezy-orange text-lg text-center mb-1">${quest.title}</span>
            </div>
            <!-- XP & Essence badges -->
            <div class="flex justify-center items-center gap-2 mb-2">
              ${xpBadge}
              ${essenceBadge}
            </div>
            <!-- Leírás -->
            <div class="mb-2 text-gray-300 text-center text-sm">${quest.description}</div>
            <!-- Idő badge, ha van -->
            ${timeBadge ? `<div class='flex justify-center mb-2'>${timeBadge}</div>` : ''}
            <div class="flex-1"></div>
            <!-- Progress bar és státusz -->
            <div class="mb-2">${progressBar}</div>
            <!-- Action button -->
            <div class="flex justify-center">${actionButton}</div>
          </div>
        `;
    }

    /**
     * Beállítja a küldetés event listener-eket
     */
    function setupQuestEventListeners() {
        // Tab switching
        const tabButtons = document.querySelectorAll('.quest-tab');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = button.getAttribute('data-tab');
                switchQuestTab(tabName);
            });
        });

        // Quest accept buttons
        const acceptButtons = document.querySelectorAll('.quest-accept-btn');
        acceptButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const questId = button.getAttribute('data-quest-id');
                const questType = button.getAttribute('data-quest-type');
                if (questId && questType && window.QuestsService) {
                    button.disabled = true;
                    await window.QuestsService.acceptQuest(questId, questType);
                    await refreshQuestsDisplay(questType);
                }
            });
        });

        // Quest completion buttons
        const completeButtons = document.querySelectorAll('.quest-complete-btn');
        completeButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const questId = button.getAttribute('data-quest-id');
                const questType = button.getAttribute('data-quest-type');
                if (questId && questType && window.QuestsService) {
                    button.disabled = true;
                    await window.QuestsService.completeQuest(questId, questType);
                    await refreshQuestsDisplay(questType);
                    if (window.CurrencyService) {
                        window.CurrencyService.updateEssenceDisplay();
                    }
                }
            });
        });

        // Automatikus gomb frissítés
        updateQuestButtons();
    }

    /**
     * Automatikusan frissíti a küldetés gombok állapotát a progress alapján
     */
    function updateQuestButtons() {
        if (!window.QuestsService) return;

        // Progress frissítés
        window.QuestsService.updateQuestProgressAutomatically().then(() => {
            // Frissített adatok lekérése
            const quests = window.QuestsService.getQuests();
            
            // Minden accepted küldetés gombjának frissítése
            Object.keys(quests).forEach(type => {
                quests[type].forEach(quest => {
                    if (quest.status === 'accepted') {
                        const button = document.querySelector(`[data-quest-id="${quest.id}"].quest-complete-btn`);
                        if (button) {
                            const canComplete = quest.progress >= quest.goal;
                            if (canComplete) {
                                // Gomb kattinthatóvá tétele
                                button.disabled = false;
                                button.className = 'quest-complete-btn w-full bg-donezy-orange hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200';
                                button.textContent = '✅ Teljesítés';
                            } else {
                                // Gomb letiltása
                                button.disabled = true;
                                button.className = 'w-full bg-gray-600 text-white font-bold py-2 px-4 rounded-lg opacity-75 cursor-not-allowed';
                                button.textContent = `⏳ Még nem teljesíthető (${quest.progress}/${quest.goal})`;
                            }
                        }
                    }
                });
            });
        });
    }

    /**
     * Vált a küldetés tabok között
     * @param {string} tabName - Tab neve
     */
    function switchQuestTab(tabName) {
        currentTab = tabName;

        // Update tab buttons
        const tabButtons = document.querySelectorAll('.quest-tab');
        tabButtons.forEach(button => {
            button.classList.remove('active');
            if (button.getAttribute('data-tab') === tabName) {
                button.classList.add('active');
            }
        });

        // Update content
        const contentDivs = document.querySelectorAll('.quest-content');
        contentDivs.forEach(div => {
            div.classList.remove('active');
            if (div.id === `quest-content-${tabName}`) {
                div.classList.add('active');
            }
        });
    }

    /**
     * Frissíti a küldetések megjelenítését
     */
    function refreshQuestsDisplay() {
        if (window.QuestsService) {
            const quests = window.QuestsService.getQuests();
            renderQuestContent(quests);
            setupQuestEventListeners();
        }
    }

    /**
     * Beállítja az automatikus frissítést
     */
    function setupAutoRefresh() {
        // Töröljük a korábbi időzítést, ha van
        if (window.questAutoRefreshInterval) {
            clearInterval(window.questAutoRefreshInterval);
        }
        
        // 5 másodpercenként frissítjük a gombokat
        window.questAutoRefreshInterval = setInterval(() => {
            if (document.getElementById('quest-content') && document.getElementById('quest-content').style.display !== 'none') {
                updateQuestButtons();
            }
        }, 5000);
    }

    // Public API
    return {
        renderQuestsTab,
        switchQuestTab,
        refreshQuestsDisplay,
        getCurrentTab: () => currentTab
    };
})(); 