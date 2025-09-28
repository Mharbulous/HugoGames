import { describe, it, expect, beforeEach } from 'vitest'
import { PhraseAnalyzer, analyzePhraseComparison, createHighlightedFeedback, calculatePhraseAccuracy } from './phrase-analyzer.mjs'

describe('PhraseAnalyzer', () => {
  let analyzer

  beforeEach(() => {
    analyzer = new PhraseAnalyzer()
  })

  describe('Basic functionality', () => {
    it('should handle empty input', () => {
      const result = analyzer.analyzePhraseComparison('', '')
      expect(result.totalVotes).toBe(0)
      expect(result.displaySegments).toEqual([])
    })

    it('should handle null/undefined input', () => {
      const result = analyzer.analyzePhraseComparison(null, undefined)
      expect(result.totalVotes).toBe(0)
      expect(result.displaySegments).toEqual([])
    })

    it('should identify perfect matches', () => {
      const result = analyzer.analyzePhraseComparison('Bonjour le monde', 'Bonjour le monde')
      expect(result.totalVotes).toBe(0)
      expect(result.words.correct.length).toBe(3)
      expect(result.words.errors.length).toBe(0)
    })
  })

  describe('Punctuation handling', () => {
    it('should preserve punctuation in display while stripping for analysis', () => {
      const result = analyzer.analyzePhraseComparison(
        'Qu\'est-ce que tu fais ici? Oh, rien!',
        'Qu\'est-ce que tu fais ici? Oh, rien du tout!'
      )

      // Should identify "du tout" as missing, not flag punctuation as wrong
      const missingWords = result.words.missing
      expect(missingWords).toHaveLength(2)
      expect(missingWords[0].word).toBe('du')
      expect(missingWords[1].word).toBe('tout')

      // Display should preserve punctuation
      const segments = result.displaySegments
      const rienSegment = segments.find(s => s.text.includes('rien!'))
      expect(rienSegment).toBeDefined()
      expect(rienSegment.text).toBe('rien!')
    })

    it('should detect actual punctuation errors', () => {
      const result = analyzer.analyzePhraseComparison(
        'Bonjour le monde.',
        'Bonjour le monde!'
      )

      // Should detect punctuation error
      expect(result.words.errors.length).toBe(1)
      expect(result.words.errors[0].type).toBe('punctuation_error')
      expect(result.totalVotes).toBe(1)
    })

    it('should handle multiple sentences with punctuation', () => {
      const result = analyzer.analyzePhraseComparison(
        'Bonjour! Comment allez-vous.',
        'Bonjour! Comment allez-vous?'
      )

      // First punctuation correct, second incorrect
      expect(result.words.errors.length).toBe(1)
      expect(result.words.errors[0].type).toBe('punctuation_error')
    })

    it('should strip end punctuation correctly', () => {
      expect(analyzer.stripEndPunctuation('word!')).toBe('word')
      expect(analyzer.stripEndPunctuation('word?')).toBe('word')
      expect(analyzer.stripEndPunctuation('word.')).toBe('word')
      expect(analyzer.stripEndPunctuation('word!?')).toBe('word')
      expect(analyzer.stripEndPunctuation('don\'t')).toBe('don\'t') // Preserve contractions
      expect(analyzer.stripEndPunctuation('word')).toBe('word') // No punctuation
    })

    it('should extract punctuation patterns correctly', () => {
      const punctuation = analyzer.extractPunctuation('Hello! How are you?')
      expect(punctuation).toEqual(['!', '', '', '?'])
    })
  })

  describe('Word-level errors', () => {
    it('should detect missing words', () => {
      const result = analyzer.analyzePhraseComparison(
        'Je suis',
        'Je suis très heureux'
      )

      expect(result.words.missing.length).toBe(2)
      expect(result.words.missing[0].word).toBe('très')
      expect(result.words.missing[1].word).toBe('heureux')
      expect(result.totalVotes).toBe(4) // 2 votes per missing word
    })

    it('should detect extra words', () => {
      const result = analyzer.analyzePhraseComparison(
        'Je suis très très heureux',
        'Je suis très heureux'
      )

      expect(result.words.extra.length).toBe(1)
      expect(result.words.extra[0].word).toBe('très')
      // Total votes should account for extra word (1) + position adjustments (2) = 3
      expect(result.totalVotes).toBe(3)
    })

    it('should detect position errors', () => {
      const result = analyzer.analyzePhraseComparison(
        'très Je suis heureux',
        'Je suis très heureux'
      )

      // The algorithm detects multiple position errors and one extra word
      expect(result.words.errors.length).toBe(2) // Je and suis are in wrong positions
      expect(result.words.errors[0].type).toBe('position')
      expect(result.words.errors[1].type).toBe('position')
      expect(result.words.extra.length).toBe(1) // très is extra in its current position
      expect(result.totalVotes).toBe(3) // 2 position errors (2 votes) + 1 extra (1 vote)
    })
  })

  describe('Character-level errors', () => {
    it('should detect single character errors', () => {
      const result = analyzer.analyzePhraseComparison(
        'Bonjour le morde',
        'Bonjour le monde'
      )

      expect(result.words.errors.length).toBe(1)
      expect(result.words.errors[0].type).toBe('single_char_error')
      expect(result.words.errors[0].submitted).toBe('morde')
      expect(result.words.errors[0].correct).toBe('monde')
      expect(result.totalVotes).toBe(1)
    })

    it('should detect multiple character errors', () => {
      const result = analyzer.analyzePhraseComparison(
        'Bonjour le mxrde',
        'Bonjour le monde'
      )

      expect(result.words.errors.length).toBe(1)
      expect(result.words.errors[0].type).toBe('multiple_char_error')
      expect(result.totalVotes).toBe(2)
    })

    it('should apply short word exception', () => {
      const result = analyzer.analyzePhraseComparison(
        'Je sui',
        'Je suis'
      )

      // Short words with any error count as multiple character error
      expect(result.words.errors.length).toBe(1)
      expect(result.words.errors[0].type).toBe('multiple_char_error')
      expect(result.totalVotes).toBe(2)
    })
  })

  describe('Complex scenarios', () => {
    it('should handle mixed error types', () => {
      const result = analyzer.analyzePhraseComparison(
        'Je suis très haureux aujourd\'hui!',
        'Je suis très heureux hier?'
      )

      // Should detect:
      // - character error in "haureux" vs "heureux"
      // - extra word "aujourd'hui"
      // - missing word "hier"
      // - punctuation error "!" vs "?"
      expect(result.totalVotes).toBeGreaterThan(0)
      expect(result.words.errors.length).toBeGreaterThanOrEqual(1)
    })

    it('should handle the original punctuation bug scenario', () => {
      const result = analyzer.analyzePhraseComparison(
        'Qu\'est-ce que tu fais ici? Oh, rien!',
        'Qu\'est-ce que tu fais ici? Oh, rien du tout!'
      )

      // Should NOT flag punctuation as wrong
      const punctuationErrors = result.words.errors.filter(e => e.type === 'punctuation_error')
      expect(punctuationErrors).toHaveLength(0)

      // Should correctly identify missing words
      expect(result.words.missing.length).toBe(2)
      expect(result.words.missing.map(m => m.word)).toEqual(['du', 'tout'])
    })
  })

  describe('Utility functions', () => {
    it('should calculate word similarity correctly', () => {
      expect(analyzer.calculateSimilarity('hello', 'hello')).toBe(1)
      expect(analyzer.calculateSimilarity('hello', 'hallo')).toBe(0.8)
      expect(analyzer.calculateSimilarity('hello', 'world')).toBeLessThan(0.5)
      expect(analyzer.calculateSimilarity('', '')).toBe(0)
    })

    it('should tokenize text correctly', () => {
      const tokens = analyzer.tokenize('Hello! How are you?')
      expect(tokens).toEqual(['Hello', 'How', 'are', 'you'])
    })

    it('should check word matches correctly', () => {
      expect(analyzer.wordsMatch('hello', 'hello')).toBe(true)
      expect(analyzer.wordsMatch('hello', 'Hello')).toBe(false)
      expect(analyzer.wordsMatch('hello', 'world')).toBe(false)
    })
  })

  describe('HTML output generation', () => {
    it('should create highlighted feedback', () => {
      const html = analyzer.createHighlightedFeedback(
        'Bonjour le morde',
        'Bonjour le monde'
      )

      expect(html).toContain('Bonjour')
      expect(html).toContain('le')
      expect(html).toContain('mo') // Part of the word before the error
      expect(html).toContain('de') // Part of the word after the error
      expect(html).toContain('color: #ff6b6b') // Error highlighting
    })

    it('should highlight punctuation errors correctly', () => {
      const html = analyzer.createHighlightedFeedback(
        'Bonjour le monde.',
        'Bonjour le monde!'
      )

      expect(html).toContain('monde')
      expect(html).toContain('color: #ff6b6b') // Punctuation error highlighting
    })

    it('should highlight missing words', () => {
      const html = analyzer.createHighlightedFeedback(
        'Je suis',
        'Je suis heureux'
      )

      expect(html).toContain('heureux')
      expect(html).toContain('color: #d3d3d3') // Missing word styling
      expect(html).toContain('text-decoration: underline')
    })
  })

  describe('Accuracy calculation', () => {
    it('should calculate character accuracy correctly', () => {
      expect(analyzer.calculatePhraseAccuracy('hello', 'hello')).toBe(5)
      expect(analyzer.calculatePhraseAccuracy('hello', 'hallo')).toBe(4)
      expect(analyzer.calculatePhraseAccuracy('', 'hello')).toBe(0)
      expect(analyzer.calculatePhraseAccuracy('hello', '')).toBe(0)
    })
  })
})

describe('Global API functions', () => {
  it('should export analyzePhraseComparison function', () => {
    expect(typeof analyzePhraseComparison).toBe('function')

    const result = analyzePhraseComparison('hello', 'hello')
    expect(result.totalVotes).toBe(0)
  })

  it('should export createHighlightedFeedback function', () => {
    expect(typeof createHighlightedFeedback).toBe('function')

    const html = createHighlightedFeedback('hello', 'hello')
    expect(typeof html).toBe('string')
  })

  it('should export calculatePhraseAccuracy function', () => {
    expect(typeof calculatePhraseAccuracy).toBe('function')

    const accuracy = calculatePhraseAccuracy('hello', 'hello')
    expect(accuracy).toBe(5)
  })
})