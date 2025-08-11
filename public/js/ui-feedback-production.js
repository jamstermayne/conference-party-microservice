// Production UI Feedback: Toasts, Empty States, Loading, Modals
import Events from './events.js';
import Store from './store.js';

// Toast notification system
function showToast({ message, type = 'info', duration = 3000, action = null }) {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  
  // Toast content
  const content = document.createElement('div');
  content.className = 'toast-content';
  
  // Icon based on type
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  const icon = document.createElement('span');
  icon.className = 'toast-icon';
  icon.textContent = icons[type] || icons.info;
  
  const text = document.createElement('span');
  text.className = 'toast-message';
  text.textContent = message;
  
  content.appendChild(icon);
  content.appendChild(text);
  toast.appendChild(content);
  
  // Add action button if provided
  if (action) {
    const btn = document.createElement('button');
    btn.className = 'toast-action';
    btn.textContent = action.label;
    btn.onclick = () => {
      action.onClick();
      removeToast(toast);
    };
    toast.appendChild(btn);
  }
  
  // Add to container
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  container.appendChild(toast);
  
  // Animate in
  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });
  
  // Auto remove
  const timeout = setTimeout(() => removeToast(toast), duration);
  
  // Allow manual dismissal
  toast.addEventListener('click', () => {
    if (!action) {
      clearTimeout(timeout);
      removeToast(toast);
    }
  });
  
  return toast;
}

// Remove toast with animation
function removeToast(toast) {
  toast.classList.remove('visible');
  setTimeout(() => toast.remove(), 300);
}

// Empty state component
function emptyState(selector, { 
  icon = '📭', 
  title = 'No Content', 
  message = 'Nothing to show here yet.', 
  action = null 
}) {
  const container = typeof selector === 'string' 
    ? document.querySelector(selector) 
    : selector;
    
  if (!container) return;
  
  const emptyEl = document.createElement('div');
  emptyEl.className = 'empty-state';
  
  emptyEl.innerHTML = `
    <div class="empty-state-icon">${icon}</div>
    <h2 class="empty-state-title">${title}</h2>
    <p class="empty-state-message">${message}</p>
    ${action ? `
      <button class="btn btn-primary empty-state-action" id="empty-action-${Date.now()}">
        ${action.label}
      </button>
    ` : ''}
  `;
  
  container.innerHTML = '';
  container.appendChild(emptyEl);
  
  if (action) {
    const btn = emptyEl.querySelector('.empty-state-action');
    btn?.addEventListener('click', action.onClick);
  }
  
  return emptyEl;
}

// Loading state
function showLoading(selector, message = 'Loading...') {
  const container = typeof selector === 'string'
    ? document.querySelector(selector)
    : selector;
    
  if (!container) return;
  
  const loader = document.createElement('div');
  loader.className = 'loading-state';
  loader.innerHTML = `
    <div class="spinner"></div>
    <p class="loading-message">${message}</p>
  `;
  
  container.innerHTML = '';
  container.appendChild(loader);
  
  return loader;
}

// Error state
function showError(selector, { 
  title = 'Error', 
  message = 'Something went wrong', 
  retry = null 
}) {
  return emptyState(selector, {
    icon: '❌',
    title,
    message,
    action: retry ? { label: 'Try Again', onClick: retry } : null
  });
}

// Modal system
class Modal {
  constructor(options = {}) {
    this.options = {
      title: '',
      content: '',
      closeable: true,
      className: '',
      buttons: [],
      onClose: null,
      ...options
    };
    
    this.element = null;
    this.overlay = null;
  }
  
  show() {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.addEventListener('click', () => {
      if (this.options.closeable) this.close();
    });
    
    // Create modal
    this.element = document.createElement('div');
    this.element.className = `modal ${this.options.className}`;
    this.element.setAttribute('role', 'dialog');
    this.element.setAttribute('aria-modal', 'true');
    if (this.options.title) {
      this.element.setAttribute('aria-labelledby', 'modal-title');
    }
    
    // Modal content
    let html = '';
    
    if (this.options.closeable) {
      html += `<button class="modal-close" aria-label="Close">&times;</button>`;
    }
    
    if (this.options.title) {
      html += `<h2 class="modal-title" id="modal-title">${this.options.title}</h2>`;
    }
    
    html += `<div class="modal-content">${this.options.content}</div>`;
    
    if (this.options.buttons.length) {
      html += '<div class="modal-buttons">';
      this.options.buttons.forEach((btn, i) => {
        const classes = btn.primary ? 'btn btn-primary' : 'btn btn-secondary';
        html += `<button class="${classes}" data-button-index="${i}">${btn.label}</button>`;
      });
      html += '</div>';
    }
    
    this.element.innerHTML = html;
    
    // Wire up buttons
    this.element.querySelectorAll('[data-button-index]').forEach(btn => {
      const index = parseInt(btn.dataset.buttonIndex);
      const config = this.options.buttons[index];
      btn.addEventListener('click', () => {
        if (config.onClick) config.onClick();
        if (config.closeOnClick !== false) this.close();
      });
    });
    
    // Close button
    const closeBtn = this.element.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
    
    // Add to DOM
    document.body.appendChild(this.overlay);
    document.body.appendChild(this.element);
    
    // Animate in
    requestAnimationFrame(() => {
      this.overlay.classList.add('visible');
      this.element.classList.add('visible');
    });
    
    // Focus management
    this.element.focus();
    
    // Trap focus
    this.trapFocus();
    
    // Store in global state
    Store.patch('ui.modal', this);
    
    return this;
  }
  
  close() {
    if (!this.element) return;
    
    // Animate out
    this.overlay.classList.remove('visible');
    this.element.classList.remove('visible');
    
    setTimeout(() => {
      this.overlay?.remove();
      this.element?.remove();
      this.overlay = null;
      this.element = null;
    }, 300);
    
    // Clear from state
    Store.patch('ui.modal', null);
    
    // Callback
    if (this.options.onClose) {
      this.options.onClose();
    }
    
    Events.emit('modal:closed');
  }
  
  trapFocus() {
    const focusable = this.element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (!focusable.length) return;
    
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    
    this.element.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.options.closeable) {
        this.close();
        return;
      }
      
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }
}

// Confirmation dialog
function confirm({ title = 'Confirm', message = 'Are you sure?', onConfirm, onCancel }) {
  const modal = new Modal({
    title,
    content: `<p>${message}</p>`,
    buttons: [
      {
        label: 'Cancel',
        onClick: onCancel
      },
      {
        label: 'Confirm',
        primary: true,
        onClick: onConfirm
      }
    ]
  });
  
  modal.show();
  return modal;
}

// Progress indicator
function showProgress(selector, { current = 0, total = 100, message = '' }) {
  const container = typeof selector === 'string'
    ? document.querySelector(selector)
    : selector;
    
  if (!container) return;
  
  const percent = Math.round((current / total) * 100);
  
  const progress = document.createElement('div');
  progress.className = 'progress-state';
  progress.innerHTML = `
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${percent}%"></div>
    </div>
    <p class="progress-message">${message || `${percent}%`}</p>
  `;
  
  container.innerHTML = '';
  container.appendChild(progress);
  
  return progress;
}

// Wire up event listeners
Events.on('ui:toast', showToast);
Events.on('ui:empty', (params) => emptyState(params.container, params));
Events.on('ui:loading', (params) => showLoading(params.container, params.message));
Events.on('ui:error', (params) => showError(params.container, params));
Events.on('ui:progress', (params) => showProgress(params.container, params));
Events.on('ui:confirm', confirm);

Events.on('ui:modal', (options) => {
  const modal = new Modal(options);
  modal.show();
});

Events.on('modal:close', () => {
  const modal = Store.get('ui.modal');
  if (modal && modal.close) modal.close();
});

// Add required styles if not present
document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('style[data-ui-feedback]')) {
    const style = document.createElement('style');
    style.setAttribute('data-ui-feedback', 'true');
    style.textContent = `
      .toast-container { position: fixed; top: 20px; right: 20px; z-index: 10000; }
      .toast { background: var(--color-surface, #2a2d31); color: white; padding: 12px 16px; 
                border-radius: 8px; margin-bottom: 10px; display: flex; align-items: center;
                opacity: 0; transform: translateX(100%); transition: all 0.3s; }
      .toast.visible { opacity: 1; transform: translateX(0); }
      .toast-success { background: #10b981; }
      .toast-error { background: #ef4444; }
      .toast-warning { background: #f59e0b; }
      .toast-icon { margin-right: 8px; }
      .empty-state { text-align: center; padding: 40px 20px; }
      .empty-state-icon { font-size: 48px; margin-bottom: 16px; }
      .loading-state { text-align: center; padding: 40px; }
      .spinner { width: 40px; height: 40px; border: 3px solid #e5e7eb;
                 border-top-color: #3b82f6; border-radius: 50%;
                 animation: spin 1s linear infinite; margin: 0 auto 16px; }
      @keyframes spin { to { transform: rotate(360deg); } }
      .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5);
                       z-index: 9998; opacity: 0; transition: opacity 0.3s; }
      .modal-overlay.visible { opacity: 1; }
      .modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.9);
               background: var(--color-surface, white); border-radius: 12px;
               padding: 24px; max-width: 500px; width: 90%; z-index: 9999;
               opacity: 0; transition: all 0.3s; }
      .modal.visible { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      .modal-close { position: absolute; top: 12px; right: 12px; background: none;
                     border: none; font-size: 24px; cursor: pointer; }
      .modal-buttons { display: flex; gap: 12px; margin-top: 24px; justify-content: flex-end; }
      .progress-bar { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
      .progress-fill { height: 100%; background: #3b82f6; transition: width 0.3s; }
    `;
    document.head.appendChild(style);
  }
});

// Export API
export { 
  showToast, 
  emptyState, 
  showLoading, 
  showError, 
  showProgress,
  confirm,
  Modal 
};

export default {
  showToast,
  emptyState,
  showLoading,
  showError,
  showProgress,
  confirm,
  Modal
};