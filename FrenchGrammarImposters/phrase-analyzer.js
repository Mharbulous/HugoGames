// French Grammar Impostors - Simplified Phrase Analyzer
// All word-level errors, no character-level analysis

class PhraseAnalyzer {
    constructor() {
        this.ERROR_TYPES = {
            CORRECT: 'correct',
            WRONG: 'wrong',
            MISSING: 'missing',
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
        return this.buildAnalysis(alignment, submittedWords, correctWords, originalSubmittedWords, originalCorrectWords);
    }

    stripEndPunctuation(word) {
        return word.replace(/[.!?,;:]+$/, '');
    }

    tokenize(text) {
        const words = text.match(/\S+/g) || [];
        return words.map(word => this.stripEndPunctuation(word));
    }

    computeAlignment(submitted, correct) {
        const m = submitted.length;
        const n = correct.length;
        const lcs = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
        
        // Build LCS table
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (submitted[i-1] === correct[j-1]) {
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
            if (i > 0 && j > 0 && submitted[i-1] === correct[j-1]) {
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

    buildAnalysis(alignment, submittedWords, correctWords, originalSubmittedWords, originalCorrectWords) {
        const analysis = {
            words: { correct: [], wrong: [], missing: [], extra: [] },
            totalVotes: 0,
            displaySegments: []
        };

        const segments = [];
        let i = 0;
        
        while (i < alignment.length) {
            const item = alignment[i];
            
            if (item.type === 'match') {
                // Correct word at correct position
                segments.push({
                    type: this.ERROR_TYPES.CORRECT,
                    text: originalSubmittedWords[item.subIndex],
                    index: item.subIndex
                });
                analysis.words.correct.push({ word: item.submitted, votes: 0 });
                i++;
                
            } else if (item.type === 'extra' || item.type === 'missing') {
                // Collect consecutive extras and missings
                const group = [];
                while (i < alignment.length && 
                       (alignment[i].type === 'extra' || alignment[i].type === 'missing')) {
                    group.push(alignment[i]);
                    i++;
                }
                
                // Process group - check if it's a substitution (wrong word) or truly extra/missing
                const extras = group.filter(g => g.type === 'extra');
                const missings = group.filter(g => g.type === 'missing');
                
                // Simple heuristic: if we have both extras and missings in close proximity,
                // they're likely substitutions (wrong words)
                const minCount = Math.min(extras.length, missings.length);
                
                // Process substitutions (wrong words)
                for (let j = 0; j < minCount; j++) {
                    segments.push({
                        type: this.ERROR_TYPES.WRONG,
                        text: originalSubmittedWords[extras[j].subIndex],
                        correct: originalCorrectWords[missings[j].corrIndex],
                        index: extras[j].subIndex
                    });
                    analysis.words.wrong.push({
                        submitted: submittedWords[extras[j].subIndex],
                        correct: correctWords[missings[j].corrIndex],
                        votes: 2
                    });
                    analysis.totalVotes += 2;
                }
                
                // Process remaining extras
                for (let j = minCount; j < extras.length; j++) {
                    segments.push({
                        type: this.ERROR_TYPES.EXTRA,
                        text: originalSubmittedWords[extras[j].subIndex],
                        index: extras[j].subIndex
                    });
                    analysis.words.extra.push({
                        word: submittedWords[extras[j].subIndex],
                        votes: 1
                    });
                    analysis.totalVotes += 1;
                }
                
                // Process remaining missings
                for (let j = minCount; j < missings.length; j++) {
                    segments.push({
                        type: this.ERROR_TYPES.MISSING,
                        text: originalCorrectWords[missings[j].corrIndex],
                        index: missings[j].corrIndex + 0.5, // Place after previous word
                        isMissing: true
                    });
                    analysis.words.missing.push({
                        word: correctWords[missings[j].corrIndex],
                        votes: 2
                    });
                    analysis.totalVotes += 2;
                }
            } else {
                i++;
            }
        }
        
        // Sort segments by position
        segments.sort((a, b) => a.index - b.index);
        
        // Merge consecutive missing words for cleaner display
        const finalSegments = [];
        let missingGroup = [];
        
        for (const segment of segments) {
            if (segment.type === this.ERROR_TYPES.MISSING) {
                missingGroup.push(segment.text);
            } else {
                if (missingGroup.length > 0) {
                    finalSegments.push({
                        type: this.ERROR_TYPES.MISSING,
                        text: missingGroup.join(' ')
                    });
                    missingGroup = [];
                }
                finalSegments.push(segment);
            }
        }
        
        if (missingGroup.length > 0) {
            finalSegments.push({
                type: this.ERROR_TYPES.MISSING,
                text: missingGroup.join(' ')
            });
        }
        
        analysis.displaySegments = finalSegments;
        return analysis;
    }

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
                case this.ERROR_TYPES.WRONG:
                    html.push(`<span style="color: #ff6b6b;">${segment.text}</span>`);
                    break;
                case this.ERROR_TYPES.MISSING:
                    html.push(`<span style="color: #d3d3d3; text-decoration: underline;">${segment.text}</span>`);
                    break;
                case this.ERROR_TYPES.EXTRA:
                    html.push(`<span style="color: #ff6b6b; text-decoration: line-through;">${segment.text}</span>`);
                    break;
            }
        }
        
        return html.join('');
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
            words: { correct: [], wrong: [], missing: [], extra: [] },
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
// Streamlined from 612 lines to 198 lines on 2025-09-28