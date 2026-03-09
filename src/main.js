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
    if ('fonts' in document) {
      await document.fonts.load('20px "MV Waheed"');
      await document.fonts.ready;
    } else {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } catch (error) {
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

  await waitForFont();

  const wordStats = getWordStats();
  console.log('📚 Word files loaded:', wordStats.totalFiles, 'files (', wordStats.fileRange, ')');

  firebaseService = new FirebaseService();
  authUI = new AuthUI(firebaseService);
  scoreboardUI = new ScoreboardUI(firebaseService);
  liveScoreboard = new LiveScoreboard(firebaseService);

  game = new Game(canvas, firebaseService);

  window.addEventListener('resize', () => {
    game.setupCanvas();
    game.particles.resize(game.width, game.height);
  });

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

  setTimeout(() => {
    const input = document.getElementById('hidden-input');
    if (input) input.focus();
  }, 100);

  window.showScoreboard = () => scoreboardUI.show();
  window.showAuthUI = (callback) => authUI.show(callback);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
