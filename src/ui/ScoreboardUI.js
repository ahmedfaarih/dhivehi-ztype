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

    
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    
    document.getElementById('close-scoreboard').addEventListener('click', () => {
      this.hide();
    });

    
    const tabBtns = this.modal.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);

        
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });

    
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
    try {
      if (tab === 'global') {
        await this.loadGlobalScores();
      } else if (tab === 'personal') {
        await this.loadPersonalScores();
      }
    } catch (error) {
      console.error('Error switching tabs:', error);
      
      const loadingDiv = document.getElementById('scoreboard-loading');
      if (loadingDiv) {
        loadingDiv.classList.add('hidden');
      }
      const listDiv = document.getElementById('scoreboard-list');
      if (listDiv) {
        listDiv.innerHTML = '<div class="error">Failed to load scores</div>';
      }
    }
  }

  /**
   * Show the scoreboard
   */
  async show() {
    this.modal.classList.remove('hidden');
    this.isOpen = true;

    
    try {
      await this.loadGlobalScores();
    } catch (error) {
      console.error('Error showing scoreboard:', error);
      
      const loadingDiv = document.getElementById('scoreboard-loading');
      if (loadingDiv) {
        loadingDiv.classList.add('hidden');
      }
    }
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
    console.log('📊 Loading global scores...');
    const listDiv = document.getElementById('scoreboard-list');
    const loadingDiv = document.getElementById('scoreboard-loading');

    if (!listDiv || !loadingDiv) {
      console.error('❌ Scoreboard elements not found!');
      return;
    }

    
    console.log('🔄 Showing loading spinner');
    loadingDiv.classList.remove('hidden');
    loadingDiv.style.display = 'block';
    listDiv.innerHTML = '';

    try {
      
      const scores = await this.firebaseService.getLeaderboard(10);

      console.log(`✅ Loaded ${scores ? scores.length : 0} scores`);

      
      console.log('✅ Hiding loading spinner');
      loadingDiv.classList.add('hidden');
      loadingDiv.style.display = 'none';

      if (!scores || scores.length === 0) {
        listDiv.innerHTML = '<div class="no-scores">No scores yet. Be the first!</div>';
        return;
      }

      
      listDiv.innerHTML = this.renderScoresList(scores, true);
      console.log('✅ Scores rendered');

    } catch (error) {
      console.error('❌ Failed to load scores:', error);

      
      console.log('⚠️ Hiding loading spinner (error path)');
      loadingDiv.classList.add('hidden');
      loadingDiv.style.display = 'none';

      listDiv.innerHTML = '<div class="error">Failed to load scores. Please try again.</div>';
    }
  }

  /**
   * Load personal best scores and stats
   */
  async loadPersonalScores() {
    console.log('👤 Loading personal scores...');
    const listDiv = document.getElementById('scoreboard-list');
    const loadingDiv = document.getElementById('scoreboard-loading');
    const currentUsername = this.firebaseService.getCurrentUsername();

    if (!listDiv || !loadingDiv) {
      console.error('❌ Scoreboard elements not found!');
      return;
    }

    
    console.log('🔄 Showing loading spinner');
    loadingDiv.classList.remove('hidden');
    loadingDiv.style.display = 'block';
    listDiv.innerHTML = '';

    if (!currentUsername) {
      console.log('⚠️ No user logged in');
      loadingDiv.classList.add('hidden');
      loadingDiv.style.display = 'none';
      listDiv.innerHTML = '<div class="no-scores">Login to see your scores</div>';
      return;
    }

    console.log(`👤 Loading scores for user: ${currentUsername}`);

    try {
      
      const stats = await this.firebaseService.getUserStats().catch(err => {
        console.warn('Failed to load stats from Firebase, using local only:', err);
        return null;
      });

      console.log('📊 User stats:', stats);

      
      const allScores = JSON.parse(localStorage.getItem('dhivehi_type_scores') || '[]');
      const userScores = allScores
        .filter(s => s.username === currentUsername)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      console.log(`✅ Found ${userScores.length} personal scores`);

      
      console.log('✅ Hiding loading spinner');
      loadingDiv.classList.add('hidden');
      loadingDiv.style.display = 'none';

      let html = '';

      
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

      
      if (userScores.length > 0) {
        html += '<h3 style="margin-top: 20px; color: #7ba8d1; text-align: center; font-family: \'Orbitron\', Arial, sans-serif;">Your Top 5 Scores</h3>';
        html += this.renderScoresList(userScores, false);
      } else if (!stats) {
        html = '<div class="no-scores">No data yet. Start playing!</div>';
      }

      listDiv.innerHTML = html;

    } catch (error) {
      console.error('❌ Failed to load personal scores:', error);

      
      console.log('⚠️ Hiding loading spinner (error path)');
      loadingDiv.classList.add('hidden');
      loadingDiv.style.display = 'none';

      listDiv.innerHTML = '<div class="error">Failed to load personal scores</div>';
    }
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
          ${showRank ? '<div class="col-games">Games</div>' : ''}
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
        ${showRank ? `<div class="col-games">${score.gamesPlayed || 1}</div>` : ''}
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
