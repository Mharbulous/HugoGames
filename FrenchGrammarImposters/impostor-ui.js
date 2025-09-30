// French Grammar Impostors - Impostor UI Module
// User interface management for impostor mode

// Update main display based on current game state
function updateImpostorDisplay() {
    updateTaskProgressBar();
    updateCharactersDisplay();
    updateGamePhaseDisplay();
    scrollToHugo();

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

    // Always show task progress bar
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
        } else if (impostorGameState.gamePhase === 'phrase_correction' && character.isImpostor && !isHugo && character.alive && !character.ejected && !impostorGameState.actionInProgress) {
            // Saboter buttons for living impostors (except Hugo) during phrase correction
            buttonContent = `<button class="hugo-submit-btn" onclick="submitCorrection()"><img src="images/sabotage.svg" alt="Sabotage" style="width: 24px; height: 24px; margin-right: 8px; vertical-align: middle;">Saboter</button>`;
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
    const accentHelpCard = document.getElementById('accentHelpCard');
    const voteTitle = document.getElementById('voteTitle');
    const voteInstructions = document.getElementById('voteInstructions');
    const voteButtons = document.getElementById('voteButtons');

    // Hide all phase-specific areas first
    if (accentHelpCard) accentHelpCard.style.display = 'none';

    switch (impostorGameState.gamePhase) {
        case 'phrase_correction':
            updatePhraseCorrectionDisplay();
            if (accentHelpCard) accentHelpCard.style.display = 'block';
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
            if (voteTitle) voteTitle.innerHTML = '🎉 Victoire des Imposteurs ! 🎉';
            if (voteInstructions) {
                voteInstructions.innerHTML = 'Hugo et les imposteurs ont éliminé tous les membres d\'équipage !';
            }
            if (voteButtons) {
                voteButtons.innerHTML = `
                    <div class="victory-message">
                        <h2 style="color: #ff6b6b; margin: 0;">🎉 Victory!</h2>
                        <p style="color: #fff; margin: 10px 0;">Vous avez réussi à éliminer tous les membres d'équipage !</p>
                        <button class="new-game-btn" onclick="startNewImpostorGame()">Nouvelle Partie</button>
                    </div>
                `;
            }
            break;

        case 'game_over':
            if (voteTitle) voteTitle.innerHTML = '💀 Game Over 💀';
            if (voteInstructions) {
                voteInstructions.innerHTML = 'Hugo a été éjecté ! Les membres d\'équipage ont gagné.';
            }
            if (voteButtons) {
                voteButtons.innerHTML = `
                    <div class="defeat-message">
                        <h2 style="color: #ff6b6b; margin: 0;">💀 Défaite !</h2>
                        <p style="color: #fff; margin: 10px 0;">Vous avez été éjecté ! Améliorez votre français pour la prochaine fois.</p>
                        <button class="new-game-btn" onclick="startNewImpostorGame()">Nouvelle Partie</button>
                    </div>
                `;
            }
            break;

        case 'tasks_completed':
            if (voteTitle) voteTitle.innerHTML = '⏰ Temps écoulé ! ⏰';
            if (voteInstructions) {
                voteInstructions.innerHTML = 'Les membres d\'équipage ont terminé leurs tâches ! Hugo a perdu.';
            }
            if (voteButtons) {
                voteButtons.innerHTML = `
                    <div class="defeat-message">
                        <h2 style="color: #ff6b6b; margin: 0;">⏰ Temps écoulé !</h2>
                        <p style="color: #fff; margin: 10px 0;">Les tâches ont été terminées ! Soyez plus rapide la prochaine fois.</p>
                        <button class="new-game-btn" onclick="startNewImpostorGame()">Nouvelle Partie</button>
                    </div>
                `;
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


// Scroll to center Hugo's character
function scrollToHugo() {
    const hugoElement = document.querySelector(`[data-character-id="${impostorGameState.hugoId}"]`);
    if (hugoElement) {
        hugoElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
        });
    }
}

// Handle French accent input
function setupAccentInput() {
    const phraseInput = document.getElementById('phraseInput');
    if (!phraseInput) return;

    let lastChar = '';

    phraseInput.addEventListener('input', function(event) {
        const currentValue = this.textContent;
        const selection = window.getSelection();
        const cursorPosition = selection.anchorOffset;

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

// Handle window resize to maintain Hugo centering
function setupWindowResize() {
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(scrollToHugo, 250);
    });
}

// Initialize UI event handlers
function initializeImpostorUI() {
    setupAccentInput();
    setupWindowResize();
}

// CSS injection for impostor-specific styles removed - now using external CSS file