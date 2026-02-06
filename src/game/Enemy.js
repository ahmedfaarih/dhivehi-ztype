/**
 * Enemy class - represents an enemy ship with a word
 */
export class Enemy {
  constructor(word, x, y, speed = 80) {
    this.word = word;
    this.x = x;
    this.y = y;
    this.speed = speed; 
    this.baseSpeed = speed;
    this.targeted = false;
    this.health = word.length;
    this.maxHealth = word.length;
    this.alive = true;
    this.dying = false;

    
    this.size = 20;
    this.color = '#00ff88';
    this.targetColor = '#ff4466';
    this.wordOffset = 35;

    this.pulsePhase = Math.random() * Math.PI * 2;
    this.deathTimer = 0;
    this.deathDuration = 0.3; 
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

    
    this.y += this.speed * deltaTime;

    
    this.pulsePhase += deltaTime * 3;

    
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

    
    ctx.fillStyle = this.targeted ? this.targetColor : this.color;
    ctx.beginPath();

    
    ctx.moveTo(this.x, this.y + currentSize); 
    ctx.lineTo(this.x - currentSize, this.y - currentSize); 
    ctx.lineTo(this.x + currentSize, this.y - currentSize); 
    ctx.closePath();
    ctx.fill();

    
    if (this.targeted) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = this.targetColor;
      ctx.fill();
    }

    
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px "Waheed", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.fillText(this.word, this.x, this.y - this.wordOffset);

    
    this.drawHealthBar(ctx);

    ctx.restore();
  }

  /**
   * Draw health bar below ship
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  drawHealthBar(ctx) {
    const barWidth = 40;
    const barHeight = 4;
    const barY = this.y + this.size + 10;

    
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
  }

  /**
   * Reduce enemy health when hit
   * @param {number} damage - Amount of damage (usually 1 per letter)
   */
  hit(damage = 1) {
    this.health -= damage;
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
