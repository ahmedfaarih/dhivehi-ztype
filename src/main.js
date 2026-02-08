import './style-new.css';
import { Game } from './game/Game.js';
import { getWordStats } from './data/words.js';
import { FirebaseService } from './services/FirebaseService.js';
import { AuthUI } from './ui/AuthUI.js';
import { ScoreboardUI } from './ui/ScoreboardUI.js';
import { LiveScoreboard } from './ui/LiveScoreboard.js';

/**
 * Main entry point for Dhivehi Type game
 */

let game = null;
let firebaseService = null;
let authUI = null;
let scoreboardUI = null;
let liveScoreboard = null;

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

  // Initialize Firebase and UI components
  firebaseService = new FirebaseService();
  authUI = new AuthUI(firebaseService);
  scoreboardUI = new ScoreboardUI(firebaseService);
  liveScoreboard = new LiveScoreboard(firebaseService);

  // Initialize game
  game = new Game(canvas, firebaseService);

  window.addEventListener('resize', () => {
    game.setupCanvas();
    game.particles.resize(game.width, game.height);
  });

  // R key to restart
  document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
      if (game.gameOver) {
        e.preventDefault();
        e.stopPropagation();
        game.restart();
        const hiddenInput = document.getElementById('hidden-input');
        if (hiddenInput) {
          hiddenInput.value = '';
        }
      }
    }
  });

  // Focus game input immediately - don't ask for login on startup
  setTimeout(() => {
    const input = document.getElementById('hidden-input');
    if (input) input.focus();
  }, 100);

  // Expose functions globally for game over screen
  window.showScoreboard = () => scoreboardUI.show();
  window.showAuthUI = (callback) => authUI.show(callback);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
