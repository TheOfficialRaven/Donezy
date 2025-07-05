// UserIDTest.js - User ID resolution test module
// Tests that all services are using the correct authenticated user ID

window.UserIDTest = (function() {
    'use strict';

    /**
     * Runs comprehensive user ID tests
     */
    async function runTests() {
        console.log('🔍 Running User ID Resolution Tests...');
        
        const results = {
            firebaseAuth: testFirebaseAuth(),
            windowCurrentUserId: testWindowCurrentUserId(),
            dataService: testDataService(),
            firebaseService: testFirebaseService(),
            resultsService: testResultsService(),
            consistency: testConsistency()
        };
        
        console.log('📊 User ID Test Results:', results);
        
        // Check if all tests pass
        const allPassed = Object.values(results).every(result => result.passed);
        
        if (allPassed) {
            console.log('✅ All User ID tests passed!');
        } else {
            console.log('❌ Some User ID tests failed!');
        }
        
        return results;
    }

    /**
     * Test Firebase Auth current user
     */
    function testFirebaseAuth() {
        try {
            if (!window.firebase || !window.firebase.auth) {
                return { passed: false, error: 'Firebase not available' };
            }
            
            const user = window.firebase.auth().currentUser;
            if (!user) {
                return { passed: false, error: 'No Firebase user authenticated' };
            }
            
            if (!user.uid) {
                return { passed: false, error: 'Firebase user has no UID' };
            }
            
            return { 
                passed: true, 
                userId: user.uid,
                message: 'Firebase Auth user available'
            };
        } catch (error) {
            return { passed: false, error: error.message };
        }
    }

    /**
     * Test window.currentUserId
     */
    function testWindowCurrentUserId() {
        try {
            if (!window.currentUserId) {
                return { passed: false, error: 'window.currentUserId not set' };
            }
            
            return { 
                passed: true, 
                userId: window.currentUserId,
                message: 'window.currentUserId available'
            };
        } catch (error) {
            return { passed: false, error: error.message };
        }
    }

    /**
     * Test DataService user ID
     */
    function testDataService() {
        try {
            if (!window.app || !window.app.dataService) {
                return { passed: false, error: 'DataService not available' };
            }
            
            const userId = window.app.dataService.getCurrentUserId();
            if (!userId) {
                return { passed: false, error: 'DataService returned no user ID' };
            }
            
            // Check if it's a Firebase UID (not a localStorage fallback)
            const isFirebaseUID = userId.length > 20 && !userId.startsWith('user_');
            
            return { 
                passed: isFirebaseUID, 
                userId: userId,
                isFirebaseUID: isFirebaseUID,
                message: isFirebaseUID ? 'DataService using Firebase UID' : 'DataService using fallback ID'
            };
        } catch (error) {
            return { passed: false, error: error.message };
        }
    }

    /**
     * Test FirebaseService user ID
     */
    function testFirebaseService() {
        try {
            if (!window.app || !window.app.dataService || !window.app.dataService.currentService) {
                return { passed: false, error: 'FirebaseService not available' };
            }
            
            const firebaseService = window.app.dataService.currentService;
            if (!firebaseService.getCurrentUserId) {
                return { passed: false, error: 'FirebaseService has no getCurrentUserId method' };
            }
            
            const userId = firebaseService.getCurrentUserId();
            if (!userId) {
                return { passed: false, error: 'FirebaseService returned no user ID' };
            }
            
            // Check if it's a Firebase UID (not a localStorage fallback)
            const isFirebaseUID = userId.length > 20 && !userId.startsWith('user_');
            
            return { 
                passed: isFirebaseUID, 
                userId: userId,
                isFirebaseUID: isFirebaseUID,
                message: isFirebaseUID ? 'FirebaseService using Firebase UID' : 'FirebaseService using fallback ID'
            };
        } catch (error) {
            return { passed: false, error: error.message };
        }
    }

    /**
     * Test ResultsService user ID
     */
    function testResultsService() {
        try {
            if (!window.ResultsService) {
                return { passed: false, error: 'ResultsService not available' };
            }
            
            // Try to get the current user from ResultsService
            const currentUser = window.ResultsService.getCurrentUser ? 
                window.ResultsService.getCurrentUser() : null;
            
            if (!currentUser) {
                return { passed: false, error: 'ResultsService has no current user' };
            }
            
            // Check if it's a Firebase UID (not a localStorage fallback)
            const isFirebaseUID = currentUser.length > 20 && !currentUser.startsWith('user_');
            
            return { 
                passed: isFirebaseUID, 
                userId: currentUser,
                isFirebaseUID: isFirebaseUID,
                message: isFirebaseUID ? 'ResultsService using Firebase UID' : 'ResultsService using fallback ID'
            };
        } catch (error) {
            return { passed: false, error: error.message };
        }
    }

    /**
     * Test consistency across all services
     */
    function testConsistency() {
        try {
            const userIds = [];
            
            // Collect user IDs from all sources
            if (window.firebase && window.firebase.auth) {
                const user = window.firebase.auth().currentUser;
                if (user && user.uid) {
                    userIds.push({ source: 'Firebase Auth', id: user.uid });
                }
            }
            
            if (window.currentUserId) {
                userIds.push({ source: 'window.currentUserId', id: window.currentUserId });
            }
            
            if (window.app && window.app.dataService) {
                const userId = window.app.dataService.getCurrentUserId();
                if (userId) {
                    userIds.push({ source: 'DataService', id: userId });
                }
            }
            
            if (userIds.length === 0) {
                return { passed: false, error: 'No user IDs found' };
            }
            
            // Check if all user IDs are the same
            const uniqueIds = [...new Set(userIds.map(u => u.id))];
            
            if (uniqueIds.length === 1) {
                return { 
                    passed: true, 
                    userId: uniqueIds[0],
                    sources: userIds.length,
                    message: `All ${userIds.length} sources agree on user ID`
                };
            } else {
                return { 
                    passed: false, 
                    userIds: userIds,
                    uniqueIds: uniqueIds,
                    error: 'Inconsistent user IDs across services'
                };
            }
        } catch (error) {
            return { passed: false, error: error.message };
        }
    }

    /**
     * Get current user ID from all sources
     */
    function getAllUserIDs() {
        const results = {};
        
        // Firebase Auth
        if (window.firebase && window.firebase.auth) {
            const user = window.firebase.auth().currentUser;
            results.firebaseAuth = user ? user.uid : null;
        }
        
        // window.currentUserId
        results.windowCurrentUserId = window.currentUserId || null;
        
        // DataService
        if (window.app && window.app.dataService) {
            results.dataService = window.app.dataService.getCurrentUserId();
        }
        
        // FirebaseService
        if (window.app && window.app.dataService && window.app.dataService.currentService) {
            const firebaseService = window.app.dataService.currentService;
            if (firebaseService.getCurrentUserId) {
                results.firebaseService = firebaseService.getCurrentUserId();
            }
        }
        
        // ResultsService
        if (window.ResultsService && window.ResultsService.getCurrentUser) {
            results.resultsService = window.ResultsService.getCurrentUser();
        }
        
        return results;
    }

    // Public API
    return {
        runTests,
        getAllUserIDs,
        testFirebaseAuth,
        testWindowCurrentUserId,
        testDataService,
        testFirebaseService,
        testResultsService,
        testConsistency
    };
})(); 