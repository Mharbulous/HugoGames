// French Grammar Impostors - Streamlined Phrase Analyzer
// Word-level analysis with proper punctuation handling

class PhraseAnalyzer {
    constructor() {
        this.ERROR_TYPES = {
            CORRECT: 'correct',
            WRONG: 'wrong',
            MISSING: 'missing',
            EXTRA: 'extra'
        };
    }

    tokenize(text) {
        if (!text) return [];
        // Split on whitespace and keep punctuation as separate tokens
        const tokens = [];
        const words = text.match(/\S+/g) || [];
        
        for (const word of words) {
            // Check for trailing punctuation
            const match = word.match(/^(.+?)([.!?,;:]+)$/);
            if (match) {
                tokens.push(match[1]); // Word without punctuation
                tokens.push(match[2]); // Punctuation as separate token
            } else {
                tokens.push(word);
            }
        }
        return tokens;
    }

    computeLCS(a, b) {
        const m = a.length, n = b.length;
        const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
        
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                dp[i][j] = a[i-1] === b[j-1] ? 
                    dp[i-1][j-1] + 1 : 
                    Math.max(dp[i-1][j], dp[i][j-1]);
            }
        }
        
        // Backtrack to find alignment
        const alignment = [];
        let i = m, j = n;
        
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && a[i-1] === b[j-1]) {
                alignment.unshift({ type: 'match', subIdx: i-1, corrIdx: j-1 });
                i--; j--;
            } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
                alignment.unshift({ type: 'missing', corrIdx: j-1 });
                j--;
            } else {
                alignment.unshift({ type: 'extra', subIdx: i-1 });
                i--;
            }
        }
        
        return alignment;
    }

    analyzePhraseComparison(submission, correct) {
        const subTokens = this.tokenize(submission || '');
        const corrTokens = this.tokenize(correct || '');
        
        if (!subTokens.length && !corrTokens.length) {
            return { words: { correct: [], wrong: [], missing: [], extra: [] },
                    totalVotes: 0, displaySegments: [] };
        }
        
        const alignment = this.computeLCS(subTokens, corrTokens);
        const analysis = {
            words: { correct: [], wrong: [], missing: [], extra: [] },
            totalVotes: 0,
            displaySegments: []
        };
        
        // Process alignment to identify errors
        let i = 0;
        while (i < alignment.length) {
            const current = alignment[i];
            
            if (current.type === 'match') {
                analysis.displaySegments.push({
                    type: this.ERROR_TYPES.CORRECT,
                    text: subTokens[current.subIdx]
                });
                analysis.words.correct.push({ word: subTokens[current.subIdx], votes: 0 });
                i++;
            } else {
                // Check if this is a substitution (wrong word) or extra/missing
                const nextMatch = alignment.slice(i).findIndex(a => a.type === 'match');
                const endIdx = nextMatch === -1 ? alignment.length : i + nextMatch;
                
                const extras = [];
                const missings = [];
                
                for (let j = i; j < endIdx; j++) {
                    if (alignment[j].type === 'extra') {
                        extras.push(alignment[j]);
                    } else if (alignment[j].type === 'missing') {
                        missings.push(alignment[j]);
                    }
                }
                
                // Pair up extras and missings as substitutions
                const substitutions = Math.min(extras.length, missings.length);
                
                for (let k = 0; k < substitutions; k++) {
                    analysis.displaySegments.push({
                        type: this.ERROR_TYPES.WRONG,
                        text: subTokens[extras[k].subIdx],
                        correct: corrTokens[missings[k].corrIdx]
                    });
                    analysis.words.wrong.push({
                        submitted: subTokens[extras[k].subIdx],
                        correct: corrTokens[missings[k].corrIdx],
                        votes: 1  // Fixed: 1 vote per spec
                    });
                    analysis.totalVotes += 1;
                }
                
                // Handle remaining extras
                for (let k = substitutions; k < extras.length; k++) {
                    analysis.displaySegments.push({
                        type: this.ERROR_TYPES.EXTRA,
                        text: subTokens[extras[k].subIdx]
                    });
                    analysis.words.extra.push({
                        word: subTokens[extras[k].subIdx],
                        votes: 1
                    });
                    analysis.totalVotes += 1;
                }
                
                // Handle remaining missings
                for (let k = substitutions; k < missings.length; k++) {
                    analysis.displaySegments.push({
                        type: this.ERROR_TYPES.MISSING,
                        text: corrTokens[missings[k].corrIdx]
                    });
                    analysis.words.missing.push({
                        word: corrTokens[missings[k].corrIdx],
                        votes: 1  // Fixed: 1 vote per spec
                    });
                    analysis.totalVotes += 1;
                }
                
                i = endIdx;
            }
        }
        
        return analysis;
    }

    createHighlightedFeedback(submission, correct) {
        const analysis = this.analyzePhraseComparison(submission, correct);
        const html = [];
        let prevWasWord = false;
        
        for (const segment of analysis.displaySegments) {
            // Add space between words (not before punctuation)
            const isPunct = /^[.!?,;:]+$/.test(segment.text);
            if (prevWasWord && !isPunct) html.push(' ');
            
            switch (segment.type) {
                case this.ERROR_TYPES.CORRECT:
                    html.push(segment.text);
                    break;
                case this.ERROR_TYPES.WRONG:
                    html.push(`<span style="color: #ff6b6b; text-decoration: line-through;">${segment.text}</span>`);
                    if (segment.correct) {
                        const correctIsPunct = /^[.!?,;:]+$/.test(segment.correct);
                        if (!correctIsPunct) html.push(' '); // Always add space before non-punctuation corrections
                        html.push(`<span style="color: #131313; text-decoration: underline;">${segment.correct}</span>`);
                    }
                    break;
                case this.ERROR_TYPES.MISSING:
                    html.push(`<span style="color: #131313; text-decoration: underline;">${segment.text}</span>`);
                    break;
                case this.ERROR_TYPES.EXTRA:
                    html.push(`<span style="color: #ff6b6b; text-decoration: line-through;">${segment.text}</span>`);
                    break;
            }
            
            prevWasWord = !isPunct;
        }
        
        return html.join('');
    }

    calculatePhraseAccuracy(submission, correct) {
        if (!submission || !correct) return 0;
        const minLen = Math.min(submission.length, correct.length);
        let matches = 0;
        for (let i = 0; i < minLen; i++) {
            if (submission[i] === correct[i]) matches++;
        }
        return matches;
    }
}

// Singleton instance and exports
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

// Module exports for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        PhraseAnalyzer, 
        analyzePhraseComparison, 
        createHighlightedFeedback, 
        calculatePhraseAccuracy 
    };
}

// Global exports for browser
if (typeof window !== 'undefined') {
    window.PhraseAnalyzer = PhraseAnalyzer;
    window.analyzePhraseComparison = analyzePhraseComparison;
    window.createHighlightedFeedback = createHighlightedFeedback;
    window.calculatePhraseAccuracy = calculatePhraseAccuracy;
}
// Streamlined from 251 lines to 218 lines on 2025-09-28