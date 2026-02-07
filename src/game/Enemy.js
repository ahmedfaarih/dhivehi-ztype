import explosionGifUrl from '../images/blow.gif';

/**
 * Enemy class - represents an enemy ship with a word
 */
export class Enemy {
  constructor(word, x, y, speed = 80, player = null) {
    this.word = word;
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.baseSpeed = speed;
    this.player = player; // Reference to player for homing
    this.targeted = false;
    this.health = word.length;
    this.maxHealth = word.length;
    this.alive = true;
    this.dying = false;

    // Load ship image
    this.image = new Image();
    this.image.src = '/images/badship.png';
    this.imageLoaded = false;
    this.image.onload = () => {
      this.imageLoaded = true;
    };

    // Load explosion gif
    this.explosionGif = new Image();
    this.explosionGif.src = explosionGifUrl;
    this.explosionGifLoaded = false;
    this.explosionGif.onload = () => {
      this.explosionGifLoaded = true;
    };

    this.size = 15; // Even smaller enemy ships
    this.color = '#00ff88';
    this.targetColor = '#ff4466';
    this.wordOffset = 30; // Adjusted for smaller image
    this.typedChars = 0; // Track how many characters have been typed

    this.pulsePhase = Math.random() * Math.PI * 2;
    this.deathTimer = 0;
    this.deathDuration = 0.3;

    // Hit animation properties
    this.isHit = false;
    this.hitTimer = 0;
    this.hitDuration = 0.2; // 200ms flash
    this.hitShakeX = 0;
    this.hitShakeY = 0;
  }

  /**
   * Update enemy position and state
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    if (this.dying) {
      this.deathTimer += deltaTime;
      if (this.deathTimer >= this.deathDuration) {
        this.alive = false;
      }
      return;
    }

    // Move toward player if player exists, otherwise just move down
    if (this.player) {
      // Calculate direction to player
      const dx = this.player.x - this.x;
      const dy = this.player.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        // Normalize and apply speed
        this.x += (dx / distance) * this.speed * deltaTime * 0.5; // 50% horizontal speed
        this.y += (dy / distance) * this.speed * deltaTime;
      }
    } else {
      // Move down if no player reference
      this.y += this.speed * deltaTime;
    }

    // Pulse animation
    this.pulsePhase += deltaTime * 3;

    // Update hit animation
    if (this.isHit) {
      this.hitTimer += deltaTime;

      // Shake effect
      this.hitShakeX = (Math.random() - 0.5) * 8;
      this.hitShakeY = (Math.random() - 0.5) * 8;

      if (this.hitTimer >= this.hitDuration) {
        this.isHit = false;
        this.hitTimer = 0;
        this.hitShakeX = 0;
        this.hitShakeY = 0;

        // Restore speed after hit
        this.speed = this.baseSpeed;
      }
    }

    // Check if off screen (bottom)
    if (this.y > window.innerHeight + 100) {
      this.alive = false;
    }
  }

  /**
   * Draw the enemy
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  draw(ctx) {
    if (this.dying) {
      this.drawExplosion(ctx);
      return;
    }

    ctx.save();

    const pulse = this.targeted ? Math.sin(this.pulsePhase) * 0.15 + 1 : 1;
    const currentSize = this.size * pulse;

    // Apply hit shake
    const drawX = this.x + this.hitShakeX;
    const drawY = this.y + this.hitShakeY;

    if (this.imageLoaded) {
      // Draw image
      if (this.targeted) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.targetColor;
      }

      // Apply hit flash effect
      if (this.isHit) {
        ctx.globalAlpha = 0.5 + Math.sin(this.hitTimer * 30) * 0.5;
      }

      ctx.drawImage(
        this.image,
        drawX - currentSize,
        drawY - currentSize,
        currentSize * 2,
        currentSize * 2
      );

      ctx.globalAlpha = 1.0;
    } else {
      // Fallback to triangle if image not loaded
      ctx.fillStyle = this.targeted ? this.targetColor : this.color;
      ctx.beginPath();

      ctx.moveTo(drawX, drawY + currentSize);
      ctx.lineTo(drawX - currentSize, drawY - currentSize);
      ctx.lineTo(drawX + currentSize, drawY - currentSize);
      ctx.closePath();
      ctx.fill();

      if (this.targeted) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.targetColor;
        ctx.fill();
      }
    }

    // Draw word above ship (only remaining untyped characters)
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px "MV Waheed", Arial, sans-serif'; // Smaller font
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Only show the untyped portion of the word
    const remainingWord = this.word.substring(this.typedChars);
    ctx.fillText(remainingWord, this.x, this.y - this.wordOffset);

    // Draw health bar
    this.drawHealthBar(ctx);

    ctx.restore();
  }

  /**
   * Draw health bar below ship
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  drawHealthBar(ctx) {
    const barWidth = 30; // Smaller bar for smaller ships
    const barHeight = 3;
    const barY = this.y + this.size + 8;

    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(this.x - barWidth / 2, barY, barWidth, barHeight);

    
    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle = healthPercent > 0.5 ? '#00ff88' : healthPercent > 0.25 ? '#ffaa00' : '#ff4466';
    ctx.fillRect(this.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);
  }

  /**
   * Draw explosion animation
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  drawExplosion(ctx) {
    ctx.save();

    const progress = this.deathTimer / this.deathDuration;
    const explosionSize = this.size * (1 + progress * 3);
    const alpha = 1 - progress;


    for (let i = 0; i < 3; i++) {
      const offset = i * 0.3;
      const size = explosionSize * (1 - offset);

      ctx.globalAlpha = alpha * (1 - offset);
      ctx.fillStyle = i === 0 ? '#ff4466' : i === 1 ? '#ffaa00' : '#ffff00';

      ctx.beginPath();
      ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
      ctx.fill();
    }


    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const distance = progress * explosionSize * 2;
      const px = this.x + Math.cos(angle) * distance;
      const py = this.y + Math.sin(angle) * distance;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, 3 * (1 - progress), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Set targeted state
   * @param {boolean} targeted - Whether enemy is targeted
   */
  setTargeted(targeted) {
    this.targeted = targeted;
    // Reset typed characters when no longer targeted
    if (!targeted) {
      this.typedChars = 0;
    }
  }

  /**
   * Set how many characters have been typed
   * @param {number} count - Number of characters typed
   */
  setTypedChars(count) {
    this.typedChars = count;
  }

  /**
   * Reduce enemy health when hit
   * @param {number} damage - Amount of damage (usually 1 per letter)
   */
  hit(damage = 1) {
    this.health -= damage;

    // Trigger hit animation
    this.isHit = true;
    this.hitTimer = 0;

    // Slow down when hit (70% speed)
    this.speed = this.baseSpeed * 0.7;

    if (this.health <= 0) {
      this.destroy();
    }
  }

  /**
   * Destroy the enemy (trigger death animation)
   */
  destroy() {
    if (!this.dying) {
      this.dying = true;
      this.deathTimer = 0;
    }
  }

  /**
   * Check if enemy is still alive
   * @returns {boolean} True if alive
   */
  isAlive() {
    return this.alive;
  }

  /**
   * Check if enemy is off screen (bottom)
   * @param {number} maxY - Maximum Y coordinate
   * @returns {boolean} True if off screen
   */
  isOffScreen(maxY = 800) {
    return this.y > maxY;
  }
}
