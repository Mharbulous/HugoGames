# French Grammar Impostors - Phrase Analyzer Specification

## Overview

The phrase analyzer evaluates Hugo's French phrase corrections at the word level to determine voting penalties and provide visual feedback. Words are defined as space-separated tokens (e.g., "qu'est-ce" is one word, "Je suis" is two words).

## Error Types and Voting System

### 1. Single Character Errors
- **Definition**: One character wrong within a word (spelling, accent, capitalization, punctuation)
- **Votes**: 1 vote
- **Display**: Only the incorrect character(s) shown in red text
- **Examples**: 
  - "école" → "ecole" (missing accent)
  - "Lundi" → "lundi" (capitalization)
  - "J'ai" → "Jai" (missing apostrophe)

### 2. Multiple Character Errors
- **Definition**: Two or more characters wrong within a word
- **Votes**: 2 votes (maximum per word)
- **Display**: Entire word shown in red text
- **Examples**:
  - "heure" → "temps" (completely different word)
  - "regardé" → "regarde" (multiple character differences)

### 3. Short Word Exception
- **Definition**: For words ≤3 characters (both submitted and correct), any character error is treated as wrong word choice
- **Votes**: 2 votes
- **Display**: Entire word shown in red text
- **Rationale**: Handles gender agreement errors (le/la, un/une, à/au, etc.)
- **Examples**:
  - "le" → "la" (2 votes, not 1)
  - "un" → "une" (2 votes, not 1)
  - "à" → "au" (2 votes, not 1)

### 4. Missing Words
- **Definition**: Required word present in correct phrase but absent from Hugo's submission
- **Votes**: 2 votes
- **Display**: Missing word shown in underlined ghostly gray text in correct position
- **Example**: "Je suis fatigué" → "Je fatigué" (missing "suis")

### 5. Position Errors
- **Definition**: Correct word placed in wrong position within sentence
- **Votes**: 1 vote
- **Display**: 
  - Strikethrough black text where Hugo placed it incorrectly
  - Underlined ghostly gray text where it should be
- **Example**: "chat rouge" → "rouge chat" 
  - Display: "<s>rouge</s> chat <u style='color: gray'>rouge</u>"

### 6. Extra Words
- **Definition**: Superfluous word that doesn't belong anywhere in the correct phrase
- **Votes**: 1 vote
- **Display**: Red text with strikethrough
- **Example**: "Je suis très fatigué" → "Je suis fatigué" (extra "très")

## Character-Level Error Handling

### Accent/Diacritic Errors
- Treated as character errors within word-level analysis
- Single accent error = 1 vote
- Multiple accent errors in same word = 2 votes (max)

### Capitalization Errors
- Treated as character errors within word-level analysis
- Single capitalization error = 1 vote
- Combined with other errors may reach 2-vote maximum

### Punctuation Errors
- Treated as part of the word containing the punctuation
- Missing apostrophe in "J'ai" → "Jai" = 1 vote (single character error)
- Missing apostrophe in "J'y" → "Jy" = 2 votes (short word exception)

## Analysis Priority Order

1. **Exact matches** in correct positions (0 votes)
2. **Character-level errors** at same positions (1-2 votes based on error count and word length)
3. **Position errors** - words found elsewhere in correct phrase (1 vote)
4. **Missing words** - required words not found in submission (2 votes)
5. **Extra words** - submitted words not found in correct phrase (1 vote)

## Design Decisions

### Word Boundaries
- Contractions like "qu'est-ce", "j'ai", "c'est" are treated as single words
- Hyphenated compounds are treated as single words
- Only whitespace separates words

### Synonym Handling
- **No synonym detection** - teaches specific vocabulary
- Different correct words treated as errors to encourage learning target phrases
- Promotes practice of specific constructions rather than comfortable alternatives

### Error Severity
- Maximum 2 votes per word regardless of error count
- Short words penalized more heavily due to grammatical importance
- Position errors penalized less than wrong word choice

## Display Formatting

| Error Type | HTML Styling | Visual Result |
|------------|-------------|---------------|
| Correct | Normal text | Black text |
| Single char error | `<span style="color: #ff6b6b;">char</span>` | Red character(s) |
| Multiple char error | `<span style="color: #ff6b6b;">word</span>` | Red word |
| Missing word | `<span style="color: #d3d3d3; text-decoration: underline;">word</span>` | Gray underlined |
| Position error (wrong) | `<span style="text-decoration: line-through;">word</span>` | Black strikethrough |
| Position error (correct) | `<span style="color: #d3d3d3; text-decoration: underline;">word</span>` | Gray underlined |
| Extra word | `<span style="color: #ff6b6b; text-decoration: line-through;">word</span>` | Red strikethrough |