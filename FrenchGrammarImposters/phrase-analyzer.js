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
        
        // Group consecutive error segments (wrong, extra, missing) together
        const groupedSegments = [];
        let i = 0;
        
        while (i < analysis.displaySegments.length) {
            const segment = analysis.displaySegments[i];
            
            // Check if this is any type of error
            if (segment.type === this.ERROR_TYPES.WRONG || 
                segment.type === this.ERROR_TYPES.EXTRA ||
                segment.type === this.ERROR_TYPES.MISSING) {
                
                // Collect all consecutive error segments
                const errorGroup = {
                    wrongs: [],
                    extras: [],
                    missings: [],
                    corrections: []
                };
                
                while (i < analysis.displaySegments.length && 
                       (analysis.displaySegments[i].type === this.ERROR_TYPES.WRONG ||
                        analysis.displaySegments[i].type === this.ERROR_TYPES.EXTRA ||
                        analysis.displaySegments[i].type === this.ERROR_TYPES.MISSING)) {
                    
                    const seg = analysis.displaySegments[i];
                    
                    if (seg.type === this.ERROR_TYPES.WRONG) {
                        errorGroup.wrongs.push(seg.text);
                        if (seg.correct) {
                            errorGroup.corrections.push(seg.correct);
                        }
                    } else if (seg.type === this.ERROR_TYPES.EXTRA) {
                        errorGroup.extras.push(seg.text);
                    } else if (seg.type === this.ERROR_TYPES.MISSING) {
                        errorGroup.missings.push(seg.text);
                    }
                    i++;
                }
                
                groupedSegments.push({
                    type: 'error_group',
                    ...errorGroup
                });
            } else {
                groupedSegments.push(segment);
                i++;
            }
        }
        
        // Now render the grouped segments
        let prevWasWord = false;
        let prevWasPunct = false;
        
        for (const segment of groupedSegments) {
            if (segment.type === 'error_group') {
                // Add space before error group if previous was a word or punctuation
                const allStrikes = [...segment.wrongs, ...segment.extras];
                if ((prevWasWord || prevWasPunct) && allStrikes.length > 0) {
                    const firstIsPunct = /^[.!?,;:]+$/.test(allStrikes[0]);
                    if (!firstIsPunct) html.push(' ');
                }
                
                // Render all strikethroughs (wrongs and extras) first
                let strikeCount = 0;
                
                // Render wrong words with strikethrough
                for (const wrong of segment.wrongs) {
                    if (strikeCount > 0) {
                        const isPunct = /^[.!?,;:]+$/.test(wrong);
                        if (!isPunct) html.push(' ');
                    }
                    html.push(`<span style="color: #ff6b6b; text-decoration: line-through;">${wrong}</span>`);
                    strikeCount++;
                }
                
                // Render extra words with strikethrough
                for (const extra of segment.extras) {
                    if (strikeCount > 0) {
                        const isPunct = /^[.!?,;:]+$/.test(extra);
                        if (!isPunct) html.push(' ');
                    }
                    html.push(`<span style="color: #ff6b6b; text-decoration: line-through;">${extra}</span>`);
                    strikeCount++;
                }
                
                // Then render all insertions (corrections and missings)
                for (const correct of segment.corrections) {
                    const isPunct = /^[.!?,;:]+$/.test(correct);
                    if (!isPunct) html.push(' ');
                    html.push(`<span style="color: #131313; text-decoration: underline;">${correct}</span>`);
                }
                
                for (const missing of segment.missings) {
                    const isPunct = /^[.!?,;:]+$/.test(missing);
                    if (!isPunct) html.push(' ');
                    html.push(`<span style="color: #131313; text-decoration: underline;">${missing}</span>`);
                }
                
                // Update prev flags
                const allInsertions = [...segment.corrections, ...segment.missings];
                if (allInsertions.length > 0) {
                    const lastText = allInsertions[allInsertions.length - 1];
                    prevWasPunct = /^[.!?,;:]+$/.test(lastText);
                    prevWasWord = !prevWasPunct;
                } else if (allStrikes.length > 0) {
                    const lastText = allStrikes[allStrikes.length - 1];
                    prevWasPunct = /^[.!?,;:]+$/.test(lastText);
                    prevWasWord = !prevWasPunct;
                }
                
            } else {
                // Handle correct segments
                const isPunct = segment.text && /^[.!?,;:]+$/.test(segment.text);
                
                // Add space before this segment if:
                // - Previous was a word and this is not punctuation
                // - Previous was punctuation (always add space after punctuation)
                if ((prevWasWord && !isPunct) || prevWasPunct) {
                    html.push(' ');
                }
                
                html.push(segment.text);
                prevWasPunct = isPunct;
                prevWasWord = !isPunct;
            }
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