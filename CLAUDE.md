# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a collection of educational browser games focused on French language learning. The main game is "French Grammar Impostors", an Among Us-inspired game where players identify grammatical mistakes in French phrases.

## Project Structure

- `index.html` - Landing page listing all available games
- `FrenchGrammarImposters/` - Main game directory containing:
  - `PlayAsCrew.html` - Game entry point (referenced from index.html)
  - `game-core.js` - Core game logic and state management
  - `game-data.js` - Game content (phrase pairs, character data)
  - `game-ui.js` - UI rendering and interaction handling
  - `audio-engine.js` - Sound effects and audio management
  - `svg-assets.js` - SVG graphics and visual assets
  - `init.js` - Game initialization and event setup
  - `FrenchGrammarImposters.css` - Game styling
  - Audio/image assets (.mp3, .svg, .png, .jpg files)

## Development Commands

This is a static HTML/JavaScript project with modern testing infrastructure. To develop:

1. **Run locally**: Open `index.html` in a web browser or use a local web server:
   ```bash
   npm run serve
   # Or: python -m http.server 8000
   # Then visit http://localhost:8000
   ```

2. **Test the game**: Navigate to "French Grammar Impostors" from the main page

3. **Run tests**: Comprehensive test suite using Vitest:
   ```bash
   npm test              # Run tests in watch mode
   npm run test:run      # Run tests once
   npm run test:coverage # Run tests with coverage report
   npm run test:phrase-analyzer # Test only the phrase analyzer
   npm run test:ui       # Run tests with UI interface
   ```

## Architecture Notes

### Game Module System
The French Grammar Impostors game uses a modular JavaScript architecture loaded in dependency order:
1. `game-data.js` - Static game data and constants
2. `svg-assets.js` - Visual assets and graphics
3. `audio-engine.js` - Audio system initialization
4. `game-core.js` - Game state and logic
5. `game-ui.js` - DOM manipulation and rendering
6. `init.js` - Game startup and event binding

### Game Mechanics
- Educational game teaching French grammar through gameplay
- Players vote to eliminate "impostors" who use incorrect French grammar
- Game state managed through a central `gameState` object
- Audio feedback for game events (emergency meetings, victories, etc.)
- SVG-based character graphics with dynamic coloring

### File Dependencies
- The main `index.html` links to `FrenchGrammarImposters/PlayAsCrew.html` (note: different from the main game file)
- Game modules must be loaded in the specific order defined in `PlayAsCrew.html`
- CSS styling is centralized in `FrenchGrammarImposters.css`

### Testing Architecture
- **Testing Framework**: Vitest with jsdom environment for DOM testing
- **Coverage**: 98%+ code coverage for the phrase analyzer module
- **Module Testing**: `phrase-analyzer.mjs` - ES module version for testing compatibility
- **Test Files**: Located alongside source files with `.test.js` extension
- **Key Tests**:
  - Punctuation handling (two-phase analysis)
  - Word-level error detection (missing, extra, position)
  - Character-level error analysis with short word exceptions
  - HTML output generation and highlighting
  - Edge cases and complex scenarios