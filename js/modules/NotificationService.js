// Notification Service Module
class NotificationService {
    constructor() {
        this.notificationQueue = [];
        this.isProcessing = false;
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-x-full`;
        
        // Set background color based on type
        switch (type) {
            case 'success':
                notification.classList.add('bg-success', 'text-primary');
                break;
            case 'error':
                notification.classList.add('bg-error', 'text-primary');
                break;
            case 'warning':
                notification.classList.add('bg-warning', 'text-primary');
                break;
            default:
                notification.classList.add('bg-info', 'text-primary');
        }
        
        notification.textContent = message;
        notification.id = `notification-${Date.now()}`;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Remove after specified duration
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, duration);
    }

    showError(message, duration = 5000) {
        this.showNotification(message, 'error', duration);
    }

    showSuccess(message, duration = 3000) {
        this.showNotification(message, 'success', duration);
    }

    showWarning(message, duration = 4000) {
        this.showNotification(message, 'warning', duration);
    }

    showInfo(message, duration = 3000) {
        this.showNotification(message, 'info', duration);
    }

    // Show multiple notifications in sequence
    showNotificationSequence(notifications) {
        this.notificationQueue = [...notifications];
        this.processQueue();
    }

    processQueue() {
        if (this.isProcessing || this.notificationQueue.length === 0) {
            return;
        }

        this.isProcessing = true;
        const notification = this.notificationQueue.shift();
        
        this.showNotification(notification.message, notification.type, notification.duration);
        
        setTimeout(() => {
            this.isProcessing = false;
            this.processQueue();
        }, notification.duration + 400);
    }

    // Clear all notifications
    clearAll() {
        const notifications = document.querySelectorAll('[id^="notification-"]');
        notifications.forEach(notification => {
            notification.remove();
        });
    }

    // Show loading notification
    showLoading(message = 'Betöltés...') {
        const loadingId = `loading-${Date.now()}`;
        const loading = document.createElement('div');
        loading.id = loadingId;
        loading.className = 'fixed top-4 right-4 bg-info text-primary px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
        loading.innerHTML = `
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>${message}</span>
        `;
        
        document.body.appendChild(loading);
        return loadingId;
    }

    // Hide loading notification
    hideLoading(loadingId) {
        const loading = document.getElementById(loadingId);
        if (loading) {
            loading.remove();
        }
    }

    // XP Animáció
    showXPAnimation(amount, reason = '') {
        const notification = document.createElement('div');
        notification.className = 'xp-notification';
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 32px;">⭐</span>
                <div>
                    <div style="font-size: 28px; font-weight: bold;">+${amount} XP</div>
                    ${reason ? `<div style="font-size: 16px; opacity: 0.9;">${reason}</div>` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Add sparkle effects
        this.addSparkleEffects(notification);
        
        // Remove after animation
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 2000);
        
        // Animate XP progress bar
        this.animateXPProgress();
    }

    // Essence Animáció
    showEssenceAnimation(amount, reason = '') {
        const notification = document.createElement('div');
        notification.className = 'essence-notification';
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <img src="imgs/Essence.svg" alt="Essence" style="width: 32px; height: 32px;">
                <div>
                    <div style="font-size: 28px; font-weight: bold;">+${amount} Essence</div>
                    ${reason ? `<div style="font-size: 16px; opacity: 0.9;">${reason}</div>` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Add floating particles
        this.addFloatingParticles(notification);
        
        // Remove after animation
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 2000);
        
        // Animate essence counter
        this.animateEssenceCounter();
    }

    // Level Up Animáció
    showLevelUpAnimation(oldLevel, newLevel) {
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                <div style="font-size: 36px;">🎉</div>
                <div style="font-size: 32px; font-weight: bold;">Szint Emelkedés!</div>
                <div style="font-size: 24px;">${oldLevel} → ${newLevel}</div>
                <div style="font-size: 16px; opacity: 0.9;">Gratulálok!</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Add celebration effects
        this.addCelebrationEffects(notification);
        
        // Remove after animation
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
        
        // Animate level display
        this.animateLevelDisplay();
    }

    // Sparkle Effects
    addSparkleEffects(container) {
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.className = 'sparkle';
                sparkle.style.left = Math.random() * 100 + '%';
                sparkle.style.top = Math.random() * 100 + '%';
                sparkle.style.animationDelay = Math.random() * 0.5 + 's';
                container.appendChild(sparkle);
                
                setTimeout(() => {
                    if (sparkle.parentNode) {
                        sparkle.remove();
                    }
                }, 1500);
            }, i * 100);
        }
    }

    // Floating Particles
    addFloatingParticles(container) {
        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'floating-particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                container.appendChild(particle);
                
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.remove();
                    }
                }, 2000);
            }, i * 150);
        }
    }

    // Celebration Effects
    addCelebrationEffects(container) {
        // Add confetti-like particles
        for (let i = 0; i < 12; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.position = 'absolute';
                confetti.style.width = '8px';
                confetti.style.height = '8px';
                confetti.style.background = ['#ffd700', '#ff9100', '#ff6b35', '#7f5fff'][Math.floor(Math.random() * 4)];
                confetti.style.borderRadius = '50%';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.top = Math.random() * 100 + '%';
                confetti.style.animation = 'floatParticle 2s ease-out forwards';
                container.appendChild(confetti);
                
                setTimeout(() => {
                    if (confetti.parentNode) {
                        confetti.remove();
                    }
                }, 2000);
            }, i * 100);
        }
    }

    // XP Progress Bar Animation
    animateXPProgress() {
        const progressBar = document.querySelector('.xp-progress-bar');
        if (progressBar) {
            progressBar.classList.add('xp-progress-animation');
            setTimeout(() => {
                progressBar.classList.remove('xp-progress-animation');
            }, 1000);
        }
    }

    // Essence Counter Animation
    animateEssenceCounter() {
        const essenceElements = document.querySelectorAll('.essence-display');
        essenceElements.forEach(element => {
            element.classList.add('essence-counter-animation');
            setTimeout(() => {
                element.classList.remove('essence-counter-animation');
            }, 600);
        });
    }

    // Level Display Animation
    animateLevelDisplay() {
        const levelElements = document.querySelectorAll('.level-display');
        levelElements.forEach(element => {
            element.style.animation = 'levelUpFloat 1s ease-out';
            setTimeout(() => {
                element.style.animation = '';
            }, 1000);
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationService;
} else {
    window.NotificationService = NotificationService;
} 