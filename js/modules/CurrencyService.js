// CurrencyService.js - Essence currency management
window.CurrencyService = (function() {
    'use strict';

    // Essence icon - purple crystal/drop
    const ESSENCE_ICON = '<img src="imgs/Essence.svg" alt="Essence" class="inline w-4 h-4 align-middle" style="display:inline;vertical-align:middle;"/>';
    
    // Default essence amount for new users
    const DEFAULT_ESSENCE = 50;
    
    // Essence gain rates (rare and valuable)
    const ESSENCE_GAINS = {
        DAILY_STREAK_7: 10,      // 7-day streak
        DAILY_STREAK_30: 50,     // 30-day streak
        WEEKLY_GOAL: 25,         // Weekly goal completion
        SPECIAL_QUEST: 15,       // Special quest completion
        BADGE_TIER_UPGRADE: 5,   // Badge tier upgrade
        UNIQUE_ACHIEVEMENT: 100, // Unique achievements
        FIRST_TIME_BONUS: 20     // First time bonuses
    };

    // Current user's essence amount
    let currentEssence = DEFAULT_ESSENCE;

    /**
     * Initialize currency service
     */
    function init() {
        loadEssence();
        console.log('CurrencyService initialized');
    }

    /**
     * Load essence from Firebase (primary) or localStorage (fallback)
     */
    async function loadEssence() {
        try {
            // Try Firebase first through DataService
            if (window.app && window.app.dataService) {
                const userData = await window.app.dataService.getUserData();
                if (userData && userData.essence !== undefined) {
                    currentEssence = userData.essence;
                    console.log('Essence loaded from Firebase:', currentEssence);
                    updateEssenceDisplay();
                    return;
                }
            }
            
            // Fallback to localStorage
            const storedEssence = localStorage.getItem('essence');
            if (storedEssence !== null) {
                currentEssence = parseInt(storedEssence);
                console.log('Essence loaded from localStorage (fallback):', currentEssence);
                updateEssenceDisplay();
            }
        } catch (error) {
            console.error('Error loading essence:', error);
            // Fallback to localStorage on error
            const storedEssence = localStorage.getItem('essence');
            if (storedEssence !== null) {
                currentEssence = parseInt(storedEssence);
                console.log('Essence loaded from localStorage (fallback):', currentEssence);
                updateEssenceDisplay();
            }
        }
    }

    /**
     * Save essence to Firebase (primary) and localStorage (backup)
     */
    async function saveEssence() {
        try {
            // Try Firebase first through DataService
            if (window.app && window.app.dataService) {
                const success = await window.app.dataService.updateUserField('essence', currentEssence);
                if (success) {
                    console.log('Essence saved to Firebase:', currentEssence);
                    return;
                }
            }
            
            // Fallback to localStorage
            localStorage.setItem('essence', currentEssence.toString());
            console.log('Essence saved to localStorage (fallback):', currentEssence);
        } catch (error) {
            console.error('Error saving essence:', error);
            // Fallback to localStorage on error
            localStorage.setItem('essence', currentEssence.toString());
        }
    }

    /**
     * Add essence to user's balance
     * @param {number} amount - Amount to add
     * @param {string} reason - Reason for gaining essence
     */
    async function addEssence(amount, reason = '') {
        if (amount <= 0) return;
        
        const oldAmount = currentEssence;
        currentEssence += amount;
        
        await saveEssence();
        updateEssenceDisplay();
        
        // Show essence animation if available
        if (window.NotificationService && window.NotificationService.showEssenceAnimation) {
            try {
                window.NotificationService.showEssenceAnimation(amount, reason);
            } catch (error) {
                console.warn('Essence animation error:', error);
                // Fallback to regular notification
                if (window.NotificationService.showSuccess) {
                    window.NotificationService.showSuccess(
                        `+${amount} ${ESSENCE_ICON} Essence${reason ? ` - ${reason}` : ''}`,
                        'Essence gained!'
                    );
                }
            }
        } else if (window.NotificationService && window.NotificationService.showSuccess) {
            // Fallback to regular notification
            try {
                window.NotificationService.showSuccess(
                    `+${amount} ${ESSENCE_ICON} Essence${reason ? ` - ${reason}` : ''}`,
                    'Essence gained!'
                );
            } catch (error) {
                console.warn('Notification error:', error);
            }
        }
        
        console.log(`Essence gained: +${amount} (${oldAmount} → ${currentEssence})`);
    }

    /**
     * Spend essence from user's balance
     * @param {number} amount - Amount to spend
     * @param {string} reason - Reason for spending essence
     * @returns {boolean} - Whether the transaction was successful
     */
    async function spendEssence(amount, reason = '') {
        if (amount <= 0) return false;
        if (currentEssence < amount) {
            if (window.NotificationService && window.NotificationService.showError) {
                try {
                    window.NotificationService.showError(
                        `Nincs elég Essence! Szükséges: ${amount}, Van: ${currentEssence}`,
                        'Insufficient Essence'
                    );
                } catch (error) {
                    console.warn('Notification error:', error);
                }
            }
            return false;
        }
        
        const oldAmount = currentEssence;
        currentEssence -= amount;
        
        await saveEssence();
        updateEssenceDisplay();
        
        // Show notification if available
        if (window.NotificationService && window.NotificationService.showInfo) {
            try {
                window.NotificationService.showInfo(
                    `-${amount} ${ESSENCE_ICON} Essence${reason ? ` - ${reason}` : ''}`,
                    'Essence spent!'
                );
            } catch (error) {
                console.warn('Notification error:', error);
            }
        }
        
        console.log(`Essence spent: -${amount} (${oldAmount} → ${currentEssence})`);
        return true;
    }

    /**
     * Get current essence amount
     * @returns {number} - Current essence amount
     */
    function getEssence() {
        return currentEssence;
    }

    /**
     * Check if user has enough essence
     * @param {number} amount - Required amount
     * @returns {boolean} - Whether user has enough essence
     */
    function hasEnoughEssence(amount) {
        return currentEssence >= amount;
    }

    /**
     * Update essence display in UI
     */
    function updateEssenceDisplay() {
        const essenceElements = document.querySelectorAll('.essence-display');
        essenceElements.forEach(element => {
            element.innerHTML = `${ESSENCE_ICON} ${currentEssence.toLocaleString()}`;
        });
    }

    /**
     * Get essence icon
     * @returns {string} - Essence icon
     */
    function getEssenceIcon() {
        return ESSENCE_ICON;
    }

    /**
     * Get essence gains configuration
     * @returns {object} - Essence gains configuration
     */
    function getEssenceGains() {
        return ESSENCE_GAINS;
    }

    /**
     * Format essence amount with icon
     * @param {number} amount - Amount to format
     * @returns {string} - Formatted essence string
     */
    function formatEssence(amount) {
        return `${ESSENCE_ICON} ${amount.toLocaleString()}`;
    }

    // Public API
    return {
        init,
        addEssence,
        spendEssence,
        getEssence,
        hasEnoughEssence,
        updateEssenceDisplay,
        getEssenceIcon,
        getEssenceGains,
        formatEssence
    };
})(); 