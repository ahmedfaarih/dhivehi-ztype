/**
 * Authentication UI for username registration/login
 */
export class AuthUI {
  constructor(firebaseService) {
    this.firebaseService = firebaseService;
    this.modal = null;
    this.input = null;
    this.onAuthSuccess = null;

    this.createModal();
  }

  /**
   * Create the auth modal HTML
   */
  createModal() {
    this.modal = document.createElement('div');
    this.modal.id = 'auth-modal';
    this.modal.className = 'modal hidden';

    this.modal.innerHTML = `
      <div class="modal-content">
        <h2>🏆 Join the Leaderboard!</h2>
        <p class="subtitle">Enter your username to save your score</p>

        <div class="auth-form">
          <input
            type="text"
            id="username-input"
            placeholder="Enter your username"
            maxlength="20"
            autocomplete="off"
          />

          <button id="submit-username" class="btn-primary">
            Save Score & Continue
          </button>

          <button id="skip-auth" class="btn-secondary">
            Skip (Don't Save Score)
          </button>
        </div>

        <div class="auth-status hidden" id="auth-status"></div>
      </div>
    `;

    document.body.appendChild(this.modal);

    // Get elements
    this.input = document.getElementById('username-input');
    this.submitBtn = document.getElementById('submit-username');
    this.skipBtn = document.getElementById('skip-auth');
    this.statusDiv = document.getElementById('auth-status');

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Submit button
    this.submitBtn.addEventListener('click', () => this.handleSubmit());

    // Enter key
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleSubmit();
      }
    });

    // Skip button
    this.skipBtn.addEventListener('click', () => this.handleSkip());

    // Focus input when modal shows
    this.modal.addEventListener('transitionend', () => {
      if (!this.modal.classList.contains('hidden')) {
        this.input.focus();
      }
    });
  }

  /**
   * Handle username submission
   */
  async handleSubmit() {
    const username = this.input.value.trim();

    if (!username) {
      this.showStatus('Please enter a username', 'error');
      return;
    }

    if (username.length < 2) {
      this.showStatus('Username too short (min 2 characters)', 'error');
      return;
    }

    // Disable button during submission
    this.submitBtn.disabled = true;
    this.submitBtn.textContent = 'Saving...';

    try {
      await this.firebaseService.registerUsername(username);
      this.showStatus('Success! Score saved.', 'success');

      setTimeout(() => {
        this.hide();
        if (this.onAuthSuccess) {
          this.onAuthSuccess(username);
        }
      }, 500);

    } catch (error) {
      this.showStatus(error.message, 'error');
      this.submitBtn.disabled = false;
      this.submitBtn.textContent = 'Save Score & Continue';
    }
  }

  /**
   * Handle skip authentication
   */
  handleSkip() {
    this.hide();
    if (this.onAuthSuccess) {
      this.onAuthSuccess(null);
    }
  }

  /**
   * Show status message
   */
  showStatus(message, type = 'info') {
    this.statusDiv.textContent = message;
    this.statusDiv.className = `auth-status ${type}`;
    this.statusDiv.classList.remove('hidden');

    if (type === 'error') {
      setTimeout(() => {
        this.statusDiv.classList.add('hidden');
      }, 3000);
    }
  }

  /**
   * Show the modal
   */
  show(callback) {
    this.onAuthSuccess = callback;

    // Check if already logged in
    const currentUsername = this.firebaseService.getCurrentUsername();
    if (currentUsername) {
      console.log(`Already logged in as ${currentUsername}`);
      if (callback) callback(currentUsername);
      return;
    }

    this.modal.classList.remove('hidden');
    this.input.value = '';
    this.input.focus();

    // Re-enable JTK for this input
    if (window.JTK && window.JTK.init) {
      setTimeout(() => window.JTK.init(), 100);
    }
  }

  /**
   * Hide the modal
   */
  hide() {
    this.modal.classList.add('hidden');
    this.submitBtn.disabled = false;
    this.submitBtn.textContent = 'Save Score & Continue';
  }

  /**
   * Destroy the modal
   */
  destroy() {
    if (this.modal && this.modal.parentNode) {
      this.modal.parentNode.removeChild(this.modal);
    }
  }
}
