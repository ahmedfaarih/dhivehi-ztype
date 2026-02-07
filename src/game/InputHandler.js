import { normalizeThaana } from '../utils/thaana.js';
import { SoundManager } from '../utils/SoundManager.js';

/**
 * Handles Thaana keyboard input for the game
 * Uses JTK (Javascript Thaana Keyboard) for phonetic input
 */
export class InputHandler {
  constructor(game) {
    this.game = game;
    this.currentInput = '';
    this.inputDisplay = document.getElementById('input-display');
    this.hiddenInput = document.getElementById('hidden-input');
    this.soundManager = new SoundManager();
    this.lastInputLength = 0; // Track input length to detect new characters
    this.musicStarted = false; // Track if background music has started

    // Statistics tracking
    this.correctInputs = 0;
    this.incorrectInputs = 0;
    this.totalCharactersTyped = 0;

    // Load sounds (music will start on first user interaction)
    this.soundManager.loadSounds();

    this.setupEventListeners();

    if (this.hiddenInput) {
      this.hiddenInput.focus();
    }
  }

  /**
   * Start background music on first user interaction
   */
  startMusicOnInteraction() {
    if (!this.musicStarted && this.soundManager.loaded) {
      this.soundManager.playBackground();
      this.musicStarted = true;
    }
  }

  setupEventListeners() {
    if (!this.hiddenInput) {
      return;
    }

    this.hiddenInput.addEventListener('keyup', (e) => {
      // Start music on first interaction
      this.startMusicOnInteraction();

      const value = e.target.value;

      // Validate input before accepting it
      this.validateAndUpdateInput(value);
    });

    this.hiddenInput.addEventListener('input', (e) => {
      // Start music on first interaction
      this.startMusicOnInteraction();

      const value = e.target.value;

      // Validate input before accepting it
      this.validateAndUpdateInput(value);
    });

    document.addEventListener('click', () => {
      // Start music on first click
      this.startMusicOnInteraction();

      if (this.hiddenInput) {
        this.hiddenInput.focus();
      }
    });

    this.hiddenInput.addEventListener('keydown', (e) => {
      // Start music on first keypress
      this.startMusicOnInteraction();

      if (e.key === 'Escape') {
        this.clear();
        e.preventDefault();
      }
    });
  }

  /**
   * Validate and update input - only accept characters that match targeted enemy
   * @param {string} newValue - New input value from text field
   */
  validateAndUpdateInput(newValue) {
    // If input is being cleared or shortened (backspace), always allow it
    if (newValue.length <= this.currentInput.length) {
      this.currentInput = newValue;
      this.checkMatches();
      return;
    }

    // Check if we have a targeted enemy
    const targetedEnemy = this.game.enemies.find(e => e.targeted);

    if (targetedEnemy) {
      // We have a locked target - validate the new input
      const normalizedNewValue = normalizeThaana(newValue);
      const normalizedTargetWord = normalizeThaana(targetedEnemy.word);

      // Check if the new input still matches the target
      if (normalizedTargetWord.startsWith(normalizedNewValue)) {
        // Valid input - accept it
        this.currentInput = newValue;
        this.soundManager.playShotgun();

        // Track statistics
        this.correctInputs++;
        this.totalCharactersTyped++;

        // Fire bullet at the enemy
        this.game.fireBullet(targetedEnemy);

        // Hit the enemy (reduce health by 1)
        targetedEnemy.hit(1);

        // Update typed characters count for visual feedback
        targetedEnemy.setTypedChars(normalizedNewValue.length);

        this.checkMatches();
      } else {
        // Invalid input - reject it and clear input field
        this.soundManager.playEmpty();

        // Track error
        this.incorrectInputs++;
        this.totalCharactersTyped++;

        // Clear the input completely to let user start fresh
        this.clear();
      }
    } else {
      // No locked target - accept any input and try to find a match
      this.currentInput = newValue;
      this.checkMatches();
    }
  }

  /**
   * Check if current input matches any enemy words
   */
  checkMatches() {
    if (!this.currentInput || this.currentInput.length === 0) {
      this.game.clearAllTargets();
      this.lastInputLength = 0;
      return;
    }

    const normalizedInput = normalizeThaana(this.currentInput);

    let foundMatch = false;
    let matchedEnemy = null;

    // Check if this is a new character being typed (used only for initial match sound)
    const isNewCharacter = this.currentInput.length > this.lastInputLength;

    for (const enemy of this.game.enemies) {
      const normalizedWord = normalizeThaana(enemy.word);

      if (normalizedWord.startsWith(normalizedInput)) {
        if (!foundMatch) {
          foundMatch = true;
          matchedEnemy = enemy;

          // Play shotgun sound ONLY when initially finding a match (not locked yet)
          // When locked, sound is played in validateAndUpdateInput
          if (isNewCharacter && !this.game.enemies.some(e => e.targeted)) {
            this.soundManager.playShotgun();
          }
        }

        if (normalizedInput === normalizedWord) {
          matchedEnemy = enemy;
          break;
        }
      }
    }

    // Play empty sound if no match found (only when not locked)
    if (!foundMatch && isNewCharacter && !this.game.enemies.some(e => e.targeted)) {
      this.soundManager.playEmpty();
    }

    for (const enemy of this.game.enemies) {
      if (enemy === matchedEnemy) {
        enemy.setTargeted(true);
        // Update typed characters count for visual feedback
        enemy.setTypedChars(normalizedInput.length);

        const normalizedWord = normalizeThaana(enemy.word);
        if (normalizedInput === normalizedWord) {
          this.handleCompleteMatch(enemy);
        }
      } else {
        enemy.setTargeted(false);
      }
    }

    // Update last input length
    this.lastInputLength = this.currentInput.length;

    return foundMatch;
  }

  /**
   * Handle when a word is completely typed
   */
  handleCompleteMatch(enemy) {
    enemy.destroy();

    const points = enemy.word.length * 10;
    this.game.addScore(points);

    this.clear();

    this.game.playSound('hit');
  }

  /**
   * Update the visual display of current input
   */
  updateDisplay() {
  }

  /**
   * Clear current input
   */
  clear() {
    this.currentInput = '';
    this.lastInputLength = 0;
    if (this.hiddenInput) {
      this.hiddenInput.value = '';
    }
    this.updateDisplay();
    this.game.clearAllTargets();
  }

  /**
   * Get current input text
   */
  getCurrentInput() {
    return this.currentInput;
  }

  /**
   * Get current typing statistics
   */
  getStatistics() {
    const accuracy = this.totalCharactersTyped > 0
      ? Math.round((this.correctInputs / this.totalCharactersTyped) * 100)
      : 100;

    return {
      correctInputs: this.correctInputs,
      incorrectInputs: this.incorrectInputs,
      totalCharactersTyped: this.totalCharactersTyped,
      accuracy: accuracy
    };
  }

  /**
   * Reset statistics for new wave
   */
  resetStatistics() {
    this.correctInputs = 0;
    this.incorrectInputs = 0;
    this.totalCharactersTyped = 0;
  }

  /**
   * Cleanup event listeners
   */
  destroy() {
  }
}
