// French Grammar Impostors - Streamlined Phrase Analyzer
// Fixed to handle all test cases correctly

class PhraseAnalyzer {
    constructor() {
        this.ERROR_TYPES = {
            CORRECT: 'correct',
            SINGLE_CHAR: 'single_char_error',
            MULTIPLE_CHAR: 'multiple_char_error',
            MISSING: 'missing',
            POSITION: 'position',
            EXTRA: 'extra'
        };
    }

    analyzePhraseComparison(submission, correct) {
        if (!submission && !correct) return this.createEmptyAnalysis();

        const originalSubmittedWords = (submission || '').match(/\S+/g) || [];
        const originalCorrectWords = (correct || '').match(/\S+/g) || [];
        const submittedWords = this.tokenize(submission || '');
        const correctWords = this.tokenize(correct || '');

        const alignment = this.computeAlignment(submittedWords, correctWords);
        const analysis = this.buildAnalysis(alignment, submittedWords, correctWords, originalSubmittedWords, originalCorrectWords);

        // Add punctuation analysis
        const submittedPunctuation = this.extractPunctuation(submission || '');
        const correctPunctuation = this.extractPunctuation(correct || '');
        const punctuationErrors = this.comparePunctuation(submittedPunctuation, correctPunctuation);

        for (const error of punctuationErrors) {
            if (error.submitted === '' || error.correct === '') continue;
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
                if (analysis.displaySegments[error.position]) {
                    analysis.displaySegments[error.position].punctuationError = true;
                    analysis.displaySegments[error.position].correctPunctuation = error.correct;
                }
            }
        }

        return analysis;
    }

    stripEndPunctuation(word) {
        return word.replace(/[.!?]+$/, '');
    }

    extractPunctuation(text) {
        const words = text.match(/\S+/g) || [];
        return words.map(word => {
            const match = word.match(/[.!?]+$/);
            return match ? match[0] : '';
        });
    }

    comparePunctuation(submittedPunctuation, correctPunctuation) {
        const errors = [];
        const maxLen = Math.max(submittedPunctuation.length, correctPunctuation.length);
        for (let i = 0; i < maxLen; i++) {
            const subPunct = submittedPunctuation[i] || '';
            const corrPunct = correctPunctuation[i] || '';
            if (subPunct !== corrPunct && (subPunct || corrPunct)) {
                errors.push({ position: i, submitted: subPunct, correct: corrPunct, type: 'punctuation' });
            }
        }
        return errors;
    }

    tokenize(text) {
        const words = text.match(/\S+/g) || [];
        return words.map(word => this.stripEndPunctuation(word));
    }

    computeAlignment(submitted, correct) {
        const m = submitted.length;
        const n = correct.length;
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

    wordsMatch(word1, word2) {
        return word1 === word2;
    }

    buildAnalysis(alignment, submittedWords, correctWords, originalSubmittedWords, originalCorrectWords) {
        const analysis = {
            words: { correct: [], errors: [], missing: [], extra: [] },
            totalVotes: 0,
            displaySegments: []
        };

        // Build word position map for detecting true position errors
        const correctWordPositions = new Map();
        correctWords.forEach((word, idx) => {
            if (!correctWordPositions.has(word)) correctWordPositions.set(word, []);
            correctWordPositions.get(word).push(idx);
        });

        this.buildDisplaySegments(alignment, submittedWords, correctWords, originalSubmittedWords, originalCorrectWords, analysis, correctWordPositions);
        return analysis;
    }

    buildDisplaySegments(alignment, submittedWords, correctWords, originalSubmittedWords, originalCorrectWords, analysis, correctWordPositions) {
        const segments = [];
        const processedSubIndices = new Set();
        const processedCorrIndices = new Set();

        // First pass: process alignment and determine segment types
        for (let idx = 0; idx < alignment.length; idx++) {
            const item = alignment[idx];
            
            if (item.type === 'match') {
                // Check if word appears elsewhere in correct phrase (true position error)
                const correctPositions = correctWordPositions.get(item.submitted) || [];
                const isPositionError = correctPositions.length > 1 && item.subIndex !== item.corrIndex;
                
                if (isPositionError) {
                    segments.push({
                        type: this.ERROR_TYPES.POSITION,
                        text: originalSubmittedWords[item.subIndex],
                        index: item.subIndex
                    });
                    analysis.words.errors.push({
                        type: this.ERROR_TYPES.POSITION,
                        submitted: item.submitted,
                        correct: item.correct,
                        votes: 1
                    });
                    analysis.totalVotes += 1;
                } else {
                    segments.push({
                        type: this.ERROR_TYPES.CORRECT,
                        text: originalSubmittedWords[item.subIndex],
                        index: item.subIndex
                    });
                    analysis.words.correct.push({ word: item.submitted, votes: 0 });
                }
                processedSubIndices.add(item.subIndex);
                processedCorrIndices.add(item.corrIndex);
                
            } else if (item.type === 'extra' && item.type === 'missing') {
                // Check for character-level error between extra and missing at same position
                const extraItem = alignment[idx];
                const missingItem = alignment[idx + 1];
                
                if (extraItem && missingItem && 
                    extraItem.type === 'extra' && missingItem.type === 'missing' &&
                    Math.abs((extraItem.subIndex || idx) - (missingItem.corrIndex || idx)) <= 1) {
                    
                    const errorAnalysis = this.analyzeWordError(
                        submittedWords[extraItem.subIndex],
                        correctWords[missingItem.corrIndex]
                    );
                    
                    segments.push({
                        type: errorAnalysis.type,
                        text: originalSubmittedWords[extraItem.subIndex],
                        correct: originalCorrectWords[missingItem.corrIndex],
                        errorPositions: errorAnalysis.errorPositions,
                        index: extraItem.subIndex
                    });
                    
                    analysis.words.errors.push(errorAnalysis);
                    analysis.totalVotes += errorAnalysis.votes;
                    
                    processedSubIndices.add(extraItem.subIndex);
                    processedCorrIndices.add(missingItem.corrIndex);
                    idx++; // Skip the missing item we just processed
                }
            }
        }

        // Second pass: handle remaining unprocessed items
        alignment.forEach((item, idx) => {
            if (item.type === 'extra' && item.subIndex !== undefined && !processedSubIndices.has(item.subIndex)) {
                // Check if this could be a character error with a nearby missing word
                let foundMatch = false;
                
                for (let j = Math.max(0, idx - 2); j <= Math.min(alignment.length - 1, idx + 2); j++) {
                    const other = alignment[j];
                    if (other.type === 'missing' && !processedCorrIndices.has(other.corrIndex)) {
                        const similarity = this.calculateSimilarity(
                            submittedWords[item.subIndex],
                            correctWords[other.corrIndex]
                        );
                        
                        if (similarity > 0.3) { // Lower threshold to catch more errors
                            const errorAnalysis = this.analyzeWordError(
                                submittedWords[item.subIndex],
                                correctWords[other.corrIndex]
                            );
                            
                            segments.push({
                                type: errorAnalysis.type,
                                text: originalSubmittedWords[item.subIndex],
                                correct: originalCorrectWords[other.corrIndex],
                                errorPositions: errorAnalysis.errorPositions,
                                index: item.subIndex
                            });
                            
                            analysis.words.errors.push(errorAnalysis);
                            analysis.totalVotes += errorAnalysis.votes;
                            
                            processedSubIndices.add(item.subIndex);
                            processedCorrIndices.add(other.corrIndex);
                            foundMatch = true;
                            break;
                        }
                    }
                }
                
                if (!foundMatch) {
                    segments.push({
                        type: this.ERROR_TYPES.EXTRA,
                        text: originalSubmittedWords[item.subIndex],
                        index: item.subIndex
                    });
                    analysis.words.extra.push({ word: item.submitted, votes: 1 });
                    analysis.totalVotes += 1;
                    processedSubIndices.add(item.subIndex);
                }
            }
            
            if (item.type === 'missing' && !processedCorrIndices.has(item.corrIndex)) {
                segments.push({
                    type: this.ERROR_TYPES.MISSING,
                    text: originalCorrectWords[item.corrIndex],
                    index: item.corrIndex,
                    isMissing: true
                });
                analysis.words.missing.push({ word: item.correct, votes: 2 });
                analysis.totalVotes += 2;
                processedCorrIndices.add(item.corrIndex);
            }
        });

        // Sort segments and merge missing words
        segments.sort((a, b) => {
            const aIndex = a.isMissing ? a.index : a.index;
            const bIndex = b.isMissing ? b.index : b.index;
            if (Math.abs(aIndex - bIndex) < 0.5) {
                return a.isMissing ? 1 : -1;
            }
            return aIndex - bIndex;
        });

        // Merge consecutive missing words
        const mergedSegments = [];
        let missingGroup = [];
        
        for (const segment of segments) {
            if (segment.type === this.ERROR_TYPES.MISSING) {
                missingGroup.push(segment.text);
            } else {
                if (missingGroup.length > 0) {
                    mergedSegments.push({
                        type: this.ERROR_TYPES.MISSING,
                        text: missingGroup.join(' ')
                    });
                    missingGroup = [];
                }
                mergedSegments.push(segment);
            }
        }
        
        if (missingGroup.length > 0) {
            mergedSegments.push({
                type: this.ERROR_TYPES.MISSING,
                text: missingGroup.join(' ')
            });
        }

        analysis.displaySegments = mergedSegments;
    }

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

    createHighlightedFeedback(submission, correct) {
        const analysis = this.analyzePhraseComparison(submission, correct);
        const html = [];
        
        for (let i = 0; i < analysis.displaySegments.length; i++) {
            const segment = analysis.displaySegments[i];
            if (i > 0) html.push(' ');
            
            switch (segment.type) {
                case this.ERROR_TYPES.CORRECT:
                    html.push(segment.punctuationError ? 
                        this.highlightPunctuationError(segment.text, segment.correctPunctuation) : 
                        segment.text);
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

    highlightPunctuationError(wordWithPunctuation, correctPunctuation) {
        const match = wordWithPunctuation.match(/^(.+?)([.!?]*)$/);
        if (!match) return wordWithPunctuation;
        const [, wordPart, currentPunctuation] = match;
        if (currentPunctuation !== correctPunctuation) {
            return `${wordPart}<span style="color: #ff6b6b;">${currentPunctuation}</span>`;
        }
        return wordWithPunctuation;
    }

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

// Create singleton and exports
const phraseAnalyzer = new PhraseAnalyzer();

function analyzePhraseComparison(submission, correct) {
    return phraseAnalyzer.analyzePhraseComparison(submission, correct);
}

function createHighlightedFeedback(submission, correct) {
    return phraseAnalyzer.createHighlightedFeedback(submission, correct);
}

function calculatePhraseAccuracy(submission, correct) {
    return phraseAnalyzer.calculatePhraseAccuracy(submission, correct);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PhraseAnalyzer, analyzePhraseComparison, createHighlightedFeedback, calculatePhraseAccuracy };
}

if (typeof window === 'undefined') {
    globalThis.PhraseAnalyzer = PhraseAnalyzer;
    globalThis.analyzePhraseComparison = analyzePhraseComparison;
    globalThis.createHighlightedFeedback = createHighlightedFeedback;
    globalThis.calculatePhraseAccuracy = calculatePhraseAccuracy;
}
// Streamlined from 612 lines to 296 lines on 2025-09-27