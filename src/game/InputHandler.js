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
    this.lastInputLength = 0; 
    this.musicStarted = false; 

    
    this.correctInputs = 0;
    this.incorrectInputs = 0;
    this.totalCharactersTyped = 0;

    
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
      
      this.startMusicOnInteraction();

      const value = e.target.value;

      
      this.validateAndUpdateInput(value);
    });

    this.hiddenInput.addEventListener('input', (e) => {
      
      this.startMusicOnInteraction();

      const value = e.target.value;

      
      this.validateAndUpdateInput(value);
    });

    document.addEventListener('click', () => {
      
      this.startMusicOnInteraction();

      if (this.hiddenInput) {
        this.hiddenInput.focus();
      }
    });

    this.hiddenInput.addEventListener('keydown', (e) => {
      
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
    
    if (newValue.length <= this.currentInput.length) {
      this.currentInput = newValue;
      this.checkMatches();
      return;
    }

    
    const targetedEnemy = this.game.enemies.find(e => e.targeted);

    if (targetedEnemy) {
      
      const normalizedNewValue = normalizeThaana(newValue);
      const normalizedTargetWord = normalizeThaana(targetedEnemy.word);

      
      if (normalizedTargetWord.startsWith(normalizedNewValue)) {
        
        this.currentInput = newValue;
        this.soundManager.playShotgun();

        
        this.correctInputs++;
        this.totalCharactersTyped++;

        
        this.game.fireBullet(targetedEnemy);

        
        targetedEnemy.hit(1);

        
        targetedEnemy.setTypedChars(normalizedNewValue.length);

        
        if (normalizedNewValue === normalizedTargetWord) {
          this.handleCompleteMatch(targetedEnemy);
        }
      } else {
        
        this.soundManager.playEmpty();

        
        this.incorrectInputs++;
        this.totalCharactersTyped++;

        
        if (this.hiddenInput) {
          this.hiddenInput.value = this.currentInput;
        }
      }
    } else {
      
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

    
    const isNewCharacter = this.currentInput.length > this.lastInputLength;

    for (const enemy of this.game.enemies) {
      const normalizedWord = normalizeThaana(enemy.word);

      if (normalizedWord.startsWith(normalizedInput)) {
        if (!foundMatch) {
          foundMatch = true;
          matchedEnemy = enemy;

          
          
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

    
    if (!foundMatch && isNewCharacter && !this.game.enemies.some(e => e.targeted)) {
      this.soundManager.playEmpty();
    }

    for (const enemy of this.game.enemies) {
      if (enemy === matchedEnemy) {
        const wasAlreadyTargeted = enemy.targeted;
        enemy.setTargeted(true);

        
        enemy.setTypedChars(normalizedInput.length);

        
        
        if (!wasAlreadyTargeted && isNewCharacter) {
          
          this.correctInputs++;
          this.totalCharactersTyped++;

          this.game.fireBullet(enemy);
          enemy.hit(1);
        }

        const normalizedWord = normalizeThaana(enemy.word);
        if (normalizedInput === normalizedWord) {
          this.handleCompleteMatch(enemy);
        }
      } else {
        enemy.setTargeted(false);
      }
    }

    
    this.lastInputLength = this.currentInput.length;

    return foundMatch;
  }

  /**
   * Handle when a word is completely typed
   */
  handleCompleteMatch(enemy) {
    enemy.destroy();

    
    const points = enemy.word.length * 2;
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
