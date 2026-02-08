/**
 * Custom confirmation modal with styled UI
 */
export class ConfirmModal {
  constructor() {
    this.modal = null;
    this.resolveCallback = null;
    this.createModal();
  }

  /**
   * Create the confirmation modal HTML
   */
  createModal() {
    this.modal = document.createElement('div');
    this.modal.id = 'confirm-modal';
    this.modal.className = 'modal hidden';

    this.modal.innerHTML = `
      <div class="modal-content confirm-modal-content">
        <h2 id="confirm-title">Confirm Action</h2>
        <p id="confirm-message">Are you sure?</p>

        <div class="confirm-buttons">
          <button id="confirm-yes" class="btn-primary">Yes</button>
          <button id="confirm-no" class="btn-secondary">No</button>
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
    const yesBtn = document.getElementById('confirm-yes');
    const noBtn = document.getElementById('confirm-no');

    yesBtn.addEventListener('click', () => this.confirm(true));
    noBtn.addEventListener('click', () => this.confirm(false));

    // ESC key to cancel
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
        this.confirm(false);
      }
    });

    // Click outside to cancel
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.confirm(false);
      }
    });
  }

  /**
   * Show confirmation dialog
   * @param {string} message - Message to display
   * @param {string} title - Optional title (default: "Confirm Action")
   * @returns {Promise<boolean>} - True if confirmed, false if cancelled
   */
  show(message, title = 'Confirm Action') {
    return new Promise((resolve) => {
      this.resolveCallback = resolve;

      // Set content
      document.getElementById('confirm-title').textContent = title;
      document.getElementById('confirm-message').textContent = message;

      // Show modal
      this.modal.classList.remove('hidden');

      // Focus Yes button
      document.getElementById('confirm-yes').focus();
    });
  }

  /**
   * Handle confirmation result
   */
  confirm(result) {
    this.modal.classList.add('hidden');
    if (this.resolveCallback) {
      this.resolveCallback(result);
      this.resolveCallback = null;
    }
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
