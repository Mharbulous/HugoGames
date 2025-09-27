# French Grammar Impostors - Impostor Expansion
## Design Document v1.0

### Overview
An expansion to the French Grammar Impostors game where Hugo plays as an impostor who must correct English-influenced French phrases to avoid detection while eliminating crewmates.

---

## Game Setup

### Initial Configuration
- **5 Impostors** (Hugo + 4 AI)
- **7 Crewmates** (AI-controlled)
- **Total Players:** 12

### Visual Design
- Hugo's impostor character has a **near-white background** (#F5F5F5) to distinguish it
- All impostors display with **venting.svg** instead of regular crewmate graphics
- Auto-scroll to center Hugo's character on screen
- Task progress bar prominently displayed at top of screen

---

## Core Gameplay Loop

### Phase 1: Phrase Correction
**Hugo's Challenge:**
- Text input field pre-populated with **incorrect English-influenced French phrase**
- Hugo must correct the phrase to proper French grammar
- Flashing cursor indicates editable field
- Submit button labeled **"Soumettre"**

**Timing Mechanics:**
- **Hugo's Time Limit:** Always 60 seconds (full time regardless of speed)
- **AI Impostor Timing:** Each rolls `20 + (random × 40)` seconds
- **Kill Opportunity Window:** Hugo can kill if he finishes before the fastest AI impostor
- **Emergency Trigger:** If Hugo hasn't submitted after 60 seconds, emergency meeting automatically triggered with whatever text is in field

### Phase 2: Kill Opportunity (Conditional)
**Conditions:**
- Only available if Hugo completes phrase correction faster than AI impostors
- Hugo clicks on a crewmate to eliminate them
- **Time Window:** `10 + (random × 20) - (number of remaining impostors)` seconds
- If Hugo doesn't act, AI impostors may kill instead

**Immediate Result:**
- Emergency meeting sound plays as soon as any crewmate is killed
- Proceed to voting phase

### Phase 3: Voting & Survival
**Voting Algorithm:**
- **Perfect French:** Another impostor gets voted out (Hugo survives)
- **Imperfect French:** Each incorrect character = 1 vote against Hugo
- **Vote Distribution:** Remaining votes distributed among other impostors
- **Elimination Rule:** Character with most votes is ejected

**Game End Conditions:**
- **Hugo Loses:** If Hugo receives most votes and gets ejected
- **Hugo Wins:** If all crewmates are eliminated
- **Continue:** Return to Phase 1 with remaining players

---

## Special Mechanics

### Last Impostor Scenario
When Hugo is the sole remaining impostor:
- **No time pressure** for phrase correction
- **Task Progress Bar** becomes critical threat
- Bar fills over **180 seconds cumulative** (across all previous rounds)
- Hugo must eliminate all remaining crewmates before tasks complete

### Task Progress System
- **Total Duration:** 180 seconds cumulative across entire game
- **Progress Timing:** Advances continuously during all gameplay phases
- **Visual:** Green progress bar with percentage display
- **Game Over:** If bar reaches 100% before all crewmates eliminated, Hugo loses

---

## French Accent Input System

### Keystroke Patterns
Hugo must use proper French accent marks for perfect scoring:

| Accent Type | Keystroke Pattern | Example |
|-------------|------------------|---------|
| **Accent Aigu (é)** | `'` + `e` | é |
| **Accent Grave (à,è,ù)** | `` ` `` + vowel | à, è, ù |
| **Circumflex (â,ê,î,ô,û)** | `^` + vowel | â, ê, î, ô, û |
| **Tréma/Umlaut (ë,ï,ü)** | `"` + vowel | ë, ï, ü |
| **Cédille (ç)** | `'` + `c` | ç |

### Accuracy Requirements
- **Strict Enforcement:** All accent marks and capitalization must be correct
- **Character-by-Character Scoring:** Each wrong character adds one vote against Hugo
- **No Partial Credit:** Only perfect French phrases provide safety

---

## Educational Objectives

### Primary Learning Goals
1. **Grammar Correction:** Transform English-influenced French into proper French
2. **Accent Mastery:** Reinforce proper use of French diacritical marks
3. **Time Pressure Practice:** Develop fluency under stress
4. **Pattern Recognition:** Identify common English grammar interference

### Skill Development
- **Accuracy over Speed:** Perfect French provides safety regardless of time taken
- **Risk/Reward Balance:** Fast correction enables offensive play (killing crewmates)
- **Strategic Thinking:** Balance correction time with survival needs

---

## Technical Requirements

### File Structure
- **Main File:** `PlayAsImpostor.html` (alongside existing `PlayAsCrew.html`)
- **Asset Dependencies:** 
  - `venting.svg` (impostor character graphic)
  - All existing game assets and modules
  - Emergency meeting sound effects

### Integration Points
- Reuse existing phrase pairs from `game-data.js`
- Leverage existing audio engine for emergency meetings
- Maintain visual consistency with base game styling
- Compatible with existing SVG asset system

---

## Victory Conditions Summary

### Hugo Wins When:
- All 7 crewmates are eliminated
- Hugo survives all voting rounds

### Hugo Loses When:
- Hugo gets voted out (receives most votes)
- Task progress bar reaches 100% before all crewmates eliminated

### Strategic Considerations:
- **Perfect accuracy** in French ensures survival each round
- **Speed** enables kill opportunities but isn't required for survival
- **Last impostor** scenario becomes race against task completion timer