// UI Helper Functions

let toastTimeout;

export function initUI() {
  // Add keyboard navigation support
  document.addEventListener('keydown', handleKeyboardNavigation);
  
  // Initialize tooltips
  initTooltips();
  
  // Set up loading states
  initLoadingStates();
}

export function showToast(message, type = 'info') {
  // Remove existing toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
    clearTimeout(toastTimeout);
  }
  
  // Create new toast
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  // Add type-specific styling
  switch(type) {
    case 'success':
      toast.style.borderLeft = `4px solid var(--accent-success)`;
      break;
    case 'warning':
      toast.style.borderLeft = `4px solid var(--accent-warning)`;
      break;
    case 'error':
      toast.style.borderLeft = `4px solid var(--accent-danger)`;
      break;
    default:
      toast.style.borderLeft = `4px solid var(--accent-primary)`;
  }
  
  document.body.appendChild(toast);
  
  // Auto-dismiss after 3 seconds
  toastTimeout = setTimeout(() => {
    toast.style.animation = 'slideDown 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function showLoading(container) {
  const loading = document.createElement('div');
  loading.className = 'loading';
  loading.innerHTML = '<span class="sr-only">Loading...</span>';
  
  if (container) {
    container.innerHTML = '';
    container.appendChild(loading);
  }
  
  return loading;
}

export function hideLoading(container) {
  const loading = container?.querySelector('.loading');
  if (loading) {
    loading.remove();
  }
}

export function showModal(content, options = {}) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>${options.title || 'Modal'}</h2>
        <button class="close-modal" aria-label="Close">×</button>
      </div>
      <div class="modal-content">
        ${content}
      </div>
      ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close handlers
  modal.querySelector('.close-modal').addEventListener('click', () => {
    closeModal(modal);
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal(modal);
    }
  });
  
  return modal;
}

export function closeModal(modal) {
  modal.style.animation = 'fadeOut 0.3s ease-out';
  setTimeout(() => modal.remove(), 300);
}

function handleKeyboardNavigation(e) {
  // Tab navigation enhancement
  if (e.key === 'Tab') {
    document.body.classList.add('keyboard-nav');
  }
  
  // Escape key closes modals
  if (e.key === 'Escape') {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
      closeModal(modal);
    }
  }
}

function initTooltips() {
  // Initialize tooltips for elements with title attribute
  document.querySelectorAll('[title]').forEach(element => {
    const title = element.getAttribute('title');
    element.setAttribute('aria-label', title);
    element.removeAttribute('title');
  });
}

function initLoadingStates() {
  // Add skeleton loading for cards
  document.querySelectorAll('.card-list:empty').forEach(container => {
    for (let i = 0; i < 3; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'card skeleton';
      skeleton.style.height = '100px';
      container.appendChild(skeleton);
    }
  });
}

// Export additional UI utilities
export const UI = {
  showToast,
  showLoading,
  hideLoading,
  showModal,
  closeModal
};