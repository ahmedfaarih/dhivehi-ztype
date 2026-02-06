import { normalizeThaana } from '../utils/thaana.js';

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

    console.log('InputHandler constructor called');
    console.log('Hidden input element:', this.hiddenInput);

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

      this.currentInput = value;

      this.checkMatches();
    });

    this.hiddenInput.addEventListener('input', (e) => {
      const value = e.target.value;

      console.log('INPUT EVENT - Value:', value);

      this.currentInput = value;

      this.checkMatches();
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
   * Check if current input matches any enemy words
   */
  checkMatches() {
    console.log('checkMatches called, currentInput:', this.currentInput);

    if (!this.currentInput || this.currentInput.length === 0) {
      this.game.clearAllTargets();
      return;
    }

    const normalizedInput = normalizeThaana(this.currentInput);
    console.log('Normalized input:', normalizedInput);
    console.log('Enemies count:', this.game.enemies.length);

    let foundMatch = false;
    let matchedEnemy = null;

    for (const enemy of this.game.enemies) {
      const normalizedWord = normalizeThaana(enemy.word);

      console.log(`Checking: "${enemy.word}" vs "${this.currentInput}"`);

      if (normalizedWord.startsWith(normalizedInput)) {
        if (!foundMatch) {
          foundMatch = true;
          matchedEnemy = enemy;
          console.log('✓ Match found:', enemy.word);
        }

        if (normalizedInput === normalizedWord) {
          matchedEnemy = enemy;
          console.log('✓✓ Complete match!');
          break;
        }
      }
    }

    if (!foundMatch) {
      console.log('No matches found');
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
