import { Player } from './Player.js';
import { Enemy } from './Enemy.js';
import { InputHandler } from './InputHandler.js';
import { ParticleSystem } from './ParticleSystem.js';
import { Bullet } from './Bullet.js';
import { getRandomWord, getDifficultyForWave } from '../data/words.js';
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

    // Timing
    this.lastTime = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 4.0; // seconds between spawns (slowed down from 2.5)
    this.waveTimer = 0;
    this.waveDuration = 45; // seconds per wave (increased from 30)

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

    // Spawn enemies
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnEnemy();
      this.spawnTimer = 0;
    }

    // Wave progression
    this.waveTimer += dt;
    if (this.waveTimer >= this.waveDuration) {
      this.nextWave();
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

    // Draw game over screen
    if (this.gameOver) {
      this.drawGameOver();
    }
  }

  /**
   * Spawn a new enemy
   */
  spawnEnemy() {
    const difficulty = getDifficultyForWave(this.wave);
    const word = getRandomWord(difficulty);

    // Random X position (avoid edges)
    const x = Math.random() * (this.width - 200) + 100;

    // Speed increases with wave (slower progression)
    const speed = 60 + this.wave * 3;

    const enemy = new Enemy(word, x, -50, speed, this.player);
    this.enemies.push(enemy);
  }

  /**
   * Progress to next wave
   */
  nextWave() {
    this.wave++;
    this.waveTimer = 0;

    // Increase difficulty (slower progression)
    this.spawnInterval = Math.max(2.0, this.spawnInterval - 0.15);

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
   * Draw game over screen
   */
  drawGameOver() {
    this.ctx.save();

    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Game Over text
    this.ctx.fillStyle = '#ff4466';
    this.ctx.font = 'bold 64px "MV Waheed", Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = '#ff4466';
    this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 50);

    // Final score
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '32px "MV Waheed", Arial, sans-serif';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = '#ffffff';
    this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 + 20);
    this.ctx.fillText(`Wave: ${this.wave}`, this.width / 2, this.height / 2 + 60);

    // Restart instruction
    this.ctx.fillStyle = '#00bbff';
    this.ctx.font = '24px "MV Waheed", Arial, sans-serif';
    this.ctx.fillText('Press R to Restart', this.width / 2, this.height / 2 + 120);

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
    this.spawnTimer = 0;
    this.waveTimer = 0;
    this.spawnInterval = 4.0;
    this.enemies = [];
    this.bullets = [];
    this.player.lives = this.player.maxLives;
    this.player.x = this.width / 2;
    this.player.y = this.height - 80;
    this.particles.createStarfield(150);
    this.updateUI();
    this.input.clear();
  }
}
