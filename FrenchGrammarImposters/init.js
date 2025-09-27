// French Grammar Impostors - Initialization Module
// Game startup and event listener setup

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeGame();

    // Resume audio context on user interaction
    document.addEventListener('click', () => {
        if (audioContext && audioContext.state === 'suspended')
            audioContext.resume();
    });
});