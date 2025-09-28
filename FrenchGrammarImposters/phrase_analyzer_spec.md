# French Grammar Impostors - Simplified Phrase Analyzer Specification

## Overview

The phrase analyzer evaluates Hugo's French phrase corrections at the word level to determine voting penalties and provide visual feedback. Words are defined as space-separated tokens (e.g., "qu'est-ce" is one word, "Je suis" is two words).

## Error Types and Voting System

### 1. Correct Words
- **Definition**: Word matches exactly in both submission and correct phrase at the same position
- **Votes**: 0 votes
- **Display**: Normal black text

### 2. Wrong Words
- **Definition**: Word in submission that should be a different word at that position
- **Votes**: 1 vote (covers spelling, accent, capitalization, gender, and vocabulary errors)
- **Display**: Entire word shown in red strikethrough text followed by underlined black text in correct position
- **Examples**:
  - "ecole" → "école" (missing accent)
  - "le" → "la" (gender error)
  - "heure" → "temps" (wrong vocabulary)
  - "Lundi" → "lundi" (capitalization)

### 3. Missing Words
- **Definition**: Required word present in correct phrase but absent from Hugo's submission
- **Votes**: 1 vote
- **Display**: Missing word shown in underlined black text in correct position
- **Example**: "Je suis fatigué" → "Je fatigué" (missing "suis")

### 4. Extra Words
- **Definition**: Superfluous word that doesn't belong in the correct phrase
- **Votes**: 1 vote
- **Display**: Red text with strikethrough
- **Example**: "Je suis très fatigué" → "Je suis fatigué" (extra "très")

## Word Boundaries

- Contractions like "qu'est-ce", "j'ai", "c'est", "d'eau" are treated as single words
- Hyphenated compounds are treated as single words
- Only whitespace and punctuation marks (.!?,;:) separates words. 
- Punctuation marks (.!?,;:) should be treated as single character words.

## Analysis Process

1. **Tokenize** both submission and correct phrase into words (whitespace-separated)
2. **Align words** using Longest Common Subsequence (LCS) algorithm
3. **Categorize** each word as: correct, wrong, missing, or extra
4. **Calculate votes** based on number of correct, wrong, missing or extra words (or punctuation marks)
5. **Generate display** with appropriate styling

## Display Formatting

| Error Type | HTML Styling | Visual Result |
|------------|-------------|---------------|
| Correct | Normal text | Black text |
| Wrong word | `<span style="color: #ff6b6b; text-decoration: line-through;">word</span>` | Red strikethrough |
| Extra word | `<span style="color: #ff6b6b; text-decoration: line-through;">word</span>` | Red strikethrough |
| Missing word | `<span style="color: #131313; text-decoration: underline;">word</span>` | black underlined |

## Design Decisions

### Simplified Error Model
- No distinction between character-level and word-level errors
- All incorrect words are treated equally (1 vote penalty)

### No Synonym Detection
- Different words are always treated as errors
- Teaches specific vocabulary and constructions
- Promotes practice of target phrases

### Alignment Strategy
- LCS algorithm finds optimal word alignment
- Minimizes total error count
- Provides intuitive visual feedback