// Toast Notification System
import Events from './foundation/events.js';

class ToastManager {
  constructor() {
    this.container = this.createContainer();
    this.toasts = new Map();
    this.init();
  }

  init() {
    // Listen for toast events
    Events.on('ui:toast', (data) => this.show(data));
    Events.on('toast:show', (data) => this.show(data));
    Events.on('toast:hide', (data) => this.hide(data.id));
    
    // Listen for common app events
    Events.on('sw:update', () => this.showUpdate());
    Events.on('app:offline', () => this.showOffline());
    Events.on('app:online', () => this.showOnline());
    Events.on('api:error', (data) => this.showError(data.message));
  }

  createContainer() {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  show(options = {}) {
    const {
      message = '',
      title = '',
      type = 'info',
      duration = 5000,
      persistent = false,
      actions = []
    } = options;

    if (!message) return null;

    const id = this.generateId();
    const toast = this.createToast(id, { message, title, type, persistent, actions });
    
    this.container.appendChild(toast);
    this.toasts.set(id, toast);

    // Auto-dismiss unless persistent
    if (!persistent && duration > 0) {
      setTimeout(() => this.hide(id), duration);
    }

    // Emit shown event
    Events.emit('toast:shown', { id, type, message });

    return id;
  }

  createToast(id, options) {
    const { message, title, type, persistent, actions } = options;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.dataset.toastId = id;

    const icon = this.getIcon(type);
    
    toast.innerHTML = `
      ${icon ? `<div class="toast__icon">${icon}</div>` : ''}
      <div class="toast__content">
        ${title ? `<div class="toast__title">${this.escapeHtml(title)}</div>` : ''}
        <div class="toast__message">${this.escapeHtml(message)}</div>
        ${actions.length > 0 ? this.renderActions(actions, id) : ''}
      </div>
      <button class="toast__close" data-action="close-toast" data-toast-id="${id}" aria-label="Close">×</button>
    `;

    // Bind close button
    const closeBtn = toast.querySelector('.toast__close');
    closeBtn.addEventListener('click', () => this.hide(id));

    // Bind action buttons
    actions.forEach((action, index) => {
      const btn = toast.querySelector(`[data-action-index="${index}"]`);
      if (btn) {
        btn.addEventListener('click', () => {
          if (action.handler) action.handler();
          if (action.dismiss !== false) this.hide(id);
        });
      }
    });

    return toast;
  }

  renderActions(actions, toastId) {
    return `
      <div class="toast__actions">
        ${actions.map((action, index) => `
          <button class="toast__action ${action.primary ? 'toast__action--primary' : ''}" 
                  data-action-index="${index}">
            ${this.escapeHtml(action.label)}
          </button>
        `).join('')}
      </div>
    `;
  }

  hide(id) {
    const toast = this.toasts.get(id);
    if (!toast) return;

    toast.classList.add('removing');
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      this.toasts.delete(id);
      Events.emit('toast:hidden', { id });
    }, 300);
  }

  hideAll() {
    this.toasts.forEach((_, id) => this.hide(id));
  }

  getIcon(type) {
    const icons = {
      success: '✅',
      warning: '⚠️',
      error: '❌',
      info: 'ℹ️'
    };
    return icons[type] || '';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  generateId() {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Convenience methods for common toast types
  showSuccess(message, title = '') {
    return this.show({ message, title, type: 'success' });
  }

  showError(message, title = 'Error') {
    return this.show({ message, title, type: 'error', duration: 8000 });
  }

  showWarning(message, title = 'Warning') {
    return this.show({ message, title, type: 'warning', duration: 6000 });
  }

  showInfo(message, title = '') {
    return this.show({ message, title, type: 'info' });
  }

  showUpdate() {
    return this.show({
      message: 'A new version is available. Reload to update.',
      title: 'Update Available',
      type: 'info',
      persistent: true,
      actions: [
        {
          label: 'Reload',
          primary: true,
          handler: () => location.reload()
        },
        {
          label: 'Later',
          dismiss: true
        }
      ]
    });
  }

  showOffline() {
    return this.show({
      message: 'You are offline. Some features may be limited.',
      type: 'warning',
      persistent: true
    });
  }

  showOnline() {
    this.hideAll(); // Hide offline message
    return this.show({
      message: 'Connection restored.',
      type: 'success',
      duration: 2000
    });
  }
}

// Initialize toast manager
const toastManager = new ToastManager();

// Expose for external use
window.Toast = toastManager;

export default toastManager;