// French Grammar Impostors - Game UI Module
// User interface, display updates, and interaction handling

function updateDisplay() {
    const aliveImpostors = gameState.crewmates.filter(c => c.isImpostor && c.alive && !c.ejected).length;
    const aliveInnocents = gameState.crewmates.filter(c => !c.isImpostor && c.alive && !c.ejected).length;

    const crewmatesArea = document.getElementById('crewmatesArea');
    const votingDisabled = gameState.votingPhase !== 'emergency_meeting' || gameState.hasVoted;
    crewmatesArea.innerHTML = gameState.crewmates.map(c => {
        // Determine speech bubble content and styling
        let speechContent = c.phrase;
        let isRecentlyDead = false;

        if (!c.alive && !c.ejected) {
            // This crewmate is dead (killed by impostor)
            if (c.id === gameState.currentDeadCrewmate) {
                // This is the most recently killed crewmate - show death phrase
                speechContent = c.deathPhrase || c.phrase;
                isRecentlyDead = true;
            } else {
                // This is an old dead crewmate - speech will be hidden by CSS
                speechContent = c.phrase;
            }
        } else if (c.ejected) {
            // This crewmate is ejected (voted out)
            if (c.id === gameState.currentEjectedCrewmate) {
                // This is the most recently ejected crewmate - show death phrase
                speechContent = c.deathPhrase || c.phrase;
                isRecentlyDead = true;
            } else {
                // This is an old ejected crewmate - speech will be hidden by CSS
                speechContent = c.phrase;
            }
        }

        // Determine which SVG to use based on timing and game state
        let svgContent;
        if (gameState.gameOver && aliveImpostors >= aliveInnocents && c.isImpostor && c.alive && !c.ejected) {
            // Imposters after they've won - reveal with imposter SVG
            svgContent = crewmateSVGs.imposter;
        } else if (c.alive && !c.ejected) {
            // Alive crewmates
            svgContent = crewmateSVGs.alive;
        } else if (c.ejected) {
            // Ejected crewmates
            svgContent = crewmateSVGs.ejected;
        } else if (!c.alive && c.id === gameState.currentDeadCrewmate) {
            // Recently killed crewmate (most recent victim)
            svgContent = crewmateSVGs.killed;
        } else if (!c.alive) {
            // Old corpses (dead but not the current victim)
            svgContent = crewmateSVGs.corpse;
        } else {
            // Fallback to alive crewmate
            svgContent = crewmateSVGs.alive;
        }

        return `
        <div class="crewmate ${c.alive ? 'alive' : 'dead'} ${c.ejected ? 'ejected' : ''} ${isRecentlyDead ? 'recently-dead' : ''}">
            <div class="crewmate-body" style="--crewmate-color: ${c.color}; background-color: transparent;">
                ${svgContent}
            </div>
            <div class="speech-bubble">${speechContent}</div>
            <button class="vote-btn ${votingDisabled ? 'voting-disabled' : ''}"
                style="background-color: ${c.color}; color: ${c.color === '#FFFFFF' || c.color === '#F5F557' ? '#000' : '#FFF'}"
                onclick="vote(${c.id})" ${!c.alive || c.ejected || gameState.isRevealing || gameState.gameOver ? 'disabled' : ''}>
                Voter ${c.name}
            </button>
        </div>
        `;
    }).join('');

    const voteButtons = document.getElementById('voteButtons');
    const voteInstructions = document.getElementById('voteInstructions');
    if (gameState.gameOver) {
        voteButtons.innerHTML = '<p style="color: #4ecdc4;">Jeu terminé - Aucun vote disponible</p>';
    } else if (gameState.isRevealing) {
        voteButtons.innerHTML = '';
    } else if (gameState.showingResults) {
        // Don't clear vote buttons when showing results - preserve the emergency button
    } else {
        if (gameState.currentDeadCrewmate !== -1) {
            const dead = gameState.crewmates[gameState.currentDeadCrewmate];
            voteInstructions.innerHTML = `Un coéquipier est mort !<div class="dead-crewmate-display">
                <div class="dead-crewmate-body-small" style="background-color: ${dead.color}">☠️</div>
                <div style="color: ${dead.color === '#FFFFFF' || dead.color === '#F5F557' ? '#000' : '#FFF'}; font-weight: bold;">${dead.name}</div>
            </div>Les imposteurs parlent français avec la grammaire anglaise.<br><br>Votez pour éliminer celui que vous pensez être un imposteur.`;
        } else {
            voteInstructions.innerHTML = 'Les imposteurs parlent français avec la grammaire anglaise.<br><br>Votez pour éliminer celui que vous pensez être un imposteur.';
        }
        voteButtons.innerHTML = '';
    }
    checkGameEnd();
}

function startSuspensefulReveal(votedCrewmate) {
    // Delay scroll to ensure layout updates complete first
    requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.querySelector('.vote-title').innerHTML = ' Résultats du vote';

    // Clear vote buttons during reveal
    document.getElementById('voteButtons').innerHTML = '';

    // Start the suspenseful text reveal immediately
    let revealText = votedCrewmate.isImpostor
        ? `"${votedCrewmate.correctPhrase}" utilise la grammaire française. ...<br>"${votedCrewmate.phrase}" utilise la grammaire anglaise. ...<br>${votedCrewmate.name} était un imposteur.`
        : `"${votedCrewmate.phrase}" utilise la grammaire française. ...<br>${votedCrewmate.name} n'était pas un imposteur.`;

    revealTextWithSync(document.getElementById('voteInstructions'), revealText, () => {
        // After reveal completes, update game state and show Next button
        if (votedCrewmate.isImpostor) gameState.impostors = gameState.impostors.filter(id => id !== votedCrewmate.id);
        gameState.round++;
        // Don't reset currentEjectedCrewmate here - keep it visible
        gameState.votingPhase = 'between_rounds';
        gameState.showingResults = true;  // Set flag to preserve emergency button

        // Show the Next button with updated stats
        const aliveImpostors = gameState.crewmates.filter(c => c.isImpostor && c.alive && !c.ejected).length;
        const aliveInnocents = gameState.crewmates.filter(c => !c.isImpostor && c.alive && !c.ejected).length;

        document.getElementById('voteButtons').innerHTML = `
            <br><button class="emergency-meeting-btn" onclick="proceedToNextRound()"><img src="FrenchGrammarImposters/Emergency_button.png" alt="Emergency Meeting Button"></button>
            <br><br>
            <div class="game-stats">
                <div class="stat">Imposteurs: <span id="impostorsLeft">${aliveImpostors}</span></div>
                <div class="stat">Coéquipiers: <span id="crewmatesLeft">${aliveInnocents}</span></div>
                <div class="stat">Manche: <span id="round">${gameState.round}</span></div>
            </div>
        `;
        updateDisplay();
    });
}

function startNewGame() {
    initializeGame();
}