/**
 * Particle System for background effects (stars, explosions, etc.)
 */
export class ParticleSystem {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.particles = [];
  }

  /**
   * Create starfield background
   * @param {number} count - Number of stars
   */
  createStarfield(count = 100) {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        type: 'star',
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 30 + 10,
        brightness: Math.random() * 0.5 + 0.5,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 2 + 1,
      });
    }
  }

  /**
   * Update particles
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    for (const particle of this.particles) {
      if (particle.type === 'star') {
        particle.x -= particle.speed * deltaTime;

        if (particle.x < -10) {
          particle.x = this.width + 10;
          particle.y = Math.random() * this.height;
        }

        particle.twinklePhase += particle.twinkleSpeed * deltaTime;
      }
    }
  }

  /**
   * Draw particles
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  draw(ctx) {
    ctx.save();

    for (const particle of this.particles) {
      if (particle.type === 'star') {
        const twinkle = Math.sin(particle.twinklePhase) * 0.3 + 0.7;
        const alpha = particle.brightness * twinkle;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffffff';

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        if (particle.size > 1.5) {
          ctx.shadowBlur = 4;
          ctx.shadowColor = '#ffffff';
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }

    ctx.restore();
  }

  /**
   * Add explosion particles at a position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} count - Number of particles
   */
  addExplosion(x, y, count = 20) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = Math.random() * 100 + 50;

      this.particles.push({
        type: 'explosion',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 2,
        life: 1.0,
        decay: Math.random() * 2 + 1,
        color: this.getExplosionColor(i / count),
      });
    }
  }

  /**
   * Get color for explosion particle based on position in explosion
   * @param {number} ratio - Position in explosion (0-1)
   * @returns {string} Color
   */
  getExplosionColor(ratio) {
    if (ratio < 0.33) return '#ff4466';
    if (ratio < 0.66) return '#ffaa00';
    return '#ffff00';
  }

  /**
   * Resize the particle system
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    this.width = width;
    this.height = height;

    const starCount = this.particles.filter(p => p.type === 'star').length;
    if (starCount > 0) {
      this.createStarfield(starCount);
    }
  }
}
