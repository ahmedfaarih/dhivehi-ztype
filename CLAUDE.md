# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dhivehi Type is a fast-paced typing game for practicing Dhivehi (Thaana) script, inspired by ZType. Players type Dhivehi words to destroy enemy ships before they reach the bottom of the screen.

## Build Commands

```bash
# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The project uses Vite (specifically rolldown-vite@7.2.5) as its build tool.

## Architecture

### Game Loop Architecture

The game follows a traditional game loop pattern centered around `Game.js`:

1. **Main Game Loop** (`src/game/Game.js`):
   - Runs via `requestAnimationFrame` in the `gameLoop()` method
   - Calculates delta time between frames for smooth animations
   - Calls `update(dt)` and `render()` each frame
   - Manages game state (score, wave, gameOver, paused)

2. **Core Game Objects**:
   - `Player.js`: Player ship at bottom (visual only, no movement controls)
   - `Enemy.js`: Enemy ships that move toward the player, each carrying a Dhivehi word
   - `Bullet.js`: Projectiles fired from player to enemies
   - `ParticleSystem.js`: Starfield background and visual effects

### Input Handling System

The input system is the most complex part of the architecture:

- **JTK Integration** (`public/jtk.min.js`): External library for phonetic Thaana keyboard
  - Converts English keyboard input to Thaana characters in real-time
  - Initialized in `index.html` with `phonetic` mode
  - Works with hidden input field marked with class `thaanaKeyboardInput`

- **InputHandler.js**: Manages the typing game logic
  - Listens to `input` and `keyup` events on `#hidden-input`
  - **Target Locking**: Once a match is found, the input locks to that enemy
  - Uses `validateAndUpdateInput()` to accept/reject characters based on locked target
  - Only allows characters that match the targeted enemy's word
  - Plays sounds (`playShotgun()` for correct, `playEmpty()` for incorrect)
  - Fires bullets and damages enemies on each correct character
  - Calls `handleCompleteMatch()` when word is fully typed

- **Text Normalization**: All Thaana comparisons use `normalizeThaana()` from `utils/thaana.js`
  - Trims whitespace and normalizes Unicode (NFC) for consistent matching
  - Critical for comparing user input against word list

### Wave Progression System

Located in `Game.js` (`nextWave()` and related):

- Wave duration: 45 seconds per wave
- Difficulty progression tied to wave number (in `data/words.js`):
  - Waves 1-4: Easy words (3-5 letters)
  - Waves 5-9: Medium words (6-8 letters)
  - Wave 10+: Hard words (9+ letters)
- Spawn interval decreases by 0.15s per wave (minimum 2.0s)
- Enemy speed increases by 3 pixels/second per wave

### Enemy Behavior

Enemies use **homing movement** toward the player (`Enemy.js` line 66-76):
- Move at 50% speed horizontally and 100% vertically toward player position
- Each enemy has health equal to word length
- Hit animation: shake effect + visual flash + speed reduction to 70%
- Death animation: expanding circle explosion with particles

### Rendering Pipeline

The render order (bottom to top) in `Game.js` `render()`:

1. Solid color background (#000814)
2. Scrolling background image (seamless vertical loop at 20px/sec)
3. Starfield particles (depth effect)
4. Bullets
5. Enemies (with Thaana words and health bars)
6. Player ship
7. Game Over overlay (if applicable)

## Word Management

Words are stored in `src/data/words.js`:
- 30 easy words, 25 medium words, 18 hard words
- To add new words: append to appropriate difficulty array
- Word selection uses `getDifficultyForWave(wave)` then `getRandomWord(difficulty)`

## Thaana/Dhivehi Text Handling

- Unicode range: U+0780 to U+07BF
- Text direction: RTL (right-to-left)
- Font: "Waheed" (A_Waheed) loaded from `src/fonts/A_Waheed/`
- Always use `normalizeThaana()` for text comparisons
- Utilities in `src/utils/thaana.js` for validation, filtering, measuring

## Asset Loading

Images are loaded asynchronously with `onload` handlers:
- Enemy ships: `/src/images/badship.png`
- Player ship: `/src/images/goodship.png`
- Explosion: `/src/images/blow.gif`
- Background: `/src/images/bg_space_seamless.png`
- Fallback rendering (geometric shapes) used until images load

## Sound System

- `SoundManager.js`: Manages two sound effects
  - `shotgun.wav`: Correct character typed
  - `empty.wav`: Incorrect character typed
- Game.js uses Web Audio API for game sounds (hit, damage, wave, gameover)

## UI Elements

Managed in `Game.js` `updateUI()`:
- Score display: `#score` element (Thaana: "ސްކޯ:")
- Wave display: `#wave` element (Thaana: "ވޭވް:")
- Health bar: `.health-segment` elements (3 segments, class `lost` when depleted)

## Canvas Scaling

The canvas uses high-DPI display support (`setupCanvas()` in Game.js):
- Multiplies canvas dimensions by `devicePixelRatio`
- Scales context to maintain correct rendering
- Game logic uses simpler rect-based dimensions

## Key Game Constants

From `Game.js` constructor:
- Game dimensions: 1200x700 (base)
- Initial spawn interval: 4.0s
- Wave duration: 45s
- Initial player lives: 3 (maxLives in Player.js)
- Scoring: word length × 10 points
