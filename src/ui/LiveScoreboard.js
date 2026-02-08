import { ConfirmModal } from './ConfirmModal.js';

/**
 * Live scoreboard that shows top 5 scores during gameplay
 */
export class LiveScoreboard {
  constructor(firebaseService) {
    this.firebaseService = firebaseService;
    this.container = null;
    this.refreshInterval = null;
    this.confirmModal = new ConfirmModal();

    this.createScoreboard();
    this.startAutoRefresh();
  }

  /**
   * Create the live scoreboard HTML
   */
  createScoreboard() {
    // Use existing container from HTML
    this.container = document.getElementById('live-scoreboard-container');
    if (!this.container) {
      console.error('Live scoreboard container not found!');
      return;
    }

    this.container.className = 'live-scoreboard';

    this.container.innerHTML = `
      <div class="live-scoreboard-header">
        <span>🏆 TOP 5</span>
      </div>
      <div id="user-status" class="user-status"></div>
      <div id="login-prompt" class="login-prompt hidden">
        <p class="login-text">Join the leaderboard!</p>
        <p class="login-subtext">Play to unlock registration</p>
      </div>
      <div class="live-scoreboard-list" id="live-scoreboard-list">
        <div class="loading-scores">Loading...</div>
      </div>
      <button id="login-register-btn" class="login-register-btn hidden">
        Login / Register
      </button>
      <button id="view-full-leaderboard-btn" class="view-leaderboard-btn">
        View Full Leaderboard
      </button>
    `;

    this.updateLoginPrompt();
    this.setupButtons();
  }

  /**
   * Setup button click handlers
   */
  setupButtons() {
    // Leaderboard button
    const leaderboardBtn = document.getElementById('view-full-leaderboard-btn');
    if (leaderboardBtn) {
      leaderboardBtn.addEventListener('click', () => {
        if (window.showScoreboard) {
          window.showScoreboard();
        }
      });
    }

    // Login/Register button
    const loginRegisterBtn = document.getElementById('login-register-btn');
    if (loginRegisterBtn) {
      loginRegisterBtn.addEventListener('click', () => {
        if (window.showAuthUI) {
          window.showAuthUI((success) => {
            if (success) {
              this.updateLoginPrompt();
              this.loadScores();
            }
          });
        }
      });
    }
  }

  /**
   * Start auto-refresh every 30 seconds
   */
  startAutoRefresh() {
    // Load immediately
    this.loadScores();

    // Refresh every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.loadScores();
    }, 30000);
  }

  /**
   * Update login prompt visibility and user status
   */
  updateLoginPrompt() {
    const loginPrompt = document.getElementById('login-prompt');
    const userStatus = document.getElementById('user-status');
    const loginRegisterBtn = document.getElementById('login-register-btn');
    if (!loginPrompt || !userStatus) return;

    if (this.firebaseService.isLoggedIn()) {
      loginPrompt.classList.add('hidden');
      if (loginRegisterBtn) loginRegisterBtn.classList.add('hidden');

      // Show user status with logout button
      const username = this.firebaseService.getCurrentUsername();
      userStatus.innerHTML = `
        <div class="user-info">
          <span class="username-display">👤 ${this.escapeHtml(username)}</span>
          <button id="logout-btn" class="logout-btn">Logout</button>
        </div>
      `;
      userStatus.classList.remove('hidden');

      // Setup logout button
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          const confirmed = await this.confirmModal.show(
            'Are you sure you want to logout? Your local session will end.',
            'Logout Confirmation'
          );
          if (confirmed) {
            await this.firebaseService.logout();
            this.updateLoginPrompt();
            this.loadScores();
          }
        });
      }
    } else {
      loginPrompt.classList.remove('hidden');
      if (loginRegisterBtn) loginRegisterBtn.classList.remove('hidden');
      userStatus.innerHTML = '';
      userStatus.classList.add('hidden');
    }
  }

  /**
   * Load top 5 scores
   */
  async loadScores() {
    const listDiv = document.getElementById('live-scoreboard-list');
    this.updateLoginPrompt();

    try {
      const scores = await this.firebaseService.getLeaderboard(5);

      if (scores.length === 0) {
        listDiv.innerHTML = '<div class="no-scores-live">No scores yet</div>';
        return;
      }

      // Render scores
      listDiv.innerHTML = scores.map((score, index) => this.renderScoreItem(score, index + 1)).join('');

    } catch (error) {
      console.error('Failed to load live scores:', error);
      listDiv.innerHTML = '<div class="error-live">Failed to load</div>';
    }
  }

  /**
   * Render a single score item
   */
  renderScoreItem(score, rank) {
    const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
    const isCurrentUser = score.username === this.firebaseService.getCurrentUsername();
    const highlightClass = isCurrentUser ? 'current-user' : '';

    return `
      <div class="score-item ${highlightClass}">
        <span class="rank">${rankEmoji}</span>
        <span class="username">${this.escapeHtml(score.username)}</span>
        <span class="score">${score.score}</span>
      </div>
    `;
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Destroy the scoreboard
   */
  destroy() {
    this.stopAutoRefresh();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
