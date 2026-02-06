/**
 * Sound Manager for loading and playing game sounds
 */
export class SoundManager {
  constructor() {
    this.sounds = {};
    this.loaded = false;
    this.volume = 0.5; // Default volume (0.0 to 1.0)
  }

  /**
   * Load sound files
   */
  async loadSounds() {
    try {
      // Load shotgun sound (correct typing)
      this.sounds.shotgun = new Audio('/src/sounds/shotgun.wav');
      this.sounds.shotgun.volume = this.volume;

      // Load empty sound (incorrect typing)
      this.sounds.empty = new Audio('/src/sounds/empty.wav');
      this.sounds.empty.volume = this.volume * 0.7; // Slightly quieter

      // Preload the audio
      await Promise.all([
        this.sounds.shotgun.load(),
        this.sounds.empty.load()
      ]);

      this.loaded = true;
      console.log('✅ Sounds loaded successfully!');
    } catch (error) {
      console.error('Error loading sounds:', error);
    }
  }

  /**
   * Play shotgun sound (correct typing)
   */
  playShotgun() {
    if (!this.loaded || !this.sounds.shotgun) return;

    try {
      // Clone the audio node to allow rapid firing
      const sound = this.sounds.shotgun.cloneNode();
      sound.volume = this.volume;
      sound.play();
    } catch (error) {
      console.error('Error playing shotgun sound:', error);
    }
  }

  /**
   * Play empty sound (incorrect typing)
   */
  playEmpty() {
    if (!this.loaded || !this.sounds.empty) return;

    try {
      // Clone the audio node to allow rapid firing
      const sound = this.sounds.empty.cloneNode();
      sound.volume = this.volume * 0.7;
      sound.play();
    } catch (error) {
      console.error('Error playing empty sound:', error);
    }
  }

  /**
   * Set volume for all sounds
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.sounds.shotgun) this.sounds.shotgun.volume = this.volume;
    if (this.sounds.empty) this.sounds.empty.volume = this.volume * 0.7;
  }
}
