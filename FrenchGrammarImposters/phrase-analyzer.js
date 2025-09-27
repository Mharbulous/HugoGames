// French Grammar Impostors - Phrase Analyzer Module
// Word-level and character-level analysis for French grammar learning

/**
 * Parses a phrase into words and punctuation
 * @param {string} phrase - Input phrase to parse
 * @returns {{words: string[], punctuation: string}} Parsed components
 */
function parsePhrase(phrase) {
    if (!phrase) return { words: [], punctuation: '' };
    
    // Match ending punctuation (., !, ?, ..., etc.)
    const punctMatch = phrase.match(/([.!?]+|\.{3,})$/);
    const punctuation = punctMatch ? punctMatch[0] : '';
    
    // Remove punctuation and split into words
    const textWithoutPunct = punctuation ? phrase.slice(0, -punctuation.length) : phrase;
    const words = textWithoutPunct.trim().split(/\s+/).filter(w => w.length > 0);
    
    return { words, punctuation };
}

/**
 * Analyzes character differences between two words
 * @param {string} submitted - Submitted word
 * @param {string} correct - Correct word
 * @returns {{type: string, votes: number, positions: Array}} Error analysis
 */
function analyzeWordError(submitted, correct) {
    if (submitted === correct) {
        return { type: 'correct', votes: 0, positions: [] };
    }
    
    const errors = [];
    const maxLen = Math.max(submitted.length, correct.length);
    
    for (let i = 0; i < maxLen; i++) {
        if (submitted[i] !== correct[i]) {
            errors.push({
                pos: i,
                submitted: submitted[i] || '',
                correct: correct[i] || ''
            });
        }
    }
    
    // Special rule: short words (≤3 chars) get 2 votes
    const isShortWord = correct.length <= 3 && submitted.length <= 3;
    const votes = isShortWord || errors.length > 1 ? 2 : 1;
    
    return {
        type: errors.length === 1 ? 'single_char' : 'multiple_char',
        votes,
        positions: errors
    };
}

/**
 * Normalizes a word for semantic comparison (removes punctuation, lowercases)
 * @private
 */
function normalizeWord(word) {
    return word.toLowerCase().replace(/[,.!?;:]/g, '');
}

/**
 * Checks if two words are semantically equivalent (ignoring case/punctuation)
 * @private
 */
function wordsMatch(word1, word2, word1Index, word2Index) {
    const norm1 = normalizeWord(word1);
    const norm2 = normalizeWord(word2);

    if (norm1 !== norm2) {
        return false;
    }

    // Words are semantically the same, check if capitalization context allows match
    const word1IsFirstWord = word1Index === 0;
    const word2IsFirstWord = word2Index === 0;

    // If both are first words or neither are first words, must match exactly
    if (word1IsFirstWord === word2IsFirstWord) {
        return word1 === word2;
    }

    // Different contexts - allow capitalization differences
    // e.g., "lundi" (not first) can match "Lundi" (first)
    return true;
}

/**
 * Creates word correspondences between submission and correct phrase
 * @private
 */
function createWordCorrespondences(subParsed, corrParsed) {
    const subUsed = new Array(subParsed.words.length).fill(false);
    const corrUsed = new Array(corrParsed.words.length).fill(false);
    const correspondences = [];

    // First pass: exact matches
    for (let i = 0; i < subParsed.words.length; i++) {
        if (subUsed[i]) continue;
        for (let j = 0; j < corrParsed.words.length; j++) {
            if (corrUsed[j]) continue;
            if (subParsed.words[i] === corrParsed.words[j]) {
                correspondences.push({ subIndex: i, corrIndex: j, type: 'exact' });
                subUsed[i] = corrUsed[j] = true;
                break;
            }
        }
    }

    // Second pass: semantic matches (case/punctuation differences)
    for (let i = 0; i < subParsed.words.length; i++) {
        if (subUsed[i]) continue;
        for (let j = 0; j < corrParsed.words.length; j++) {
            if (corrUsed[j]) continue;
            if (wordsMatch(subParsed.words[i], corrParsed.words[j], i, j)) {
                const matchType = (subParsed.words[i] === corrParsed.words[j]) ? 'exact' : 'semantic';
                correspondences.push({ subIndex: i, corrIndex: j, type: matchType });
                subUsed[i] = corrUsed[j] = true;
                break;
            }
        }
    }

    return { correspondences, subUsed, corrUsed };
}

/**
 * Main analysis function - compares submission to correct phrase
 * @param {string} submission - Hugo's submitted phrase
 * @param {string} correct - Correct phrase
 * @returns {Object} Complete analysis with categorized errors and vote count
 */
function analyzePhraseComparison(submission, correct) {
    if (!submission && !correct) {
        return createEmptyAnalysis();
    }

    const subParsed = parsePhrase(submission || '');
    const corrParsed = parsePhrase(correct || '');

    const analysis = {
        words: {
            correct: [],
            errors: [],
            missing: [],
            extra: [],
            position: []
        },
        punctuation: null,
        totalVotes: 0,
        displaySegments: []
    };

    // Create semantic word correspondences
    const { correspondences, subUsed, corrUsed } = createWordCorrespondences(subParsed, corrParsed);

    // Process correspondences
    correspondences.forEach(({ subIndex, corrIndex, type }) => {
        const subWord = subParsed.words[subIndex];
        const corrWord = corrParsed.words[corrIndex];

        if (type === 'exact') {
            // Exact match
            analysis.words.correct.push({
                word: subWord,
                position: subIndex
            });
        } else {
            // Semantic match with character differences
            const error = analyzeWordError(subWord, corrWord);
            if (error.votes === 0) {
                // Actually no error (shouldn't happen, but handle gracefully)
                analysis.words.correct.push({
                    word: subWord,
                    position: subIndex
                });
            } else {
                analysis.words.errors.push({
                    submitted: subWord,
                    correct: corrWord,
                    position: subIndex,
                    ...error
                });
                analysis.totalVotes += error.votes;
            }
        }
    });

    // Handle extra words (in submission but not matched)
    subParsed.words.forEach((word, i) => {
        if (!subUsed[i]) {
            analysis.words.extra.push({ word, position: i });
            analysis.totalVotes += 1;
        }
    });

    // Handle missing words (in correct but not matched)
    corrParsed.words.forEach((word, i) => {
        if (!corrUsed[i]) {
            analysis.words.missing.push({ word, position: i });
            analysis.totalVotes += 2;
        }
    });

    // Punctuation analysis
    if (subParsed.punctuation !== corrParsed.punctuation) {
        analysis.punctuation = {
            submitted: subParsed.punctuation,
            correct: corrParsed.punctuation,
            votes: 1
        };
        analysis.totalVotes += 1;
    }

    // Generate display segments
    analysis.displaySegments = generateDisplaySegments(analysis, subParsed, corrParsed);

    return analysis;
}

/**
 * Generates display segments for HTML rendering
 * @private
 */
function generateDisplaySegments(analysis, subParsed, corrParsed) {
    const segments = [];
    const maxPos = Math.max(subParsed.words.length, corrParsed.words.length);
    
    // Create position map for all words
    const posMap = new Map();
    
    // Add segments based on analysis results
    analysis.words.correct.forEach(({word, position}) => {
        posMap.set(position, { type: 'correct', text: word });
    });
    
    analysis.words.errors.forEach(item => {
        posMap.set(item.position, {
            type: item.type === 'single_char' ? 'single_char_error' : 'multiple_char_error',
            text: item.submitted,
            correct: item.correct,
            positions: item.positions
        });
    });
    
    analysis.words.missing.forEach(({word, position}) => {
        if (!posMap.has(position)) {
            posMap.set(position, { type: 'missing', text: word });
        }
    });
    
    analysis.words.position.forEach(({word, submittedPos, correctPos}) => {
        posMap.set(submittedPos, { type: 'position_wrong', text: word });
        if (!posMap.has(correctPos)) {
            posMap.set(correctPos, { type: 'position_correct', text: word });
        }
    });
    
    analysis.words.extra.forEach(({word, position}) => {
        posMap.set(position, { type: 'extra', text: word });
    });
    
    // Convert map to array
    for (let i = 0; i < maxPos; i++) {
        if (posMap.has(i)) segments.push(posMap.get(i));
    }
    
    // Add punctuation segment
    if (analysis.punctuation) {
        segments.push({
            type: 'punctuation_error',
            submitted: analysis.punctuation.submitted,
            correct: analysis.punctuation.correct
        });
    } else if (corrParsed.punctuation) {
        segments.push({
            type: 'punctuation_correct',
            text: corrParsed.punctuation
        });
    }
    
    return segments;
}

/**
 * Creates HTML feedback with appropriate styling
 * @param {string} submission - Hugo's submitted phrase
 * @param {string} correct - Correct phrase
 * @returns {string} HTML string with visual feedback
 */
function createHighlightedFeedback(submission, correct) {
    const analysis = analyzePhraseComparison(submission, correct);
    const html = [];
    
    analysis.displaySegments.forEach((seg, i) => {
        if (i > 0 && seg.type !== 'punctuation_correct' && seg.type !== 'punctuation_error') {
            html.push(' ');
        }
        
        switch (seg.type) {
            case 'correct':
                html.push(seg.text);
                break;
                
            case 'single_char_error':
                html.push(highlightCharErrors(seg.text, seg.correct, seg.positions));
                break;
                
            case 'multiple_char_error':
                html.push(`<span style="color: #ff6b6b;">${seg.text}</span>`);
                break;
                
            case 'missing':
                html.push(`<span style="color: #d3d3d3; text-decoration: underline;">${seg.text}</span>`);
                break;
                
            case 'position_wrong':
                html.push(`<span style="text-decoration: line-through;">${seg.text}</span>`);
                break;
                
            case 'position_correct':
                html.push(`<span style="color: #d3d3d3; text-decoration: underline;">${seg.text}</span>`);
                break;
                
            case 'extra':
                html.push(`<span style="color: #ff6b6b; text-decoration: line-through;">${seg.text}</span>`);
                break;
                
            case 'punctuation_correct':
                html.push(seg.text);
                break;
                
            case 'punctuation_error':
                if (seg.submitted) {
                    html.push(`<span style="color: #ff6b6b;">${seg.submitted}</span>`);
                }
                if (seg.correct && !seg.submitted) {
                    html.push(`<span style="color: #d3d3d3;">${seg.correct}</span>`);
                }
                break;
        }
    });
    
    return html.join('');
}

/**
 * Highlights individual character errors within a word
 * @private
 */
function highlightCharErrors(submitted, correct, positions) {
    const chars = [];
    const errorMap = new Map(positions.map(p => [p.pos, p]));
    
    for (let i = 0; i < Math.max(submitted.length, correct.length); i++) {
        if (errorMap.has(i)) {
            if (submitted[i]) {
                chars.push(`<span style="color: #ff6b6b;">${submitted[i]}</span>`);
            } else {
                chars.push(`<span style="color: #d3d3d3; text-decoration: underline;">${correct[i]}</span>`);
            }
        } else if (submitted[i]) {
            chars.push(submitted[i]);
        }
    }
    
    return chars.join('');
}

/**
 * Calculates accuracy for phrase correction
 * @param {string} submission - Hugo's submitted phrase
 * @param {string} correct - Correct phrase
 * @returns {number} Number of correct characters
 */
function calculatePhraseAccuracy(submission, correct) {
    if (!submission || !correct) return 0;
    
    let correctChars = 0;
    const minLen = Math.min(submission.length, correct.length);
    
    for (let i = 0; i < minLen; i++) {
        if (submission[i] === correct[i]) correctChars++;
    }
    
    return correctChars;
}

/**
 * Gets detailed statistics about the comparison
 * @param {string} submission - Hugo's submitted phrase
 * @param {string} correct - Correct phrase
 * @returns {Object} Statistics with counts and percentages
 */
function getCharacterStats(submission, correct) {
    const analysis = analyzePhraseComparison(submission, correct);
    const corrParsed = parsePhrase(correct || '');
    const subParsed = parsePhrase(submission || '');
    
    const stats = {
        totalCorrect: correct ? correct.length : 0,
        totalSubmitted: submission ? submission.length : 0,
        correctCount: calculatePhraseAccuracy(submission, correct),
        totalVotes: analysis.totalVotes,
        wordAccuracy: corrParsed.words.length ? 
            Math.round((analysis.words.correct.length / corrParsed.words.length) * 100) : 0,
        accuracyPercentage: 0
    };
    
    stats.accuracyPercentage = stats.totalCorrect ? 
        Math.round((stats.correctCount / stats.totalCorrect) * 100) : 0;
    
    return stats;
}

/**
 * Creates an empty analysis result
 * @private
 */
function createEmptyAnalysis() {
    return {
        words: { correct: [], errors: [], missing: [], extra: [], position: [] },
        punctuation: null,
        totalVotes: 0,
        displaySegments: []
    };
}