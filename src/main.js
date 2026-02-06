import './style.css';
import { Game } from './game/Game.js';

/**
 * Main entry point for Dhivehi Type game
 */

let game = null;

/**
 * Initialize the game
 */
function init() {
  const canvas = document.getElementById('gameCanvas');

  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  game = new Game(canvas);

  window.addEventListener('resize', () => {
    game.setupCanvas();
    game.particles.resize(game.width, game.height);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
      if (game.gameOver) {
        game.restart();
      }
    }
  });

  setTimeout(() => {
    const input = document.getElementById('hidden-input');
    if (input) {
      input.focus();
      console.log('🎯 Input field focused and ready!');
    }
  }, 100);

  console.log('🎮 Dhivehi Type - Game initialized!');
  console.log('📝 Start typing to play - JTK will convert English to Thaana!');
  console.log('Press R to restart when game is over.');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
