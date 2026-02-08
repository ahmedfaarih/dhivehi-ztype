import './style.css';
import { Game } from './game/Game.js';
import { getWordStats } from './data/words.js';

/**
 * Main entry point for Dhivehi Type game
 */

let game = null;

/**
 * Wait for MV Waheed font to load, then initialize the game
 */
async function waitForFont() {
  try {
    // Wait for the MV Waheed font to be loaded
    if ('fonts' in document) {
      await document.fonts.load('20px "MV Waheed"');
      await document.fonts.ready;
    } else {
      // Fallback for browsers without Font Loading API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } catch (error) {
    // Continue anyway after short delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

/**
 * Initialize the game
 */
async function init() {
  const canvas = document.getElementById('gameCanvas');

  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  // Wait for font to be loaded before starting game
  await waitForFont();

  // Log word loading stats
  const wordStats = getWordStats();
  console.log('📚 Word files loaded:', wordStats.totalFiles, 'files (', wordStats.fileRange, ')');

  game = new Game(canvas);

  window.addEventListener('resize', () => {
    game.setupCanvas();
    game.particles.resize(game.width, game.height);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
      if (game.gameOver) {
        e.preventDefault(); // Prevent 'r' from being typed into input field
        e.stopPropagation();
        game.restart();
        // Clear the hidden input to ensure no stray 'r' character
        const hiddenInput = document.getElementById('hidden-input');
        if (hiddenInput) {
          hiddenInput.value = '';
        }
      }
    }
  });

  setTimeout(() => {
    const input = document.getElementById('hidden-input');
    if (input) {
      input.focus();
    }
  }, 100);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
