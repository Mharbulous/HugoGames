// French Grammar Impostors - Impostor UI Module
// User interface management for impostor mode

// Update main display based on current game state
function updateImpostorDisplay() {
    updateTaskProgressBar();
    updateCharactersDisplay();
    updateGamePhaseDisplay();

    // Re-initialize accent input after character display updates (Hugo's textarea may have been recreated)
    if (impostorGameState.gamePhase === 'phrase_correction') {
        setTimeout(() => {
            setupAccentInput();
        }, 100);
    }
}

// Update task progress bar
function updateTaskProgressBar() {
    const taskProgressContainer = document.getElementById('taskProgressContainer');

    // Hide task progress bar during defeat/victory screens
    if (impostorGameState.gamePhase === 'game_over' || impostorGameState.gamePhase === 'tasks_completed' || impostorGameState.gamePhase === 'impostor_victory') {
        if (taskProgressContainer) taskProgressContainer.style.display = 'none';
        return;
    }

    // Show task progress bar during active gameplay
    if (taskProgressContainer) taskProgressContainer.style.display = 'block';

    // Update task progress bar
    const progressPercent = Math.min(100, (impostorGameState.taskProgress / impostorConfig.taskProgressTotal) * 100);
    const progressFill = document.getElementById('taskProgressFill');
    const taskPercentage = document.getElementById('taskPercentage');
    const taskWarning = document.getElementById('taskWarning');

    if (progressFill) {
        progressFill.style.width = `${progressPercent}%`;
    }

    if (taskPercentage) {
        taskPercentage.textContent = `${Math.round(progressPercent)}%`;
    }

    if (taskWarning) {
        taskWarning.style.display = progressPercent > 75 ? 'block' : 'none';
    }
}

// Update characters display
function updateCharactersDisplay() {
    const crewmatesArea = document.getElementById('crewmatesArea');
    if (!crewmatesArea) return;

    // Hide character cards during victory/defeat screens
    if (impostorGameState.gamePhase === 'game_over' || impostorGameState.gamePhase === 'tasks_completed' || impostorGameState.gamePhase === 'impostor_victory') {
        crewmatesArea.innerHTML = '';
        return;
    }

    const votingDisabled = (impostorGameState.gamePhase !== 'emergency_meeting' && impostorGameState.gamePhase !== 'voting') || impostorGameState.hasVoted;

    crewmatesArea.innerHTML = impostorGameState.characters.map(character => {
        // Determine speech bubble content and styling (matching crew mode logic)
        let speechContent = character.phrase;
        let speechBubbleClass = 'speech-bubble';
        let isRecentlyDead = false;
        let isHugo = character.id === impostorGameState.hugoId;

        if (!character.alive && !character.ejected) {
            // This character is dead (killed by impostor)
            if (character.id === impostorGameState.currentDeadCharacter) {
                // This is the most recently killed character - show death phrase
                speechContent = character.deathPhrase || character.phrase;
                isRecentlyDead = true;
            } else if (impostorGameState.gameOver && !character.isImpostor) {
                // Game over scenario - show death phrase for all killed innocent characters
                speechContent = character.deathPhrase || character.phrase;
                isRecentlyDead = true;
            } else {
                // This is an old dead character - speech will be hidden by CSS
                speechContent = character.phrase;
            }
        } else if (character.ejected) {
            // This character is ejected (voted out)
            if (character.id === impostorGameState.currentEjectedCharacter) {
                // This is the most recently ejected character - show death phrase
                speechContent = character.deathPhrase || character.phrase;
                isRecentlyDead = true;
            } else {
                // This is an old ejected character - speech will be hidden by CSS
                speechContent = character.phrase;
            }
        }

        // Special handling for Hugo's speech bubble during phrase correction
        if (isHugo && impostorGameState.gamePhase === 'phrase_correction') {
            // Hugo gets a textarea container as his speech bubble during phrase correction
            speechBubbleClass = '';
            speechContent = '';
        } else if (isHugo) {
            // Hugo gets normal speech bubble during other phases (like emergency_meeting, voting)
            speechBubbleClass = 'speech-bubble';
            // Use Hugo's submission with highlighted feedback from phrase analyzer
            // During voting phases, use previous round's data (submission vs correct phrase from the round being voted on)
            // During other phases, use current round's data
            const isVotingPhase = (impostorGameState.gamePhase === 'voting' || impostorGameState.gamePhase === 'emergency_meeting');

            const hugoSubmissionToUse = isVotingPhase
                ? (impostorGameState.previousHugoSubmission || impostorGameState.hugoSubmission)
                : impostorGameState.hugoSubmission;

            const correctPhraseToUse = isVotingPhase
                ? (impostorGameState.previousCorrectPhrase || impostorGameState.correctPhrase)
                : impostorGameState.correctPhrase;

            speechContent = createHighlightedFeedback(hugoSubmissionToUse, correctPhraseToUse);
        } else if (impostorGameState.gamePhase === 'phrase_correction' && !isRecentlyDead) {
            // During phrase correction phase, hide speech bubbles for all characters except Hugo and recently eliminated
            speechBubbleClass = '';
            speechContent = '';
        }

        // Determine which SVG to use based on timing and game state
        let svgContent;
        if (character.isImpostor && character.alive && !character.ejected) {
            // Show venting.svg for alive impostors (player can see who impostors are in impostor mode)
            svgContent = crewmateSVGs.venting;
        } else if (character.alive && !character.ejected) {
            // Alive crewmates
            svgContent = crewmateSVGs.alive;
        } else if (character.ejected) {
            // Ejected characters
            svgContent = crewmateSVGs.ejected;
        } else if (!character.alive && character.id === impostorGameState.currentDeadCharacter) {
            // Recently killed character (most recent victim)
            svgContent = crewmateSVGs.killed;
        } else if (!character.alive && impostorGameState.gameOver && !character.isImpostor) {
            // Game over scenario - show killed innocent characters as fresh corpses
            svgContent = crewmateSVGs.killed;
        } else if (!character.alive) {
            // Old corpses (dead but not the current victim)
            svgContent = crewmateSVGs.corpse;
        } else {
            // Fallback to alive character
            svgContent = crewmateSVGs.alive;
        }

        // Add button content based on character type and game phase
        let buttonContent = '';
        if (impostorGameState.gamePhase === 'phrase_correction' && !character.isImpostor && character.alive && !character.ejected && !impostorGameState.actionInProgress) {
            // Eliminer buttons for crewmates during phrase correction
            buttonContent = `<button class="vote-btn kill-btn" onclick="killCrewmate(${character.id})"><img src="images/knife.svg" alt="Knife" style="width: 24px; height: 24px; margin-right: 8px; vertical-align: middle;">Éliminer ${character.name}</button>`;
        } else if (impostorGameState.gamePhase === 'voting' && !impostorGameState.hasVoted && character.alive && !character.ejected && !isHugo) {
            // Vote buttons for all characters except Hugo (Hugo cannot vote for himself)
            // Only show during 'voting' phase (not 'emergency_meeting')
            buttonContent = `<button class="vote-btn"
                style="background-color: ${character.color}; color: ${character.color === '#FFFFFF' || character.color === '#F5F557' ? '#000' : '#FFF'}"
                onclick="voteImpostorCharacter(${character.id})" ${!character.alive || character.ejected || impostorGameState.gameOver ? 'disabled' : ''}>
                Voter ${character.name}
            </button>`;
        }

        // Hugo no longer gets a submit button - moved to impostor cards

        // Add Hugo's special contenteditable speech bubble during phrase correction
        let hugoTextareaElement = '';
        if (isHugo && impostorGameState.gamePhase === 'phrase_correction') {
            hugoTextareaElement = `<div class="speech-bubble hugo-speech-bubble" id="phraseInput" contenteditable="true" data-placeholder="Tapez la phrase corrigée ici...">${impostorGameState.currentPhrase || ''}</div>`;
        }

        // Generate vote crewmates for this character
        let voteCrewmatesHtml = '';
        if (impostorGameState.individualVotes && impostorGameState.individualVotes[character.id]) {
            const votes = impostorGameState.individualVotes[character.id];
            voteCrewmatesHtml = `
                <div class="vote-crewmates-container">
                    ${votes.map(vote => `
                        <svg class="vote-crewmate" width="18" height="18" viewBox="0 0 32 32" title="Vote de ${vote.voterName}">
                            <path fill="${vote.voterColor}" d="M27,11c0-1.3889-0.5712-2.6454-1.4888-3.5524C24.4883,4.8478,21.9586,3,19,3h-4c-3.8599,0-7,3.1401-7,7H7   c-1.6543,0-3,1.3457-3,3v8c0,1.6543,1.3457,3,3,3h1v1v1c0,1.6543,1.3457,3,3,3h2c1.6543,0,3-1.3457,3-3v-1.7693   c0.1204,0.0084,0.2469,0.0134,0.3804,0.0134c0.466,0,1.013-0.0637,1.6196-0.2253V26c0,1.6543,1.3457,3,3,3h2c1.6543,0,3-1.3457,3-3   v-1V13.9691C26.62,13.1364,27,12.1155,27,11z M25,11c0,1.6543-1.3457,3-3,3h-4c-1.6543,0-3-1.3457-3-3s1.3457-3,3-3h4   C23.6543,8,25,9.3457,25,11z M7,22c-0.5513,0-1-0.4487-1-1v-8c0-0.5513,0.4487-1,1-1h1v10H7z M24,26c0,0.5513-0.4487,1-1,1h-2   c-0.5513,0-1-0.4487-1-1v-2.8252c0.1821-0.1055,0.3664-0.2173,0.5547-0.3428c0.4595-0.3062,0.5835-0.9272,0.2773-1.3867   c-0.3071-0.4595-0.9272-0.5845-1.3867-0.2773c-2.3955,1.5981-3.9194,0.9727-4.0137,0.9302   c-0.007-0.0034-0.0146-0.0024-0.0217-0.0056c-0.0562-0.0255-0.1193-0.0314-0.1805-0.0463   c-0.0696-0.0167-0.1373-0.0402-0.2071-0.0418C15.0145,22.0043,15.0079,22,15,22c-0.0444,0-0.0822,0.0197-0.1251,0.0253   c-0.0797,0.0103-0.1581,0.0182-0.2327,0.047c-0.0546,0.0211-0.0991,0.0554-0.1486,0.0853   c-0.0597,0.0358-0.1196,0.0673-0.1712,0.1154c-0.0496,0.0461-0.0836,0.1033-0.123,0.1586   c-0.0299,0.0421-0.0701,0.0735-0.0939,0.1211c-0.0049,0.0098-0.0037,0.0206-0.0082,0.0305   c-0.0273,0.0591-0.0358,0.1247-0.0513,0.1893c-0.0157,0.0664-0.038,0.1307-0.0399,0.1974C14.0057,22.9805,14,22.9894,14,23v3   c0,0.5513-0.4487,1-1,1h-2c-0.5513,0-1-0.4487-1-1v-1v-2V11v-1c0-2.7568,2.2432-5,5-5h4c1.1193,0,2.1489,0.3755,2.9824,1H18   c-2.7568,0-5,2.2432-5,5s2.2432,5,5,5h4c0.7118,0,1.3864-0.1545,2-0.4238V25V26z M22,10c0-0.5523,0.4477-1,1-1s1,0.4477,1,1   c0,0.5522-0.4477,1-1,1S22,10.5522,22,10z M18,9h2c0.5522,0,1,0.4478,1,1s-0.4478,1-1,1h-2c-0.5522,0-1-0.4478-1-1S17.4478,9,18,9z"/>
                        </svg>
                    `).join('')}
                </div>
            `;
        }

        return `
        <div class="crewmate ${character.alive ? 'alive' : 'dead'} ${character.ejected ? 'ejected' : ''} ${isRecentlyDead ? 'recently-dead' : ''}" data-character-id="${character.id}">
            <div class="crewmate-body" style="--crewmate-color: ${character.color}; background-color: transparent;">
                ${svgContent}
            </div>
            ${hugoTextareaElement}
            ${speechBubbleClass ? `<div class="${speechBubbleClass}">${speechContent}</div>` : ''}
            ${buttonContent}
            ${voteCrewmatesHtml}
        </div>
        `;
    }).join('');
}

// Update game phase specific displays
function updateGamePhaseDisplay() {
    const voteTitle = document.getElementById('voteTitle');
    const voteInstructions = document.getElementById('voteInstructions');
    const voteButtons = document.getElementById('voteButtons');

    switch (impostorGameState.gamePhase) {
        case 'phrase_correction':
            updatePhraseCorrectionDisplay();
            if (voteTitle) voteTitle.innerHTML = '';
            if (voteInstructions) {
                voteInstructions.innerHTML = `Round ${impostorGameState.round} - Vous êtes un imposteur ! Corrigez la phrase ET éliminez un membre d'équipage si possible.`;
            }
            if (voteButtons) voteButtons.innerHTML = '';
            break;


        case 'emergency_meeting':
            if (voteTitle) voteTitle.innerHTML = '🚨 Réunion d\'urgence! 🚨';
            if (voteInstructions) {
                const deadCrewmate = impostorGameState.characters.find(c => !c.alive && !c.ejected);
                let instructions = 'Un membre d\'équipage a été tué !<br><br>';
                if (deadCrewmate) {
                    instructions += `<div class="dead-crewmate-display">
                        <div class="dead-crewmate-body-small" style="background-color: ${deadCrewmate.color}">☠️</div>
                        <strong>${deadCrewmate.name}</strong>
                    </div><br>`;
                }
                instructions += 'Votez pour éliminer un imposteur !';
                voteInstructions.innerHTML = instructions;
            }
            if (voteButtons) {
                voteButtons.innerHTML = '<p>Cliquez sur le bouton VOTE sous chaque personnage !</p>';
            }
            break;

        case 'voting':
            if (voteTitle) voteTitle.innerHTML = '🗳️ Vote en cours... 🗳️';
            if (voteInstructions) {
                voteInstructions.innerHTML = 'Les membres d\'équipage votent ! Cliquez sur un personnage pour voter.';
            }
            if (voteButtons) {
                voteButtons.innerHTML = '<p>Cliquez sur le bouton VOTE sous chaque personnage !</p>';
            }
            break;

        case 'impostor_victory':
            if (voteTitle) voteTitle.innerHTML = '';
            if (voteInstructions) {
                voteInstructions.innerHTML = '';
            }
            // Remove card background
            const votingAreaVictory = document.querySelector('.voting-area');
            if (votingAreaVictory) votingAreaVictory.style.background = 'transparent';

            if (voteButtons) {
                // Get last crewmate and Hugo's colors
                const lastCrewmate = impostorGameState.characters.filter(c => !c.isImpostor && c.alive && !c.ejected)[0];
                const hugoCharacter = impostorGameState.characters.find(c => c.id === impostorGameState.hugoId);
                const crewmateColor = lastCrewmate ? lastCrewmate.color : '#00FF00';
                const hugoColor = hugoCharacter ? hugoCharacter.color : '#FF0000';

                voteButtons.innerHTML = `
                    <div style="text-align: center; color: #fff; font-size: 2em; margin: 40px 0;">
                        🎉 Victoire des Imposteurs 🎉
                    </div>

                    <!-- Victory chase animation -->
                    <div class="victory-chase-container">
                        <!-- Fleeing crewmate -->
                        <div class="chase-character crewmate-chase">
                            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                                <path d="M27,11c0-1.3889-0.5712-2.6454-1.4888-3.5524C24.4883,4.8478,21.9586,3,19,3h-4c-3.8599,0-7,3.1401-7,7H7   c-1.6543,0-3,1.3457-3,3v8c0,1.6543,1.3457,3,3,3h1v1v1c0,1.6543,1.3457,3,3,3h2c1.6543,0,3-1.3457,3-3v-1.7693   c0.1204,0.0084,0.2469,0.0134,0.3804,0.0134c0.466,0,1.013-0.0637,1.6196-0.2253V26c0,1.6543,1.3457,3,3,3h2c1.6543,0,3-1.3457,3-3   v-1V13.9691C26.62,13.1364,27,12.1155,27,11z M25,11c0,1.6543-1.3457,3-3,3h-4c-1.6543,0-3-1.3457-3-3s1.3457-3,3-3h4   C23.6543,8,25,9.3457,25,11z M7,22c-0.5513,0-1-0.4487-1-1v-8c0-0.5513,0.4487-1,1-1h1v10H7z M24,26c0,0.5513-0.4487,1-1,1h-2   c-0.5513,0-1-0.4487-1-1v-2.8252c0.1821-0.1055,0.3664-0.2173,0.5547-0.3428c0.4595-0.3062,0.5835-0.9272,0.2773-1.3867   c-0.3071-0.4595-0.9272-0.5845-1.3867-0.2773c-2.3955,1.5981-3.9194,0.9727-4.0137,0.9302   c-0.007-0.0034-0.0146-0.0024-0.0217-0.0056c-0.0562-0.0255-0.1193-0.0314-0.1805-0.0463   c-0.0696-0.0167-0.1373-0.0402-0.2071-0.0418C15.0145,22.0043,15.0079,22,15,22c-0.0444,0-0.0822,0.0197-0.1251,0.0253   c-0.0797,0.0103-0.1581,0.0182-0.2327,0.047c-0.0546,0.0211-0.0991,0.0554-0.1486,0.0853   c-0.0597,0.0358-0.1196,0.0673-0.1712,0.1154c-0.0496,0.0461-0.0836,0.1033-0.123,0.1586   c-0.0299,0.0421-0.0701,0.0735-0.0939,0.1211c-0.0049,0.0098-0.0037,0.0206-0.0082,0.0305   c-0.0273,0.0591-0.0358,0.1247-0.0513,0.1893c-0.0157,0.0664-0.038,0.1307-0.0399,0.1974C14.0057,22.9805,14,22.9894,14,23v3   c0,0.5513-0.4487,1-1,1h-2c-0.5513,0-1-0.4487-1-1v-1v-2V11v-1c0-2.7568,2.2432-5,5-5h4c1.1193,0,2.1489,0.3755,2.9824,1H18   c-2.7568,0-5,2.2432-5,5s2.2432,5,5,5h4c0.7118,0,1.3864-0.1545,2-0.4238V25V26z M22,10c0-0.5523,0.4477-1,1-1s1,0.4477,1,1   c0,0.5522-0.4477,1-1,1S22,10.5522,22,10z M18,9h2c0.5522,0,1,0.4478,1,1s-0.4478,1-1,1h-2c-0.5522,0-1-0.4478-1-1S17.4478,9,18,9z" fill="${crewmateColor}"/>
                            </svg>
                        </div>
                        <!-- Chasing impostor (Hugo with alternating laugh) -->
                        <div class="chase-character impostor-chase">
                            <div class="impostor-laugh-layer crewmate-layer">
                                <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M27,11c0-1.3889-0.5712-2.6454-1.4888-3.5524C24.4883,4.8478,21.9586,3,19,3h-4c-3.8599,0-7,3.1401-7,7H7   c-1.6543,0-3,1.3457-3,3v8c0,1.6543,1.3457,3,3,3h1v1v1c0,1.6543,1.3457,3,3,3h2c1.6543,0,3-1.3457,3-3v-1.7693   c0.1204,0.0084,0.2469,0.0134,0.3804,0.0134c0.466,0,1.013-0.0637,1.6196-0.2253V26c0,1.6543,1.3457,3,3,3h2c1.6543,0,3-1.3457,3-3   v-1V13.9691C26.62,13.1364,27,12.1155,27,11z M25,11c0,1.6543-1.3457,3-3,3h-4c-1.6543,0-3-1.3457-3-3s1.3457-3,3-3h4   C23.6543,8,25,9.3457,25,11z M7,22c-0.5513,0-1-0.4487-1-1v-8c0-0.5513,0.4487-1,1-1h1v10H7z M24,26c0,0.5513-0.4487,1-1,1h-2   c-0.5513,0-1-0.4487-1-1v-2.8252c0.1821-0.1055,0.3664-0.2173,0.5547-0.3428c0.4595-0.3062,0.5835-0.9272,0.2773-1.3867   c-0.3071-0.4595-0.9272-0.5845-1.3867-0.2773c-2.3955,1.5981-3.9194,0.9727-4.0137,0.9302   c-0.007-0.0034-0.0146-0.0024-0.0217-0.0056c-0.0562-0.0255-0.1193-0.0314-0.1805-0.0463   c-0.0696-0.0167-0.1373-0.0402-0.2071-0.0418C15.0145,22.0043,15.0079,22,15,22c-0.0444,0-0.0822,0.0197-0.1251,0.0253   c-0.0797,0.0103-0.1581,0.0182-0.2327,0.047c-0.0546,0.0211-0.0991,0.0554-0.1486,0.0853   c-0.0597,0.0358-0.1196,0.0673-0.1712,0.1154c-0.0496,0.0461-0.0836,0.1033-0.123,0.1586   c-0.0299,0.0421-0.0701,0.0735-0.0939,0.1211c-0.0049,0.0098-0.0037,0.0206-0.0082,0.0305   c-0.0273,0.0591-0.0358,0.1247-0.0513,0.1893c-0.0157,0.0664-0.038,0.1307-0.0399,0.1974C14.0057,22.9805,14,22.9894,14,23v3   c0,0.5513-0.4487,1-1,1h-2c-0.5513,0-1-0.4487-1-1v-1v-2V11v-1c0-2.7568,2.2432-5,5-5h4c1.1193,0,2.1489,0.3755,2.9824,1H18   c-2.7568,0-5,2.2432-5,5s2.2432,5,5,5h4c0.7118,0,1.3864-0.1545,2-0.4238V25V26z M22,10c0-0.5523,0.4477-1,1-1s1,0.4477,1,1   c0,0.5522-0.4477,1-1,1S22,10.5522,22,10z M18,9h2c0.5522,0,1,0.4478,1,1s-0.4478,1-1,1h-2c-0.5522,0-1-0.4478-1-1S17.4478,9,18,9z" fill="${hugoColor}"/>
                                </svg>
                            </div>
                            <div class="impostor-laugh-layer impostor-layer">
                                <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.2929,7.2929c0.3905-0.3906,1.0237-0.3906,1.4142,0c0.3906,0.3905,0.3906,1.0237,0,1.4142   c-0.3905,0.3905-1.0237,0.3905-1.4142,0C16.9023,8.3166,16.9023,7.6834,17.2929,7.2929z M15.293,9.293l-1,1   c-0.3906,0.3906-0.3906,1.0234,0,1.4141C14.4883,11.9023,14.7441,12,15,12s0.5117-0.0977,0.707-0.293l1-1   c0.3906-0.3906,0.3906-1.0234,0-1.4141S15.6836,8.9023,15.293,9.293z M27,20v7v1.1733C27,29.7319,25.7319,31,24.1733,31h-2.3467   C20.2681,31,19,29.7319,19,28.1733v-2.1951c-0.3607,0.084-0.6946,0.1289-1,0.1461v2.049C18,29.7319,16.7319,31,15.1733,31h-2.3467   C11.2681,31,10,29.7319,10,28.1733V28v-1v-1H8.8267C7.2681,26,6,24.7319,6,23.1733v-2.7593l-1.707-1.707   c-0.7393-0.7393-0.9141-1.8857-0.4556-2.9922c0.3922-0.9467,1.1291-1.5826,1.9221-1.6922   C4.4821,11.783,4.8584,9.0618,6.8916,6.9414l3.646-3.4854c1.084-1.1323,2.3135-1.7334,3.6235-1.7549   c1.4438-0.0181,2.8379,0.6396,4.2007,1.9707c0.1446,0.1412,0.2191,0.3188,0.2595,0.5025c0.765,0.2061,1.4724,0.5936,2.0471,1.1738   c0.7369,0.7438,1.149,1.6833,1.2728,2.6539c0.0104-0.0001,0.021,0.0031,0.0315,0.0033c0.0399-0.0011,0.0775,0.0085,0.1172,0.0122   c0.03,0.0043,0.0599,0.0023,0.0897,0.0093c0.0157,0.0037,0.0293,0.0124,0.0447,0.0168c0.1758,0.0408,0.3455,0.1122,0.4826,0.2493   c0.188,0.188,0.2804,0.4326,0.2875,0.6788l0.611,1.8329c0.1196,0.3594,0.0264,0.7559-0.2417,1.0234   c-0.1904,0.1904-0.4463,0.293-0.707,0.293c-0.106,0-0.2124-0.0166-0.3164-0.0513l-1.4671-0.489   c-0.0711,0.0829-0.1268,0.1744-0.2048,0.2532l-1.073,1.0832l0.4744,1.4232c0.1196,0.3594,0.0264,0.7559-0.2417,1.0234   c-0.1904,0.1904-0.4463,0.293-0.707,0.293c-0.106,0-0.2124-0.0166-0.3164-0.0513l-1.4971-0.499L13.4141,19h2.9678l0.7236-1.4473   c0.3389-0.6777,1.4502-0.6777,1.7891,0L19.6182,19h1.7637l0.7236-1.4473c0.3389-0.6777,1.4502-0.6777,1.7891,0L24.6182,19H26   C26.5522,19,27,19.4478,27,20z M19.2476,6.7554C18.7651,6.2681,18.124,6,17.4429,6c-0.6816,0-1.3228,0.2681-1.8052,0.7554   l-2.5156,2.5396c-1.0024,1.0122-1.0024,2.6592,0,3.6714c0.8078,0.816,2.1135,0.9389,3.0849,0.3878   c0.0281-0.0375,0.0522-0.0777,0.086-0.1115l1.4141-1.4141c0.0633-0.0635,0.1343-0.1163,0.2101-0.1598l1.6707-1.6707   C20.2307,8.9929,20.1187,7.6349,19.2476,6.7554z M8.2563,14.0088c0.0283,0.0278,0.0552,0.0571,0.0801,0.0884l3.19,3.9623   l2.4443-2.4443c-0.8531-0.1829-1.6385-0.6046-2.2695-1.2417c-1.771-1.7886-1.771-4.6982,0-6.4858l2.5156-2.5396   c0.4869-0.4916,1.0702-0.8421,1.7006-1.0679c-0.6046-0.3831-1.1921-0.5947-1.7231-0.5795   c-0.7568,0.0127-1.5117,0.4063-2.2437,1.1704L8.3042,8.3564C6.6025,10.1323,6.5713,12.3633,8.2563,14.0088z M5.707,17.293   L7.4141,19h2.3024l-2.4573-3.0523C7.1746,15.9709,7.0919,16,7,16H6c-0.0522,0.0342-0.3071,0.3286-0.3901,0.7207   C5.5791,16.8672,5.5503,17.1362,5.707,17.293z M10,24v-3H8v2.1733C8,23.6294,8.3706,24,8.8267,24H10z M25,27v-6h-1h-2h-3h-2h-5v6v1   v0.1733C12,28.6294,12.3706,29,12.8267,29h2.3467C15.6294,29,16,28.6294,16,28.1733V26c0-0.0606,0.0242-0.1133,0.0345-0.171   c-0.0125-0.0058-0.0445-0.0189-0.0487-0.0209c-0.4937-0.2471-0.6943-0.8477-0.4473-1.3418   c0.2446-0.4878,0.8325-0.6904,1.3247-0.4556c0.0898,0.0376,1.4463,0.5796,3.582-0.8428c0.4595-0.3076,1.0801-0.1821,1.3867,0.2773   c0.3062,0.4595,0.1821,1.0806-0.2773,1.3867c-0.1882,0.1254-0.373,0.2387-0.5547,0.3425v2.9988C21,28.6294,21.3706,29,21.8267,29   h2.3467C24.6294,29,25,28.6294,25,28.1733V27z" fill="${hugoColor}"/>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div style="text-align: center;">
                        <button class="new-game-btn" onclick="startNewImpostorGame()">Nouvelle Partie</button>
                    </div>
                `;

                // Start the chase animation after DOM update
                setTimeout(animateVictoryChase, 100);
            }
            break;

        case 'game_over':
            if (voteTitle) voteTitle.innerHTML = '';
            if (voteInstructions) {
                voteInstructions.innerHTML = '';
            }
            // Remove card background
            const votingAreaGameOver = document.querySelector('.voting-area');
            if (votingAreaGameOver) votingAreaGameOver.style.background = 'transparent';

            if (voteButtons) {
                // Get all impostors with their colors
                const allImpostors = impostorGameState.characters.filter(c => c.isImpostor);

                voteButtons.innerHTML = `
                    <div style="text-align: center; color: #fff; font-size: 2em; margin: 40px 0;">
                        💀 Défaite
                    </div>

                    <!-- Ejected impostors animation overlay -->
                    <div class="ejected-impostor-container">
                        ${allImpostors.map(impostor => `
                            <div class="ejected-impostor">
                                <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M30,10.1548c-0.002-0.5811-0.2305-1.1265-0.6426-1.5352c-0.4131-0.4092-0.9551-0.6538-1.541-0.6294l-0.6104,0.0032   l1.6514-2.4783c0.4033-0.6724,0.4082-1.4897,0.0137-2.1875C28.415,2.521,27.5117,2,26.5703,2   c-0.6348,0-1.2314,0.2471-1.6797,0.6958L24.0039,3.582c-0.0537-0.1455-0.1221-0.2871-0.2061-0.4224   C23.3496,2.4336,22.5605,2,21.6885,2c-0.7432,0-1.4346,0.333-1.8984,0.9136l-2.7256,3.415   c-0.71,0.8882-1.0977,2.0034-1.0928,3.1396l0.0134,3.5599c-0.6112,0.62-0.9885,1.4714-0.985,2.4093l0.001,0.1621   c0.0029,0.9121,0.3613,1.7681,1.0088,2.4102c0.0358,0.0355,0.0784,0.0605,0.1155,0.0942c0.1561,0.7336,0.4616,1.3546,0.9392,1.8345   C17.7666,20.6431,18.7461,21,19.9727,21c0.0088,0,0.0186,0,0.0273,0h3.0039c2.5111-0.0107,4.0036-1.5056,3.9958-3.9955L27.8555,17   c1.1992-0.0063,2.1699-0.9863,2.1641-2.1846L30,10.1548z M18.4189,16.9995c-0.002,0-0.0039,0-0.0059,0   c-0.375,0-0.7285-0.1455-0.9941-0.4097c-0.2686-0.2656-0.417-0.6201-0.418-0.9995L17,15.4277   c-0.0029-0.7783,0.6279-1.4146,1.4072-1.418l2.1738-0.0093c0.0029,0,0.0049,0,0.0068,0c0.375,0,0.7285,0.1455,0.9941,0.4097   c0.2686,0.2656,0.417,0.6201,0.418,0.9995l0.001,0.1626c0.0029,0.7783-0.6279,1.4146-1.4063,1.418L18.4189,16.9995z M25,17.0039   c0.0059,1.3931-0.5938,1.9902-2,1.9961h-3.0039c-0.0373-0.0002-0.0682-0.0056-0.1045-0.0067l0.7119-0.0031   c1.8799-0.0083,3.4043-1.5449,3.3975-3.4277L24,15.4004c-0.0029-0.9121-0.3613-1.7681-1.0088-2.4102s-1.5127-0.9668-2.418-0.9897   l-2.1748,0.0093c0,0,0,0-0.001,0c-0.1425,0.0006-0.2781,0.0262-0.416,0.0439L17.9717,9.46   c-0.0029-0.6816,0.2295-1.3506,0.6553-1.8833l2.7256-3.415C21.4346,4.0591,21.5576,4,21.6885,4   c0.1738,0,0.3262,0.0786,0.4082,0.2109c0.0664,0.1069,0.0693,0.2217,0.0088,0.3418l-1,2c-0.2188,0.439-0.0879,0.9717,0.3096,1.2583   c0.3975,0.2871,0.9453,0.2422,1.292-0.104l3.5977-3.5972c0.249-0.2495,0.7031-0.0156,0.8262,0.2031   c0.1055,0.1855,0.0371,0.1333,0.0371,0.1323l-2,3C25.0586,7.6094,25,7.8027,25,8v0.8609c-0.0071,0.0487-0.0285,0.0923-0.0283,0.143   L25,16.0137V17.0039z M27.8457,15L27,15.0044V9.9945l0.8271-0.0043c0.001,0,0.001,0,0.001,0c0.0586,0,0.0986,0.0269,0.1211,0.0498   C27.9727,10.063,28,10.1021,28,10.1621l0.0195,4.6621C28.0195,14.9209,27.9414,14.9995,27.8457,15z M21,23c-0.5527,0-1,0.4478-1,1   v1c0,1.6543-1.3457,3-3,3c-1.1104,0-2.5244-0.2822-3.8535-0.7432C14.2549,26.3779,15,25.291,15,24c0-2.6631-2.5645-4-4-4   s-4,1.3369-4,4c0,1.291,0.7451,2.3779,1.8535,3.2568C7.5244,27.7178,6.1104,28,5,28H3c-0.5527,0-1,0.4478-1,1s0.4473,1,1,1h2   c1.4668,0,3.9004-0.4912,6-1.459C13.0996,29.5088,15.5332,30,17,30c2.7568,0,5-2.2432,5-5v-1C22,23.4478,21.5527,23,21,23z    M11,26.2993C9.8242,25.625,9,24.8164,9,24c0-1.3984,1.5176-2,2-2s2,0.6016,2,2C13,24.8164,12.1758,25.625,11,26.2993z" fill="${impostor.color}"/>
                                </svg>
                            </div>
                        `).join('')}
                    </div>

                    <div style="text-align: center;">
                        <button class="new-game-btn" onclick="startNewImpostorGame()">Nouvelle Partie</button>
                    </div>
                `;

                // Start the animation after DOM update
                setTimeout(animateEjectedImpostors, 100);
            }
            break;

        case 'tasks_completed':
            if (voteTitle) voteTitle.innerHTML = '';
            if (voteInstructions) {
                voteInstructions.innerHTML = '';
            }
            // Remove card background
            const votingAreaTasksComplete = document.querySelector('.voting-area');
            if (votingAreaTasksComplete) votingAreaTasksComplete.style.background = 'transparent';

            if (voteButtons) {
                // Get all impostors with their colors
                const allImpostors = impostorGameState.characters.filter(c => c.isImpostor);

                voteButtons.innerHTML = `
                    <div style="text-align: center; color: #fff; font-size: 2em; margin: 40px 0;">
                        💀 Défaite
                    </div>

                    <!-- Ejected impostors animation overlay -->
                    <div class="ejected-impostor-container">
                        ${allImpostors.map(impostor => `
                            <div class="ejected-impostor">
                                <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M30,10.1548c-0.002-0.5811-0.2305-1.1265-0.6426-1.5352c-0.4131-0.4092-0.9551-0.6538-1.541-0.6294l-0.6104,0.0032   l1.6514-2.4783c0.4033-0.6724,0.4082-1.4897,0.0137-2.1875C28.415,2.521,27.5117,2,26.5703,2   c-0.6348,0-1.2314,0.2471-1.6797,0.6958L24.0039,3.582c-0.0537-0.1455-0.1221-0.2871-0.2061-0.4224   C23.3496,2.4336,22.5605,2,21.6885,2c-0.7432,0-1.4346,0.333-1.8984,0.9136l-2.7256,3.415   c-0.71,0.8882-1.0977,2.0034-1.0928,3.1396l0.0134,3.5599c-0.6112,0.62-0.9885,1.4714-0.985,2.4093l0.001,0.1621   c0.0029,0.9121,0.3613,1.7681,1.0088,2.4102c0.0358,0.0355,0.0784,0.0605,0.1155,0.0942c0.1561,0.7336,0.4616,1.3546,0.9392,1.8345   C17.7666,20.6431,18.7461,21,19.9727,21c0.0088,0,0.0186,0,0.0273,0h3.0039c2.5111-0.0107,4.0036-1.5056,3.9958-3.9955L27.8555,17   c1.1992-0.0063,2.1699-0.9863,2.1641-2.1846L30,10.1548z M18.4189,16.9995c-0.002,0-0.0039,0-0.0059,0   c-0.375,0-0.7285-0.1455-0.9941-0.4097c-0.2686-0.2656-0.417-0.6201-0.418-0.9995L17,15.4277   c-0.0029-0.7783,0.6279-1.4146,1.4072-1.418l2.1738-0.0093c0.0029,0,0.0049,0,0.0068,0c0.375,0,0.7285,0.1455,0.9941,0.4097   c0.2686,0.2656,0.417,0.6201,0.418,0.9995l0.001,0.1626c0.0029,0.7783-0.6279,1.4146-1.4063,1.418L18.4189,16.9995z M25,17.0039   c0.0059,1.3931-0.5938,1.9902-2,1.9961h-3.0039c-0.0373-0.0002-0.0682-0.0056-0.1045-0.0067l0.7119-0.0031   c1.8799-0.0083,3.4043-1.5449,3.3975-3.4277L24,15.4004c-0.0029-0.9121-0.3613-1.7681-1.0088-2.4102s-1.5127-0.9668-2.418-0.9897   l-2.1748,0.0093c0,0,0,0-0.001,0c-0.1425,0.0006-0.2781,0.0262-0.416,0.0439L17.9717,9.46   c-0.0029-0.6816,0.2295-1.3506,0.6553-1.8833l2.7256-3.415C21.4346,4.0591,21.5576,4,21.6885,4   c0.1738,0,0.3262,0.0786,0.4082,0.2109c0.0664,0.1069,0.0693,0.2217,0.0088,0.3418l-1,2c-0.2188,0.439-0.0879,0.9717,0.3096,1.2583   c0.3975,0.2871,0.9453,0.2422,1.292-0.104l3.5977-3.5972c0.249-0.2495,0.7031-0.0156,0.8262,0.2031   c0.1055,0.1855,0.0371,0.1333,0.0371,0.1323l-2,3C25.0586,7.6094,25,7.8027,25,8v0.8609c-0.0071,0.0487-0.0285,0.0923-0.0283,0.143   L25,16.0137V17.0039z M27.8457,15L27,15.0044V9.9945l0.8271-0.0043c0.001,0,0.001,0,0.001,0c0.0586,0,0.0986,0.0269,0.1211,0.0498   C27.9727,10.063,28,10.1021,28,10.1621l0.0195,4.6621C28.0195,14.9209,27.9414,14.9995,27.8457,15z M21,23c-0.5527,0-1,0.4478-1,1   v1c0,1.6543-1.3457,3-3,3c-1.1104,0-2.5244-0.2822-3.8535-0.7432C14.2549,26.3779,15,25.291,15,24c0-2.6631-2.5645-4-4-4   s-4,1.3369-4,4c0,1.291,0.7451,2.3779,1.8535,3.2568C7.5244,27.7178,6.1104,28,5,28H3c-0.5527,0-1,0.4478-1,1s0.4473,1,1,1h2   c1.4668,0,3.9004-0.4912,6-1.459C13.0996,29.5088,15.5332,30,17,30c2.7568,0,5-2.2432,5-5v-1C22,23.4478,21.5527,23,21,23z    M11,26.2993C9.8242,25.625,9,24.8164,9,24c0-1.3984,1.5176-2,2-2s2,0.6016,2,2C13,24.8164,12.1758,25.625,11,26.2993z" fill="${impostor.color}"/>
                                </svg>
                            </div>
                        `).join('')}
                    </div>

                    <div style="text-align: center;">
                        <button class="new-game-btn" onclick="startNewImpostorGame()">Nouvelle Partie</button>
                    </div>
                `;

                // Start the animation after DOM update
                setTimeout(animateEjectedImpostors, 100);
            }
            break;
    }
}

// Update phrase correction display
function updatePhraseCorrectionDisplay() {
    const phraseInput = document.getElementById('phraseInput');

    if (!phraseInput) return;

    // Set the incorrect phrase for Hugo to correct
    if (impostorGameState.currentPhrase && phraseInput.textContent === "") {
        phraseInput.textContent = impostorGameState.currentPhrase;
        // Select all text for easy replacement
        const range = document.createRange();
        range.selectNodeContents(phraseInput);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

// Handle French accent input
function setupAccentInput() {
    const phraseInput = document.getElementById('phraseInput');
    if (!phraseInput) return;

    let lastChar = '';

    phraseInput.addEventListener('input', function(event) {
        let currentValue = this.textContent;
        const selection = window.getSelection();
        let cursorPosition = selection.anchorOffset;

        // Normalize curly quotes to straight quotes
        const normalizedValue = currentValue
            .replace(/'/g, "'")  // Right single quotation mark → apostrophe
            .replace(/'/g, "'")  // Left single quotation mark → apostrophe
            .replace(/"/g, '"')  // Left double quotation mark → quotation mark
            .replace(/"/g, '"'); // Right double quotation mark → quotation mark

        if (normalizedValue !== currentValue) {
            this.textContent = normalizedValue;
            currentValue = normalizedValue;

            // Restore cursor position after normalization
            const range = document.createRange();
            const sel = window.getSelection();
            if (this.firstChild) {
                range.setStart(this.firstChild, Math.min(cursorPosition, normalizedValue.length));
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }

        if (currentValue.length > 0) {
            const currentChar = currentValue.charAt(cursorPosition - 1);

            // Process accent combination
            if (lastChar && (lastChar === "'" || lastChar === "`" || lastChar === "^" || lastChar === '"')) {
                const accentedChar = processAccentInput(currentChar, lastChar);

                if (accentedChar !== currentChar) {
                    // Replace the accent combination with the accented character
                    const newValue = currentValue.substring(0, cursorPosition - 2) +
                                   accentedChar +
                                   currentValue.substring(cursorPosition);

                    this.textContent = newValue;

                    // Restore cursor position
                    const range = document.createRange();
                    const sel = window.getSelection();
                    range.setStart(this.firstChild, cursorPosition - 1);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }

            lastChar = currentChar;
        } else {
            lastChar = '';
        }
    });

    // Disable Enter key completely (no line breaks, no submission)
    phraseInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
        }
    });
}

// Vote for a character in impostor mode
function voteImpostorCharacter(characterId) {
    if (impostorGameState.hasVoted || impostorGameState.gamePhase !== 'voting') return;

    // Call the new hugoVote function which handles Phase 3, 4, and 5
    hugoVote(characterId);
}


// Animate ejected impostors floating across screen
function animateEjectedImpostors() {
    const container = document.querySelector('.ejected-impostor-container');
    if (!container) return;

    const impostorElements = container.querySelectorAll('.ejected-impostor');
    const screenWidth = window.innerWidth;
    const startPositions = [10, 30, 50, 70, 85]; // Vertical positions in %
    const delays = [0, 500, 1000, 1500, 2000]; // Stagger delays in ms

    // Simple constants
    const totalDuration = 60000; // 60 seconds to cross screen
    const rotationPeriod = 5000; // One full rotation every 5 seconds

    impostorElements.forEach((element, index) => {
        const verticalPosition = startPositions[index] || 50;
        const delay = delays[index] || 0;

        // Set initial vertical position
        element.style.top = `${verticalPosition}%`;

        // Start animation after delay
        setTimeout(() => {
            const startTime = performance.now();
            const startX = -100;
            const endX = screenWidth + 100;
            const totalDistance = endX - startX;

            function animate(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / totalDuration, 1);

                // Calculate position (linear interpolation)
                const currentX = startX + (totalDistance * progress);

                // Calculate rotation (one full rotation every 5 seconds, counterclockwise)
                const rotation = -360 * (elapsed / rotationPeriod);

                // Apply transforms
                element.style.transform = `translate(${currentX}px, -50%) rotate(${rotation}deg)`;
                element.style.width = '80px';
                element.style.height = '80px';
                element.style.opacity = 1;

                // Continue animation if not complete
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            }

            requestAnimationFrame(animate);
        }, delay);
    });
}

// Animate victory chase - impostor chasing fleeing crewmate
function animateVictoryChase() {
    const container = document.querySelector('.victory-chase-container');
    if (!container) return;

    const crewmateElement = container.querySelector('.crewmate-chase');
    const impostorElement = container.querySelector('.impostor-chase');
    if (!crewmateElement || !impostorElement) return;

    const screenWidth = window.innerWidth;
    const verticalPosition = 50; // Middle of screen

    // Simple constants
    const totalDuration = 30000; // 30 seconds to cross screen
    const chaseOffset = 150; // Impostor trails behind by 150px

    // Set initial vertical positions
    crewmateElement.style.top = `${verticalPosition}%`;
    impostorElement.style.top = `${verticalPosition}%`;

    const startTime = performance.now();
    const startX = -100;
    const endX = screenWidth + 100 + chaseOffset; // Add offset so impostor fully exits
    const totalDistance = endX - startX;

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / totalDuration, 1);

        // Calculate positions (linear interpolation)
        const crewmateX = startX + (totalDistance * progress);
        const impostorX = crewmateX - chaseOffset; // Impostor trails behind

        // Apply transforms (no rotation, just horizontal movement)
        crewmateElement.style.transform = `translate(${crewmateX}px, -50%)`;
        crewmateElement.style.width = '80px';
        crewmateElement.style.height = '80px';
        crewmateElement.style.opacity = 1;

        impostorElement.style.transform = `translate(${impostorX}px, -50%)`;
        impostorElement.style.width = '80px';
        impostorElement.style.height = '80px';
        impostorElement.style.opacity = 1;

        // Continue animation if not complete
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
}

// Initialize UI event handlers
function initializeImpostorUI() {
    setupAccentInput();
}

// CSS injection for impostor-specific styles removed - now using external CSS file