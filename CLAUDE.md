# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HugoGames is a collection of educational French language learning games hosted as static HTML files. The project is designed to help users practice French grammar through interactive, gamified experiences.

## Project Structure

- `index.html` - Main landing page that serves as a game directory
- `FrenchGrammarImposters.html` - Among Us-inspired game for identifying French grammar mistakes
- `.github/workflows/deploy.yml` - GitHub Actions workflow for automatic deployment to GitHub Pages

## Architecture

This is a static site project with no build process or dependencies. Each game is implemented as a self-contained HTML file with embedded CSS and JavaScript.

### Game Architecture

Games follow a pattern of:
- Embedded CSS using Among Us-inspired visual themes (dark backgrounds, bright colors)
- Vanilla JavaScript for game logic and state management
- Web Audio API for sound effects
- No external dependencies or frameworks

### Key Technical Features

- **Audio System**: Custom Web Audio API implementation for synchronized sound effects during text reveals
- **Animation System**: RequestAnimationFrame-based text animation with typewriter effects
- **Game State Management**: Object-based state tracking for game progression
- **Responsive Design**: CSS Grid and Flexbox for responsive layouts

## Deployment

The project automatically deploys to GitHub Pages via GitHub Actions on pushes to the `master` branch. The deployment workflow:
1. Uploads all files as static assets
2. Deploys directly to GitHub Pages without any build process
3. Serves files directly from the repository root

## Development Notes

- All games are self-contained HTML files - no shared dependencies
- French language content uses proper Unicode characters and accents
- Color schemes follow Among Us game aesthetics (#1a1a2e, #16213e, #ff6b6b, #4ecdc4)
- Games include educational explanations for incorrect grammar patterns
- No package.json, build tools, or dependency management required

## Game Content Structure

French Grammar Impostors game includes:
- Paired correct/incorrect French phrases demonstrating common grammar mistakes
- Standalone incorrect phrases using English grammar with French vocabulary
- Educational explanations for each grammar error
- Progressive difficulty through multiple rounds