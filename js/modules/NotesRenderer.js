// NotesRenderer.js - Jegyzetek UI, titkosítás, modalok
window.NotesRenderer = (function() {
    'use strict';

    let currentOpenNote = null;

    function renderNotesTab(notes) {
        renderNotesHeader();
        renderNotesList(notes);
        setupNotesEventListeners();
    }

    function renderNotesHeader() {
        const header = document.getElementById('notes-header');
        if (!header) return;
        header.innerHTML = `
            <div class="flex items-center justify-between mb-8">
                <h2 class="text-3xl font-bold text-donezy-orange flex items-center gap-2">📝 Jegyzetek</h2>
                <button id="open-create-note-modal" class="bg-donezy-orange hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-colors duration-200 text-lg">Új jegyzet</button>
            </div>
        `;
    }

    function renderNotesList(notes) {
        const list = document.getElementById('notes-list');
        if (!list) return;
        const notesArr = Object.values(notes).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        if (notesArr.length === 0) {
            list.innerHTML = `<div class="text-center py-12 text-gray-400">Nincs még jegyzeted.</div>`;
            return;
        }
        list.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                ${notesArr.map(note => renderNoteCard(note)).join('')}
            </div>
        `;
    }

    function renderNoteCard(note) {
        const isEncrypted = note.isEncrypted;
        const isPinned = note.pinned;
        
        if (isEncrypted) {
            return `
                <div class="card note-card flex flex-col min-h-[220px] relative ${isPinned ? 'ring-2 ring-donezy-orange' : ''}">
                    <div class="card-header flex items-center gap-2 mb-3">
                        <span class="text-2xl">🔒</span>
                        <span class="card-title">${note.title}</span>
                        ${isPinned ? '<span class="text-donezy-orange text-sm">📍</span>' : ''}
                    </div>
                    <div class="note-card-encrypted-overlay absolute inset-0 flex flex-col items-center justify-center rounded-lg z-10 animate-fade-in" style="background:rgba(0,0,0,0.40);backdrop-filter:blur(4px);">
                        <div class="text-5xl mb-2 animate-bounce">🔒</div>
                        <div class="text-lg font-bold text-donezy-orange mb-1">Védett tartalom</div>
                        <div class="text-xs font-semibold bg-donezy-accent text-donezy-orange px-3 py-1 rounded-full mb-2 tracking-wide shadow">Titkosított jegyzet</div>
                        <div class="text-sm text-donezy-text-secondary mb-4">Jelszó szükséges a megtekintéshez</div>
                        <button class="note-unlock-btn btn btn-primary" data-note-id="${note.id}">Jelszó megadása</button>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="card note-card flex flex-col min-h-[220px] relative ${isPinned ? 'ring-2 ring-donezy-orange' : ''}">
                    <div class="card-header flex items-center gap-2 mb-3">
                        <span class="text-2xl">📝</span>
                        <span class="card-title">${note.title}</span>
                        ${isPinned ? '<span class="text-donezy-orange text-sm">📍</span>' : ''}
                        ${note.tags ? `<span class='ml-2 px-2 py-1 rounded bg-donezy-accent text-xs text-donezy-orange'>${note.tags}</span>` : ''}
                    </div>
                    <div class="card-body flex-1 text-donezy-text-secondary">${note.content}</div>
                    <div class="card-footer flex items-center gap-2 mt-auto pt-4">
                        <button class="note-pin-btn btn btn-ghost text-donezy-orange" title="${isPinned ? 'Kitűzés feloldása' : 'Kitűzés'}" data-note-id="${note.id}">${isPinned ? '📍' : '📌'}</button>
                        <button class="note-edit-btn btn btn-ghost text-donezy-orange" title="Szerkesztés" data-note-id="${note.id}">✏️</button>
                        <button class="note-delete-btn btn btn-ghost text-red-400 hover:text-red-600" title="Törlés" data-note-id="${note.id}">🗑️</button>
                        <span class="ml-auto text-xs text-donezy-text-secondary">${new Date(note.createdAt).toLocaleString('hu-HU')}</span>
                    </div>
                </div>
            `;
        }
    }

    function showNoteModal(note) {
        currentOpenNote = note;
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.id = 'note-modal';
        let contentHtml = '';
        if (note.isEncrypted) {
            contentHtml = `
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-300 mb-2">Jelszó a jegyzet feloldásához</label>
                    <input type="password" id="decrypt-password" class="w-full bg-donezy-accent border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-donezy-orange" placeholder="Jelszó...">
                    <div id="decrypt-error" class="text-red-400 text-sm mt-2"></div>
                </div>
                <button id="decrypt-note-btn" class="w-full bg-donezy-orange hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 mb-2">Feloldás</button>
            `;
        } else {
            contentHtml = `<div class="whitespace-pre-line text-gray-200">${note.content}</div>`;
        }
        modal.innerHTML = `
            <div class="bg-donezy-card rounded-lg p-6 shadow-lg border border-donezy-accent max-w-lg w-full mx-4">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-donezy-orange">📝 ${note.title}</h3>
                    <button id="close-note-modal" class="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                ${contentHtml}
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('close-note-modal').addEventListener('click', closeNoteModal);
        if (note.isEncrypted) {
            document.getElementById('decrypt-note-btn').addEventListener('click', tryDecryptNote);
        }
    }

    function closeNoteModal() {
        const modal = document.getElementById('note-modal');
        if (modal) modal.remove();
        currentOpenNote = null;
    }

    async function tryDecryptNote() {
        const password = document.getElementById('decrypt-password').value;
        const errorDiv = document.getElementById('decrypt-error');
        if (!password) {
            errorDiv.textContent = 'Kérlek, adj meg egy jelszót!';
            return;
        }
        const decrypted = window.NotesService.decryptNoteContent(currentOpenNote.content, password);
        if (!decrypted) {
            errorDiv.textContent = 'Hibás jelszó vagy sérült jegyzet!';
            return;
        }
        // Megjelenítjük a tartalmat szerkesztés/törlés gombokkal
        errorDiv.textContent = '';
        const modal = document.getElementById('note-modal');
        if (modal) {
            modal.querySelector('.bg-donezy-card').innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-donezy-orange">📝 ${currentOpenNote.title}</h3>
                    <button id="close-note-modal" class="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <div class="whitespace-pre-line text-gray-200 mb-4">${decrypted}</div>
                <div class="flex gap-2 mt-2">
                    <button id="edit-note-btn" class="btn btn-ghost text-donezy-orange">✏️ Szerkesztés</button>
                    <button id="delete-note-btn" class="btn btn-ghost text-red-400 hover:text-red-600">🗑️ Törlés</button>
                </div>
            `;
            document.getElementById('close-note-modal').addEventListener('click', closeNoteModal);
            document.getElementById('delete-note-btn').addEventListener('click', async () => {
                await window.NotesService.deleteNote(currentOpenNote.id);
                closeNoteModal();
                window.NotesRenderer.refreshNotesDisplay();
            });
            document.getElementById('edit-note-btn').addEventListener('click', () => {
                alert('A szerkesztés funkció hamarosan elérhető!');
                // Itt lehet majd szerkesztő modalt nyitni, ha implementálva lesz
            });
        }
    }

    // Jegyzet hozzáadás modal
    function showCreateNoteModal() {
        if (!window.ModalService) return alert('A modal szolgáltatás nem elérhető!');
        const modalId = window.ModalService.showModal({
            title: 'Új jegyzet',
            icon: '📝',
            fields: [
                { type: 'text', id: 'modal-note-title', label: 'Cím', placeholder: 'pl. Gép jelszavak', required: true },
                { type: 'textarea', id: 'modal-note-content', label: 'Tartalom', placeholder: 'Írd ide a jegyzetedet...', rows: 6, required: true },
                { type: 'checkbox', id: 'modal-note-encrypt', label: '🔒 Titkosított jegyzet', required: false },
                { type: 'password', id: 'modal-note-password', label: 'Jelszó a titkosításhoz', placeholder: 'Jelszó...', required: false, style: 'display:none;' }
            ],
            buttons: [
                {
                    text: 'Létrehozás',
                    type: 'primary',
                    id: 'create-note-modal-btn',
                    action: async (data, modalId) => {
                        const isEncrypted = data['modal-note-encrypt'] === true;
                        let password = '';
                        
                        if (isEncrypted) {
                            password = data['modal-note-password'];
                            if (!password || password.trim() === '') {
                                alert('A titkosított jegyzethez kötelező a jelszó!');
                                return;
                            }
                        }
                        
                        const success = await window.NotesService.createNote(
                            data['modal-note-title'], 
                            data['modal-note-content'], 
                            isEncrypted, 
                            password
                        );
                        
                        if (success) {
                            window.ModalService.closeModal(modalId);
                            window.NotesRenderer.refreshNotesDisplay();
                        } else {
                            alert('Hiba történt a jegyzet létrehozásakor!');
                        }
                    }
                },
                {
                    text: 'Mégse',
                    type: 'secondary',
                    id: 'cancel-note-modal-btn',
                    action: (data, modalId) => {
                        window.ModalService.closeModal(modalId);
                    }
                }
            ]
        });
        // Dinamikus jelszó input megjelenítés
        setTimeout(() => {
            const encryptCheckbox = document.getElementById('modal-note-encrypt');
            const passwordField = document.getElementById('modal-note-password');
            const passwordFieldContainer = passwordField?.parentElement;
            
            if (encryptCheckbox && passwordFieldContainer) {
                // Kezdeti állapot beállítása
                passwordFieldContainer.style.display = encryptCheckbox.checked ? '' : 'none';
                passwordField.required = encryptCheckbox.checked;
                
                // Event listener a checkbox változásához
                encryptCheckbox.addEventListener('change', () => {
                    passwordFieldContainer.style.display = encryptCheckbox.checked ? '' : 'none';
                    passwordField.required = encryptCheckbox.checked;
                    
                    // Ha kikapcsoljuk a titkosítást, töröljük a jelszó mezőt
                    if (!encryptCheckbox.checked) {
                        passwordField.value = '';
                    }
                });
            }
        }, 100);
    }

    function setupNotesEventListeners() {
        // Új jegyzet modal gomb
        document.getElementById('open-create-note-modal')?.addEventListener('click', showCreateNoteModal);
        // Jegyzet törlés
        document.querySelectorAll('.note-delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const noteId = btn.getAttribute('data-note-id');
                await window.NotesService.deleteNote(noteId);
                refreshNotesDisplay();
            });
        });
        // Jegyzet szerkesztés (TODO: implementálható később)
        document.querySelectorAll('.note-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                alert('A szerkesztés funkció hamarosan elérhető!');
            });
        });
        // Jegyzet kitűzés (TODO: implementálható később)
        document.querySelectorAll('.note-pin-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const noteId = btn.getAttribute('data-note-id');
                const success = await window.NotesService.toggleNotePin(noteId);
                if (success) {
                    refreshNotesDisplay();
                    // Pin ikon frissítése
                    const note = window.NotesService.getNote(noteId);
                    if (note) {
                        btn.textContent = note.pinned ? '📍' : '📌';
                        btn.title = note.pinned ? 'Kitűzés feloldása' : 'Kitűzés';
                    }
                }
            });
        });
        // Jegyzet megnyitás (csak titkosított)
        document.querySelectorAll('.note-unlock-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const noteId = btn.getAttribute('data-note-id');
                const note = window.NotesService.getNote(noteId);
                if (note) showNoteModal(note);
            });
        });
    }

    function refreshNotesDisplay() {
        if (window.NotesService) {
            const notes = window.NotesService.getAllNotes();
            renderNotesList(notes);
            setupNotesEventListeners();
        }
    }

    // Public API
    return {
        renderNotesTab,
        refreshNotesDisplay
    };
})(); 