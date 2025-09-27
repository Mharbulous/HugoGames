// French Grammar Impostors - Game Core Module
// Core game logic, state management, and game mechanics

let gameState = {
    crewmates: [],
    impostors: [],
    round: 1,
    gameOver: false,
    currentDeadCrewmate: -1,
    currentEjectedCrewmate: -1,
    isRevealing: false,
    votingPhase: 'between_rounds',
    hasVoted: false,
    showingResults: false,
    victoryPlayed: false,
    impostorVictoryPlayed: false
};

function initializeGame() {
    gameState = { crewmates: [], impostors: [], round: 1, gameOver: false, currentDeadCrewmate: -1, currentEjectedCrewmate: -1, isRevealing: false, votingPhase: 'game_start', hasVoted: false, showingResults: false, victoryPlayed: false, impostorVictoryPlayed: false };
    document.querySelector('.vote-title').innerHTML = '';
    document.getElementById('voteInstructions').innerHTML = 'Les imposteurs menacent la langue française avec la grammaire anglaise.<br><br>Sauvez la langue française, pour l\'Alliance Française !';
    const shuffledPairs = [...phrasePairs].sort(() => Math.random() - 0.5);
    const shuffledCrewmateData = [...crewmateData].sort(() => Math.random() - 0.5);

    // Track which phrase pairs are used by crewmates
    const usedPairIndices = new Set();

    // Assign 10 crewmates, each with a different phrase pair
    for (let i = 0; i < 10; i++) {
        gameState.crewmates.push({
            id: i, phrase: shuffledPairs[i].correct, isImpostor: false,
            alive: true, ejected: false, color: shuffledCrewmateData[i].color,
            name: shuffledCrewmateData[i].name, pairIndex: i
        });
        usedPairIndices.add(i);
    }

    // Create list of unused pairs for impostor priority assignment
    const unusedPairIndices = [];
    for (let i = 10; i < shuffledPairs.length; i++) {
        unusedPairIndices.push(i);
    }

    // Shuffle unused pairs for random selection
    unusedPairIndices.sort(() => Math.random() - 0.5);

    // Track which pairs have been assigned to impostors to prevent duplicates
    const impostorUsedPairs = new Set();

    // Assign 5 impostors using the prioritized system
    for (let impostorIndex = 0; impostorIndex < 5; impostorIndex++) {
        const crewmateId = 10 + impostorIndex;
        let pairIndex;

        // Priority 1: Use unused pairs if available
        if (unusedPairIndices.length > 0) {
            pairIndex = unusedPairIndices.pop();
        } else {
            // Priority 2: Reuse pairs already assigned to crewmates, but avoid duplicates among impostors
            const usedIndicesArray = Array.from(usedPairIndices).filter(index => !impostorUsedPairs.has(index));

            // If all crewmate pairs are already used by impostors, fall back to any crewmate pair
            if (usedIndicesArray.length === 0) {
                const allUsedIndices = Array.from(usedPairIndices);
                pairIndex = allUsedIndices[Math.floor(Math.random() * allUsedIndices.length)];
            } else {
                pairIndex = usedIndicesArray[Math.floor(Math.random() * usedIndicesArray.length)];
            }
        }

        // Track this pair as used by an impostor
        impostorUsedPairs.add(pairIndex);

        gameState.crewmates.push({
            id: crewmateId, phrase: shuffledPairs[pairIndex].impostor,
            correctPhrase: shuffledPairs[pairIndex].correct, isImpostor: true,
            alive: true, ejected: false, color: shuffledCrewmateData[crewmateId].color,
            name: shuffledCrewmateData[crewmateId].name, pairIndex: pairIndex
        });
        gameState.impostors.push(crewmateId);
    }

    // Shuffle the crewmates array to randomize impostor placement
    gameState.crewmates.sort(() => Math.random() - 0.5);

    // Reassign sequential IDs to maintain proper indexing for voting system
    gameState.crewmates.forEach((crewmate, index) => {
        crewmate.id = index;
    });

    // Update impostor IDs in the impostors array to match new positions
    gameState.impostors = gameState.crewmates
        .map((crewmate, index) => crewmate.isImpostor ? index : -1)
        .filter(id => id !== -1);

    updateDisplay();

    // Show the emergency button to start the game
    document.getElementById('voteButtons').innerHTML = `
        <br><button class="emergency-meeting-btn" onclick="startFirstEmergencyMeeting()">
            <img src="Emergency_button.png" alt="Emergency Meeting Button">
        </button>
        <p>Appuyez sur le bouton d'urgence pour commencer !</p>
    `;
}

function startFirstEmergencyMeeting() {
    // Kill a random innocent crewmate first
    const aliveInnocents = gameState.crewmates.filter(c => c.alive && !c.ejected && !c.isImpostor);
    if (aliveInnocents.length > 0) {
        const victim = aliveInnocents[Math.floor(Math.random() * aliveInnocents.length)];
        victim.alive = false;
        victim.deathPhrase = getRandomDeathPhrase('violent');
        gameState.currentDeadCrewmate = victim.id;
        // Clear any previous ejected crewmate when starting the game
        gameState.currentEjectedCrewmate = -1;

        // Show the emergency meeting with dead crewmate info
        document.querySelector('.vote-title').innerHTML = '🚨 Réunion d\'urgence! 🚨';
        document.getElementById('voteInstructions').innerHTML = `A crewmate has been killed!<br><br>
            <div class="dead-crewmate-display">
                <div class="dead-crewmate-body-small" style="background-color: ${victim.color}">☠️</div>
                <strong>${victim.name}</strong>
            </div><br>
            Les imposteurs parlent français avec la grammaire anglaise.<br><br>
            Votez pour éliminer celui que vous pensez être un imposteur.`;

        // Play emergency meeting sound
        playEmergencyMeetingSound();

        // Enable voting
        gameState.hasVoted = false;
        gameState.votingPhase = 'emergency_meeting';

        // Update vote buttons area
        document.getElementById('voteButtons').innerHTML = '<p>Cliquez sur le bouton sous chaque personnage pour voter pour l\'éliminer!</p>';

        updateDisplay();
    }
}

function vote(crewmateId) {
    if (gameState.isRevealing || gameState.gameOver || gameState.hasVoted || gameState.votingPhase !== 'emergency_meeting') return;
    gameState.hasVoted = true;
    gameState.votingPhase = 'vote_results';
    const votedCrewmate = gameState.crewmates[crewmateId];
    votedCrewmate.ejected = true;
    votedCrewmate.deathPhrase = getRandomDeathPhrase(votedCrewmate.isImpostor ? 'impostor_ejected' : 'innocent_ejected');

    // Clear the current dead crewmate and set the current ejected crewmate
    gameState.currentDeadCrewmate = -1;
    gameState.currentEjectedCrewmate = crewmateId;

    updateDisplay();
    startSuspensefulReveal(votedCrewmate);
}

function proceedToNextRound() {
    // Kill next crewmate and start emergency meeting
    killNextCrewmate();
    startEmergencyMeeting();
}

function killNextCrewmate() {
    const aliveInnocents = gameState.crewmates.filter(c => c.alive && !c.ejected && !c.isImpostor);
    if (aliveInnocents.length > 0) {
        const victim = aliveInnocents[Math.floor(Math.random() * aliveInnocents.length)];
        victim.alive = false;
        victim.deathPhrase = getRandomDeathPhrase('violent');

        // Clear the previous ejected crewmate and set the new dead crewmate
        gameState.currentEjectedCrewmate = -1;
        gameState.currentDeadCrewmate = victim.id;
    }
}

function checkGameEnd() {
    const aliveImpostors = gameState.crewmates.filter(c => c.isImpostor && c.alive && !c.ejected).length;
    const aliveInnocents = gameState.crewmates.filter(c => !c.isImpostor && c.alive && !c.ejected).length;
    const voteButtons = document.getElementById('voteButtons');

    if (aliveImpostors === 0) {
        // Display victory message in vote buttons area, preserving the feedback message above
        voteButtons.innerHTML = `
            <br><div class="victory-message">
                <h2 style="color: #4ecdc4; margin: 0;">🎉 Victory!</h2>
                <p style="color: #fff; margin: 10px 0;">Vous avez sauvé la langue française des imposteurs anglais !</p>
                <button class="new-game-btn" onclick="startNewGame()">Nouvelle Partie</button>
            </div>
        `;

        // Only play victory sound once and only after feedback reveal is completed
        if (!gameState.victoryPlayed && gameState.showingResults) {
            playVictorySound();
            gameState.victoryPlayed = true;
        }
        gameState.gameOver = true;
    } else if (aliveImpostors >= aliveInnocents) {
        // Only play impostor victory sound once when Game Over is displayed
        if (!gameState.impostorVictoryPlayed) {
            playImpostorVictorySound();
            gameState.impostorVictoryPlayed = true;
        }

        // Kill all surviving innocent crewmates when impostors win
        const survivingInnocents = gameState.crewmates.filter(c => !c.isImpostor && c.alive && !c.ejected);
        survivingInnocents.forEach(crewmate => {
            crewmate.alive = false;
            crewmate.deathPhrase = getRandomDeathPhrase('violent');
        });

        // Clear currentDeadCrewmate since multiple crewmates die simultaneously
        gameState.currentDeadCrewmate = -1;

        const voteTitle = document.querySelector('.vote-title');
        const voteInstructions = document.getElementById('voteInstructions');
        voteTitle.innerHTML = '💀 Game Over!';
        voteInstructions.innerHTML = `The grammar impostors have taken over! The remaining impostors were: ${gameState.crewmates.filter(c => c.isImpostor && c.alive && !c.ejected).map(c => c.name).join(', ')}<br><br><button class="new-game-btn" onclick="startNewGame()">Nouvelle Partie</button>`;
        gameState.gameOver = true;

        // Update display to reveal imposters with imposter.svg and show killed crewmates
        updateDisplay();
    }
}

function startEmergencyMeeting() {
    // Play emergency meeting sound
    playEmergencyMeetingSound();

    // Reset voting state and enable voting
    gameState.hasVoted = false;
    gameState.votingPhase = 'emergency_meeting';
    gameState.showingResults = false;  // Reset flag when starting new meeting

    // Set up emergency meeting display (killing is now done in proceedToNextRound)
    document.querySelector('.vote-title').innerHTML = '🚨 Réunion d\'urgence! 🚨';
    document.getElementById('voteButtons').innerHTML = '<p>Cliquez sur le bouton sous chaque personnage pour voter pour l\'éliminer!</p>';
    updateDisplay();
}