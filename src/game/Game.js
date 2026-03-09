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
  constructor(canvas, firebaseService = null) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.firebaseService = firebaseService;

    
    this.width = 1200;
    this.height = 700;
    this.setupCanvas();

    
    this.score = 0;
    this.wave = 1;
    this.gameOver = false;
    this.paused = false;
    this.waveClear = false; 
    this.waveStats = null; 

    
    this.lastTime = 0;
    this.spawnInterval = this.getSpawnIntervalForWave(this.wave); 
    this.spawnTimer = this.spawnInterval; 
    this.waveStartTime = Date.now(); 
    this.uiUpdateTimer = 0; 

    
    this.enemiesSpawnedThisWave = 0;
    this.totalEnemiesThisWave = this.getEnemyCountForWave(this.wave);

    
    this.waveClearAlpha = 0; 
    this.waveClearTimer = 0; 
    this.waveClearDuration = 4.0; 

    
    this.totalStats = {
      totalWavesCompleted: 0,
      totalScore: 0,
      totalCorrectInputs: 0,
      totalIncorrectInputs: 0,
      totalPlayTime: 0
    };

    
    this.player = new Player(this.width / 2, this.height - 80);
    this.enemies = [];
    this.bullets = [];
    this.particles = new ParticleSystem(this.width, this.height);
    this.input = new InputHandler(this);

    
    this.scoreElement = document.getElementById('score-value');
    this.levelElement = document.getElementById('level-value');
    this.wpmElement = document.getElementById('wpm-value');
    this.accuracyElement = document.getElementById('accuracy-value');
    this.healthSegments = document.querySelectorAll('.health-segment');

    
    this.audioContext = null;
    this.initAudio();

    
    this.backgroundImage = new Image();
    this.backgroundImage.src = backgroundImageUrl;
    this.backgroundImageLoaded = false;
    this.backgroundScrollY = 0; 
    this.backgroundScrollSpeed = 20; 
    this.backgroundImage.onload = () => {
      this.backgroundImageLoaded = true;
    };

    
    this.fontLoaded = false;
    this.loadFont();

    
    this.init();
  }

  /**
   * Load and ensure Waheed font is ready
   */
  async loadFont() {
    try {
      
      if ('fonts' in document) {
        
        await document.fonts.load('20px "MV Waheed"');
        this.fontLoaded = true;
      } else {
        
        this.fontLoaded = true;
      }
    } catch (error) {
      this.fontLoaded = true; 
    }
  }

  /**
   * Setup canvas size and resolution
   */
  setupCanvas() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);

    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';

    
    this.width = rect.width;
    this.height = rect.height;

    
    if (this.player) {
      this.player.y = this.height - 80;
      this.player.x = this.width / 2;
    }
  }

  /**
   * Initialize game
   */
  init() {
    
    this.particles.createStarfield(150);

    
    this.updateUI();

    
    this.gameLoop(0);
  }

  /**
   * Initialize audio context
   */
  initAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      
    }
  }

  /**
   * Main game loop
   * @param {number} timestamp - Current timestamp
   */
  gameLoop(timestamp) {
    
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;
    const dt = deltaTime / 1000; 

    
    if (!this.gameOver && !this.paused) {
      this.update(dt);
    }
    this.render();

    
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  /**
   * Update game state
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    
    if (this.backgroundImageLoaded) {
      this.backgroundScrollY += this.backgroundScrollSpeed * dt;
      
      if (this.backgroundScrollY >= this.backgroundImage.height) {
        this.backgroundScrollY = 0;
      }
    }

    
    this.uiUpdateTimer += dt;
    if (this.uiUpdateTimer >= 1.0) {
      this.updateUI();
      this.uiUpdateTimer = 0;
    }

    
    this.player.update(dt);

    
    this.particles.update(dt);

    
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.update(dt);

      
      if (!bullet.isAlive()) {
        this.bullets.splice(i, 1);
      }
    }

    
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(dt);

      
      if (!enemy.isAlive()) {
        
        if (enemy.targeted) {
          this.input.clear();
        }
        this.enemies.splice(i, 1);
        continue;
      }

      
      if ((enemy.isOffScreen(this.height + 50) || this.checkCollision(enemy, this.player)) && !enemy.dying) {
        this.player.takeDamage();
        this.updateUI();
        this.playSound('damage');
        enemy.destroy(); 

        
        if (!this.player.isAlive()) {
          this.endGame();
        }
      }
    }

    
    const targetedEnemy = this.enemies.find(e => e.targeted);
    this.player.setTarget(targetedEnemy || null);

    
    if (this.waveClear) {
      this.waveClearTimer += dt;

      
      if (this.waveClearTimer < 0.5) {
        this.waveClearAlpha = this.waveClearTimer / 0.5;
      }
      
      else if (this.waveClearTimer < this.waveClearDuration - 0.5) {
        this.waveClearAlpha = 1.0;
      }
      
      else if (this.waveClearTimer < this.waveClearDuration) {
        this.waveClearAlpha = (this.waveClearDuration - this.waveClearTimer) / 0.5;
      }
      
      else {
        this.continueToNextWave();
      }
    } else {
      
      this.spawnTimer += dt;
      if (this.spawnTimer >= this.spawnInterval) {
        if (this.enemiesSpawnedThisWave < this.totalEnemiesThisWave) {
          this.spawnEnemy();
          this.spawnTimer = 0;
        }
      }

      
      if (this.enemiesSpawnedThisWave >= this.totalEnemiesThisWave && this.enemies.length === 0) {
        this.showWaveClear();
      }
    }
  }

  /**
   * Render game
   */
  render() {
    
    this.ctx.fillStyle = '#000814';
    this.ctx.fillRect(0, 0, this.width, this.height);

    
    if (this.backgroundImageLoaded) {
      const bgWidth = this.backgroundImage.width;
      const bgHeight = this.backgroundImage.height;

      
      const tilesX = Math.ceil(this.width / bgWidth) + 1;
      const tilesY = 2; 

      
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

    
    this.particles.draw(this.ctx);

    
    for (const bullet of this.bullets) {
      bullet.draw(this.ctx);
    }

    
    for (const enemy of this.enemies) {
      enemy.draw(this.ctx);
    }

    
    this.player.draw(this.ctx);

    
    if (this.waveClear && this.waveStats) {
      this.drawWaveClear();
    }

    
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
    if (wave === 1) return 4;  
    if (wave === 2) return 6;  
    if (wave === 3) return 8;  
    if (wave <= 5) return 10; 
    if (wave <= 8) return 12; 
    return 15; 
  }

  /**
   * Get spawn interval for a specific wave
   * @param {number} wave - Wave number
   * @returns {number} Seconds between spawns
   */
  getSpawnIntervalForWave(wave) {
    if (wave === 1) return 6.0;  
    if (wave === 2) return 4.5;  
    if (wave === 3) return 3.5;  
    if (wave <= 5) return 3.0;   
    if (wave <= 8) return 2.5;   
    return 2.0; 
  }

  /**
   * Spawn a new enemy
   */
  spawnEnemy() {
    
    let maxLength = null;

    
    if (this.wave <= 3) {
      maxLength = 5; 
    } else if (this.wave <= 6) {
      maxLength = 8; 
    } else if (this.wave <= 10) {
      maxLength = 12; 
    }
    

    const word = getRandomWord(this.wave, maxLength);

    
    const margin = this.width * 0.1;
    const spawnWidth = this.width - (margin * 2);
    const x = Math.random() * spawnWidth + margin;

    
    let speed;
    if (this.wave === 1) {
      speed = 20; 
    } else if (this.wave === 2) {
      speed = 25; 
    } else {
      speed = 30 + (this.wave - 2) * 5; 
    }

    const enemy = new Enemy(word, x, -50, speed, this.player);
    this.enemies.push(enemy);

    
    this.enemiesSpawnedThisWave++;
  }


  /**
   * Show wave clear screen with statistics
   */
  showWaveClear() {
    
    const waveEndTime = Date.now();
    const waveDurationMs = waveEndTime - this.waveStartTime;
    const waveDurationMinutes = waveDurationMs / 60000;

    
    const stats = this.input.getStatistics();

    
    const words = stats.correctInputs / 5;
    const wpm = waveDurationMinutes > 0 ? Math.round(words / waveDurationMinutes) : 0;

    
    this.totalStats.totalWavesCompleted++;
    this.totalStats.totalScore = this.score;
    this.totalStats.totalCorrectInputs += stats.correctInputs;
    this.totalStats.totalIncorrectInputs += stats.incorrectInputs;
    this.totalStats.totalPlayTime += waveDurationMs;

    
    this.waveStats = {
      wave: this.wave,
      score: this.score,
      wpm: wpm,
      accuracy: stats.accuracy,
      correctInputs: stats.correctInputs,
      incorrectInputs: stats.incorrectInputs
    };

    
    this.waveClear = true;
    this.waveClearTimer = 0;
    this.waveClearAlpha = 0;

    
    this.enemies = [];
  }

  /**
   * Continue to next wave after wave clear screen
   */
  continueToNextWave() {
    this.wave++;
    this.waveStartTime = Date.now();

    
    this.enemiesSpawnedThisWave = 0;
    this.totalEnemiesThisWave = this.getEnemyCountForWave(this.wave);
    this.spawnTimer = this.spawnInterval; 

    
    this.input.resetStatistics();

    
    this.spawnInterval = this.getSpawnIntervalForWave(this.wave);

    
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
      this.scoreElement.textContent = String(this.score).padStart(7, '0');
    }

    
    if (this.levelElement) {
      this.levelElement.textContent = String(this.wave).padStart(3, '0');
    }

    
    if (this.wpmElement) {
      const currentTime = Date.now();
      const elapsedMinutes = (currentTime - this.waveStartTime) / 60000;
      const stats = this.input.getStatistics();
      const words = stats.correctInputs / 5;
      const wpm = elapsedMinutes > 0 ? Math.round(words / elapsedMinutes) : 0;
      this.wpmElement.textContent = String(wpm);
    }

    
    if (this.accuracyElement) {
      const stats = this.input.getStatistics();
      this.accuracyElement.textContent = `${stats.accuracy}%`;
    }

    
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
  async endGame() {
    this.gameOver = true;
    this.playSound('gameover');

    
    const overallAccuracy = this.totalStats.totalCorrectInputs + this.totalStats.totalIncorrectInputs > 0
      ? Math.round((this.totalStats.totalCorrectInputs / (this.totalStats.totalCorrectInputs + this.totalStats.totalIncorrectInputs)) * 100)
      : 100;

    const totalMinutes = this.totalStats.totalPlayTime / 60000;
    const totalWords = this.totalStats.totalCorrectInputs / 5;
    const overallWPM = totalMinutes > 0 ? Math.round(totalWords / totalMinutes) : 0;

    const scoreData = {
      score: this.score,
      wave: this.totalStats.totalWavesCompleted,
      wpm: overallWPM,
      accuracy: overallAccuracy
    };

    
    if (this.firebaseService && this.firebaseService.isLoggedIn()) {
      try {
        await this.firebaseService.saveScore(scoreData);
        await this.firebaseService.updateUserStats(scoreData);
        console.log('💾 Score and stats saved!');
      } catch (error) {
        console.error('Failed to save score:', error);
      }
    } else {
      
      if (this.firebaseService && window.showAuthUI) {
        setTimeout(() => {
          window.showAuthUI(async (username) => {
            if (username) {
              
              try {
                await this.firebaseService.saveScore(scoreData);
                await this.firebaseService.updateUserStats(scoreData);
                console.log('💾 Score and stats saved!');
              } catch (error) {
                console.error('Failed to save score:', error);
              }
            }
          });
        }, 1500); 
      }
    }
  }

  /**
   * Draw wave clear screen with statistics (subtle overlay with fade)
   */
  drawWaveClear() {
    this.ctx.save();

    
    this.ctx.globalAlpha = this.waveClearAlpha;

    
    this.ctx.fillStyle = 'rgba(0, 15, 30, 0.6)'; 
    this.ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    
    this.ctx.fillStyle = '#5b9bd5';
    this.ctx.font = 'bold 40px Orbitron, Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = 'rgba(91, 155, 213, 0.6)';

    const waveText = `WAVE ${String(this.waveStats.wave).padStart(3, '0')} CLEAR`;
    this.ctx.fillText(waveText, centerX, centerY - 120);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '26px Orbitron, Arial, sans-serif';
    this.ctx.shadowBlur = 8;
    this.ctx.shadowColor = '#ffffff44';
    this.ctx.fillText(`SCORE: ${String(this.waveStats.score).padStart(6, '0')}`, centerX, centerY - 70);

    const boxY = centerY - 20;
    const lineHeight = 38;

    this.ctx.fillStyle = '#7ba8d1';
    this.ctx.font = '24px Orbitron, Arial, sans-serif';
    this.ctx.shadowBlur = 8;
    this.ctx.shadowColor = 'rgba(123, 168, 209, 0.4)';
    this.ctx.fillText(`WPM: ${this.waveStats.wpm}`, centerX, boxY);

    
    this.ctx.fillStyle = this.waveStats.accuracy >= 90 ? '#5b9bd5' :
                         this.waveStats.accuracy >= 70 ? '#ffaa00' : '#ff4466';
    this.ctx.fillText(`ACCURACY: ${this.waveStats.accuracy}%`, centerX, boxY + lineHeight);

    this.ctx.fillStyle = '#aaaaaa';
    this.ctx.font = '20px Orbitron, Arial, sans-serif';
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

    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    
    this.ctx.fillStyle = '#ff4466';
    this.ctx.font = 'bold 64px Orbitron, Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = '#ff4466';
    this.ctx.fillText('GAME OVER', centerX, centerY - 160);

    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '32px Orbitron, Arial, sans-serif';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = '#ffffff';
    this.ctx.fillText(`FINAL SCORE: ${String(this.score).padStart(6, '0')}`, centerX, centerY - 90);

    
    this.ctx.font = '28px Orbitron, Arial, sans-serif';
    this.ctx.fillText(`Waves Completed: ${this.totalStats.totalWavesCompleted}`, centerX, centerY - 40);

    
    const totalInputs = this.totalStats.totalCorrectInputs + this.totalStats.totalIncorrectInputs;
    const overallAccuracy = totalInputs > 0
      ? Math.round((this.totalStats.totalCorrectInputs / totalInputs) * 100)
      : 100;

    
    const totalMinutes = this.totalStats.totalPlayTime / 60000;
    const totalWords = this.totalStats.totalCorrectInputs / 5;
    const overallWPM = totalMinutes > 0 ? Math.round(totalWords / totalMinutes) : 0;

    
    this.ctx.fillStyle = '#7ba8d1';
    this.ctx.font = '26px Orbitron, Arial, sans-serif';
    this.ctx.fillText(`Overall WPM: ${overallWPM}`, centerX, centerY + 10);

    
    this.ctx.fillStyle = overallAccuracy >= 90 ? '#5b9bd5' :
                         overallAccuracy >= 70 ? '#ffaa00' : '#ff4466';
    this.ctx.fillText(`Overall Accuracy: ${overallAccuracy}%`, centerX, centerY + 50);

    
    this.ctx.fillStyle = '#cccccc';
    this.ctx.font = '22px Orbitron, Arial, sans-serif';
    this.ctx.fillText(
      `Total Correct: ${this.totalStats.totalCorrectInputs} | Errors: ${this.totalStats.totalIncorrectInputs}`,
      centerX,
      centerY + 90
    );

    
    this.ctx.fillStyle = '#7ba8d1';
    this.ctx.font = 'bold 26px Orbitron, Arial, sans-serif';
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = 'rgba(123, 168, 209, 0.5)';
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
    this.spawnTimer = this.spawnInterval; 
    this.uiUpdateTimer = 0; 

    
    this.enemiesSpawnedThisWave = 0;
    this.totalEnemiesThisWave = this.getEnemyCountForWave(this.wave);

    
    this.waveClearAlpha = 0;
    this.waveClearTimer = 0;

    
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
