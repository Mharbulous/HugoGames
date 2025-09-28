// French Grammar Impostors - Impostor UI Module
// User interface management for impostor mode

// Update main display based on current game state
function updateImpostorDisplay() {
    updateTaskProgressBar();
    updateCharactersDisplay();
    updateGamePhaseDisplay();
    updateTimerDisplay();
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

    const votingDisabled = impostorGameState.gamePhase !== 'emergency_meeting' || impostorGameState.hasVoted;

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
            // Hugo gets normal speech bubble during other phases (like emergency_meeting)
            speechBubbleClass = 'speech-bubble';
            // Use Hugo's submission with highlighted feedback if available, otherwise fallback to character.phrase
            if (impostorGameState.hugoSubmission && impostorGameState.correctPhrase) {
                // Create highlighted feedback showing correct/incorrect characters
                speechContent = createHighlightedFeedback(impostorGameState.hugoSubmission, impostorGameState.correctPhrase);
            } else if (impostorGameState.hugoSubmission) {
                speechContent = impostorGameState.hugoSubmission;
            }
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
        if (impostorGameState.gamePhase === 'phrase_correction' && !character.isImpostor && character.alive && !character.ejected) {
            // Eliminer buttons for crewmates during phrase correction
            buttonContent = `<button class="vote-btn kill-btn" onclick="killCrewmate(${character.id})"><img src="knife.svg" alt="Knife" style="width: 24px; height: 24px; margin-right: 8px; vertical-align: middle;">Éliminer ${character.name}</button>`;
        } else if (impostorGameState.gamePhase === 'phrase_correction' && character.isImpostor && !isHugo && character.alive && !character.ejected) {
            // Saboter buttons for living impostors (except Hugo) during phrase correction
            buttonContent = `<button class="hugo-submit-btn" onclick="submitCorrection()"><img src="sabotage.svg" alt="Sabotage" style="width: 24px; height: 24px; margin-right: 8px; vertical-align: middle;">Saboter</button>`;
        } else if (impostorGameState.gamePhase === 'emergency_meeting' && !impostorGameState.hasVoted && character.alive && !character.ejected && !isHugo) {
            // Vote buttons for all characters except Hugo (Hugo cannot vote for himself)
            buttonContent = `<button class="vote-btn ${votingDisabled ? 'voting-disabled' : ''}"
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

        return `
        <div class="crewmate ${character.alive ? 'alive' : 'dead'} ${character.ejected ? 'ejected' : ''} ${isRecentlyDead ? 'recently-dead' : ''}" data-character-id="${character.id}">
            <div class="crewmate-body" style="--crewmate-color: ${character.color}; background-color: transparent;">
                ${svgContent}
            </div>
            ${hugoTextareaElement}
            ${speechBubbleClass ? `<div class="${speechBubbleClass}">${speechContent}</div>` : ''}
            ${buttonContent}
        </div>
        `;
    }).join('');
}

// Update game phase specific displays
function updateGamePhaseDisplay() {
    const accentHelpCard = document.getElementById('accentHelpCard');
    const killOpportunityArea = document.getElementById('killOpportunityArea');
    const voteTitle = document.getElementById('voteTitle');
    const voteInstructions = document.getElementById('voteInstructions');
    const voteButtons = document.getElementById('voteButtons');

    // Hide all phase-specific areas first
    if (accentHelpCard) accentHelpCard.style.display = 'none';
    if (killOpportunityArea) killOpportunityArea.style.display = 'none';

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

// Update timer displays
function updateTimerDisplay() {
    const killTimer = document.getElementById('killTimer');

    // Update kill timer
    if (killTimer && impostorGameState.gamePhase === 'kill_opportunity') {
        killTimer.textContent = `${Math.ceil(impostorGameState.killWindowTimeLeft)}s`;
        killTimer.style.color = impostorGameState.killWindowTimeLeft <= 5 ? '#ff6b6b' : '#4ecdc4';
    }
}

// Update kill timer display
function updateKillTimerDisplay() {
    updateTimerDisplay();
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

    // Handle Enter key to submit
    phraseInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            submitCorrection();
        }
    });
}

// Vote for a character in impostor mode
function voteImpostorCharacter(characterId) {
    if (impostorGameState.hasVoted || impostorGameState.gamePhase !== 'emergency_meeting') return;

    impostorGameState.hasVoted = true;

    // Process the vote
    setTimeout(() => {
        voteOutCharacter();
    }, 1000);

    updateImpostorDisplay();
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

// CSS injection for impostor-specific styles
function injectImpostorStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Task Progress Bar Styles */
        .task-progress-container {
            width: 100%;
            max-width: 800px;
            margin: 20px auto;
            text-align: center;
        }

        .task-progress-label {
            color: #4ecdc4;
            margin-bottom: 10px;
            font-weight: bold;
            font-size: 1.1em;
        }

        .task-progress-bar {
            width: 100%;
            height: 20px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            border: 2px solid #4ecdc4;
            overflow: hidden;
            margin-bottom: 10px;
        }

        .task-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4ecdc4, #44FFF7);
            transition: width 0.3s ease;
            width: 0%;
        }

        .task-warning {
            color: #ff6b6b;
            font-weight: bold;
            display: none;
        }

        /* Phrase Correction Styles */
        .phrase-correction-area {
            background: rgba(26, 26, 46, 0.9);
            border-radius: 15px;
            padding: 20px;
            margin: 20px auto;
            max-width: 600px;
            border: 3px solid #4ecdc4;
        }

        .correction-title {
            color: #4ecdc4;
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 15px;
            text-align: center;
        }

        .phrase-input-container {
            position: relative;
            margin-bottom: 15px;
        }

        #phraseInput {
            width: 100%;
            min-height: 80px;
            padding: 15px;
            border: 2px solid #4ecdc4;
            border-radius: 10px;
            background: rgba(255,255,255,0.1);
            color: white;
            font-size: 16px;
            resize: vertical;
            font-family: Arial, sans-serif;
        }

        #phraseInput:focus {
            outline: none;
            border-color: #44FFF7;
            box-shadow: 0 0 10px rgba(68, 255, 247, 0.3);
        }

        .input-timer {
            position: absolute;
            top: -10px;
            right: 10px;
            background: rgba(26, 26, 46, 0.9);
            color: #4ecdc4;
            padding: 5px 10px;
            border-radius: 15px;
            font-weight: bold;
            border: 2px solid #4ecdc4;
        }

        .accent-help {
            background: rgba(255,255,255,0.05);
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 15px;
        }

        .accent-help-title {
            color: #44FFF7;
            font-size: 0.9em;
            margin-bottom: 5px;
        }

        .accent-patterns {
            font-size: 0.8em;
            color: #ccc;
        }

        .accent-patterns span {
            margin-right: 15px;
            font-family: monospace;
        }

        .submit-btn {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #4ecdc4, #44FFF7);
            color: #1a1a2e;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
        }

        .submit-btn:hover {
            transform: translateY(-2px);
        }

        /* Kill Opportunity Styles */
        .kill-opportunity-area {
            background: rgba(255, 107, 107, 0.2);
            border: 3px solid #ff6b6b;
            border-radius: 15px;
            padding: 20px;
            margin: 20px auto;
            max-width: 600px;
            text-align: center;
        }

        .kill-title {
            color: #ff6b6b;
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .kill-instructions {
            color: white;
            margin-bottom: 15px;
        }

        .kill-timer {
            color: #ff6b6b;
            font-size: 1.2em;
            font-weight: bold;
        }

        .kill-btn {
            background: linear-gradient(135deg, #ff6b6b, #ff4757);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 8px 15px;
            margin-top: 10px;
            cursor: pointer;
            font-weight: bold;
            transition: transform 0.2s;
        }

        .kill-btn:hover {
            transform: translateY(-2px);
        }

        /* Character-specific styles */
        .hugo-character {
            border-color: #F5F5F5 !important;
            box-shadow: 0 0 15px rgba(245, 245, 245, 0.3);
        }

        .impostor-character .crewmate-body {
            border: 3px solid #ff6b6b;
        }

        .dead-crewmate-display {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            margin: 10px 0;
        }

        .dead-crewmate-body-small {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }
    `;
    document.head.appendChild(style);
}