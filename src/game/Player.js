/**
 * Player class - represents the player's ship
 */
export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 25;
    this.color = '#00bbff';
    this.lives = 3;
    this.maxLives = 3;

    
    this.pulsePhase = 0;
    this.targetEnemy = null;
  }

  /**
   * Update player state
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    
    this.pulsePhase += deltaTime * 2;
  }

  /**
   * Draw the player ship
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  draw(ctx) {
    ctx.save();

    
    const pulse = Math.sin(this.pulsePhase) * 0.1 + 1;
    const currentSize = this.size * pulse;

    
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;

    ctx.beginPath();
    ctx.moveTo(this.x, this.y - currentSize); 
    ctx.lineTo(this.x - currentSize, this.y + currentSize); 
    ctx.lineTo(this.x + currentSize, this.y + currentSize); 
    ctx.closePath();
    ctx.fill();

    
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentSize * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draw targeting line to enemy
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Enemy} enemy - Target enemy
   */
  drawTargetingLine(ctx, enemy) {
    if (!enemy) return;

    ctx.save();

    
    const dashOffset = (Date.now() / 20) % 20;
    ctx.setLineDash([10, 10]);
    ctx.lineDashOffset = -dashOffset;

    
    ctx.strokeStyle = 'rgba(255, 68, 102, 0.6)';
    ctx.lineWidth = 2;

    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff4466';

    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(enemy.x, enemy.y);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Set the current target enemy
   * @param {Enemy} enemy - Enemy to target
   */
  setTarget(enemy) {
    this.targetEnemy = enemy;
  }

  /**
   * Clear current target
   */
  clearTarget() {
    this.targetEnemy = null;
  }

  /**
   * Take damage (lose a life)
   */
  takeDamage() {
    this.lives--;
    if (this.lives < 0) this.lives = 0;
  }

  /**
   * Heal (gain a life)
   */
  heal() {
    this.lives++;
    if (this.lives > this.maxLives) this.lives = this.maxLives;
  }

  /**
   * Check if player is alive
   * @returns {boolean} True if player has lives remaining
   */
  isAlive() {
    return this.lives > 0;
  }

  /**
   * Get current lives
   * @returns {number} Number of lives remaining
   */
  getLives() {
    return this.lives;
  }
}
