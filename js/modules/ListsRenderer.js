// ListsRenderer.js - Listák és teendők UI renderelése
window.ListsRenderer = (function() {
    'use strict';

    // Jelenlegi megnyitott lista
    let currentOpenList = null;

    /**
     * Rendereli a teljes listák tabot
     * @param {Object} lists - Listák adatai
     */
    function renderListsTab(lists) {
        console.log('ListsRenderer.renderListsTab called with:', lists);
        
        const headerContainer = document.getElementById('lists-header');
        const gridContainer = document.getElementById('lists-grid');
        
        console.log('lists-header element:', headerContainer);
        console.log('lists-grid element:', gridContainer);
        
        if (!headerContainer) {
            console.error('lists-header element not found!');
            return;
        }
        if (!gridContainer) {
            console.error('lists-grid element not found!');
            return;
        }
        
        renderListsHeader();
        renderListsGrid(lists);
        setupListsEventListeners();
        
        console.log('ListsRenderer.renderListsTab completed successfully');
    }

    /**
     * Rendereli a listák fejlécét és a szűrő/kereső sort
     */
    function renderListsHeader() {
        const headerContainer = document.getElementById('lists-header');
        if (!headerContainer) return;

        // Kategóriák autocomplete-hez
        const categories = window.ListsService ? window.ListsService.getAllCategories() : [];
        const categoryOptions = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');

        headerContainer.innerHTML = `
            <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                <div class="flex-1">
                    <h2 class="text-2xl font-bold text-donezy-orange mb-2">📋 Listák</h2>
                    <div class="flex flex-col md:flex-row gap-2 items-stretch md:items-end">
                        <div class="flex-1">
                            <label class="block text-sm text-gray-400 mb-1">Lista neve</label>
                            <input type="text" id="list-title" class="w-full bg-donezy-accent border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-donezy-orange" placeholder="pl. Bevásárlás, Munka...">
                        </div>
                        <div class="flex-1">
                            <label class="block text-sm text-gray-400 mb-1">Kategória</label>
                            <input list="category-list" id="list-category" class="w-full bg-donezy-accent border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-donezy-orange" placeholder="pl. Otthon, Munka, Hobbi...">
                            <datalist id="category-list">${categoryOptions}</datalist>
                        </div>
                        <button id="create-list-btn" class="bg-donezy-orange hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 mt-4 md:mt-0">➕ Lista létrehozása</button>
                    </div>
                </div>
                <div class="flex-1 flex flex-col md:flex-row gap-2 items-stretch md:items-end">
                    <div class="flex-1">
                        <label class="block text-sm text-gray-400 mb-1">Kategória szűrő</label>
                        <input list="filter-category-list" id="filter-category" class="w-full bg-donezy-accent border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-donezy-orange" placeholder="Összes kategória">
                        <datalist id="filter-category-list">${categoryOptions}</datalist>
                    </div>
                    <div class="flex-1">
                        <label class="block text-sm text-gray-400 mb-1">Keresés</label>
                        <input type="text" id="search-lists" class="w-full bg-donezy-accent border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-donezy-orange" placeholder="Keresés a listákban és teendőkben...">
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Rendereli a listák gridet oszlopos elrendezéssel
     * @param {Object} lists - Listák adatai
     */
    function renderListsGrid(lists) {
        const gridContainer = document.getElementById('lists-grid');
        if (!gridContainer) return;

        // Szűrés/keresés
        const searchText = document.getElementById('search-lists')?.value || '';
        const filterCategory = document.getElementById('filter-category')?.value || '';
        const filtered = window.ListsService ? window.ListsService.filterLists({ searchText, category: filterCategory }) : Object.values(lists);

        if (filtered.length === 0) {
            gridContainer.innerHTML = `<div class="text-center py-12 text-gray-400">Nincs találat a megadott szűrőkre.</div>`;
            return;
        }

        gridContainer.innerHTML = `
            <div class="lists-grid">
                ${filtered.map(list => renderListColumn(list)).join('')}
            </div>
        `;
    }

    /**
     * Rendereli egy lista oszlopát (kártya)
     */
    function renderListColumn(list) {
        const tasks = Object.values(list.tasks);
        const slug = getCategorySlug(list.category);
        const emoji = getCategoryEmoji(list.category);
        const categoryBadge = list.category ? `<span class="category-badge ${slug}">${emoji} ${list.category}</span>` : '';
        const isPinned = list.pinned;
        
        return `
            <div class="list-card ${isPinned ? 'ring-2 ring-donezy-orange' : ''}" data-list-id="${list.id}">
                <div class="card-header">
                    <span class="list-title editable-list-title" data-list-id="${list.id}">${emoji} ${list.title}</span>
                    ${isPinned ? '<span class="text-donezy-orange text-sm">📍</span>' : ''}
                    ${categoryBadge}
                    <button class="list-pin-btn btn btn-ghost text-donezy-orange" title="${isPinned ? 'Kitűzés feloldása' : 'Kitűzés'}" data-list-id="${list.id}">${isPinned ? '📍' : '📌'}</button>
                    <button class="delete-btn list-delete-btn" data-list-id="${list.id}" title="Lista törlése">🗑️</button>
                </div>
                <div class="card-body">
                    ${tasks.map(task => renderTaskItem(list.id, task)).join('')}
                </div>
                <div class="add-task-row">
                    <input type="text" class="add-task-input" data-list-id="${list.id}" placeholder="Új teendő...">
                    <button class="add-task-btn" data-list-id="${list.id}">Hozzáadás</button>
                </div>
            </div>
        `;
    }

    /**
     * Rendereli egy teendő elemet szerkeszthető névvel
     */
    function renderTaskItem(listId, task) {
        const isCompleted = task.done;
        const isPinned = task.pinned;
        
        return `
            <div class="task-row ${isPinned ? 'ring-1 ring-donezy-orange' : ''}" data-list-id="${listId}" data-task-id="${task.id}">
                <div class="custom-checkbox${isCompleted ? ' checked' : ''}" data-list-id="${listId}" data-task-id="${task.id}" tabindex="0" role="checkbox" aria-checked="${isCompleted}">
                  <span class="checkmark">
                    <svg viewBox="0 0 20 20"><polyline points="5 11 9 15 15 7"></polyline></svg>
                  </span>
                </div>
                <span class="editable-task-name${isCompleted ? ' line-through text-gray-400' : ''}" data-list-id="${listId}" data-task-id="${task.id}">${task.name}</span>
                ${isPinned ? '<span class="text-donezy-orange text-xs">📍</span>' : ''}
                <button class="task-pin-btn btn btn-ghost text-donezy-orange text-xs" title="${isPinned ? 'Kitűzés feloldása' : 'Kitűzés'}" data-list-id="${listId}" data-task-id="${task.id}">${isPinned ? '📍' : '📌'}</button>
                <button class="delete-btn task-delete-btn" data-list-id="${listId}" data-task-id="${task.id}" title="Teendő törlése">🗑️</button>
            </div>
        `;
    }

    /**
     * Rendereli a lista részletes nézetét
     * @param {Object} list - Lista adatai
     */
    function renderListDetail(list) {
        currentOpenList = list;
        
        const detailContainer = document.getElementById('list-detail');
        if (!detailContainer) return;

        const tasks = Object.values(list.tasks);
        const completedTasks = tasks.filter(task => task.done);
        const pendingTasks = tasks.filter(task => !task.done);

        detailContainer.innerHTML = `
            <div class="bg-donezy-card rounded-lg p-6 shadow-lg border border-donezy-accent">
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h2 class="text-2xl font-bold text-donezy-orange">${list.title}</h2>
                        ${list.description ? `<p class="text-gray-400 mt-1">${list.description}</p>` : ''}
                    </div>
                    <div class="flex items-center space-x-3">
                        ${getPriorityBadge(list.priority)}
                        <button id="back-to-lists-btn" class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">
                            ← Vissza
                        </button>
                    </div>
                </div>

                <div class="mb-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-bold text-white">Teendők</h3>
                        <button id="add-task-btn" class="bg-donezy-orange hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">
                            ➕ Új teendő
                        </button>
                    </div>

                    <!-- Pending Tasks -->
                    <div class="space-y-2 mb-4">
                        <h4 class="text-sm font-medium text-gray-400 uppercase tracking-wide">Függőben</h4>
                        ${pendingTasks.map(task => renderDetailTaskItem(list.id, task)).join('')}
                        ${pendingTasks.length === 0 ? '<p class="text-gray-500 text-sm italic">Nincsenek függő teendők</p>' : ''}
                    </div>

                    <!-- Completed Tasks -->
                    ${completedTasks.length > 0 ? `
                        <div class="space-y-2">
                            <h4 class="text-sm font-medium text-gray-400 uppercase tracking-wide">Teljesítve</h4>
                            ${completedTasks.map(task => renderDetailTaskItem(list.id, task)).join('')}
                        </div>
                    ` : ''}
                </div>

                <!-- Progress Summary -->
                <div class="bg-donezy-accent rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-gray-300">Teljesítés</span>
                        <span class="text-sm font-bold text-donezy-orange">${completedTasks.length} / ${tasks.length}</span>
                    </div>
                    <div class="w-full bg-gray-700 rounded-full h-2">
                        <div class="bg-donezy-orange h-2 rounded-full transition-all duration-300" style="width: ${tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0}%"></div>
                    </div>
                </div>
            </div>
        `;

        // Show detail view, hide grid
        document.getElementById('lists-grid').style.display = 'none';
        detailContainer.style.display = 'block';
    }

    /**
     * Rendereli egy részletes teendő elemet
     * @param {string} listId - Lista azonosítója
     * @param {Object} task - Teendő adatai
     * @returns {string} - HTML string
     */
    function renderDetailTaskItem(listId, task) {
        const isCompleted = task.done;
        
        return `
            <div class="task-detail-item flex items-center justify-between p-3 bg-donezy-accent rounded-lg ${isCompleted ? 'opacity-75' : ''}">
                <div class="flex items-center space-x-3 flex-1">
                    <input type="checkbox" 
                           class="task-checkbox w-4 h-4 text-donezy-orange bg-donezy-card border-gray-600 rounded focus:ring-donezy-orange focus:ring-2" 
                           data-list-id="${listId}" 
                           data-task-id="${task.id}" 
                           ${isCompleted ? 'checked' : ''}>
                    <span class="task-name text-sm ${isCompleted ? 'line-through text-gray-400' : 'text-gray-300'}">${task.name}</span>
                </div>
                <button class="task-delete-btn text-red-400 hover:text-red-300 transition-colors duration-200" data-list-id="${listId}" data-task-id="${task.id}" title="Teendő törlése">
                    🗑️
                </button>
            </div>
        `;
    }

    /**
     * Visszaadja a prioritás badge-et
     * @param {string} priority - Prioritás
     * @returns {string} - HTML string
     */
    function getPriorityBadge(priority) {
        const badges = {
            high: '<span class="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">🔴 Magas</span>',
            medium: '<span class="bg-yellow-600 text-white px-2 py-1 rounded text-xs font-medium">🟡 Közepes</span>',
            low: '<span class="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">🟢 Alacsony</span>'
        };
        return badges[priority] || badges.medium;
    }

    /**
     * Event listener-ek: létrehozás, szűrés, szerkesztés, törlés, hozzáadás
     */
    function setupListsEventListeners() {
        // Lista létrehozás
        document.getElementById('create-list-btn')?.addEventListener('click', async () => {
            const title = document.getElementById('list-title').value.trim();
            const category = document.getElementById('list-category').value.trim();
            if (!title) return alert('Adj meg egy listanevet!');
            await window.ListsService.createList(title, '', 'medium', category);
            document.getElementById('list-title').value = '';
            document.getElementById('list-category').value = '';
            refreshListsDisplay();
        });
        // Szűrők
        document.getElementById('filter-category')?.addEventListener('input', refreshListsDisplay);
        document.getElementById('search-lists')?.addEventListener('input', refreshListsDisplay);
        // Lista törlés
        document.querySelectorAll('.list-delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const listId = e.target.getAttribute('data-list-id');
                const card = document.querySelector(`.list-card[data-list-id="${listId}"]`);
                if (card) {
                    card.classList.add('fade-out');
                    setTimeout(async () => {
                        await window.ListsService.deleteList(listId);
                        refreshListsDisplay();
                    }, 350);
                } else {
                    await window.ListsService.deleteList(listId);
                    refreshListsDisplay();
                }
            });
        });
        // Teendő hozzáadás
        document.querySelectorAll('.add-task-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const listId = e.target.getAttribute('data-list-id');
                const input = document.querySelector(`.add-task-input[data-list-id="${listId}"]`);
                const value = input.value.trim();
                if (!value) return;
                await window.ListsService.addTask(listId, value);
                input.value = '';
                refreshListsDisplay();
            });
        });
        // Enterrel teendő hozzáadás
        document.querySelectorAll('.add-task-input').forEach(input => {
            input.addEventListener('keydown', async (e) => {
                if (e.key === 'Enter') {
                    const listId = input.getAttribute('data-list-id');
                    const value = input.value.trim();
                    if (!value) return;
                    await window.ListsService.addTask(listId, value);
                    input.value = '';
                    refreshListsDisplay();
                }
            });
        });
        // Custom checkbox pipálás
        document.querySelectorAll('.custom-checkbox').forEach(box => {
            box.addEventListener('click', async (e) => {
                const listId = box.getAttribute('data-list-id');
                const taskId = box.getAttribute('data-task-id');
                box.classList.toggle('checked');
                box.setAttribute('aria-checked', box.classList.contains('checked'));
                // Sor vizuális frissítése
                const row = box.closest('.task-row');
                if (row) {
                    row.querySelector('.editable-task-name').classList.toggle('line-through');
                    row.querySelector('.editable-task-name').classList.toggle('text-gray-400');
                }
                await window.ListsService.toggleTask(listId, taskId);
            });
            // Enter/Space accessibility
            box.addEventListener('keydown', async (e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    box.click();
                }
            });
        });
        // Teendő törlés
        document.querySelectorAll('.task-delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const listId = e.target.getAttribute('data-list-id');
                const taskId = e.target.getAttribute('data-task-id');
                const row = document.querySelector(`.task-row[data-list-id="${listId}"][data-task-id="${taskId}"]`);
                if (row) {
                    row.classList.add('fade-out');
                    setTimeout(async () => {
                        await window.ListsService.deleteTask(listId, taskId);
                        refreshListsDisplay();
                    }, 350);
                } else {
                    await window.ListsService.deleteTask(listId, taskId);
                    refreshListsDisplay();
                }
            });
        });
        // Inline szerkesztés lista név
        document.querySelectorAll('.editable-list-title').forEach(span => {
            span.addEventListener('click', (e) => {
                const listId = span.getAttribute('data-list-id');
                const oldValue = span.textContent;
                const input = document.createElement('input');
                input.type = 'text';
                input.value = oldValue;
                input.className = 'font-bold text-donezy-orange text-lg bg-transparent border-b border-donezy-orange focus:outline-none';
                span.replaceWith(input);
                input.focus();
                input.addEventListener('blur', async () => {
                    await window.ListsService.updateList(listId, { title: input.value });
                    refreshListsDisplay();
                });
                input.addEventListener('keydown', async (ev) => {
                    if (ev.key === 'Enter') {
                        input.blur();
                    }
                });
            });
        });
        // Inline szerkesztés teendő név
        document.querySelectorAll('.editable-task-name').forEach(span => {
            span.addEventListener('click', (e) => {
                const listId = span.getAttribute('data-list-id');
                const taskId = span.getAttribute('data-task-id');
                const oldValue = span.textContent;
                const input = document.createElement('input');
                input.type = 'text';
                input.value = oldValue;
                input.className = 'text-sm bg-transparent border-b border-donezy-orange focus:outline-none';
                span.replaceWith(input);
                input.focus();
                input.addEventListener('blur', async () => {
                    await window.ListsService.updateTask(listId, taskId, { name: input.value });
                    refreshListsDisplay();
                });
                input.addEventListener('keydown', async (ev) => {
                    if (ev.key === 'Enter') {
                        input.blur();
                    }
                });
            });
        });
        
        // Lista kitűzés
        document.querySelectorAll('.list-pin-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const listId = btn.getAttribute('data-list-id');
                const success = await window.ListsService.toggleListPin(listId);
                if (success) {
                    refreshListsDisplay();
                }
            });
        });
        
        // Teendő kitűzés
        document.querySelectorAll('.task-pin-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const listId = btn.getAttribute('data-list-id');
                const taskId = btn.getAttribute('data-task-id');
                const success = await window.ListsService.toggleTaskPin(listId, taskId);
                if (success) {
                    refreshListsDisplay();
                }
            });
        });
    }

    /**
     * Megjeleníti a lista létrehozás modalt
     */
    function showCreateListModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.id = 'create-list-modal';

        modal.innerHTML = `
            <div class="bg-donezy-card rounded-lg p-6 shadow-lg border border-donezy-accent max-w-md w-full mx-4">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-donezy-orange">📋 Új lista létrehozása</h3>
                    <button id="close-create-modal" class="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Lista neve</label>
                        <input type="text" id="list-title" class="w-full bg-donezy-accent border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-donezy-orange" placeholder="pl. Bevásárlás">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Leírás (opcionális)</label>
                        <textarea id="list-description" rows="3" class="w-full bg-donezy-accent border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-donezy-orange" placeholder="Rövid leírás a listáról"></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Prioritás</label>
                        <select id="list-priority" class="w-full bg-donezy-accent border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-donezy-orange">
                            <option value="low">🟢 Alacsony</option>
                            <option value="medium" selected>🟡 Közepes</option>
                            <option value="high">🔴 Magas</option>
                        </select>
                    </div>
                    <div class="flex space-x-3">
                        <button id="save-list" class="flex-1 bg-donezy-orange hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">
                            Létrehozás
                        </button>
                        <button id="cancel-list" class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">
                            Mégse
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        document.getElementById('close-create-modal').addEventListener('click', closeCreateListModal);
        document.getElementById('cancel-list').addEventListener('click', closeCreateListModal);
        document.getElementById('save-list').addEventListener('click', createList);
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCreateListModal();
            }
        });

        // Focus on title input
        document.getElementById('list-title').focus();
    }

    /**
     * Bezárja a lista létrehozás modalt
     */
    function closeCreateListModal() {
        const modal = document.getElementById('create-list-modal');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * Létrehoz egy új listát
     */
    async function createList() {
        const title = document.getElementById('list-title').value.trim();
        const description = document.getElementById('list-description').value.trim();
        const priority = document.getElementById('list-priority').value;

        if (!title) {
            alert('Kérjük, adj meg egy listanevet!');
            return;
        }

        if (window.ListsService) {
            const newList = await window.ListsService.createList(title, description, priority);
            if (newList) {
                closeCreateListModal();
                refreshListsDisplay();
            }
        }
    }

    /**
     * Megjeleníti a teendő hozzáadás modalt
     */
    function showAddTaskModal() {
        if (!currentOpenList) return;

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.id = 'add-task-modal';

        modal.innerHTML = `
            <div class="bg-donezy-card rounded-lg p-6 shadow-lg border border-donezy-accent max-w-md w-full mx-4">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-donezy-orange">➕ Új teendő hozzáadása</h3>
                    <button id="close-add-task-modal" class="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Teendő neve</label>
                        <input type="text" id="task-name" class="w-full bg-donezy-accent border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-donezy-orange" placeholder="pl. Kenyér vásárlása">
                    </div>
                    <div class="flex space-x-3">
                        <button id="save-task" class="flex-1 bg-donezy-orange hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">
                            Hozzáadás
                        </button>
                        <button id="cancel-task" class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">
                            Mégse
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        document.getElementById('close-add-task-modal').addEventListener('click', closeAddTaskModal);
        document.getElementById('cancel-task').addEventListener('click', closeAddTaskModal);
        document.getElementById('save-task').addEventListener('click', addTask);
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAddTaskModal();
            }
        });

        // Focus on task name input
        document.getElementById('task-name').focus();
    }

    /**
     * Bezárja a teendő hozzáadás modalt
     */
    function closeAddTaskModal() {
        const modal = document.getElementById('add-task-modal');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * Hozzáad egy új teendőt
     */
    async function addTask() {
        const taskName = document.getElementById('task-name').value.trim();

        if (!taskName) {
            alert('Kérjük, adj meg egy teendőnevet!');
            return;
        }

        if (window.ListsService && currentOpenList) {
            const newTask = await window.ListsService.addTask(currentOpenList.id, taskName);
            if (newTask) {
                closeAddTaskModal();
                openListDetail(currentOpenList.id); // Refresh detail view
            }
        }
    }

    /**
     * Töröl egy listát
     * @param {string} listId - Lista azonosítója
     */
    async function deleteList(listId) {
        if (confirm('Biztosan törölni szeretnéd ezt a listát?')) {
            if (window.ListsService) {
                const success = await window.ListsService.deleteList(listId);
                if (success) {
                    refreshListsDisplay();
                }
            }
        }
    }

    /**
     * Töröl egy teendőt
     * @param {string} listId - Lista azonosítója
     * @param {string} taskId - Teendő azonosítója
     */
    async function deleteTask(listId, taskId) {
        if (confirm('Biztosan törölni szeretnéd ezt a teendőt?')) {
            if (window.ListsService) {
                const success = await window.ListsService.deleteTask(listId, taskId);
                if (success && currentOpenList) {
                    openListDetail(currentOpenList.id); // Refresh detail view
                }
            }
        }
    }

    /**
     * Vált egy teendő állapotát
     * @param {string} listId - Lista azonosítója
     * @param {string} taskId - Teendő azonosítója
     */
    async function toggleTask(listId, taskId) {
        if (window.ListsService) {
            const success = await window.ListsService.toggleTask(listId, taskId);
            if (success) {
                refreshListsDisplay();
                if (currentOpenList) {
                    openListDetail(currentOpenList.id); // Refresh detail view
                }
            }
        }
    }

    /**
     * Frissíti a listák megjelenítését
     */
    function refreshListsDisplay() {
        if (window.ListsService) {
            const lists = window.ListsService.getAllLists();
            renderListsGrid(lists);
            setupListsEventListeners();
        }
    }

    // Kategória slug generálás (pl. "Munka" -> "work")
    function getCategorySlug(category) {
        if (!category) return '';
        const map = {
            'munka': 'work',
            'otthon': 'otthon',
            'bevásárlás': 'bevásárlás', 'bevasarlas': 'bevásárlás',
            'hobbi': 'hobbi',
            'tanulás': 'tanulás', 'tanulas': 'tanulás',
            'egyéb': 'egyéb', 'egyeb': 'egyéb',
        };
        const slug = category.trim().toLowerCase().replace(/[^a-záéíóöőúüű0-9]/gi, '');
        return map[slug] || slug;
    }
    // Emoji ikon kategória alapján
    function getCategoryEmoji(category) {
        if (!category) return '📋';
        const map = {
            'munka': '💼',
            'otthon': '🏠',
            'bevásárlás': '🛒', 'bevasarlas': '🛒',
            'hobbi': '🎨',
            'tanulás': '📚', 'tanulas': '📚',
            'egyéb': '🗂️', 'egyeb': '🗂️',
        };
        const slug = getCategorySlug(category);
        return map[slug] || '📋';
    }

    // Public API
    return {
        renderListsTab,
        refreshListsDisplay,
        getCurrentOpenList: () => currentOpenList
    };
})(); 