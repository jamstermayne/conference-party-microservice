import { Events } from './state.js';

// Toast notification system
function showToast({ message, type = 'info', duration = 3000 }) {
  // Remove any existing toasts with same message
  const existingToasts = document.querySelectorAll('.toast');
  existingToasts.forEach(toast => {
    if (toast.textContent === message) {
      toast.remove();
    }
  });
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  
  document.body.appendChild(toast);
  
  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });
  
  // Auto dismiss
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, duration);
  
  return toast;
}

// Empty state renderer
function renderEmptyState(containerSelector, { icon, title, message, action }) {
  const container = typeof containerSelector === 'string' 
    ? document.querySelector(containerSelector)
    : containerSelector;
    
  if (!container) return;
  
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">${icon || '📭'}</div>
      <h2>${title}</h2>
      <p>${message}</p>
      ${action ? `<button class="btn btn-primary" id="empty-action">${action.label}</button>` : ''}
    </div>
  `;
  
  if (action && typeof action.onClick === 'function') {
    const actionBtn = container.querySelector('#empty-action');
    if (actionBtn) {
      actionBtn.addEventListener('click', action.onClick);
    }
  }
}

// Loading state renderer
function showLoadingState(containerSelector, message = 'Loading...') {
  const container = typeof containerSelector === 'string'
    ? document.querySelector(containerSelector)
    : containerSelector;
    
  if (!container) return;
  
  container.innerHTML = `
    <div class="loading-state">
      <div class="spinner-large"></div>
      <p>${message}</p>
    </div>
  `;
}

// Modal system
class ModalManager {
  constructor() {
    this.modals = new Map();
  }
  
  open({ id, title, content, actions, closeable = true }) {
    // Close existing modal with same ID
    if (this.modals.has(id)) {
      this.close(id);
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = `modal-${id}`;
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        ${closeable ? '<button class="modal-close" aria-label="Close">×</button>' : ''}
        ${title ? `<h2 class="modal-title">${title}</h2>` : ''}
        <div class="modal-body">
          ${content}
        </div>
        ${actions ? `
          <div class="modal-actions">
            ${actions.map(action => `
              <button class="btn ${action.class || 'btn-primary'}" data-action="${action.id}">
                ${action.label}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
    
    document.body.appendChild(modal);
    this.modals.set(id, modal);
    
    // Setup event handlers
    if (closeable) {
      const closeBtn = modal.querySelector('.modal-close');
      const backdrop = modal.querySelector('.modal-backdrop');
      
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.close(id));
      }
      if (backdrop) {
        backdrop.addEventListener('click', () => this.close(id));
      }
    }
    
    // Setup action handlers
    if (actions) {
      actions.forEach(action => {
        const btn = modal.querySelector(`[data-action="${action.id}"]`);
        if (btn && action.onClick) {
          btn.addEventListener('click', () => {
            action.onClick();
            if (action.closeOnClick !== false) {
              this.close(id);
            }
          });
        }
      });
    }
    
    // Show animation
    requestAnimationFrame(() => {
      modal.classList.add('visible');
    });
    
    return modal;
  }
  
  close(id) {
    const modal = this.modals.get(id);
    if (!modal) return;
    
    modal.classList.remove('visible');
    setTimeout(() => {
      modal.remove();
      this.modals.delete(id);
    }, 300);
  }
  
  closeAll() {
    this.modals.forEach((modal, id) => this.close(id));
  }
}

// Confirmation dialog
function confirm({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel' }) {
  return new Promise((resolve) => {
    modalManager.open({
      id: 'confirm-dialog',
      title,
      content: `<p>${message}</p>`,
      actions: [
        {
          id: 'cancel',
          label: cancelLabel,
          class: 'btn-ghost',
          onClick: () => resolve(false)
        },
        {
          id: 'confirm',
          label: confirmLabel,
          class: 'btn-primary',
          onClick: () => resolve(true)
        }
      ]
    });
  });
}

// Progress indicator
function showProgress(message = 'Processing...', progress = null) {
  let progressEl = document.querySelector('.progress-indicator');
  
  if (!progressEl) {
    progressEl = document.createElement('div');
    progressEl.className = 'progress-indicator';
    document.body.appendChild(progressEl);
  }
  
  progressEl.innerHTML = `
    <div class="progress-content">
      <div class="spinner"></div>
      <p>${message}</p>
      ${progress !== null ? `
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
      ` : ''}
    </div>
  `;
  
  progressEl.classList.add('visible');
  
  return {
    update: (newMessage, newProgress) => {
      const messageEl = progressEl.querySelector('p');
      if (messageEl && newMessage) {
        messageEl.textContent = newMessage;
      }
      if (newProgress !== null) {
        const fillEl = progressEl.querySelector('.progress-fill');
        if (fillEl) {
          fillEl.style.width = `${newProgress}%`;
        }
      }
    },
    close: () => {
      progressEl.classList.remove('visible');
      setTimeout(() => progressEl.remove(), 300);
    }
  };
}

// Initialize modal manager
const modalManager = new ModalManager();

// Setup event listeners
Events.on('ui:toast', (data) => {
  if (typeof data === 'string') {
    showToast({ message: data });
  } else {
    showToast(data);
  }
});

Events.on('ui:empty', (data) => {
  renderEmptyState(data.container, data);
});

Events.on('ui:loading', (data) => {
  showLoadingState(data.container, data.message);
});

Events.on('ui:modal:open', (data) => {
  modalManager.open(data);
});

Events.on('ui:modal:close', (id) => {
  modalManager.close(id);
});

Events.on('ui:progress:show', (data) => {
  showProgress(data.message, data.progress);
});

// Export functions
export { 
  showToast, 
  renderEmptyState, 
  showLoadingState,
  modalManager,
  confirm,
  showProgress
};