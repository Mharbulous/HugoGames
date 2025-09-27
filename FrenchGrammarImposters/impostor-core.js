// French Grammar Impostors - Impostor Core Module
// Core game logic for impostor mode gameplay

let impostorGameState = {
    characters: [], // All 12 characters (5 impostors + 7 crewmates)
    impostors: [], // Array of impostor character IDs
    crewmates: [], // Array of crewmate character IDs
    hugoId: -1, // ID of Hugo's character
    round: 1,
    gameOver: false,
    gamePhase: 'phrase_correction', // 'phrase_correction', 'kill_opportunity', 'emergency_meeting', 'voting', 'results'
    taskProgress: 0, // Current task progress (0-180 seconds)
    taskProgressInterval: null,
    currentPhraseIndex: -1,
    currentPhrase: "",
    correctPhrase: "",
    hugoSubmission: "",
    hugoTimeLeft: 60,
    hugoTimer: null,
    aiImpostorTimers: [],
    killWindowTimeLeft: 0,
    killTimer: null,
    canKill: false,
    lastImpostorMode: false,
    votingResults: {},
    hasVoted: false,
    isLastRound: false,
    currentDeadCharacter: -1, // Track most recently killed character
    currentEjectedCharacter: -1 // Track most recently ejected character
};

// Initialize impostor game
function initializeImpostorGame() {
    // Reset game state
    impostorGameState = {
        characters: [],
        impostors: [],
        crewmates: [],
        hugoId: -1,
        round: 1,
        gameOver: false,
        gamePhase: 'phrase_correction',
        taskProgress: 0,
        taskProgressInterval: null,
        currentPhraseIndex: -1,
        currentPhrase: "",
        correctPhrase: "",
        hugoSubmission: "",
        hugoTimeLeft: 60,
        hugoTimer: null,
        aiImpostorTimers: [],
        killWindowTimeLeft: 0,
        killTimer: null,
        canKill: false,
        lastImpostorMode: false,
        votingResults: {},
        hasVoted: false,
        isLastRound: false,
        currentDeadCharacter: -1,
        currentEjectedCharacter: -1
    };

    // Clear any existing intervals
    clearAllTimers();

    // Shuffle phrase pairs and crewmate data
    const shuffledPairs = [...phrasePairs].sort(() => Math.random() - 0.5);
    const shuffledCrewmateData = [...crewmateData].sort(() => Math.random() - 0.5);

    // Select random color for Hugo first
    const hugoColorIndex = Math.floor(Math.random() * shuffledCrewmateData.length);
    const hugoColor = shuffledCrewmateData[hugoColorIndex];

    // Create Hugo (player impostor) - always first character (id: 0)
    impostorGameState.characters.push({
        id: 0,
        name: impostorConfig.hugo.name,
        color: hugoColor.color,
        phrase: "", // Will be set dynamically
        isImpostor: true,
        isHugo: true,
        alive: true,
        ejected: false,
        deathPhrase: ""
    });
    impostorGameState.impostors.push(0);
    impostorGameState.hugoId = 0;

    // Create 7 crewmates (AI-controlled) - skip Hugo's color
    let crewmateIndex = 0;
    for (let i = 0; i < impostorConfig.crewmates; i++) {
        // Skip the color already assigned to Hugo
        if (crewmateIndex === hugoColorIndex) {
            crewmateIndex++;
        }

        impostorGameState.characters.push({
            id: i + 1, // Start from id 1 since Hugo is 0
            name: shuffledCrewmateData[crewmateIndex].name,
            color: shuffledCrewmateData[crewmateIndex].color,
            phrase: shuffledPairs[i].correct,
            isImpostor: false,
            isHugo: false,
            alive: true,
            ejected: false,
            deathPhrase: ""
        });
        impostorGameState.crewmates.push(i + 1);
        crewmateIndex++;
    }

    // Create 4 AI impostors
    for (let i = 1; i < impostorConfig.impostors; i++) {
        const characterIndex = impostorConfig.crewmates + i; // This will be 8, 9, 10, 11
        const pairIndex = (impostorConfig.crewmates - 1 + i) < shuffledPairs.length ?
                          (impostorConfig.crewmates - 1 + i) :
                          Math.floor(Math.random() * shuffledPairs.length);

        // Skip the color already assigned to Hugo and crewmates
        let colorIndex = crewmateIndex;
        if (colorIndex >= shuffledCrewmateData.length) {
            colorIndex = Math.floor(Math.random() * shuffledCrewmateData.length);
        }

        impostorGameState.characters.push({
            id: characterIndex,
            name: shuffledCrewmateData[colorIndex].name,
            color: shuffledCrewmateData[colorIndex].color,
            phrase: shuffledPairs[pairIndex].impostor,
            correctPhrase: shuffledPairs[pairIndex].correct,
            isImpostor: true,
            isHugo: false,
            alive: true,
            ejected: false,
            deathPhrase: ""
        });
        impostorGameState.impostors.push(characterIndex);
        crewmateIndex++;
    }

    // Shuffle non-Hugo characters for display (Hugo stays first)
    const hugoCharacter = impostorGameState.characters[0]; // Hugo is always at index 0
    const otherCharacters = impostorGameState.characters.slice(1); // All characters except Hugo

    // Shuffle only the non-Hugo characters
    otherCharacters.sort(() => Math.random() - 0.5);

    // Rebuild characters array with Hugo first, then shuffled others
    impostorGameState.characters = [hugoCharacter, ...otherCharacters];

    // Start task progress timer
    startTaskProgressTimer();

    // Start first round
    startPhraseCorrection();
    updateImpostorDisplay();
}

// Start task progress timer (180 seconds total)
function startTaskProgressTimer() {
    if (impostorGameState.taskProgressInterval) {
        clearInterval(impostorGameState.taskProgressInterval);
    }

    impostorGameState.taskProgressInterval = setInterval(() => {
        impostorGameState.taskProgress += 0.1; // Increment by 0.1 seconds
        updateTaskProgressBar();

        if (impostorGameState.taskProgress >= impostorConfig.taskProgressTotal) {
            // Tasks completed - Hugo loses
            endGameTasksCompleted();
        }
    }, 100); // Update every 100ms for smooth progress
}

// Start phrase correction phase
function startPhraseCorrection() {
    impostorGameState.gamePhase = 'phrase_correction';

    // Select random phrase for Hugo to correct
    const availablePairs = phrasePairs.filter((_, index) =>
        !impostorGameState.characters.some(char => char.pairIndex === index)
    );

    if (availablePairs.length === 0) {
        // Fallback to any pair if all are used
        impostorGameState.currentPhraseIndex = Math.floor(Math.random() * phrasePairs.length);
    } else {
        const selectedPair = availablePairs[Math.floor(Math.random() * availablePairs.length)];
        impostorGameState.currentPhraseIndex = phrasePairs.indexOf(selectedPair);
    }

    const selectedPair = phrasePairs[impostorGameState.currentPhraseIndex];
    impostorGameState.currentPhrase = selectedPair.impostor;
    impostorGameState.correctPhrase = selectedPair.correct;

    // Check if this is last impostor mode
    const aliveImpostors = impostorGameState.characters.filter(c => c.isImpostor && c.alive && !c.ejected);
    impostorGameState.lastImpostorMode = aliveImpostors.length === 1 && aliveImpostors[0].isHugo;

    // Start Hugo's timer (60 seconds, or no time limit if last impostor)
    startHugoTimer();

    // Start AI impostor timers if not in last impostor mode
    if (!impostorGameState.lastImpostorMode) {
        startAIImpostorTimers();
    }

    updateImpostorDisplay();
}

// Start Hugo's correction timer
function startHugoTimer() {
    if (impostorGameState.lastImpostorMode) {
        // No time pressure for last impostor
        impostorGameState.hugoTimeLeft = -1;
        return;
    }

    impostorGameState.hugoTimeLeft = impostorConfig.hugoTimeLimit;

    if (impostorGameState.hugoTimer) {
        clearInterval(impostorGameState.hugoTimer);
    }

    impostorGameState.hugoTimer = setInterval(() => {
        impostorGameState.hugoTimeLeft--;
        updateTimerDisplay();

        if (impostorGameState.hugoTimeLeft <= 0) {
            // Auto-submit whatever is in the text field
            submitCorrection(true);
        }
    }, 1000);
}

// Start AI impostor timers
function startAIImpostorTimers() {
    impostorGameState.aiImpostorTimers = [];

    const aliveAIImpostors = impostorGameState.characters.filter(c =>
        c.isImpostor && !c.isHugo && c.alive && !c.ejected
    );

    aliveAIImpostors.forEach(impostor => {
        const completionTime = impostorConfig.aiImpostorMinTime +
                              Math.random() * (impostorConfig.aiImpostorMaxTime - impostorConfig.aiImpostorMinTime);

        const timer = setTimeout(() => {
            onAIImpostorComplete(impostor.id);
        }, completionTime * 1000);

        impostorGameState.aiImpostorTimers.push(timer);
    });
}

// Handle AI impostor completion
function onAIImpostorComplete(impostorId) {
    if (impostorGameState.gamePhase !== 'phrase_correction') return;

    // Check if Hugo has finished
    if (impostorGameState.hugoSubmission !== "") {
        // Hugo finished first - check for kill opportunity
        checkKillOpportunity();
    }
}

// Submit Hugo's correction
function submitCorrection(autoSubmit = false) {
    if (impostorGameState.gamePhase !== 'phrase_correction') return;

    const inputField = document.getElementById('phraseInput');
    impostorGameState.hugoSubmission = inputField ? inputField.textContent.trim() : "";

    // Clear Hugo's timer
    if (impostorGameState.hugoTimer) {
        clearInterval(impostorGameState.hugoTimer);
        impostorGameState.hugoTimer = null;
    }

    // Check if Hugo finished before AI impostors
    const aiStillWorking = impostorGameState.aiImpostorTimers.length > 0;

    if (aiStillWorking && !impostorGameState.lastImpostorMode) {
        // Hugo might get kill opportunity
        checkKillOpportunity();
    } else {
        // No kill opportunity - proceed to emergency meeting
        proceedToEmergencyMeeting();
    }
}

// Check for kill opportunity
function checkKillOpportunity() {
    const aliveCrewmates = impostorGameState.characters.filter(c =>
        !c.isImpostor && c.alive && !c.ejected
    );

    if (aliveCrewmates.length === 0) {
        // No crewmates left to kill
        proceedToEmergencyMeeting();
        return;
    }

    impostorGameState.gamePhase = 'kill_opportunity';
    impostorGameState.canKill = true;

    // Calculate kill window duration
    const aliveImpostors = impostorGameState.characters.filter(c =>
        c.isImpostor && c.alive && !c.ejected
    ).length;

    impostorGameState.killWindowTimeLeft = impostorConfig.killWindowBase +
                                          Math.random() * impostorConfig.killWindowRandom -
                                          aliveImpostors;

    impostorGameState.killWindowTimeLeft = Math.max(5, impostorGameState.killWindowTimeLeft);

    // Start kill window timer
    impostorGameState.killTimer = setInterval(() => {
        impostorGameState.killWindowTimeLeft--;
        updateKillTimerDisplay();

        if (impostorGameState.killWindowTimeLeft <= 0) {
            // Time's up - AI impostors might kill instead
            handleAIImpostorKill();
        }
    }, 1000);

    updateImpostorDisplay();
}

// Handle AI impostor kill when Hugo doesn't act
function handleAIImpostorKill() {
    if (!impostorGameState.canKill) return;

    const aliveCrewmates = impostorGameState.characters.filter(c =>
        !c.isImpostor && c.alive && !c.ejected
    );

    if (aliveCrewmates.length > 0) {
        const victim = aliveCrewmates[Math.floor(Math.random() * aliveCrewmates.length)];
        killCrewmate(victim.id, false);
    } else {
        proceedToEmergencyMeeting();
    }
}

// Kill a crewmate
function killCrewmate(crewmateId, killedByHugo = true) {
    if (!impostorGameState.canKill) return;

    const victim = impostorGameState.characters[crewmateId];
    if (!victim || victim.isImpostor || !victim.alive || victim.ejected) return;

    victim.alive = false;
    victim.deathPhrase = getRandomDeathPhrase('violent');

    // Set the current dead character and clear ejected character
    impostorGameState.currentDeadCharacter = crewmateId;
    impostorGameState.currentEjectedCharacter = -1;

    // Clear kill timer
    if (impostorGameState.killTimer) {
        clearInterval(impostorGameState.killTimer);
        impostorGameState.killTimer = null;
    }

    impostorGameState.canKill = false;

    // Clear AI impostor timers
    clearAITimers();

    // Play emergency meeting sound
    playEmergencyMeetingSound();

    // Proceed to emergency meeting
    setTimeout(() => {
        proceedToEmergencyMeeting();
    }, 1000);
}

// Proceed to emergency meeting
function proceedToEmergencyMeeting() {
    impostorGameState.gamePhase = 'emergency_meeting';

    // Clear any remaining timers
    clearAITimers();

    // Calculate voting results based on Hugo's phrase accuracy
    calculateVotingResults();

    updateImpostorDisplay();
}

// Calculate voting results based on grammar accuracy
function calculateVotingResults() {
    const hugoAccuracy = calculatePhraseAccuracy(impostorGameState.hugoSubmission, impostorGameState.correctPhrase);
    const errorsCount = impostorGameState.correctPhrase.length - hugoAccuracy;

    // Get all alive characters
    const aliveCharacters = impostorGameState.characters.filter(c => c.alive && !c.ejected);
    const aliveImpostors = aliveCharacters.filter(c => c.isImpostor);

    impostorGameState.votingResults = {};

    if (errorsCount === 0) {
        // Perfect French - another impostor gets voted out
        const otherImpostors = aliveImpostors.filter(c => !c.isHugo);
        if (otherImpostors.length > 0) {
            const scapegoat = otherImpostors[Math.floor(Math.random() * otherImpostors.length)];
            impostorGameState.votingResults[scapegoat.id] = aliveCharacters.length;
        } else {
            // Only Hugo left - he gets voted out
            impostorGameState.votingResults[impostorGameState.hugoId] = aliveCharacters.length;
        }
    } else {
        // Distribute votes based on errors
        impostorGameState.votingResults[impostorGameState.hugoId] = errorsCount;

        // Distribute remaining votes among other impostors
        const remainingVotes = aliveCharacters.length - errorsCount;
        const otherImpostors = aliveImpostors.filter(c => !c.isHugo);

        if (otherImpostors.length > 0 && remainingVotes > 0) {
            otherImpostors.forEach(impostor => {
                impostorGameState.votingResults[impostor.id] =
                    Math.floor(remainingVotes / otherImpostors.length);
            });
        }
    }
}

// Note: Character comparison functions moved to phrase-analyzer.js

// Vote out character
function voteOutCharacter() {
    // Find character with most votes
    let maxVotes = 0;
    let votedOutId = -1;

    for (const [characterId, votes] of Object.entries(impostorGameState.votingResults)) {
        if (votes > maxVotes) {
            maxVotes = votes;
            votedOutId = parseInt(characterId);
        }
    }

    if (votedOutId !== -1) {
        const ejectedCharacter = impostorGameState.characters[votedOutId];
        ejectedCharacter.ejected = true;
        ejectedCharacter.deathPhrase = getRandomDeathPhrase(
            ejectedCharacter.isImpostor ? 'impostor_ejected' : 'innocent_ejected'
        );

        // Set the current ejected character and clear dead character
        impostorGameState.currentEjectedCharacter = votedOutId;
        impostorGameState.currentDeadCharacter = -1;

        // Check if Hugo was voted out
        if (votedOutId === impostorGameState.hugoId) {
            endGameHugoEjected();
            return;
        }
    }

    // Check win conditions
    if (checkImpostorVictory()) {
        endGameImpostorVictory();
    } else {
        // Continue to next round
        setTimeout(() => {
            startNextRound();
        }, 3000);
    }
}

// Check if impostors have won
function checkImpostorVictory() {
    const aliveCrewmates = impostorGameState.characters.filter(c =>
        !c.isImpostor && c.alive && !c.ejected
    );
    return aliveCrewmates.length === 0;
}

// Start next round
function startNextRound() {
    impostorGameState.round++;
    impostorGameState.hasVoted = false;
    startPhraseCorrection();
}

// End game - Hugo ejected
function endGameHugoEjected() {
    impostorGameState.gameOver = true;
    impostorGameState.gamePhase = 'game_over';
    clearAllTimers();
    updateImpostorDisplay();
}

// End game - Impostor victory
function endGameImpostorVictory() {
    impostorGameState.gameOver = true;
    impostorGameState.gamePhase = 'impostor_victory';
    clearAllTimers();
    updateImpostorDisplay();
}

// End game - Tasks completed
function endGameTasksCompleted() {
    impostorGameState.gameOver = true;
    impostorGameState.gamePhase = 'tasks_completed';
    clearAllTimers();
    updateImpostorDisplay();
}

// Clear all timers
function clearAllTimers() {
    if (impostorGameState.hugoTimer) {
        clearInterval(impostorGameState.hugoTimer);
        impostorGameState.hugoTimer = null;
    }

    if (impostorGameState.killTimer) {
        clearInterval(impostorGameState.killTimer);
        impostorGameState.killTimer = null;
    }

    if (impostorGameState.taskProgressInterval) {
        clearInterval(impostorGameState.taskProgressInterval);
        impostorGameState.taskProgressInterval = null;
    }

    clearAITimers();
}

// Clear AI timers
function clearAITimers() {
    impostorGameState.aiImpostorTimers.forEach(timer => clearTimeout(timer));
    impostorGameState.aiImpostorTimers = [];
}

// Start new impostor game
function startNewImpostorGame() {
    initializeImpostorGame();
}