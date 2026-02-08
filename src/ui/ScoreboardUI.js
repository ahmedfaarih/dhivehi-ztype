/**
 * Scoreboard/Leaderboard UI
 */
export class ScoreboardUI {
  constructor(firebaseService) {
    this.firebaseService = firebaseService;
    this.modal = null;
    this.isOpen = false;

    this.createModal();
  }

  /**
   * Create the scoreboard modal HTML
   */
  createModal() {
    // Create modal container
    this.modal = document.createElement('div');
    this.modal.id = 'scoreboard-modal';
    this.modal.className = 'modal hidden';

    this.modal.innerHTML = `
      <div class="modal-content scoreboard-content">
        <div class="modal-header">
          <h2>🏆 Leaderboard</h2>
          <button id="close-scoreboard" class="close-btn">×</button>
        </div>

        <div class="scoreboard-tabs">
          <button class="tab-btn active" data-tab="global">
            🌐 ${this.firebaseService.isFirebaseEnabled() ? 'Global Top 10' : 'All Time'}
          </button>
          <button class="tab-btn" data-tab="personal">
            👤 Your Best
          </button>
        </div>

        <div class="scoreboard-loading hidden" id="scoreboard-loading">
          <div class="spinner"></div>
          <p>Loading scores...</p>
        </div>

        <div class="scoreboard-list" id="scoreboard-list">
          <!-- Scores will be inserted here -->
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Close button
    document.getElementById('close-scoreboard').addEventListener('click', () => {
      this.hide();
    });

    // Tab buttons
    const tabBtns = this.modal.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);

        // Update active state
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Click outside to close
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.hide();
      }
    });
  }

  /**
   * Switch between tabs
   */
  async switchTab(tab) {
    if (tab === 'global') {
      await this.loadGlobalScores();
    } else if (tab === 'personal') {
      this.loadPersonalScores();
    }
  }

  /**
   * Show the scoreboard
   */
  async show() {
    this.modal.classList.remove('hidden');
    this.isOpen = true;

    // Load global scores by default
    await this.loadGlobalScores();
  }

  /**
   * Hide the scoreboard
   */
  hide() {
    this.modal.classList.add('hidden');
    this.isOpen = false;
  }

  /**
   * Load global scores from Firebase
   */
  async loadGlobalScores() {
    const listDiv = document.getElementById('scoreboard-list');
    const loadingDiv = document.getElementById('scoreboard-loading');

    // Show loading
    loadingDiv.classList.remove('hidden');
    listDiv.innerHTML = '';

    try {
      const scores = await this.firebaseService.getLeaderboard(10);

      // Hide loading
      loadingDiv.classList.add('hidden');

      if (scores.length === 0) {
        listDiv.innerHTML = '<div class="no-scores">No scores yet. Be the first!</div>';
        return;
      }

      // Render scores
      listDiv.innerHTML = this.renderScoresList(scores, true);

    } catch (error) {
      console.error('Failed to load scores:', error);
      loadingDiv.classList.add('hidden');
      listDiv.innerHTML = '<div class="error">Failed to load scores</div>';
    }
  }

  /**
   * Load personal best scores and stats
   */
  async loadPersonalScores() {
    const listDiv = document.getElementById('scoreboard-list');
    const currentUsername = this.firebaseService.getCurrentUsername();

    if (!currentUsername) {
      listDiv.innerHTML = '<div class="no-scores">Login to see your scores</div>';
      return;
    }

    // Get user stats
    const stats = await this.firebaseService.getUserStats();

    // Get local scores for this user
    const allScores = JSON.parse(localStorage.getItem('dhivehi_type_scores') || '[]');
    const userScores = allScores
      .filter(s => s.username === currentUsername)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    let html = '';

    // Show user stats if available
    if (stats) {
      html += `
        <div class="user-stats-panel">
          <h3>📊 Your Stats</h3>
          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-label">Games Played</div>
              <div class="stat-value">${stats.gamesPlayed || 0}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Highest Wave</div>
              <div class="stat-value">${stats.highestWave || 0}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Highest Score</div>
              <div class="stat-value">${stats.highestScore || 0}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Total Score</div>
              <div class="stat-value">${stats.totalScore || 0}</div>
            </div>
          </div>
        </div>
      `;
    }

    // Show personal best scores
    if (userScores.length > 0) {
      html += '<h3 style="margin-top: 20px; color: #7ba8d1; text-align: center; font-family: \'Orbitron\', Arial, sans-serif;">Your Top 5 Scores</h3>';
      html += this.renderScoresList(userScores, false);
    } else if (!stats) {
      html = '<div class="no-scores">No data yet. Start playing!</div>';
    }

    listDiv.innerHTML = html;
  }

  /**
   * Render scores list HTML
   */
  renderScoresList(scores, showRank = true) {
    return `
      <div class="scores-table">
        <div class="scores-header">
          ${showRank ? '<div class="col-rank">Rank</div>' : ''}
          <div class="col-player">Player</div>
          <div class="col-score">Score</div>
          <div class="col-wave">Wave</div>
          <div class="col-wpm">WPM</div>
          <div class="col-acc">Acc</div>
        </div>
        ${scores.map((score, index) => this.renderScoreRow(score, index + 1, showRank)).join('')}
      </div>
    `;
  }

  /**
   * Render a single score row
   */
  renderScoreRow(score, rank, showRank) {
    const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
    const isCurrentUser = score.username === this.firebaseService.getCurrentUsername();
    const highlightClass = isCurrentUser ? 'highlight' : '';

    return `
      <div class="score-row ${highlightClass}">
        ${showRank ? `<div class="col-rank">${rankEmoji} ${rank}</div>` : ''}
        <div class="col-player">${this.escapeHtml(score.username)}</div>
        <div class="col-score">${score.score.toLocaleString()}</div>
        <div class="col-wave">${score.wave || '-'}</div>
        <div class="col-wpm">${score.wpm || '-'}</div>
        <div class="col-acc">${score.accuracy || '-'}%</div>
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
   * Destroy the modal
   */
  destroy() {
    if (this.modal && this.modal.parentNode) {
      this.modal.parentNode.removeChild(this.modal);
    }
  }
}
