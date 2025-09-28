// French Grammar Impostors - Streamlined Phrase Analyzer (ES Module)
// Implements specification from phrase_analyzer_spec.md with simplified LCS approach

export class PhraseAnalyzer {
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

        // Get original words with punctuation for display
        const originalSubmittedWords = (submission || '').match(/\S+/g) || [];
        const originalCorrectWords = (correct || '').match(/\S+/g) || [];

        // Phase 1: Word analysis (punctuation stripped)
        const submittedWords = this.tokenize(submission || '');
        const correctWords = this.tokenize(correct || '');

        // Compute word-level alignment using LCS
        const alignment = this.computeAlignment(submittedWords, correctWords);

        // Build analysis from alignment (pass original words for display)
        const analysis = this.buildAnalysis(alignment, submittedWords, correctWords, originalSubmittedWords, originalCorrectWords);

        // Phase 2: Punctuation analysis
        const submittedPunctuation = this.extractPunctuation(submission || '');
        const correctPunctuation = this.extractPunctuation(correct || '');
        const punctuationErrors = this.comparePunctuation(submittedPunctuation, correctPunctuation);

        // Add punctuation errors to analysis (only for actual punctuation mismatches)
        for (const error of punctuationErrors) {
            // Skip if this is just a length difference due to missing/extra words
            if (error.submitted === '' || error.correct === '') {
                continue;
            }

            // Only add punctuation errors if there aren't word-level issues at the same position
            const hasWordError = analysis.displaySegments[error.position] &&
                                analysis.displaySegments[error.position].type !== this.ERROR_TYPES.CORRECT;

            if (!hasWordError) {
                analysis.words.errors.push({
                    type: 'punctuation_error',
                    submitted: error.submitted,
                    correct: error.correct,
                    votes: 1
                });
                analysis.totalVotes += 1;

                // Update display segment for punctuation error
                if (analysis.displaySegments[error.position]) {
                    analysis.displaySegments[error.position].punctuationError = true;
                    analysis.displaySegments[error.position].correctPunctuation = error.correct;
                }
            }
        }

        return analysis;
    }

    /**
     * Strip end punctuation from a word (preserves contractions like don't)
     */
    stripEndPunctuation(word) {
        return word.replace(/[.!?]+$/, '');
    }

    /**
     * Extract punctuation patterns from text for separate analysis
     */
    extractPunctuation(text) {
        const words = text.match(/\S+/g) || [];
        return words.map(word => {
            const match = word.match(/[.!?]+$/);
            return match ? match[0] : '';
        });
    }

    /**
     * Compare punctuation patterns and identify errors
     */
    comparePunctuation(submittedPunctuation, correctPunctuation) {
        const errors = [];
        const maxLen = Math.max(submittedPunctuation.length, correctPunctuation.length);

        for (let i = 0; i < maxLen; i++) {
            const subPunct = submittedPunctuation[i] || '';
            const corrPunct = correctPunctuation[i] || '';

            if (subPunct !== corrPunct) {
                // Only flag as error if there's actual punctuation involved
                if (subPunct || corrPunct) {
                    errors.push({
                        position: i,
                        submitted: subPunct,
                        correct: corrPunct,
                        type: 'punctuation'
                    });
                }
            }
        }

        return errors;
    }

    /**
     * Tokenize text into words, stripping end punctuation for analysis
     */
    tokenize(text) {
        const words = text.match(/\S+/g) || [];
        return words.map(word => this.stripEndPunctuation(word));
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
    buildAnalysis(alignment, submittedWords, correctWords, originalSubmittedWords, originalCorrectWords) {
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
                    availablePositions.includes(item.subIndex) &&
                    item.subIndex !== item.corrIndex;

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
                        text: originalSubmittedWords[item.subIndex] || item.submitted
                    });
                } else {
                    // Correct word in correct position
                    analysis.words.correct.push({
                        word: item.submitted,
                        votes: 0
                    });
                    analysis.displaySegments.push({
                        type: this.ERROR_TYPES.CORRECT,
                        text: originalSubmittedWords[item.subIndex] || item.submitted
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
                        // Find original word with punctuation for the similar word
                        const originalSimilarWord = this.findOriginalWordForSimilar(similarWord, originalSubmittedWords, submittedWords);
                        analysis.displaySegments.push({
                            type: errorAnalysis.type,
                            text: originalSimilarWord,
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
                            text: originalCorrectWords[item.corrIndex] || item.correct
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
                        text: originalSubmittedWords[item.subIndex] || item.submitted
                    });
                }
            }
        }

        return analysis;
    }

    /**
     * Find the original word (with punctuation) that corresponds to a similar word
     */
    findOriginalWordForSimilar(similarWord, originalWords, strippedWords) {
        const index = strippedWords.indexOf(similarWord);
        return index >= 0 ? originalWords[index] : similarWord;
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
        const isShortWord = submitted.length <= 3 || correct.length <= 3;

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
                    // Check if this correct word has a punctuation error
                    if (segment.punctuationError) {
                        html.push(this.highlightPunctuationError(segment.text, segment.correctPunctuation));
                    } else {
                        html.push(segment.text);
                    }
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
     * Highlight punctuation errors within a word
     */
    highlightPunctuationError(wordWithPunctuation, correctPunctuation) {
        // Find where punctuation starts in the word
        const match = wordWithPunctuation.match(/^(.+?)([.!?]*)$/);
        if (!match) return wordWithPunctuation;

        const [, wordPart, currentPunctuation] = match;

        // Highlight the incorrect punctuation
        if (currentPunctuation !== correctPunctuation) {
            return `${wordPart}<span style="color: #ff6b6b;">${currentPunctuation}</span>`;
        }

        return wordWithPunctuation;
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
export function analyzePhraseComparison(submission, correct) {
    return phraseAnalyzer.analyzePhraseComparison(submission, correct);
}

export function createHighlightedFeedback(submission, correct) {
    return phraseAnalyzer.createHighlightedFeedback(submission, correct);
}

export function calculatePhraseAccuracy(submission, correct) {
    return phraseAnalyzer.calculatePhraseAccuracy(submission, correct);
}