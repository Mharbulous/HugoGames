// French Grammar Impostors - Audio Engine Module
// Handles all audio functionality including Web Audio API and sound effects

let audioContext = null, clickBuffer = null;

function initAudio() {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

function createClickBuffer() {
    if (!audioContext || clickBuffer) return clickBuffer;
    const bufferSize = audioContext.sampleRate * 0.02;
    clickBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = clickBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        if (i < bufferSize * 0.1) output[i] = (Math.random() * 2 - 1) * Math.pow((bufferSize * 0.1 - i) / (bufferSize * 0.1), 2);
        else if (i < bufferSize * 0.3) output[i] = (Math.random() * 2 - 1) * 0.3 * Math.pow((bufferSize * 0.3 - i) / (bufferSize * 0.2), 3);
        else output[i] = 0;
    }
    return clickBuffer;
}

function scheduleClick(time) {
    if (!audioContext || !clickBuffer) return;
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    source.buffer = clickBuffer;
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    filter.Q.value = 1;
    gainNode.gain.value = 0.15;
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    source.start(time);
}

function revealTextWithSync(element, text, onComplete) {
    if (gameState.isRevealing) return;
    gameState.isRevealing = true;
    initAudio();
    createClickBuffer();
    element.innerHTML = '<span class="reveal-text"></span>';
    const textSpan = element.querySelector('.reveal-text');
    const charTimings = [];
    let currentTime = 0;
    for (let i = 0; i < text.length; i++) {
        charTimings.push(currentTime);
        // Check for unpredictable pause marker (...)
        if (i >= 2 && text[i] === '.' && text[i-1] === '.' && text[i-2] === '.' && i < text.length - 1) {
            // Generate unpredictable pause: 1.0 to 2.3 seconds (1000 + random * 1300 ms)
            const unpredictablePause = 1000 + (Math.random() * 1300);
            currentTime += unpredictablePause;
        } else {
            currentTime += 60;
        }
    }
    if (audioContext) {
        const startTime = audioContext.currentTime + 0.1;
        for (let i = 0; i < text.length; i++) scheduleClick(startTime + charTimings[i] / 1000);
    }
    let startTimestamp = null, currentIndex = 0;
    function animate(timestamp) {
        if (!startTimestamp) startTimestamp = timestamp;
        const elapsed = timestamp - startTimestamp;
        while (currentIndex < text.length && elapsed >= charTimings[currentIndex]) {
            currentIndex++;
            // Filter out ... pause markers from displayed text
            let displayText = text.substring(0, currentIndex).replace(/\.\.\./g, '');
            textSpan.innerHTML = displayText;
        }
        if (currentIndex < text.length) requestAnimationFrame(animate);
        else { gameState.isRevealing = false; if (onComplete) onComplete(); }
    }
    requestAnimationFrame(animate);
}

function playEmergencyMeetingSound() {
    // Try to play the EmergencyMeetingSound.mp3 file
    const audio = new Audio('EmergencyMeetingSound.mp3');
    audio.volume = 0.1;
    audio.play().catch(error => {
        console.log('Could not play emergency meeting sound:', error);
    });
}

function playVictorySound() {
    // Try to play the crewmate-victory.mp3 file
    const audio = new Audio('crewmate-victory.mp3');
    audio.volume = 0.3;
    audio.play().catch(error => {
        console.log('Could not play victory sound:', error);
    });
}

function playImpostorVictorySound() {
    // Try to play the imposter-victory.mp3 file
    const audio = new Audio('imposter-victory.mp3');
    audio.volume = 0.1;
    audio.play().catch(error => {
        console.log('Could not play impostor victory sound:', error);
    });
}

function playKnifeStabSound() {
    // Try to play the knife_stab.mp3 file
    const audio = new Audio('knife_stab.mp3');
    audio.volume = 0.5;
    audio.play().catch(error => {
        console.log('Could not play knife stab sound:', error);
    });
}