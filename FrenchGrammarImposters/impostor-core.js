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
    previousCorrectPhrase: "", // Preserves the correct phrase from previous round for voting feedback
    hugoSubmission: "",
    previousHugoSubmission: "", // Preserves Hugo's submission from previous round for voting feedback
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
    currentEjectedCharacter: -1, // Track most recently ejected character
    actionInProgress: false, // Track if kill/sabotage action is in progress
    // Automated voting system state
    automatedVotingActive: false,
    votesNeededForHugo: 0,
    votesCastForHugo: 0,
    persistentVoters: [], // Crewmates that voted for Hugo and will continue voting
    votingTimers: [], // Timers for cleanup
    individualVotes: {}, // Tracks votes per character with voter details
    // Voting countdown timer state
    votingTimeLeft: 20,
    votingTimer: null,
    maxVotingTime: 20
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
        previousCorrectPhrase: "", // Preserves the correct phrase from previous round for voting feedback
        hugoSubmission: "",
        previousHugoSubmission: "", // Preserves Hugo's submission from previous round for voting feedback
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
        currentEjectedCharacter: -1,
        actionInProgress: false,
        // Automated voting system state
        automatedVotingActive: false,
        votesNeededForHugo: 0,
        votesCastForHugo: 0,
        persistentVoters: [],
        votingTimers: [],
        individualVotes: {},
        // Voting countdown timer state
        votingTimeLeft: 20,
        votingTimer: null,
        maxVotingTime: 20
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

// Pause task progress timer (during voting/emergency meetings)
function pauseTaskProgressTimer() {
    if (impostorGameState.taskProgressInterval) {
        clearInterval(impostorGameState.taskProgressInterval);
        impostorGameState.taskProgressInterval = null;
    }
}

// Resume task progress timer (when returning to active gameplay)
function resumeTaskProgressTimer() {
    // Only resume if not already running and game isn't over
    if (!impostorGameState.taskProgressInterval && !impostorGameState.gameOver) {
        impostorGameState.taskProgressInterval = setInterval(() => {
            impostorGameState.taskProgress += 0.1; // Increment by 0.1 seconds
            updateTaskProgressBar();

            if (impostorGameState.taskProgress >= impostorConfig.taskProgressTotal) {
                // Tasks completed - Hugo loses
                endGameTasksCompleted();
            }
        }, 100); // Update every 100ms for smooth progress
    }
}

// Start phrase correction phase
function startPhraseCorrection() {
    impostorGameState.gamePhase = 'phrase_correction';

    // Ensure task progress timer is running during active gameplay
    resumeTaskProgressTimer();

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

    // Preserve the previous correct phrase and Hugo's submission for voting feedback before setting new ones
    impostorGameState.previousCorrectPhrase = impostorGameState.correctPhrase;
    impostorGameState.previousHugoSubmission = impostorGameState.hugoSubmission;

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

    // Clear AI impostor timers since Hugo submitted
    clearAITimers();

    // Proceed directly to emergency meeting (kill opportunity is now merged with phrase correction)
    proceedToEmergencyMeeting();
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
    // Allow killing during phrase_correction phase (merged functionality)
    if (impostorGameState.gamePhase !== 'phrase_correction' && impostorGameState.gamePhase !== 'kill_opportunity') return;

    const victim = impostorGameState.characters.find(char => char.id === crewmateId);
    if (!victim || victim.isImpostor || !victim.alive || victim.ejected) return;

    // Capture Hugo's current input before proceeding (same logic as submitCorrection)
    const inputField = document.getElementById('phraseInput');
    impostorGameState.hugoSubmission = inputField ? inputField.textContent.trim() : "";

    // Prevent multiple actions by setting action in progress
    impostorGameState.actionInProgress = true;

    // Update display immediately to hide all action buttons
    updateImpostorDisplay();

    // Play knife stab sound effect
    playKnifeStabSound();

    victim.alive = false;
    victim.deathPhrase = getRandomDeathPhrase('violent');

    // Set the current dead character and clear ejected character
    impostorGameState.currentDeadCharacter = crewmateId;
    impostorGameState.currentEjectedCharacter = -1;

    // Update display immediately to show dead crewmate
    updateImpostorDisplay();

    // Clear Hugo's phrase correction timer since killing ends the phase
    if (impostorGameState.hugoTimer) {
        clearInterval(impostorGameState.hugoTimer);
        impostorGameState.hugoTimer = null;
    }

    // Clear kill timer
    if (impostorGameState.killTimer) {
        clearInterval(impostorGameState.killTimer);
        impostorGameState.killTimer = null;
    }

    impostorGameState.canKill = false;

    // Clear AI impostor timers
    clearAITimers();

    // Play emergency meeting sound after 2-second delay
    setTimeout(() => {
        playEmergencyMeetingSound();
    }, 2000);

    // Proceed to emergency meeting
    setTimeout(() => {
        proceedToEmergencyMeeting();
    }, 3000);
}

// Proceed to emergency meeting
function proceedToEmergencyMeeting() {
    impostorGameState.gamePhase = 'emergency_meeting';

    // Pause task progress during voting phase
    pauseTaskProgressTimer();

    // Reset action state for voting phase
    impostorGameState.actionInProgress = false;

    // Clear any remaining timers
    clearAITimers();

    // Calculate voting results based on Hugo's phrase accuracy
    calculateVotingResults();

    updateImpostorDisplay();
}

// Calculate voting results based on grammar accuracy using phrase analyzer
function calculateVotingResults() {
    // Use phrase analyzer to get detailed error analysis
    const analysis = analyzePhraseComparison(impostorGameState.hugoSubmission, impostorGameState.correctPhrase);
    const votesNeeded = analysis.totalVotes; // Direct vote count from errors

    // Store votes needed for automated voting system
    impostorGameState.votesNeededForHugo = votesNeeded;
    impostorGameState.votesCastForHugo = 0;

    // Reset individual votes tracking
    impostorGameState.individualVotes = {};
    impostorGameState.characters.forEach(char => {
        impostorGameState.individualVotes[char.id] = [];
    });

    // Handle vote carryover from persistent voters (from previous rounds)
    if (votesNeeded === 0) {
        // Perfect French - clear persistent voters, vote out another impostor
        impostorGameState.persistentVoters = [];

        const aliveCharacters = impostorGameState.characters.filter(c => c.alive && !c.ejected);
        const aliveImpostors = aliveCharacters.filter(c => c.isImpostor);
        const otherImpostors = aliveImpostors.filter(c => !c.isHugo);

        impostorGameState.votingResults = {};
        if (otherImpostors.length > 0) {
            const scapegoat = otherImpostors[Math.floor(Math.random() * otherImpostors.length)];
            impostorGameState.votingResults[scapegoat.id] = aliveCharacters.length;
        } else {
            // Only Hugo left - he gets voted out
            impostorGameState.votingResults[impostorGameState.hugoId] = aliveCharacters.length;
        }
    } else {
        // Hugo has errors - start automated voting system
        startAutomatedVoting();
    }
}

// Start automated voting system
function startAutomatedVoting() {
    impostorGameState.automatedVotingActive = true;
    impostorGameState.gamePhase = 'voting';

    // Clear any existing voting timers
    clearVotingTimers();

    // Start the 20-second countdown timer
    startVotingCountdown();

    // If no votes needed, still show countdown but will finish when timer expires
    if (impostorGameState.votesNeededForHugo === 0) {
        updateImpostorDisplay(); // Update display to show voting countdown
        return; // Let countdown timer finish the voting
    }

    // Schedule first vote after 5 seconds
    const firstVoteTimer = setTimeout(() => {
        castAutomatedVote();
    }, 5000);

    impostorGameState.votingTimers.push(firstVoteTimer);
    updateImpostorDisplay(); // Update display to show voting in progress
}

// Cast an automated vote for Hugo
function castAutomatedVote() {
    if (!impostorGameState.automatedVotingActive || impostorGameState.votesCastForHugo >= impostorGameState.votesNeededForHugo) {
        return;
    }

    // Get alive crewmates who can vote
    const aliveCrewmates = impostorGameState.characters.filter(c =>
        !c.isImpostor && c.alive && !c.ejected
    );

    if (aliveCrewmates.length === 0) {
        // No crewmates left to vote
        finishAutomatedVoting();
        return;
    }

    // Select a random crewmate to vote for Hugo
    const voter = aliveCrewmates[Math.floor(Math.random() * aliveCrewmates.length)];

    // Add this crewmate to persistent voters (if not already there)
    if (!impostorGameState.persistentVoters.includes(voter.id)) {
        impostorGameState.persistentVoters.push(voter.id);
    }

    // Record the vote
    if (!impostorGameState.individualVotes[impostorGameState.hugoId]) {
        impostorGameState.individualVotes[impostorGameState.hugoId] = [];
    }
    impostorGameState.individualVotes[impostorGameState.hugoId].push({
        voterId: voter.id,
        voterColor: voter.color,
        voterName: voter.name
    });

    impostorGameState.votesCastForHugo++;

    // Update display to show new vote
    updateImpostorDisplay();

    // Check if we need more votes
    if (impostorGameState.votesCastForHugo < impostorGameState.votesNeededForHugo) {
        scheduleNextVote();
    } else {
        // All needed votes cast, finish voting
        finishAutomatedVoting();
    }
}

// Schedule the next vote with random delay
function scheduleNextVote() {
    if (!impostorGameState.automatedVotingActive) return;

    // Random delay between 0-3 seconds
    const delay = Math.random() * 3000;

    const nextVoteTimer = setTimeout(() => {
        castAutomatedVote();
    }, delay);

    impostorGameState.votingTimers.push(nextVoteTimer);
}

// Finish automated voting and transition to results
function finishAutomatedVoting() {
    impostorGameState.automatedVotingActive = false;
    clearVotingTimers();
    clearVotingCountdown();

    // Set final voting results
    impostorGameState.votingResults = {};
    impostorGameState.votingResults[impostorGameState.hugoId] = impostorGameState.votesCastForHugo;

    // Update game phase and proceed with existing logic
    impostorGameState.gamePhase = 'emergency_meeting';

    // Update display to hide countdown and show emergency meeting
    updateImpostorDisplay();

    // Wait a moment to show final vote tally, then proceed
    setTimeout(() => {
        voteOutCharacter();
    }, 2000);
}

// Clear all voting timers
function clearVotingTimers() {
    impostorGameState.votingTimers.forEach(timer => clearTimeout(timer));
    impostorGameState.votingTimers = [];
}

// Start voting countdown timer
function startVotingCountdown() {
    impostorGameState.votingTimeLeft = impostorGameState.maxVotingTime;

    // Clear any existing voting countdown timer
    if (impostorGameState.votingTimer) {
        clearInterval(impostorGameState.votingTimer);
    }

    // Update display immediately
    updateVotingCountdown();

    // Start countdown timer
    impostorGameState.votingTimer = setInterval(() => {
        impostorGameState.votingTimeLeft--;
        updateVotingCountdown();

        if (impostorGameState.votingTimeLeft <= 0) {
            finishVotingCountdown();
        }
    }, 1000);
}

// Update voting countdown display
function updateVotingCountdown() {
    const countdownText = document.getElementById('votingCountdownText');
    if (countdownText) {
        if (impostorGameState.votingTimeLeft > 0) {
            countdownText.textContent = `Voting Ends in: ${impostorGameState.votingTimeLeft}s`;
        } else {
            countdownText.textContent = `Finalizing votes...`;
        }
    }
}

// Finish voting countdown
function finishVotingCountdown() {
    if (impostorGameState.votingTimer) {
        clearInterval(impostorGameState.votingTimer);
        impostorGameState.votingTimer = null;
    }

    // End voting if still active
    if (impostorGameState.automatedVotingActive) {
        finishAutomatedVoting();
    }
}

// Clear voting countdown timer
function clearVotingCountdown() {
    if (impostorGameState.votingTimer) {
        clearInterval(impostorGameState.votingTimer);
        impostorGameState.votingTimer = null;
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

    // Resume task progress for new round
    resumeTaskProgressTimer();

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
    clearVotingTimers();
    clearVotingCountdown();
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