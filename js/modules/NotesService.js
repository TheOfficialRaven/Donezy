// NotesService.js - Jegyzetek kezelése, titkosítás, Firebase/localStorage
window.NotesService = (function() {
    'use strict';

    // Dummy jegyzetek
    const DUMMY_NOTES = {
        'note_1': {
            id: 'note_1',
            title: 'Nyílt jegyzet példa',
            content: 'Ez egy nyílt, nem titkosított jegyzet. Bárki elolvashatja.',
            isEncrypted: false,
            pinned: false,
            createdAt: new Date().toISOString()
        },
        'note_2': {
            id: 'note_2',
            title: 'Titkosított jegyzet példa',
            content: '', // titkosított tartalom később kerül ide
            isEncrypted: true,
            pinned: false,
            createdAt: new Date().toISOString()
        }
    };
    // Titkosított dummy tartalom (jelszó: demo123)
    DUMMY_NOTES['note_2'].content = (window.CryptoJS ? CryptoJS.AES.encrypt('Ez egy titkosított jegyzet. Csak jelszóval olvasható!', 'demo123').toString() : 'ENCRYPTED_STRING');

    let currentNotes = {};

    async function init() {
        await loadNotes();
    }

    async function loadNotes() {
        try {
            // Try Firebase first through DataService
            if (window.app && window.app.dataService) {
                const userData = await window.app.dataService.getUserData();
                if (userData && userData.notes) {
                    currentNotes = userData.notes;
                    console.log('Notes loaded from Firebase:', Object.keys(currentNotes).length, 'notes');
                    return;
                }
            }
            
            // Fallback to localStorage
            const storedNotes = localStorage.getItem('notes');
            if (storedNotes) {
                currentNotes = JSON.parse(storedNotes);
                console.log('Notes loaded from localStorage (fallback):', Object.keys(currentNotes).length, 'notes');
                return;
            }
        } catch (error) {
            console.error('Error loading notes:', error);
            // Fallback to localStorage on error
            const storedNotes = localStorage.getItem('notes');
            if (storedNotes) {
                currentNotes = JSON.parse(storedNotes);
                console.log('Notes set to default (no storage available)');
            }
        }
    }

    async function saveNotes() {
        try {
            // Try Firebase first through DataService
            if (window.app && window.app.dataService) {
                const success = await window.app.dataService.updateUserField('notes', currentNotes);
                if (success) {
                    console.log('Notes saved to Firebase');
                    return;
                }
            }
            
            // Fallback to localStorage
            localStorage.setItem('notes', JSON.stringify(currentNotes));
            console.log('Notes saved to localStorage (fallback)');
        } catch (error) {
            console.error('Error saving notes:', error);
            // Fallback to localStorage on error
            localStorage.setItem('notes', JSON.stringify(currentNotes));
        }
    }

    function getAllNotes() {
        return currentNotes;
    }

    function getNote(noteId) {
        return currentNotes[noteId] || null;
    }

    async function createNote(title, content, isEncrypted = false, password = '') {
        try {
            const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            let finalContent = content;
            
            // Ha titkosított, akkor titkosítsuk a tartalmat
            if (isEncrypted && window.CryptoJS && password) {
                finalContent = CryptoJS.AES.encrypt(content, password).toString();
            } else if (isEncrypted && (!window.CryptoJS || !password)) {
                console.error('Titkosítás nem lehetséges: CryptoJS nem elérhető vagy hiányzó jelszó');
                return false;
            }
            
            currentNotes[noteId] = {
                id: noteId,
                title,
                content: finalContent,
                isEncrypted,
                pinned: false,
                createdAt: new Date().toISOString()
            };
            
            await saveNotes();
            console.log('Note created:', noteId, isEncrypted ? '(encrypted)' : '(not encrypted)');
            return true;
        } catch (e) {
            console.error('Error creating note:', e);
            return false;
        }
    }

    async function deleteNote(noteId) {
        try {
            delete currentNotes[noteId];
            await saveNotes();
            console.log('Note deleted:', noteId);
            return true;
        } catch (e) {
            console.error('Error deleting note:', e);
            return false;
        }
    }

    async function toggleNotePin(noteId) {
        try {
            if (currentNotes[noteId]) {
                currentNotes[noteId].pinned = !currentNotes[noteId].pinned;
                await saveNotes();
                console.log('Note pin toggled:', noteId, currentNotes[noteId].pinned);
                return true;
            }
            return false;
        } catch (e) {
            console.error('Error toggling note pin:', e);
            return false;
        }
    }

    function isNoteEncrypted(note) {
        return note && note.isEncrypted;
    }

    function decryptNoteContent(encryptedContent, password) {
        if (!window.CryptoJS) return null;
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedContent, password);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            return decrypted || null;
        } catch (e) {
            return null;
        }
    }

    // Public API
    return {
        init,
        getAllNotes,
        getNote,
        createNote,
        deleteNote,
        toggleNotePin,
        isNoteEncrypted,
        decryptNoteContent
    };
})(); 