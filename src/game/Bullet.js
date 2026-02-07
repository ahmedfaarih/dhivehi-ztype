import bulletImageUrl from '../images/bullet.png';

/**
 * Bullet class - represents a bullet/projectile fired at enemies
 */
export class Bullet {
  constructor(x, y, targetX, targetY) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.targetX = targetX;
    this.targetY = targetY;
    this.speed = 800; // pixels per second
    this.alive = true;
    this.width = 8;
    this.height = 24; // Make bullet longer

    // Load bullet image
    this.image = new Image();
    this.image.src = bulletImageUrl;
    this.imageLoaded = false;
    this.image.onload = () => {
      this.imageLoaded = true;
    };

    // Calculate direction
    const dx = targetX - x;
    const dy = targetY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    this.vx = (dx / distance) * this.speed;
    this.vy = (dy / distance) * this.speed;

    // Calculate rotation angle
    this.angle = Math.atan2(dy, dx);
  }

  /**
   * Update bullet position
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;

    // Check if bullet reached target or went off screen
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distanceToTarget = Math.sqrt(dx * dx + dy * dy);

    if (distanceToTarget < 10 || this.isOffScreen()) {
      this.alive = false;
    }
  }

  /**
   * Draw the bullet
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  draw(ctx) {
    ctx.save();

    if (this.imageLoaded) {
      // Draw bullet image with rotation
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);

      // Draw multiple glow layers for intense effect
      ctx.shadowBlur = 40;
      ctx.shadowColor = '#ffff00';
      ctx.globalAlpha = 1.0;

      ctx.drawImage(
        this.image,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );

      // Second glow layer
      ctx.globalAlpha = 0.6;
      ctx.shadowBlur = 50;
      ctx.drawImage(
        this.image,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );

      // Third glow layer for maximum brightness
      ctx.globalAlpha = 0.4;
      ctx.shadowBlur = 60;
      ctx.drawImage(
        this.image,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );
    } else {
      // Fallback to elongated shape if image not loaded
      ctx.fillStyle = '#ffff00';
      ctx.shadowBlur = 40;
      ctx.shadowColor = '#ffff00';

      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);

      // Draw elongated bullet shape
      ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    }

    ctx.restore();
  }

  /**
   * Check if bullet is alive
   * @returns {boolean} True if alive
   */
  isAlive() {
    return this.alive;
  }

  /**
   * Check if bullet is off screen
   * @returns {boolean} True if off screen
   */
  isOffScreen() {
    return this.x < -50 || this.x > window.innerWidth + 50 ||
           this.y < -50 || this.y > window.innerHeight + 50;
  }
}
