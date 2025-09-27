// French Grammar Impostors - Phrase Analyzer Module
// Centralized logic for character comparison, error detection, and feedback generation

/**
 * Analyzes character-by-character comparison between submission and correct phrase
 * @param {string} submission - Hugo's submitted phrase
 * @param {string} correct - The correct phrase
 * @returns {Object} Analysis object with categorized character data
 */
function analyzePhraseComparison(submission, correct) {
    if (!submission || !correct) {
        return {
            correct: [],
            wrong: [],
            missing: [],
            extra: [],
            positions: []
        };
    }

    const analysis = {
        correct: [],
        wrong: [],
        missing: [],
        extra: [],
        positions: [] // Array of position objects with type and character info
    };

    const maxLength = Math.max(submission.length, correct.length);

    for (let i = 0; i < maxLength; i++) {
        const submissionChar = submission[i] || '';
        const correctChar = correct[i] || '';

        if (submissionChar === correctChar && submissionChar !== '') {
            // Character is correct
            analysis.correct.push({ position: i, char: submissionChar });
            analysis.positions.push({
                position: i,
                type: 'correct',
                submissionChar,
                correctChar
            });
        } else if (submissionChar && correctChar && submissionChar !== correctChar) {
            // Character is wrong (different character in same position)
            analysis.wrong.push({ position: i, submitted: submissionChar, correct: correctChar });
            analysis.positions.push({
                position: i,
                type: 'wrong',
                submissionChar,
                correctChar
            });
        } else if (!submissionChar && correctChar) {
            // Character is missing (Hugo didn't include this character)
            analysis.missing.push({ position: i, char: correctChar });
            analysis.positions.push({
                position: i,
                type: 'missing',
                submissionChar: '',
                correctChar
            });
        } else if (submissionChar && !correctChar) {
            // Character is extra (Hugo added character that shouldn't be there)
            analysis.extra.push({ position: i, char: submissionChar });
            analysis.positions.push({
                position: i,
                type: 'extra',
                submissionChar,
                correctChar: ''
            });
        }
    }

    return analysis;
}

/**
 * Creates highlighted HTML feedback for visual display
 * @param {string} submission - Hugo's submitted phrase
 * @param {string} correct - The correct phrase
 * @returns {string} HTML string with styled feedback
 */
function createHighlightedFeedback(submission, correct) {
    if (!submission || !correct) return submission || '';

    const analysis = analyzePhraseComparison(submission, correct);
    let result = '';

    for (const position of analysis.positions) {
        switch (position.type) {
            case 'correct':
                // Character is correct - display in normal black
                result += position.submissionChar;
                break;
            case 'wrong':
                // Character is wrong - display Hugo's character in red
                result += `<span style="color: #ff6b6b;">${position.submissionChar}</span>`;
                break;
            case 'missing':
                // Character is missing - display correct character in light gray with underline
                result += `<span style="color: #d3d3d3; text-decoration: underline; text-decoration-color: #d3d3d3;">${position.correctChar}</span>`;
                break;
            case 'extra':
                // Extra character - display Hugo's character in red
                result += `<span style="color: #ff6b6b;">${position.submissionChar}</span>`;
                break;
        }
    }

    return result;
}

/**
 * Calculates phrase accuracy (character-by-character matching)
 * @param {string} submission - Hugo's submitted phrase
 * @param {string} correct - The correct phrase
 * @returns {number} Number of correct characters
 */
function calculatePhraseAccuracy(submission, correct) {
    if (!submission || !correct) return 0;

    const analysis = analyzePhraseComparison(submission, correct);
    return analysis.correct.length;
}

/**
 * Gets detailed statistics about the phrase comparison
 * @param {string} submission - Hugo's submitted phrase
 * @param {string} correct - The correct phrase
 * @returns {Object} Statistics object with counts and percentages
 */
function getCharacterStats(submission, correct) {
    if (!submission || !correct) {
        return {
            totalCorrect: correct ? correct.length : 0,
            totalSubmitted: submission ? submission.length : 0,
            correctCount: 0,
            wrongCount: 0,
            missingCount: 0,
            extraCount: 0,
            accuracyPercentage: 0
        };
    }

    const analysis = analyzePhraseComparison(submission, correct);
    const totalCorrect = correct.length;
    const correctCount = analysis.correct.length;

    return {
        totalCorrect,
        totalSubmitted: submission.length,
        correctCount,
        wrongCount: analysis.wrong.length,
        missingCount: analysis.missing.length,
        extraCount: analysis.extra.length,
        accuracyPercentage: totalCorrect > 0 ? Math.round((correctCount / totalCorrect) * 100) : 0
    };
}

/**
 * Validates if a phrase correction meets quality standards
 * @param {string} submission - Hugo's submitted phrase
 * @param {string} correct - The correct phrase
 * @param {number} threshold - Minimum accuracy percentage (0-100)
 * @returns {Object} Validation result with pass/fail and details
 */
function validatePhraseCorrection(submission, correct, threshold = 80) {
    const stats = getCharacterStats(submission, correct);
    const passed = stats.accuracyPercentage >= threshold;

    return {
        passed,
        accuracyPercentage: stats.accuracyPercentage,
        threshold,
        details: {
            correctChars: stats.correctCount,
            totalChars: stats.totalCorrect,
            errors: stats.wrongCount + stats.missingCount + stats.extraCount
        },
        feedback: passed
            ? "Excellente correction!"
            : `Amélioration nécessaire (${stats.accuracyPercentage}% < ${threshold}%)`
    };
}

/**
 * Gets a detailed breakdown of errors for educational feedback
 * @param {string} submission - Hugo's submitted phrase
 * @param {string} correct - The correct phrase
 * @returns {Object} Educational feedback object
 */
function getEducationalFeedback(submission, correct) {
    const analysis = analyzePhraseComparison(submission, correct);
    const stats = getCharacterStats(submission, correct);

    const feedback = {
        summary: `${stats.correctCount}/${stats.totalCorrect} caractères corrects`,
        errors: [],
        suggestions: []
    };

    // Add specific error feedback
    if (analysis.wrong.length > 0) {
        feedback.errors.push(`${analysis.wrong.length} caractère(s) incorrect(s)`);
        feedback.suggestions.push("Vérifiez l'orthographe et les accents");
    }

    if (analysis.missing.length > 0) {
        feedback.errors.push(`${analysis.missing.length} caractère(s) manquant(s)`);
        feedback.suggestions.push("Relisez attentivement la phrase complète");
    }

    if (analysis.extra.length > 0) {
        feedback.errors.push(`${analysis.extra.length} caractère(s) en trop`);
        feedback.suggestions.push("Supprimez les caractères superflus");
    }

    return feedback;
}