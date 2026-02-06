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

    console.log('InputHandler constructor called');
    console.log('Hidden input element:', this.hiddenInput);

    // Load sounds
    this.soundManager.loadSounds();

    this.setupEventListeners();

    if (this.hiddenInput) {
      this.hiddenInput.focus();
      console.log('✅ Input handler ready! JTK will handle phonetic conversion.');
    } else {
      console.error('❌ Hidden input not found!');
    }
  }

  setupEventListeners() {
    if (!this.hiddenInput) {
      console.error('Hidden input field not found!');
      return;
    }

    console.log('Setting up event listeners...');

    this.hiddenInput.addEventListener('keyup', (e) => {
      const value = e.target.value;

      console.log('KEYUP - Value:', value);

      // Validate input before accepting it
      this.validateAndUpdateInput(value);
    });

    this.hiddenInput.addEventListener('input', (e) => {
      const value = e.target.value;

      console.log('INPUT EVENT - Value:', value);

      // Validate input before accepting it
      this.validateAndUpdateInput(value);
    });

    document.addEventListener('click', () => {
      if (this.hiddenInput) {
        this.hiddenInput.focus();
      }
    });

    this.hiddenInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.clear();
        e.preventDefault();
      }
    });

    console.log('✅ Input listeners set up!');
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

      console.log(`Validating: "${newValue}" against locked target: "${targetedEnemy.word}"`);

      // Check if the new input still matches the target
      if (normalizedTargetWord.startsWith(normalizedNewValue)) {
        // Valid input - accept it
        console.log('✓ Valid character - accepting');
        this.currentInput = newValue;
        this.soundManager.playShotgun();

        // Hit the enemy (reduce health by 1)
        targetedEnemy.hit(1);

        this.checkMatches();
      } else {
        // Invalid input - reject it
        console.log('✗ Invalid character - rejecting');
        this.soundManager.playEmpty();

        // Revert the input field to the previous valid state
        this.hiddenInput.value = this.currentInput;
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
    console.log('checkMatches called, currentInput:', this.currentInput);

    if (!this.currentInput || this.currentInput.length === 0) {
      this.game.clearAllTargets();
      this.lastInputLength = 0;
      return;
    }

    const normalizedInput = normalizeThaana(this.currentInput);
    console.log('Normalized input:', normalizedInput);
    console.log('Enemies count:', this.game.enemies.length);

    let foundMatch = false;
    let matchedEnemy = null;

    // Check if this is a new character being typed (used only for initial match sound)
    const isNewCharacter = this.currentInput.length > this.lastInputLength;

    for (const enemy of this.game.enemies) {
      const normalizedWord = normalizeThaana(enemy.word);

      console.log(`Checking: "${enemy.word}" vs "${this.currentInput}"`);

      if (normalizedWord.startsWith(normalizedInput)) {
        if (!foundMatch) {
          foundMatch = true;
          matchedEnemy = enemy;
          console.log('✓ Match found:', enemy.word);

          // Play shotgun sound ONLY when initially finding a match (not locked yet)
          // When locked, sound is played in validateAndUpdateInput
          if (isNewCharacter && !this.game.enemies.some(e => e.targeted)) {
            this.soundManager.playShotgun();
          }
        }

        if (normalizedInput === normalizedWord) {
          matchedEnemy = enemy;
          console.log('✓✓ Complete match!');
          break;
        }
      }
    }

    // Play empty sound if no match found (only when not locked)
    if (!foundMatch && isNewCharacter && !this.game.enemies.some(e => e.targeted)) {
      console.log('No matches found - playing empty sound');
      this.soundManager.playEmpty();
    }

    for (const enemy of this.game.enemies) {
      if (enemy === matchedEnemy) {
        enemy.setTargeted(true);

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
    console.log('Complete match! Destroying enemy:', enemy.word);

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
    console.log('Clearing input');
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
   * Cleanup event listeners
   */
  destroy() {
  }
}
