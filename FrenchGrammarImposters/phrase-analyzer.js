// French Grammar Impostors - Streamlined Phrase Analyzer
// Implements specification from phrase_analyzer_spec.md with simplified LCS approach

class PhraseAnalyzer {
    constructor() {
        // Error type constants matching spec
        this.ERROR_TYPES = {
            CORRECT: 'correct',
            SINGLE_CHAR: 'single_char_error',
            MULTIPLE_CHAR: 'multiple_char_error', 
            MISSING: 'missing',
            POSITION: 'position',
            EXTRA: 'extra'
        };
    }

    /**
     * Main analysis function - compares submission against correct phrase
     * @param {string} submission - User's submitted phrase
     * @param {string} correct - Correct phrase
     * @returns {Object} Analysis with categorized errors and vote count
     */
    analyzePhraseComparison(submission, correct) {
        if (!submission && !correct) {
            return this.createEmptyAnalysis();
        }

        // Tokenize both phrases
        const submittedWords = this.tokenize(submission || '');
        const correctWords = this.tokenize(correct || '');
        
        // Compute word-level alignment using LCS
        const alignment = this.computeAlignment(submittedWords, correctWords);
        
        // Build analysis from alignment
        const analysis = this.buildAnalysis(alignment, submittedWords, correctWords);
        
        return analysis;
    }

    /**
     * Tokenize text into words, preserving French contractions
     */
    tokenize(text) {
        return text.match(/\S+/g) || [];
    }

    /**
     * Compute optimal alignment between two word sequences using LCS
     */
    computeAlignment(submitted, correct) {
        const m = submitted.length;
        const n = correct.length;
        
        // Build LCS table
        const lcs = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
        
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (this.wordsMatch(submitted[i-1], correct[j-1])) {
                    lcs[i][j] = lcs[i-1][j-1] + 1;
                } else {
                    lcs[i][j] = Math.max(lcs[i-1][j], lcs[i][j-1]);
                }
            }
        }
        
        // Trace back to find alignment
        const alignment = [];
        let i = m, j = n;
        
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && this.wordsMatch(submitted[i-1], correct[j-1])) {
                alignment.unshift({
                    type: 'match',
                    submitted: submitted[i-1],
                    correct: correct[j-1],
                    subIndex: i-1,
                    corrIndex: j-1
                });
                i--; j--;
            } else if (j > 0 && (i === 0 || lcs[i][j-1] >= lcs[i-1][j])) {
                alignment.unshift({
                    type: 'missing',
                    correct: correct[j-1],
                    corrIndex: j-1
                });
                j--;
            } else {
                alignment.unshift({
                    type: 'extra',
                    submitted: submitted[i-1],
                    subIndex: i-1
                });
                i--;
            }
        }
        
        return alignment;
    }

    /**
     * Check if two words match (exact match required per spec)
     */
    wordsMatch(word1, word2) {
        return word1 === word2;
    }

    /**
     * Build analysis from alignment, checking for position and character errors
     */
    buildAnalysis(alignment, submittedWords, correctWords) {
        const analysis = {
            words: { correct: [], errors: [], missing: [], extra: [] },
            totalVotes: 0,
            displaySegments: []
        };

        // Create maps for position error detection
        const submittedSet = new Map();
        submittedWords.forEach((word, idx) => {
            if (!submittedSet.has(word)) submittedSet.set(word, []);
            submittedSet.get(word).push(idx);
        });

        for (const item of alignment) {
            if (item.type === 'match') {
                // Check if it's in the correct position or a position error
                const availablePositions = submittedSet.get(item.submitted);
                const isPositionError = availablePositions && 
                    availablePositions.length > 1 && 
                    availablePositions[0] !== item.subIndex;
                
                if (isPositionError) {
                    // Position error - 1 vote
                    analysis.words.errors.push({
                        type: this.ERROR_TYPES.POSITION,
                        submitted: item.submitted,
                        correct: item.correct,
                        votes: 1
                    });
                    analysis.totalVotes += 1;
                    analysis.displaySegments.push({
                        type: this.ERROR_TYPES.POSITION,
                        text: item.submitted
                    });
                } else {
                    // Correct word in correct position
                    analysis.words.correct.push({
                        word: item.submitted,
                        votes: 0
                    });
                    analysis.displaySegments.push({
                        type: this.ERROR_TYPES.CORRECT,
                        text: item.submitted
                    });
                }
            } else if (item.type === 'missing') {
                // Check if this word exists elsewhere (position error) or is truly missing
                const existsElsewhere = submittedWords.includes(item.correct);
                
                if (existsElsewhere) {
                    // It's a position error, will be handled when we encounter it
                    continue;
                } else {
                    // Check if there's a similar word (character-level error)
                    const similarWord = this.findSimilarWord(item.correct, alignment, item.corrIndex);
                    
                    if (similarWord) {
                        const errorAnalysis = this.analyzeWordError(similarWord, item.correct);
                        analysis.words.errors.push(errorAnalysis);
                        analysis.totalVotes += errorAnalysis.votes;
                        analysis.displaySegments.push({
                            type: errorAnalysis.type,
                            text: similarWord,
                            correct: item.correct,
                            errorPositions: errorAnalysis.errorPositions
                        });
                    } else {
                        // Truly missing - 2 votes
                        analysis.words.missing.push({
                            word: item.correct,
                            votes: 2
                        });
                        analysis.totalVotes += 2;
                        analysis.displaySegments.push({
                            type: this.ERROR_TYPES.MISSING,
                            text: item.correct
                        });
                    }
                }
            } else if (item.type === 'extra') {
                // Check if it's similar to a missing word
                const similarCorrect = this.findSimilarCorrectWord(item.submitted, alignment, item.subIndex);
                
                if (similarCorrect) {
                    // Already handled in missing section
                    continue;
                } else {
                    // Truly extra - 1 vote
                    analysis.words.extra.push({
                        word: item.submitted,
                        votes: 1
                    });
                    analysis.totalVotes += 1;
                    analysis.displaySegments.push({
                        type: this.ERROR_TYPES.EXTRA,
                        text: item.submitted
                    });
                }
            }
        }

        return analysis;
    }

    /**
     * Find a submitted word that might be a misspelling of a correct word
     */
    findSimilarWord(correctWord, alignment, corrIndex) {
        // Look for nearby extra words that might be misspellings
        for (let i = Math.max(0, corrIndex - 2); i <= Math.min(alignment.length - 1, corrIndex + 2); i++) {
            if (alignment[i].type === 'extra') {
                const similarity = this.calculateSimilarity(alignment[i].submitted, correctWord);
                if (similarity > 0.5) {
                    return alignment[i].submitted;
                }
            }
        }
        return null;
    }

    /**
     * Find a correct word that might match an extra submitted word
     */
    findSimilarCorrectWord(submittedWord, alignment, subIndex) {
        for (let i = Math.max(0, subIndex - 2); i <= Math.min(alignment.length - 1, subIndex + 2); i++) {
            if (alignment[i].type === 'missing') {
                const similarity = this.calculateSimilarity(submittedWord, alignment[i].correct);
                if (similarity > 0.5) {
                    return alignment[i].correct;
                }
            }
        }
        return null;
    }

    /**
     * Calculate similarity between two words (0 to 1)
     */
    calculateSimilarity(word1, word2) {
        if (!word1 || !word2) return 0;
        const maxLen = Math.max(word1.length, word2.length);
        let matches = 0;
        const minLen = Math.min(word1.length, word2.length);
        
        for (let i = 0; i < minLen; i++) {
            if (word1[i] === word2[i]) matches++;
        }
        
        return matches / maxLen;
    }

    /**
     * Analyze character-level errors within a word
     * Implements rules from phrase_analyzer_spec.md
     */
    analyzeWordError(submitted, correct) {
        const errors = [];
        const maxLen = Math.max(submitted.length, correct.length);
        
        for (let i = 0; i < maxLen; i++) {
            if ((submitted[i] || '') !== (correct[i] || '')) {
                errors.push({
                    position: i,
                    submitted: submitted[i] || '',
                    correct: correct[i] || ''
                });
            }
        }

        // Apply short word exception (≤3 characters)
        const isShortWord = submitted.length <= 3 && correct.length <= 3;
        
        if (errors.length === 0) {
            return { type: this.ERROR_TYPES.CORRECT, word: submitted, votes: 0 };
        } else if (errors.length === 1 && !isShortWord) {
            return {
                type: this.ERROR_TYPES.SINGLE_CHAR,
                submitted: submitted,
                correct: correct,
                votes: 1,
                errorPositions: errors
            };
        } else {
            return {
                type: this.ERROR_TYPES.MULTIPLE_CHAR,
                submitted: submitted,
                correct: correct,
                votes: 2,
                errorPositions: errors
            };
        }
    }

    /**
     * Create HTML feedback with proper styling per spec
     */
    createHighlightedFeedback(submission, correct) {
        const analysis = this.analyzePhraseComparison(submission, correct);
        const html = [];
        
        for (let i = 0; i < analysis.displaySegments.length; i++) {
            const segment = analysis.displaySegments[i];
            if (i > 0) html.push(' ');
            
            switch (segment.type) {
                case this.ERROR_TYPES.CORRECT:
                    html.push(segment.text);
                    break;
                case this.ERROR_TYPES.SINGLE_CHAR:
                    html.push(this.highlightCharacterErrors(segment.text, segment.correct, segment.errorPositions));
                    break;
                case this.ERROR_TYPES.MULTIPLE_CHAR:
                    html.push(`<span style="color: #ff6b6b;">${segment.text}</span>`);
                    break;
                case this.ERROR_TYPES.MISSING:
                    html.push(`<span style="color: #d3d3d3; text-decoration: underline;">${segment.text}</span>`);
                    break;
                case this.ERROR_TYPES.POSITION:
                    html.push(`<span style="text-decoration: line-through;">${segment.text}</span>`);
                    break;
                case this.ERROR_TYPES.EXTRA:
                    html.push(`<span style="color: #ff6b6b; text-decoration: line-through;">${segment.text}</span>`);
                    break;
            }
        }
        
        return html.join('');
    }

    /**
     * Highlight individual character errors within a word
     */
    highlightCharacterErrors(submitted, correct, errorPositions) {
        if (!errorPositions || errorPositions.length === 0) return submitted;
        
        let result = '';
        const errorMap = new Map(errorPositions.map(err => [err.position, err]));
        
        for (let i = 0; i < submitted.length; i++) {
            if (errorMap.has(i)) {
                result += `<span style="color: #ff6b6b;">${submitted[i]}</span>`;
            } else {
                result += submitted[i];
            }
        }
        
        return result;
    }

    /**
     * Calculate character-by-character accuracy
     */
    calculatePhraseAccuracy(submission, correct) {
        if (!submission || !correct) return 0;
        
        let correctChars = 0;
        const minLen = Math.min(submission.length, correct.length);
        
        for (let i = 0; i < minLen; i++) {
            if (submission[i] === correct[i]) correctChars++;
        }
        
        return correctChars;
    }

    createEmptyAnalysis() {
        return {
            words: { correct: [], errors: [], missing: [], extra: [] },
            totalVotes: 0,
            displaySegments: []
        };
    }
}

// Create singleton instance
const phraseAnalyzer = new PhraseAnalyzer();

// Export backward-compatible API
function analyzePhraseComparison(submission, correct) {
    return phraseAnalyzer.analyzePhraseComparison(submission, correct);
}

function createHighlightedFeedback(submission, correct) {
    return phraseAnalyzer.createHighlightedFeedback(submission, correct);
}

function calculatePhraseAccuracy(submission, correct) {
    return phraseAnalyzer.calculatePhraseAccuracy(submission, correct);
}

// Module exports for both CommonJS and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { analyzePhraseComparison, createHighlightedFeedback, calculatePhraseAccuracy };
}
// Streamlined from 612 lines to 288 lines on 2025-09-27