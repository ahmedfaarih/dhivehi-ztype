import './style.css';
import { Game } from './game/Game.js';

/**
 * Main entry point for Dhivehi Type game
 */

let game = null;

/**
 * Wait for A_Waheed font to load, then initialize the game
 */
async function waitForFont() {
  try {
    console.log('⏳ Loading A_Waheed font...');

    // Wait for the A_Waheed font to be loaded
    if ('fonts' in document) {
      await document.fonts.load('20px "A_Waheed"');
      await document.fonts.ready;

      // Verify the font is actually loaded
      const fontLoaded = document.fonts.check('20px "A_Waheed"');
      console.log('✅ A_Waheed font loaded successfully!');
      console.log('🔍 Font check result:', fontLoaded);

      // List all loaded fonts
      const loadedFonts = [...document.fonts.values()].map(f => `${f.family} (${f.status})`);
      console.log('📋 All loaded fonts:', loadedFonts);

      // Create a test element to visually verify the font
      createFontTestElement();
    } else {
      // Fallback for browsers without Font Loading API
      console.log('⚠️ Font Loading API not supported, waiting 500ms...');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } catch (error) {
    console.error('❌ Error loading font:', error);
    // Continue anyway after short delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

/**
 * Create a visual test element to verify A_Waheed font is rendering
 */
function createFontTestElement() {
  const testDiv = document.createElement('div');
  testDiv.id = 'font-test';
  testDiv.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px;
    z-index: 10000;
    font-size: 24px;
    border: 2px solid #00ff88;
    border-radius: 5px;
  `;

  testDiv.innerHTML = `
    <div style="font-family: 'A_Waheed', Arial, sans-serif; margin-bottom: 5px;">
      A_Waheed: ދިވެހި ބަސް
    </div>
    <div style="font-family: Arial, sans-serif; margin-bottom: 5px;">
      Arial: ދިވެހި ބަސް
    </div>
    <div style="font-size: 12px; color: #00bbff;">
      Click to remove this test
    </div>
  `;

  testDiv.onclick = () => testDiv.remove();
  document.body.appendChild(testDiv);

  // Auto-remove after 10 seconds
  setTimeout(() => testDiv.remove(), 10000);

  console.log('🎨 Font test element created (top-left corner, click to remove)');
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
