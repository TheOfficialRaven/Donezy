// Modal Service Module
class ModalService {
    constructor() {
        this.activeModals = new Map();
        this.modalCounter = 0;
    }

    showModal(options) {
        const modalId = `modal-${++this.modalCounter}`;
        
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop';
        modalOverlay.id = modalOverlay.id || modalId;
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = `bg-donezy-card rounded-lg p-6 shadow-lg border border-donezy-accent max-w-md w-full mx-4 fade-in`;
        
        // Build modal content
        modalContent.innerHTML = this.buildModalContent(options);
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        // Store modal reference
        this.activeModals.set(modalId, {
            overlay: modalOverlay,
            content: modalContent,
            options: options
        });
        
        // Add event listeners
        this.addModalEventListeners(modalId, options);
        
        // Focus on first input if exists
        const firstInput = modalContent.querySelector('input, textarea, select');
        if (firstInput) {
            firstInput.focus();
        }
        
        return modalId;
    }

    buildModalContent(options) {
        const { title, icon, fields, buttons, content } = options;
        
        let html = `
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-donezy-orange">${icon || ''} ${title}</h3>
                <button class="modal-close text-secondary hover:text-primary text-2xl transition-colors duration-200">&times;</button>
            </div>
        `;
        
        if (content) {
            html += `<div class="mb-4">${content}</div>`;
        }
        
        if (fields) {
            html += '<div class="space-y-4">';
            fields.forEach(field => {
                html += this.buildField(field);
            });
            html += '</div>';
        }
        
        if (buttons) {
            html += '<div class="flex space-x-3 mt-6">';
            buttons.forEach(button => {
                html += this.buildButton(button);
            });
            html += '</div>';
        }
        
        return html;
    }

    buildField(field) {
        const { type, id, label, placeholder, required, rows } = field;
        
        let html = `
            <div>
                <label class="block text-sm font-medium text-primary mb-2">${label}</label>
        `;
        
        switch (type) {
            case 'textarea':
                html += `<textarea id="${id}" rows="${rows || 3}" placeholder="${placeholder || ''}" ${required ? 'required' : ''} class="w-full bg-donezy-accent border border-secondary rounded-lg px-3 py-2 text-white focus:outline-none focus:border-donezy-orange transition-colors duration-200"></textarea>`;
                break;
            case 'select':
                html += `<select id="${id}" ${required ? 'required' : ''} class="w-full bg-donezy-accent border border-secondary rounded-lg px-3 py-2 text-white focus:outline-none focus:border-donezy-orange transition-colors duration-200">`;
                if (field.options) {
                    field.options.forEach(option => {
                        html += `<option value="${option.value}">${option.label}</option>`;
                    });
                }
                html += '</select>';
                break;
            case 'checkbox':
                html += `<div class="flex items-center">
                    <input type="checkbox" id="${id}" ${required ? 'required' : ''} class="w-4 h-4 text-donezy-orange bg-donezy-accent border-secondary rounded focus:ring-donezy-orange focus:ring-2">
                    <label for="${id}" class="ml-2 text-sm text-primary">${placeholder || ''}</label>
                </div>`;
                break;
            case 'password':
                html += `<input type="password" id="${id}" placeholder="${placeholder || ''}" ${required ? 'required' : ''} class="w-full bg-donezy-accent border border-secondary rounded-lg px-3 py-2 text-white focus:outline-none focus:border-donezy-orange transition-colors duration-200">`;
                break;
            case 'date':
                html += `<input type="date" id="${id}" ${required ? 'required' : ''} class="w-full bg-donezy-accent border border-secondary rounded-lg px-3 py-2 text-white focus:outline-none focus:border-donezy-orange transition-colors duration-200">`;
                break;
            case 'time':
                html += `<input type="time" id="${id}" ${required ? 'required' : ''} class="w-full bg-donezy-accent border border-secondary rounded-lg px-3 py-2 text-white focus:outline-none focus:border-donezy-orange transition-colors duration-200">`;
                break;
            default:
                html += `<input type="${type || 'text'}" id="${id}" ${required ? 'required' : ''} class="w-full bg-donezy-accent border border-secondary rounded-lg px-3 py-2 text-white focus:outline-none focus:border-donezy-orange transition-colors duration-200" placeholder="${placeholder || ''}">`;
        }
        
        html += '</div>';
        return html;
    }

    buildButton(button) {
        const { text, action, type = 'secondary', id } = button;
        const buttonClass = type === 'primary' 
            ? 'flex-1 bg-donezy-orange hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 btn-hover-effect'
            : 'flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 btn-hover-effect';
        
        return `<button id="${id || 'modal-btn'}" class="${buttonClass}">${text}</button>`;
    }

    addModalEventListeners(modalId, options) {
        const modal = this.activeModals.get(modalId);
        if (!modal) return;
        
        const { overlay, content } = modal;
        
        // Close button
        const closeBtn = content.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeModal(modalId);
            });
        }
        
        // Button actions
        if (options.buttons) {
            options.buttons.forEach(button => {
                const btn = content.querySelector(`#${button.id || 'modal-btn'}`);
                if (btn && button.action) {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        button.action(this.getModalData(modalId), modalId);
                    });
                }
            });
        }
        
        // Click outside to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeModal(modalId);
            }
        });
        
        // Escape key to close
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal(modalId);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        // Store escape handler for cleanup
        modal.escapeHandler = escapeHandler;
    }

    getModalData(modalId) {
        const modal = this.activeModals.get(modalId);
        if (!modal) return {};
        
        const data = {};
        const { options } = modal;
        
        if (options.fields) {
            options.fields.forEach(field => {
                const element = modal.content.querySelector(`#${field.id}`);
                if (element) {
                    if (field.type === 'checkbox') {
                        data[field.id] = element.checked;
                    } else {
                        data[field.id] = element.value;
                    }
                }
            });
        }
        
        return data;
    }

    closeModal(modalId) {
        const modal = this.activeModals.get(modalId);
        if (!modal) return;
        
        const { overlay, escapeHandler } = modal;
        
        // Remove escape handler
        if (escapeHandler) {
            document.removeEventListener('keydown', escapeHandler);
        }
        
        // Remove modal
        if (overlay.parentNode) {
            overlay.remove();
        }
        
        // Remove from active modals
        this.activeModals.delete(modalId);
    }

    closeAllModals() {
        this.activeModals.forEach((modal, modalId) => {
            this.closeModal(modalId);
        });
    }

    // Quick modal helpers
    showQuickActionModal(title, type, onSave) {
        const icon = type === 'task' ? '✅' : type === 'note' ? '📝' : '📅';
        
        return this.showModal({
            title: title,
            icon: icon,
            fields: [
                {
                    type: 'text',
                    id: 'modal-title',
                    label: 'Cím',
                    placeholder: 'Adja meg a címet...',
                    required: true
                },
                {
                    type: 'textarea',
                    id: 'modal-description',
                    label: 'Leírás',
                    placeholder: 'Adja meg a leírást...',
                    rows: 3
                }
            ],
            buttons: [
                {
                    text: 'Mentés',
                    action: (data) => {
                        if (onSave) {
                            onSave(data);
                        }
                    },
                    type: 'primary',
                    id: 'save-item'
                },
                {
                    text: 'Mégse',
                    action: () => {
                        this.closeAllModals();
                    },
                    type: 'secondary',
                    id: 'cancel-item'
                }
            ]
        });
    }

    showConfirmModal(title, message, onConfirm, onCancel) {
        return this.showModal({
            title: title,
            icon: '⚠️',
            content: `<p class="text-gray-300">${message}</p>`,
            buttons: [
                {
                    text: 'Igen',
                    action: () => {
                        if (onConfirm) {
                            onConfirm();
                        }
                    },
                    type: 'primary',
                    id: 'confirm-yes'
                },
                {
                    text: 'Nem',
                    action: () => {
                        if (onCancel) {
                            onCancel();
                        }
                    },
                    type: 'secondary',
                    id: 'confirm-no'
                }
            ]
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModalService;
} else {
    window.ModalService = new ModalService();
} 