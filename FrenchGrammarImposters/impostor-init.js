// French Grammar Impostors - Impostor Initialization Module
// Game startup and event setup for impostor mode

// Initialize impostor mode when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('French Grammar Impostors - Impostor Mode Loading...');

    // Inject impostor-specific styles
    injectImpostorStyles();

    // Initialize UI handlers
    initializeImpostorUI();

    // Start the game
    initializeImpostorGame();

    console.log('Impostor mode initialized successfully!');
});

// Handle page unload to clean up timers
window.addEventListener('beforeunload', function() {
    clearAllTimers();
});