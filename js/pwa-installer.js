// PWA Installer Module for Donezy
class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.installButton = null;
        this.isInstalled = false;
        this.init();
    }

    init() {
        // Check if PWA is already installed
        this.checkInstallationStatus();
        
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('[PWA] beforeinstallprompt event fired');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        // Listen for appinstalled event
        window.addEventListener('appinstalled', (e) => {
            console.log('[PWA] App installed successfully');
            this.isInstalled = true;
            this.hideInstallButton();
            this.deferredPrompt = null;
            
            // Show success message
            this.showInstallSuccessMessage();
        });

        // Check if running in standalone mode (already installed)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('[PWA] Running in standalone mode');
            this.isInstalled = true;
        }

        // Create install button
        this.createInstallButton();
    }

    createInstallButton() {
        // Create install button element
        this.installButton = document.createElement('button');
        this.installButton.id = 'pwa-install-btn';
        this.installButton.className = 'pwa-install-btn hidden';
        this.installButton.innerHTML = `
            <div class="flex items-center space-x-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                </svg>
                <span>Telepítés</span>
            </div>
        `;

        // Add event listener
        this.installButton.addEventListener('click', () => {
            this.installPWA();
        });

        // Add styles
        this.addInstallButtonStyles();

        // Insert button into DOM (in navbar)
        this.insertInstallButton();
    }

    addInstallButtonStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .pwa-install-btn {
                background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 8px;
                font-size: 0.875rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 6px;
                box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
            }

            .pwa-install-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
            }

            .pwa-install-btn:active {
                transform: translateY(0);
            }

            .pwa-install-btn.hidden {
                display: none !important;
            }

            .pwa-install-btn.installing {
                opacity: 0.7;
                cursor: not-allowed;
            }

            .pwa-install-btn.installing span {
                display: none;
            }

            .pwa-install-btn.installing::after {
                content: "Telepítés...";
            }

            @media (max-width: 768px) {
                .pwa-install-btn {
                    padding: 6px 12px;
                    font-size: 0.8rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    insertInstallButton() {
        // Try to insert in navbar
        const navbar = document.querySelector('nav');
        if (navbar) {
            const navRight = navbar.querySelector('.flex.items-center.space-x-4');
            if (navRight) {
                navRight.insertBefore(this.installButton, navRight.firstChild);
            } else {
                navbar.appendChild(this.installButton);
            }
        } else {
            // Fallback: insert in body
            document.body.appendChild(this.installButton);
        }
    }

    showInstallButton() {
        if (this.installButton && !this.isInstalled) {
            this.installButton.classList.remove('hidden');
            console.log('[PWA] Install button shown');
        }
    }

    hideInstallButton() {
        if (this.installButton) {
            this.installButton.classList.add('hidden');
            console.log('[PWA] Install button hidden');
        }
    }

    async installPWA() {
        if (!this.deferredPrompt) {
            console.log('[PWA] No install prompt available');
            return;
        }

        // Show installing state
        this.installButton.classList.add('installing');
        this.installButton.disabled = true;

        try {
            // Show the install prompt
            this.deferredPrompt.prompt();
            
            // Wait for the user to respond to the prompt
            const { outcome } = await this.deferredPrompt.userChoice;
            
            console.log('[PWA] User response to install prompt:', outcome);
            
            if (outcome === 'accepted') {
                console.log('[PWA] User accepted the install prompt');
                this.isInstalled = true;
            } else {
                console.log('[PWA] User dismissed the install prompt');
                // Reset button state
                this.installButton.classList.remove('installing');
                this.installButton.disabled = false;
            }
            
            // Clear the deferredPrompt
            this.deferredPrompt = null;
            
        } catch (error) {
            console.error('[PWA] Error during installation:', error);
            this.installButton.classList.remove('installing');
            this.installButton.disabled = false;
        }
    }

    checkInstallationStatus() {
        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
            console.log('[PWA] App is already installed');
        }

        // Check if running in TWA (Trusted Web Activity)
        if (document.referrer.includes('android-app://')) {
            this.isInstalled = true;
            console.log('[PWA] Running in TWA');
        }
    }

    showInstallSuccessMessage() {
        // Create success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-x-full';
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <span>✅</span>
                <span>Donezy sikeresen telepítve!</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Public method to manually show install button (for testing)
    forceShowInstallButton() {
        this.showInstallButton();
    }

    // Public method to check if PWA is installable
    isInstallable() {
        return !this.isInstalled && this.deferredPrompt !== null;
    }

    // Public method to get installation status
    getInstallationStatus() {
        return {
            isInstalled: this.isInstalled,
            isInstallable: this.isInstallable(),
            hasPrompt: this.deferredPrompt !== null
        };
    }
}

// Initialize PWA Installer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pwaInstaller = new PWAInstaller();
});

// Export for module usage
window.PWAInstaller = PWAInstaller; 