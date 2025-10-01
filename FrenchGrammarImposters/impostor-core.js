// French Grammar Impostors - Impostor Core Module
// Core game logic for impostor mode gameplay

let impostorGameState = {
    characters: [], // All 12 characters (5 impostors + 7 crewmates)
    impostors: [], // Array of impostor character IDs
    crewmates: [], // Array of crewmate character IDs
    hugoId: -1, // ID of Hugo's character
    round: 1,
    gameOver: false,
    gamePhase: 'phrase_correction', // 'phrase_correction', 'emergency_meeting', 'voting', 'results'
    taskProgress: 0, // Current task progress (0-180 seconds)
    taskProgressInterval: null,
    currentPhraseIndex: -1,
    currentPhrase: "",
    correctPhrase: "",
    previousCorrectPhrase: "", // Preserves the correct phrase from previous round for voting feedback
    hugoSubmission: "",
    previousHugoSubmission: "", // Preserves Hugo's submission from previous round for voting feedback
    lastImpostorMode: false,
    votingResults: {},
    hasVoted: false,
    isLastRound: false,
    currentDeadCharacter: -1, // Track most recently killed character
    currentEjectedCharacter: -1, // Track most recently ejected character
    actionInProgress: false, // Track if kill/sabotage action is in progress
    usedHugoPhrases: [], // Track phrase indices Hugo has used across rounds
    // New voting system state
    hugoSuspectors: [], // Crewmates that voted for Hugo and will continue voting until Hugo has perfect phrase
    randomImpostorTarget: -1, // The impostor receiving Phase 2 votes
    impostorSuspectors: [], // Crewmates voting for random impostor
    hugoVoteTarget: -1, // Who Hugo voted for
    individualVotes: {} // Tracks votes per character with voter details
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
        lastImpostorMode: false,
        votingResults: {},
        hasVoted: false,
        isLastRound: false,
        currentDeadCharacter: -1,
        currentEjectedCharacter: -1,
        actionInProgress: false,
        usedHugoPhrases: [],
        // New voting system state
        hugoSuspectors: [],
        randomImpostorTarget: -1,
        impostorSuspectors: [],
        hugoVoteTarget: -1,
        individualVotes: {}
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
            pairIndex: i, // Track which phrase pair this character is using
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
            pairIndex: pairIndex, // Track which phrase pair this character is using
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
    // Filter out phrases already assigned to other characters AND phrases Hugo has already used
    const availablePairs = phrasePairs.filter((_, index) =>
        !impostorGameState.characters.some(char => char.pairIndex === index) &&
        !impostorGameState.usedHugoPhrases.includes(index)
    );

    if (availablePairs.length === 0) {
        // All phrases used - reset Hugo's used phrases and try again
        impostorGameState.usedHugoPhrases = [];

        // Filter again with only character constraints
        const availableAfterReset = phrasePairs.filter((_, index) =>
            !impostorGameState.characters.some(char => char.pairIndex === index)
        );

        if (availableAfterReset.length === 0) {
            // Fallback to any pair if all are used by other characters
            impostorGameState.currentPhraseIndex = Math.floor(Math.random() * phrasePairs.length);
        } else {
            const selectedPair = availableAfterReset[Math.floor(Math.random() * availableAfterReset.length)];
            impostorGameState.currentPhraseIndex = phrasePairs.indexOf(selectedPair);
        }
    } else {
        const selectedPair = availablePairs[Math.floor(Math.random() * availablePairs.length)];
        impostorGameState.currentPhraseIndex = phrasePairs.indexOf(selectedPair);
    }

    // Store this phrase index in Hugo's used phrases
    if (!impostorGameState.usedHugoPhrases.includes(impostorGameState.currentPhraseIndex)) {
        impostorGameState.usedHugoPhrases.push(impostorGameState.currentPhraseIndex);
    }

    const selectedPair = phrasePairs[impostorGameState.currentPhraseIndex];

    impostorGameState.currentPhrase = selectedPair.impostor;
    impostorGameState.correctPhrase = selectedPair.correct;

    // Check if this is last impostor mode
    const aliveImpostors = impostorGameState.characters.filter(c => c.isImpostor && c.alive && !c.ejected);
    impostorGameState.lastImpostorMode = aliveImpostors.length === 1 && aliveImpostors[0].isHugo;

    updateImpostorDisplay();
}

// Submit Hugo's correction
function submitCorrection(autoSubmit = false) {
    if (impostorGameState.gamePhase !== 'phrase_correction') return;

    const inputField = document.getElementById('phraseInput');
    impostorGameState.hugoSubmission = inputField ? inputField.textContent.trim() : "";

    // Proceed directly to emergency meeting
    proceedToEmergencyMeeting();
}


// Kill a crewmate
function killCrewmate(crewmateId, killedByHugo = true) {
    // Allow killing during phrase_correction phase
    if (impostorGameState.gamePhase !== 'phrase_correction') return;

    const victim = impostorGameState.characters.find(char => char.id === crewmateId);
    if (!victim || victim.isImpostor || !victim.alive || victim.ejected) return;

    // Capture Hugo's current input before proceeding (same logic as submitCorrection)
    const inputField = document.getElementById('phraseInput');
    impostorGameState.hugoSubmission = inputField ? inputField.textContent.trim() : "";

    // Prevent multiple actions by setting action in progress
    impostorGameState.actionInProgress = true;

    // Update display immediately to hide all action buttons
    updateImpostorDisplay();

    // Play knife stab sound effect, then dead body reported sound
    playKnifeStabSound(() => {
        playDeadBodyReportedSound();
    });

    victim.alive = false;
    victim.deathPhrase = getRandomDeathPhrase('violent');

    // Set the current dead character and clear ejected character
    impostorGameState.currentDeadCharacter = crewmateId;
    impostorGameState.currentEjectedCharacter = -1;

    // Update display immediately to show dead crewmate
    updateImpostorDisplay();

    // Check for victory immediately after killing
    if (checkImpostorVictory()) {
        endGameImpostorVictory();
        return;
    }

    // Proceed to emergency meeting immediately
    proceedToEmergencyMeeting();
}

// Proceed to emergency meeting
function proceedToEmergencyMeeting() {
    // Preserve the current correct phrase and Hugo's submission for voting feedback
    // This must happen BEFORE changing the game phase so the voting display shows the current round's data
    impostorGameState.previousCorrectPhrase = impostorGameState.correctPhrase;
    impostorGameState.previousHugoSubmission = impostorGameState.hugoSubmission;

    impostorGameState.gamePhase = 'emergency_meeting';

    // Pause task progress during voting phase
    pauseTaskProgressTimer();

    // Reset action state for voting phase
    impostorGameState.actionInProgress = false;

    // Calculate voting results based on Hugo's phrase accuracy
    calculateVotingResults();

    updateImpostorDisplay();
}

// Calculate voting results based on grammar accuracy using phrase analyzer
function calculateVotingResults() {
    // Reset individual votes tracking
    impostorGameState.individualVotes = {};
    impostorGameState.characters.forEach(char => {
        impostorGameState.individualVotes[char.id] = [];
    });

    // Reset voting state
    impostorGameState.hasVoted = false;
    impostorGameState.hugoVoteTarget = -1;
    impostorGameState.randomImpostorTarget = -1;
    impostorGameState.impostorSuspectors = [];

    // Start Phase 1 and 2 voting (automated crewmate suspicions)
    executePhase1And2Voting();
}

// PHASE 1 & 2: Assign crewmate votes to Hugo and random impostor based on errors
function executePhase1And2Voting() {
    // Get alive characters
    const aliveCrewmates = impostorGameState.characters.filter(c =>
        !c.isImpostor && c.alive && !c.ejected
    );
    const aliveImpostors = impostorGameState.characters.filter(c =>
        c.isImpostor && c.alive && !c.ejected && !c.isHugo
    );

    // PHASE 1: Hugo error votes
    const hugoAnalysis = analyzePhraseComparison(impostorGameState.hugoSubmission, impostorGameState.correctPhrase);
    const hugoErrorCount = hugoAnalysis.totalVotes;

    // Filter out any suspectors who are no longer alive
    impostorGameState.hugoSuspectors = impostorGameState.hugoSuspectors.filter(id => {
        const char = impostorGameState.characters.find(c => c.id === id);
        return char && char.alive && !char.ejected && !char.isImpostor;
    });

    // IMPORTANT: Once a crewmate becomes a Hugo suspector, they remain a suspector PERMANENTLY
    // This makes the voting pattern obvious to players: if they make errors, crewmates will
    // ALWAYS vote for them in every subsequent round, regardless of future performance.
    // Players must eliminate suspicious crewmates to survive.

    // Add new suspectors based on current errors (but never remove existing suspectors)
    if (hugoErrorCount > 0) {
        const neededNewSuspectors = hugoErrorCount;

        // Add new suspectors if we need them
        let addedCount = 0;
        while (addedCount < neededNewSuspectors && aliveCrewmates.length > 0) {
            // Find crewmates not already suspecting Hugo
            const availableCrewmates = aliveCrewmates.filter(c =>
                !impostorGameState.hugoSuspectors.includes(c.id)
            );

            if (availableCrewmates.length === 0) break;

            const newSuspector = availableCrewmates[Math.floor(Math.random() * availableCrewmates.length)];
            impostorGameState.hugoSuspectors.push(newSuspector.id);
            addedCount++;
        }
    }

    // ALL Hugo suspectors vote for Hugo, regardless of current round performance
    for (const suspectorId of impostorGameState.hugoSuspectors) {
        const suspector = impostorGameState.characters.find(c => c.id === suspectorId);
        if (suspector) {
            impostorGameState.individualVotes[impostorGameState.hugoId].push({
                voterId: suspector.id,
                voterColor: suspector.color,
                voterName: suspector.name
            });
        }
    }

    // PHASE 2: Random impostor error votes (only if there are other impostors alive)
    if (aliveImpostors.length > 0) {
        // Select random impostor
        const randomImpostor = aliveImpostors[Math.floor(Math.random() * aliveImpostors.length)];
        impostorGameState.randomImpostorTarget = randomImpostor.id;

        // Calculate errors in that impostor's phrase
        const impostorAnalysis = analyzePhraseComparison(randomImpostor.phrase, randomImpostor.correctPhrase);
        const impostorErrorCount = impostorAnalysis.totalVotes;

        // Assign crewmate votes (excluding Hugo suspectors)
        const availableCrewmates = aliveCrewmates.filter(c =>
            !impostorGameState.hugoSuspectors.includes(c.id)
        );

        const suspectorCount = Math.min(impostorErrorCount, availableCrewmates.length);
        for (let i = 0; i < suspectorCount; i++) {
            const suspector = availableCrewmates[i];
            impostorGameState.impostorSuspectors.push(suspector.id);

            if (!impostorGameState.individualVotes[randomImpostor.id]) {
                impostorGameState.individualVotes[randomImpostor.id] = [];
            }
            impostorGameState.individualVotes[randomImpostor.id].push({
                voterId: suspector.id,
                voterColor: suspector.color,
                voterName: suspector.name
            });
        }
    }

    // Transition to voting phase where Hugo can vote
    impostorGameState.gamePhase = 'voting';
    updateImpostorDisplay();
}

// PHASE 3: Hugo casts vote (triggered by UI), then impostors follow
function hugoVote(targetId) {
    if (impostorGameState.hasVoted) return;

    impostorGameState.hasVoted = true;
    impostorGameState.hugoVoteTarget = targetId;

    // Record Hugo's vote
    const hugo = impostorGameState.characters.find(c => c.id === impostorGameState.hugoId);
    if (!impostorGameState.individualVotes[targetId]) {
        impostorGameState.individualVotes[targetId] = [];
    }
    impostorGameState.individualVotes[targetId].push({
        voterId: hugo.id,
        voterColor: hugo.color,
        voterName: hugo.name
    });

    // All impostors vote for the same target
    const aliveImpostors = impostorGameState.characters.filter(c =>
        c.isImpostor && c.alive && !c.ejected && !c.isHugo
    );

    for (const impostor of aliveImpostors) {
        impostorGameState.individualVotes[targetId].push({
            voterId: impostor.id,
            voterColor: impostor.color,
            voterName: impostor.name
        });
    }

    // Proceed to Phase 4 and 5
    executePhase4And5Voting();
}

// PHASE 4 & 5: Remaining crewmate votes + count votes and eject
function executePhase4And5Voting() {
    const aliveCrewmates = impostorGameState.characters.filter(c =>
        !c.isImpostor && c.alive && !c.ejected
    );
    const aliveImpostors = impostorGameState.characters.filter(c =>
        c.isImpostor && c.alive && !c.ejected
    );

    // Find crewmates who haven't voted yet
    const votedCrewmateIds = new Set([
        ...impostorGameState.hugoSuspectors,
        ...impostorGameState.impostorSuspectors
    ]);
    const remainingCrewmates = aliveCrewmates.filter(c => !votedCrewmateIds.has(c.id));

    // PHASE 4: Determine remaining crewmate voting behavior
    const targetCharacter = impostorGameState.characters.find(c => c.id === impostorGameState.hugoVoteTarget);
    const hugoVotedForImpostor = targetCharacter && targetCharacter.isImpostor;
    const isHugoLastImpostor = aliveImpostors.length === 1 && aliveImpostors[0].isHugo;

    // Special case: Hugo is last impostor
    if (isHugoLastImpostor) {
        const hugoAnalysis = analyzePhraseComparison(impostorGameState.hugoSubmission, impostorGameState.correctPhrase);
        const allPhrasesArePerfect = hugoAnalysis.totalVotes === 0;

        if (allPhrasesArePerfect && impostorGameState.hugoSuspectors.length > 0) {
            // Hugo suspectors vote for Hugo, then after Hugo votes, all remaining vote for Hugo's target
            // (Hugo's vote and impostor votes already recorded in Phase 3)
            // Remaining crewmates vote for Hugo's target
            for (const crewmate of remainingCrewmates) {
                if (!impostorGameState.individualVotes[impostorGameState.hugoVoteTarget]) {
                    impostorGameState.individualVotes[impostorGameState.hugoVoteTarget] = [];
                }
                impostorGameState.individualVotes[impostorGameState.hugoVoteTarget].push({
                    voterId: crewmate.id,
                    voterColor: crewmate.color,
                    voterName: crewmate.name
                });
            }
        } else if (!allPhrasesArePerfect) {
            // Hugo's phrase is not perfect - all remaining crewmates vote for Hugo
            for (const crewmate of remainingCrewmates) {
                if (!impostorGameState.individualVotes[impostorGameState.hugoId]) {
                    impostorGameState.individualVotes[impostorGameState.hugoId] = [];
                }
                impostorGameState.individualVotes[impostorGameState.hugoId].push({
                    voterId: crewmate.id,
                    voterColor: crewmate.color,
                    voterName: crewmate.name
                });
            }
        } else {
            // All phrases perfect but no suspectors - vote for Hugo's target
            for (const crewmate of remainingCrewmates) {
                if (!impostorGameState.individualVotes[impostorGameState.hugoVoteTarget]) {
                    impostorGameState.individualVotes[impostorGameState.hugoVoteTarget] = [];
                }
                impostorGameState.individualVotes[impostorGameState.hugoVoteTarget].push({
                    voterId: crewmate.id,
                    voterColor: crewmate.color,
                    voterName: crewmate.name
                });
            }
        }
    } else {
        // Normal case: Multiple impostors alive
        if (hugoVotedForImpostor) {
            // All remaining crewmates vote for the impostor Hugo voted for
            for (const crewmate of remainingCrewmates) {
                if (!impostorGameState.individualVotes[impostorGameState.hugoVoteTarget]) {
                    impostorGameState.individualVotes[impostorGameState.hugoVoteTarget] = [];
                }
                impostorGameState.individualVotes[impostorGameState.hugoVoteTarget].push({
                    voterId: crewmate.id,
                    voterColor: crewmate.color,
                    voterName: crewmate.name
                });
            }
        } else {
            // Hugo voted for crewmate - remaining crewmates vote for random impostor
            const voteTarget = impostorGameState.randomImpostorTarget !== -1
                ? impostorGameState.randomImpostorTarget
                : impostorGameState.hugoVoteTarget;

            for (const crewmate of remainingCrewmates) {
                if (!impostorGameState.individualVotes[voteTarget]) {
                    impostorGameState.individualVotes[voteTarget] = [];
                }
                impostorGameState.individualVotes[voteTarget].push({
                    voterId: crewmate.id,
                    voterColor: crewmate.color,
                    voterName: crewmate.name
                });
            }
        }
    }

    // PHASE 5: Count votes and validate
    const voteCounts = {};
    const allVoters = new Set();

    // Count votes
    for (const characterId in impostorGameState.individualVotes) {
        const votes = impostorGameState.individualVotes[characterId];
        voteCounts[characterId] = votes.length;

        // Track voters
        for (const vote of votes) {
            allVoters.add(vote.voterId);
        }
    }

    // Validate: Each character should vote exactly once
    const aliveCharacters = impostorGameState.characters.filter(c => c.alive && !c.ejected);
    if (allVoters.size !== aliveCharacters.length) {
        console.warn('Voting validation warning: Not all characters voted exactly once');
    }

    // Store vote counts
    impostorGameState.votingResults = voteCounts;

    // Update display and proceed to ejection
    updateImpostorDisplay();

    setTimeout(() => {
        voteOutCharacter();
    }, 2000);
}

// Note: Character comparison functions moved to phrase-analyzer.js

// Vote out character
function voteOutCharacter() {
    // Find character with most votes
    let maxVotes = 0;
    let votedOutId = -1;
    let tiedCharacters = [];

    for (const [characterId, votes] of Object.entries(impostorGameState.votingResults)) {
        if (votes > maxVotes) {
            maxVotes = votes;
            votedOutId = parseInt(characterId);
            tiedCharacters = [votedOutId];
        } else if (votes === maxVotes && votes > 0) {
            tiedCharacters.push(parseInt(characterId));
        }
    }

    // Check for tie
    if (tiedCharacters.length > 1) {
        // Tie - no one is ejected
        impostorGameState.currentEjectedCharacter = -1;
        impostorGameState.currentDeadCharacter = -1;

        // Update display to show tie result
        updateImpostorDisplay();

        // Continue to next round
        setTimeout(() => {
            startNextRound();
        }, 3000);
        return;
    }

    if (votedOutId !== -1) {
        const ejectedCharacter = impostorGameState.characters.find(c => c.id === votedOutId);
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
    return aliveCrewmates.length <= 1;
}

// Start next round
function startNextRound() {
    impostorGameState.round++;
    impostorGameState.hasVoted = false;

    // Clear votes from previous round
    impostorGameState.individualVotes = {};

    // Check for victory before starting new round (safety catch)
    if (checkImpostorVictory()) {
        endGameImpostorVictory();
        return;
    }

    // Resume task progress for new round
    resumeTaskProgressTimer();

    startPhraseCorrection();
}

// End game - Hugo ejected
function endGameHugoEjected() {
    impostorGameState.gameOver = true;
    impostorGameState.gamePhase = 'game_over';
    clearAllTimers();

    // Play crewmate victory sound
    playVictorySound();

    updateImpostorDisplay();
}

// End game - Impostor victory
function endGameImpostorVictory() {
    impostorGameState.gameOver = true;
    impostorGameState.gamePhase = 'impostor_victory';
    clearAllTimers();

    // Play impostor victory sound
    playImpostorVictorySound();

    updateImpostorDisplay();
}

// End game - Tasks completed
function endGameTasksCompleted() {
    impostorGameState.gameOver = true;
    impostorGameState.gamePhase = 'tasks_completed';
    clearAllTimers();

    // Play crewmate victory sound
    playVictorySound();

    updateImpostorDisplay();
}

// Clear all timers
function clearAllTimers() {
    if (impostorGameState.taskProgressInterval) {
        clearInterval(impostorGameState.taskProgressInterval);
        impostorGameState.taskProgressInterval = null;
    }
}

// Start new impostor game
function startNewImpostorGame() {
    initializeImpostorGame();
}