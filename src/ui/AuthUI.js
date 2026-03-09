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
    this.currentTab = 'register'; 

    this.modal.innerHTML = `
      <div class="modal-content">
        <h2>🏆 Join the Leaderboard!</h2>

        <div class="auth-tabs">
          <button class="auth-tab active" data-tab="register">Create Account</button>
          <button class="auth-tab" data-tab="login">Login</button>
        </div>

        <div class="auth-form" data-jtk-ignore="true">
          <input
            type="text"
            id="username-input"
            placeholder="Enter your username (English)"
            maxlength="20"
            autocomplete="username"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            data-jtk-ignore="true"
          />

          <input
            type="password"
            id="password-input"
            placeholder="Enter password (min 6 chars)"
            minlength="6"
            autocomplete="current-password"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            data-jtk-ignore="true"
          />

          <button id="submit-auth" class="btn-primary">
            Create Account & Save Score
          </button>

          <button id="skip-auth" class="btn-secondary">
            Skip (Don't Save Score)
          </button>
        </div>

        <div class="auth-status hidden" id="auth-status"></div>
      </div>
    `;

    document.body.appendChild(this.modal);

    
    this.usernameInput = document.getElementById('username-input');
    this.passwordInput = document.getElementById('password-input');
    this.submitBtn = document.getElementById('submit-auth');
    this.skipBtn = document.getElementById('skip-auth');
    this.statusDiv = document.getElementById('auth-status');

    
    this.setupEventListeners();

    
    this.disableJTKOnAuthInputs();
  }

  /**
   * Disable JTK keyboard on authentication inputs
   */
  disableJTKOnAuthInputs() {
    
    if (this.usernameInput) {
      this.usernameInput.classList.remove('thaanaKeyboardInput');
    }
    if (this.passwordInput) {
      this.passwordInput.classList.remove('thaanaKeyboardInput');

      
      this.passwordInput.removeAttribute('readonly');
      this.passwordInput.removeAttribute('disabled');
      this.passwordInput.style.pointerEvents = 'auto';
    }

    
    const preventFocusSteal = () => {
      
      document.body.style.userSelect = 'auto';
    };
    preventFocusSteal();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    
    const tabButtons = this.modal.querySelectorAll('.auth-tab');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);

        
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    
    this.submitBtn.addEventListener('click', () => this.handleSubmit());

    
    this.usernameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.passwordInput.focus();
      }
    });

    this.passwordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleSubmit();
      }
    });

    
    this.skipBtn.addEventListener('click', () => this.handleSkip());

    
    [this.usernameInput, this.passwordInput].forEach(input => {
      input.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      input.addEventListener('input', (e) => {
        e.stopPropagation();
      }, true);

      input.addEventListener('focus', () => {
        
        input.classList.remove('thaanaKeyboardInput');
      });
    });
  }

  /**
   * Switch between login and register tabs
   */
  switchTab(tab) {
    this.currentTab = tab;

    if (tab === 'login') {
      this.submitBtn.textContent = 'Login & Save Score';
    } else {
      this.submitBtn.textContent = 'Create Account & Save Score';
    }

    
    this.usernameInput.value = '';
    this.passwordInput.value = '';
    this.statusDiv.classList.add('hidden');
  }

  /**
   * Handle authentication submission (login or register)
   */
  async handleSubmit() {
    const username = this.usernameInput.value.trim();
    const password = this.passwordInput.value;

    if (!username) {
      this.showStatus('Please enter a username', 'error');
      return;
    }

    if (username.length < 2) {
      this.showStatus('Username too short (min 2 characters)', 'error');
      return;
    }

    if (!password) {
      this.showStatus('Please enter a password', 'error');
      return;
    }

    if (password.length < 6) {
      this.showStatus('Password must be at least 6 characters', 'error');
      return;
    }

    
    this.submitBtn.disabled = true;
    const originalText = this.submitBtn.textContent;
    this.submitBtn.textContent = this.currentTab === 'login' ? 'Logging in...' : 'Creating account...';

    try {
      if (this.currentTab === 'login') {
        await this.firebaseService.loginUsername(username, password);
        this.showStatus('✅ Login successful!', 'success');
      } else {
        await this.firebaseService.registerUsername(username, password);
        this.showStatus('✅ Account created! Score saved.', 'success');
      }

      setTimeout(() => {
        this.hide();
        if (this.onAuthSuccess) {
          this.onAuthSuccess(username);
        }
      }, 500);

    } catch (error) {
      this.showStatus(error.message, 'error');
      this.submitBtn.disabled = false;
      this.submitBtn.textContent = originalText;
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

    
    const currentUsername = this.firebaseService.getCurrentUsername();
    if (currentUsername) {
      console.log(`Already logged in as ${currentUsername}`);
      if (callback) callback(currentUsername);
      return;
    }

    this.modal.classList.remove('hidden');
    this.usernameInput.value = '';
    this.passwordInput.value = '';

    
    this.disableJTKOnAuthInputs();

    
    this.switchTab('register');
    const tabButtons = this.modal.querySelectorAll('.auth-tab');
    tabButtons.forEach(b => b.classList.remove('active'));
    tabButtons[0].classList.add('active');

    
    this.usernameInput.focus();
  }

  /**
   * Hide the modal
   */
  hide() {
    this.modal.classList.add('hidden');
    this.submitBtn.disabled = false;
    this.usernameInput.value = '';
    this.passwordInput.value = '';
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
