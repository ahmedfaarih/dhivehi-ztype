import { Player } from './Player.js';
import { Enemy } from './Enemy.js';
import { InputHandler } from './InputHandler.js';
import { ParticleSystem } from './ParticleSystem.js';
import { Bullet } from './Bullet.js';
import { getRandomWord } from '../data/words.js';
import backgroundImageUrl from '../images/bg_space_seamless.png';

/**
 * Main Game class
 */
export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Game dimensions
    this.width = 1200;
    this.height = 700;
    this.setupCanvas();

    // Game state
    this.score = 0;
    this.wave = 1;
    this.gameOver = false;
    this.paused = false;
    this.waveClear = false; // Wave clear screen state
    this.waveStats = null; // Store stats for wave clear screen

    // Timing
    this.lastTime = 0;
    this.spawnInterval = this.getSpawnIntervalForWave(this.wave); // seconds between enemy spawns
    this.spawnTimer = this.spawnInterval; // Start at spawn interval so first enemy spawns immediately
    this.waveStartTime = Date.now(); // Track wave start time for WPM calculation

    // Wave-based enemy system
    this.enemiesSpawnedThisWave = 0;
    this.totalEnemiesThisWave = this.getEnemyCountForWave(this.wave);

    // Wave clear animation
    this.waveClearAlpha = 0; // Fade opacity (0-1)
    this.waveClearTimer = 0; // Time since wave clear started
    this.waveClearDuration = 4.0; // Total duration to show wave clear (seconds)

    // Cumulative statistics across all waves
    this.totalStats = {
      totalWavesCompleted: 0,
      totalScore: 0,
      totalCorrectInputs: 0,
      totalIncorrectInputs: 0,
      totalPlayTime: 0
    };

    // Game objects
    this.player = new Player(this.width / 2, this.height - 80);
    this.enemies = [];
    this.bullets = [];
    this.particles = new ParticleSystem(this.width, this.height);
    this.input = new InputHandler(this);

    // UI elements
    this.scoreElement = document.getElementById('score');
    this.waveElement = document.getElementById('wave');
    this.healthSegments = document.querySelectorAll('.health-segment');

    // Sound (simple oscillator-based sounds)
    this.audioContext = null;
    this.initAudio();

    // Load background image
    this.backgroundImage = new Image();
    this.backgroundImage.src = backgroundImageUrl;
    this.backgroundImageLoaded = false;
    this.backgroundScrollY = 0; // Background scroll position
    this.backgroundScrollSpeed = 20; // Pixels per second
    this.backgroundImage.onload = () => {
      this.backgroundImageLoaded = true;
    };

    // Font loading
    this.fontLoaded = false;
    this.loadFont();

    // Initialize
    this.init();
  }

  /**
   * Load and ensure Waheed font is ready
   */
  async loadFont() {
    try {
      // Check if the browser supports the Font Loading API
      if ('fonts' in document) {
        // Load the MV Waheed font
        await document.fonts.load('20px "MV Waheed"');
        this.fontLoaded = true;
      } else {
        // Fallback for older browsers - assume font loads via CSS
        this.fontLoaded = true;
      }
    } catch (error) {
      this.fontLoaded = true; // Continue anyway with fallback
    }
  }

  /**
   * Setup canvas size and resolution
   */
  setupCanvas() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Enable high-DPI display support
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);

    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';

    // Use simpler dimensions for game logic
    this.width = rect.width;
    this.height = rect.height;
  }

  /**
   * Initialize game
   */
  init() {
    // Create starfield background
    this.particles.createStarfield(150);

    // Update UI
    this.updateUI();

    // Start game loop
    this.gameLoop(0);
  }

  /**
   * Initialize audio context
   */
  initAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      // Web Audio API not supported
    }
  }

  /**
   * Main game loop
   * @param {number} timestamp - Current timestamp
   */
  gameLoop(timestamp) {
    // Calculate delta time
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;
    const dt = deltaTime / 1000; // Convert to seconds

    // Update and render
    if (!this.gameOver && !this.paused) {
      this.update(dt);
    }
    this.render();

    // Continue loop
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  /**
   * Update game state
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // Update background scroll
    if (this.backgroundImageLoaded) {
      this.backgroundScrollY += this.backgroundScrollSpeed * dt;
      // Reset when scrolled one full image height (seamless loop)
      if (this.backgroundScrollY >= this.backgroundImage.height) {
        this.backgroundScrollY = 0;
      }
    }

    // Update player
    this.player.update(dt);

    // Update particles
    this.particles.update(dt);

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.update(dt);

      // Remove dead bullets
      if (!bullet.isAlive()) {
        this.bullets.splice(i, 1);
      }
    }

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(dt);

      // Remove dead enemies
      if (!enemy.isAlive()) {
        // If this enemy was targeted, clear the input
        if (enemy.targeted) {
          this.input.clear();
        }
        this.enemies.splice(i, 1);
        continue;
      }

      // Check if enemy reached bottom or collided with player
      if ((enemy.isOffScreen(this.height + 50) || this.checkCollision(enemy, this.player)) && !enemy.dying) {
        this.player.takeDamage();
        this.updateUI();
        this.playSound('damage');
        enemy.destroy(); // Destroy the enemy on contact

        // Check game over
        if (!this.player.isAlive()) {
          this.endGame();
        }
      }
    }

    // Update player target
    const targetedEnemy = this.enemies.find(e => e.targeted);
    this.player.setTarget(targetedEnemy || null);

    // Handle wave clear animation and auto-transition
    if (this.waveClear) {
      this.waveClearTimer += dt;

      // Fade in (first 0.5 seconds)
      if (this.waveClearTimer < 0.5) {
        this.waveClearAlpha = this.waveClearTimer / 0.5;
      }
      // Hold (middle duration)
      else if (this.waveClearTimer < this.waveClearDuration - 0.5) {
        this.waveClearAlpha = 1.0;
      }
      // Fade out (last 0.5 seconds)
      else if (this.waveClearTimer < this.waveClearDuration) {
        this.waveClearAlpha = (this.waveClearDuration - this.waveClearTimer) / 0.5;
      }
      // Auto-continue to next wave
      else {
        this.continueToNextWave();
      }
    } else {
      // Spawn enemies one at a time until wave quota is met
      this.spawnTimer += dt;
      if (this.spawnTimer >= this.spawnInterval) {
        if (this.enemiesSpawnedThisWave < this.totalEnemiesThisWave) {
          this.spawnEnemy();
          this.spawnTimer = 0;
        }
      }

      // Check if wave is complete (all enemies destroyed)
      if (this.enemiesSpawnedThisWave >= this.totalEnemiesThisWave && this.enemies.length === 0) {
        this.showWaveClear();
      }
    }
  }

  /**
   * Render game
   */
  render() {
    // Clear canvas with solid color (fallback)
    this.ctx.fillStyle = '#000814';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw scrolling background image if loaded
    if (this.backgroundImageLoaded) {
      const bgWidth = this.backgroundImage.width;
      const bgHeight = this.backgroundImage.height;

      // Calculate how many times to tile horizontally
      const tilesX = Math.ceil(this.width / bgWidth) + 1;
      const tilesY = 2; // Always draw 2 vertically for seamless loop

      // Draw background tiles with vertical scroll offset
      for (let x = 0; x < tilesX; x++) {
        for (let y = 0; y < tilesY; y++) {
          const drawY = y * bgHeight - this.backgroundScrollY;
          this.ctx.drawImage(
            this.backgroundImage,
            x * bgWidth,
            drawY,
            bgWidth,
            bgHeight
          );
        }
      }
    }

    // Draw starfield on top for depth effect
    this.particles.draw(this.ctx);

    // Draw bullets
    for (const bullet of this.bullets) {
      bullet.draw(this.ctx);
    }

    // Draw enemies
    for (const enemy of this.enemies) {
      enemy.draw(this.ctx);
    }

    // Draw player
    this.player.draw(this.ctx);

    // Draw wave clear screen
    if (this.waveClear && this.waveStats) {
      this.drawWaveClear();
    }

    // Draw game over screen
    if (this.gameOver) {
      this.drawGameOver();
    }
  }

  /**
   * Get number of enemies for a specific wave
   * @param {number} wave - Wave number
   * @returns {number} Number of enemies to spawn
   */
  getEnemyCountForWave(wave) {
    if (wave === 1) return 4;  // Wave 1: Easy start with 4 enemies
    if (wave === 2) return 6;  // Wave 2: 6 enemies
    if (wave === 3) return 8;  // Wave 3: 8 enemies
    if (wave <= 5) return 10; // Waves 4-5: 10 enemies
    if (wave <= 8) return 12; // Waves 6-8: 12 enemies
    return 15; // Wave 9+: 15 enemies
  }

  /**
   * Get spawn interval for a specific wave
   * @param {number} wave - Wave number
   * @returns {number} Seconds between spawns
   */
  getSpawnIntervalForWave(wave) {
    if (wave === 1) return 6.0;  // Wave 1: Very slow (6 seconds)
    if (wave === 2) return 4.5;  // Wave 2: Slower (4.5 seconds)
    if (wave === 3) return 3.5;  // Wave 3: Medium (3.5 seconds)
    if (wave <= 5) return 3.0;   // Waves 4-5: Normal (3 seconds)
    if (wave <= 8) return 2.5;   // Waves 6-8: Faster (2.5 seconds)
    return 2.0; // Wave 9+: Fast (2 seconds)
  }

  /**
   * Spawn a new enemy
   */
  spawnEnemy() {
    // Get word for current wave with progressive difficulty
    let maxLength = null;

    // Progressive word length based on wave
    if (this.wave <= 3) {
      maxLength = 5; // Waves 1-3: Short words (3-5 letters)
    } else if (this.wave <= 6) {
      maxLength = 8; // Waves 4-6: Medium words (3-8 letters)
    } else if (this.wave <= 10) {
      maxLength = 12; // Waves 7-10: Longer words (3-12 letters)
    }
    // Wave 11+: No limit, all word lengths allowed

    const word = getRandomWord(this.wave, maxLength);

    // Random X position (avoid edges)
    const x = Math.random() * (this.width - 200) + 100;

    // Speed increases with wave but starts very slow for wave 1
    let speed;
    if (this.wave === 1) {
      speed = 20; // Very slow for wave 1
    } else if (this.wave === 2) {
      speed = 25; // Slow for wave 2
    } else {
      speed = 30 + (this.wave - 2) * 5; // Progressive speed increase
    }

    const enemy = new Enemy(word, x, -50, speed, this.player);
    this.enemies.push(enemy);

    // Increment spawn counter
    this.enemiesSpawnedThisWave++;
  }


  /**
   * Show wave clear screen with statistics
   */
  showWaveClear() {
    // Calculate wave duration in minutes
    const waveEndTime = Date.now();
    const waveDurationMs = waveEndTime - this.waveStartTime;
    const waveDurationMinutes = waveDurationMs / 60000;

    // Get typing statistics from input handler
    const stats = this.input.getStatistics();

    // Calculate WPM (words = characters / 5)
    const words = stats.correctInputs / 5;
    const wpm = waveDurationMinutes > 0 ? Math.round(words / waveDurationMinutes) : 0;

    // Accumulate stats across waves
    this.totalStats.totalWavesCompleted++;
    this.totalStats.totalScore = this.score;
    this.totalStats.totalCorrectInputs += stats.correctInputs;
    this.totalStats.totalIncorrectInputs += stats.incorrectInputs;
    this.totalStats.totalPlayTime += waveDurationMs;

    // Store stats for display
    this.waveStats = {
      wave: this.wave,
      score: this.score,
      wpm: wpm,
      accuracy: stats.accuracy,
      correctInputs: stats.correctInputs,
      incorrectInputs: stats.incorrectInputs
    };

    // Start wave clear animation (don't pause game)
    this.waveClear = true;
    this.waveClearTimer = 0;
    this.waveClearAlpha = 0;

    // Clear all enemies from screen
    this.enemies = [];
  }

  /**
   * Continue to next wave after wave clear screen
   */
  continueToNextWave() {
    this.wave++;
    this.waveStartTime = Date.now();

    // Reset wave-specific counters
    this.enemiesSpawnedThisWave = 0;
    this.totalEnemiesThisWave = this.getEnemyCountForWave(this.wave);
    this.spawnTimer = this.spawnInterval; // Reset to spawn interval so first enemy spawns immediately

    // Reset statistics for new wave
    this.input.resetStatistics();

    // Update spawn interval for new wave
    this.spawnInterval = this.getSpawnIntervalForWave(this.wave);

    // Reset wave clear animation
    this.waveClear = false;
    this.waveStats = null;
    this.waveClearTimer = 0;
    this.waveClearAlpha = 0;

    this.updateUI();
    this.playSound('wave');
  }

  /**
   * Add score
   * @param {number} points - Points to add
   */
  addScore(points) {
    this.score += points;
    this.updateUI();
  }

  /**
   * Update UI elements
   */
  updateUI() {
    if (this.scoreElement) {
      this.scoreElement.textContent = `ސްކޯ: ${this.score}`;
    }
    if (this.waveElement) {
      this.waveElement.textContent = `ވޭވް: ${this.wave}`;
    }

    // Update health bar segments
    const currentLives = this.player.getLives();
    this.healthSegments.forEach((segment, index) => {
      if (index < currentLives) {
        segment.classList.remove('lost');
      } else {
        segment.classList.add('lost');
      }
    });
  }

  /**
   * Clear all enemy targets
   */
  clearAllTargets() {
    for (const enemy of this.enemies) {
      enemy.setTargeted(false);
    }
  }

  /**
   * Fire a bullet at an enemy
   * @param {Enemy} enemy - Target enemy
   */
  fireBullet(enemy) {
    if (enemy) {
      const bullet = new Bullet(
        this.player.x,
        this.player.y,
        enemy.x,
        enemy.y
      );
      this.bullets.push(bullet);
    }
  }

  /**
   * Check collision between enemy and player
   * @param {Enemy} enemy - Enemy object
   * @param {Player} player - Player object
   * @returns {boolean} True if colliding
   */
  checkCollision(enemy, player) {
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = enemy.size + player.size;
    return distance < minDistance;
  }

  /**
   * End game
   */
  endGame() {
    this.gameOver = true;
    this.playSound('gameover');
  }

  /**
   * Draw wave clear screen with statistics (subtle overlay with fade)
   */
  drawWaveClear() {
    this.ctx.save();

    // Apply global alpha for fade effect
    this.ctx.globalAlpha = this.waveClearAlpha;

    // Subtle semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 15, 30, 0.6)'; // Dark blue space theme
    this.ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // Wave clear text with glow
    this.ctx.fillStyle = '#00ff88';
    this.ctx.font = 'bold 40px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = '#00ff8866';

    const waveText = `WAVE ${String(this.waveStats.wave).padStart(3, '0')} CLEAR`;
    this.ctx.fillText(waveText, centerX, centerY - 120);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '26px Arial, sans-serif';
    this.ctx.shadowBlur = 8;
    this.ctx.shadowColor = '#ffffff44';
    this.ctx.fillText(`SCORE: ${String(this.waveStats.score).padStart(6, '0')}`, centerX, centerY - 70);

    const boxY = centerY - 20;
    const lineHeight = 38;

    this.ctx.fillStyle = '#00bbff';
    this.ctx.font = '24px Arial, sans-serif';
    this.ctx.shadowBlur = 8;
    this.ctx.shadowColor = '#00bbff44';
    this.ctx.fillText(`WPM: ${this.waveStats.wpm}`, centerX, boxY);

    // Accuracy
    this.ctx.fillStyle = this.waveStats.accuracy >= 90 ? '#00ff88' :
                         this.waveStats.accuracy >= 70 ? '#ffaa00' : '#ff4466';
    this.ctx.fillText(`ACCURACY: ${this.waveStats.accuracy}%`, centerX, boxY + lineHeight);

    this.ctx.fillStyle = '#aaaaaa';
    this.ctx.font = '20px Arial, sans-serif';
    this.ctx.shadowBlur = 5;
    this.ctx.fillText(
      `Correct: ${this.waveStats.correctInputs} | Errors: ${this.waveStats.incorrectInputs}`,
      centerX,
      boxY + lineHeight * 2
    );

    this.ctx.restore();
  }

  /**
   * Draw game over screen
   */
  drawGameOver() {
    this.ctx.save();

    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // Game Over text
    this.ctx.fillStyle = '#ff4466';
    this.ctx.font = 'bold 64px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = '#ff4466';
    this.ctx.fillText('GAME OVER', centerX, centerY - 160);

    // Final statistics
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '32px Arial, sans-serif';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = '#ffffff';
    this.ctx.fillText(`FINAL SCORE: ${String(this.score).padStart(6, '0')}`, centerX, centerY - 90);

    // Total waves completed
    this.ctx.font = '28px Arial, sans-serif';
    this.ctx.fillText(`Waves Completed: ${this.totalStats.totalWavesCompleted}`, centerX, centerY - 40);

    // Calculate overall accuracy
    const totalInputs = this.totalStats.totalCorrectInputs + this.totalStats.totalIncorrectInputs;
    const overallAccuracy = totalInputs > 0
      ? Math.round((this.totalStats.totalCorrectInputs / totalInputs) * 100)
      : 100;

    // Calculate overall WPM
    const totalMinutes = this.totalStats.totalPlayTime / 60000;
    const totalWords = this.totalStats.totalCorrectInputs / 5;
    const overallWPM = totalMinutes > 0 ? Math.round(totalWords / totalMinutes) : 0;

    // Overall WPM
    this.ctx.fillStyle = '#00bbff';
    this.ctx.font = '26px Arial, sans-serif';
    this.ctx.fillText(`Overall WPM: ${overallWPM}`, centerX, centerY + 10);

    // Overall Accuracy
    this.ctx.fillStyle = overallAccuracy >= 90 ? '#00ff88' :
                         overallAccuracy >= 70 ? '#ffaa00' : '#ff4466';
    this.ctx.fillText(`Overall Accuracy: ${overallAccuracy}%`, centerX, centerY + 50);

    // Total correct/incorrect
    this.ctx.fillStyle = '#cccccc';
    this.ctx.font = '22px Arial, sans-serif';
    this.ctx.fillText(
      `Total Correct: ${this.totalStats.totalCorrectInputs} | Errors: ${this.totalStats.totalIncorrectInputs}`,
      centerX,
      centerY + 90
    );

    // Restart instruction
    this.ctx.fillStyle = '#00bbff';
    this.ctx.font = 'bold 26px Arial, sans-serif';
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = '#00bbff';
    this.ctx.fillText('Press R to Restart', centerX, centerY + 150);

    this.ctx.restore();
  }

  /**
   * Play sound effect
   * @param {string} type - Sound type ('hit', 'damage', 'wave', 'gameover')
   */
  playSound(type) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    const now = this.audioContext.currentTime;

    switch (type) {
      case 'hit':
        oscillator.frequency.setValueAtTime(800, now);
        oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
        break;

      case 'damage':
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.3);
        gainNode.gain.setValueAtTime(0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;

      case 'wave':
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.2);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
        break;

      case 'gameover':
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.5);
        gainNode.gain.setValueAtTime(0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
        break;
    }
  }

  /**
   * Restart game
   */
  restart() {
    this.score = 0;
    this.wave = 1;
    this.gameOver = false;
    this.waveClear = false;
    this.waveStats = null;
    this.waveStartTime = Date.now();
    this.spawnInterval = this.getSpawnIntervalForWave(this.wave);
    this.spawnTimer = this.spawnInterval; // Start at spawn interval so first enemy spawns immediately

    // Reset wave-based enemy system
    this.enemiesSpawnedThisWave = 0;
    this.totalEnemiesThisWave = this.getEnemyCountForWave(this.wave);

    // Reset wave clear animation
    this.waveClearAlpha = 0;
    this.waveClearTimer = 0;

    // Reset cumulative stats
    this.totalStats = {
      totalWavesCompleted: 0,
      totalScore: 0,
      totalCorrectInputs: 0,
      totalIncorrectInputs: 0,
      totalPlayTime: 0
    };

    this.enemies = [];
    this.bullets = [];
    this.player.lives = this.player.maxLives;
    this.player.x = this.width / 2;
    this.player.y = this.height - 80;
    this.particles.createStarfield(150);
    this.updateUI();
    this.input.clear();
    this.input.resetStatistics();
  }
}
