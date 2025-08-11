/**
 * 🎨 PROFESSIONAL INTELLIGENCE PLATFORM - UI UTILITIES
 * Advanced UI management with sophisticated interactions and animations
 */

export class UI {
  constructor() {
    this.toastContainer = null;
    this.modalContainer = null;
    this.activeToasts = new Set();
    this.animationFrame = null;
    
    this.initializeContainers();
    console.log('🎨 UI system initialized');
  }

  /**
   * Initialize UI containers
   */
  initializeContainers() {
    this.toastContainer = document.getElementById('toast-container');
    this.modalContainer = document.getElementById('modal-container');
    
    if (!this.toastContainer) {
      console.warn('⚠️ Toast container not found');
    }
    
    if (!this.modalContainer) {
      console.warn('⚠️ Modal container not found');
    }
  }

  /**
   * Show toast notification with sophisticated styling
   */
  showToast(message, type = 'info', options = {}) {
    if (!this.toastContainer) {
      console.log(`Toast: ${message}`);
      return;
    }

    const {
      duration = 5000,
      title = null,
      persistent = false,
      action = null
    } = options;

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');

    // Set toast content
    let content = '';
    
    if (title) {
      content += `<div class="toast-title">${this.escapeHtml(title)}</div>`;
    }
    
    content += `<div class="toast-message">${this.escapeHtml(message)}</div>`;
    
    if (action) {
      content += `<button class="btn btn-sm btn-glass toast-action" data-action="${action.id}">${action.label}</button>`;
    }
    
    toast.innerHTML = content;

    // Add close button if persistent
    if (persistent) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'toast-close';
      closeBtn.innerHTML = '×';
      closeBtn.setAttribute('aria-label', 'Close notification');
      closeBtn.addEventListener('click', () => this.removeToast(toast));
      toast.appendChild(closeBtn);
    }

    // Handle action clicks
    if (action) {
      const actionBtn = toast.querySelector('.toast-action');
      actionBtn.addEventListener('click', () => {
        action.callback?.();
        this.removeToast(toast);
      });
    }

    // Add to container
    this.toastContainer.appendChild(toast);
    this.activeToasts.add(toast);

    // Trigger entrance animation
    requestAnimationFrame(() => {
      toast.classList.add('animate-slide-in');
    });

    // Auto-remove if not persistent
    if (!persistent) {
      setTimeout(() => {
        this.removeToast(toast);
      }, duration);
    }

    console.log(`🔔 Toast shown: ${message}`);
    return toast;
  }

  /**
   * Remove toast with animation
   */
  removeToast(toast) {
    if (!toast || !this.activeToasts.has(toast)) return;

    toast.style.animation = 'slideOut 0.3s ease-in forwards';
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      this.activeToasts.delete(toast);
    }, 300);
  }

  /**
   * Clear all toasts
   */
  clearToasts() {
    this.activeToasts.forEach(toast => this.removeToast(toast));
  }

  /**
   * Show modal with sophisticated backdrop and animations
   */
  showModal(content, options = {}) {
    if (!this.modalContainer) {
      console.warn('⚠️ Cannot show modal - container not found');
      return null;
    }

    const {
      title = null,
      size = 'medium',
      closable = true,
      backdrop = true,
      className = ''
    } = options;

    // Create modal structure
    const modal = document.createElement('div');
    modal.className = `modal modal-${size} ${className}`;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    if (title) {
      modal.setAttribute('aria-labelledby', 'modal-title');
    }

    let modalContent = '';
    
    if (title) {
      modalContent += `
        <header class="modal-header">
          <h2 id="modal-title" class="modal-title">${this.escapeHtml(title)}</h2>
          ${closable ? '<button class="modal-close" aria-label="Close modal">×</button>' : ''}
        </header>
      `;
    }
    
    modalContent += `<div class="modal-body">${content}</div>`;
    
    modal.innerHTML = modalContent;

    // Set up modal container
    this.modalContainer.innerHTML = '';
    this.modalContainer.appendChild(modal);
    this.modalContainer.classList.add('active');

    // Handle close button
    if (closable) {
      const closeBtn = modal.querySelector('.modal-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeModal());
      }
    }

    // Handle backdrop clicks
    if (backdrop && closable) {
      this.modalContainer.addEventListener('click', (e) => {
        if (e.target === this.modalContainer) {
          this.closeModal();
        }
      });
    }

    // Focus management
    const focusableElements = modal.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    console.log('🔍 Modal shown');
    return modal;
  }

  /**
   * Close modal with animation
   */
  closeModal() {
    if (!this.modalContainer) return;

    this.modalContainer.classList.remove('active');
    
    setTimeout(() => {
      this.modalContainer.innerHTML = '';
      document.body.style.overflow = '';
    }, 250);

    console.log('❌ Modal closed');
  }

  /**
   * Show confirmation dialog
   */
  showConfirmation(message, options = {}) {
    const {
      title = 'Confirm Action',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      type = 'warning'
    } = options;

    return new Promise((resolve) => {
      const content = `
        <div class="confirmation-dialog">
          <div class="confirmation-icon">
            ${this.getIconForType(type)}
          </div>
          <p class="confirmation-message">${this.escapeHtml(message)}</p>
          <div class="confirmation-actions">
            <button class="btn btn-ghost confirmation-cancel">${cancelText}</button>
            <button class="btn btn-primary confirmation-confirm">${confirmText}</button>
          </div>
        </div>
      `;

      const modal = this.showModal(content, { title, closable: false });
      
      const confirmBtn = modal.querySelector('.confirmation-confirm');
      const cancelBtn = modal.querySelector('.confirmation-cancel');
      
      confirmBtn.addEventListener('click', () => {
        this.closeModal();
        resolve(true);
      });
      
      cancelBtn.addEventListener('click', () => {
        this.closeModal();
        resolve(false);
      });
    });
  }

  /**
   * Show loading overlay
   */
  showLoading(message = 'Loading...') {
    const content = `
      <div class="loading-overlay">
        <div class="loading-spinner"></div>
        <div class="loading-message">${this.escapeHtml(message)}</div>
      </div>
    `;

    return this.showModal(content, { 
      closable: false, 
      backdrop: false,
      className: 'modal-loading'
    });
  }

  /**
   * Update element with smooth transition
   */
  updateContent(element, newContent, options = {}) {
    const { animation = 'fade', duration = 300 } = options;

    if (!element) return Promise.resolve();

    return new Promise((resolve) => {
      // Fade out
      element.style.transition = `opacity ${duration / 2}ms ease`;
      element.style.opacity = '0';

      setTimeout(() => {
        // Update content
        if (typeof newContent === 'string') {
          element.innerHTML = newContent;
        } else {
          element.innerHTML = '';
          element.appendChild(newContent);
        }

        // Fade in
        element.style.opacity = '1';
        
        setTimeout(() => {
          element.style.transition = '';
          resolve();
        }, duration / 2);
      }, duration / 2);
    });
  }

  /**
   * Add subtle pulse animation to element
   */
  pulse(element, options = {}) {
    const { 
      duration = 1000, 
      intensity = 0.1, 
      color = 'rgba(102, 126, 234, 0.3)' 
    } = options;

    if (!element) return;

    const originalBoxShadow = element.style.boxShadow;
    
    element.style.transition = `box-shadow ${duration / 4}ms ease`;
    element.style.boxShadow = `0 0 20px ${color}`;

    setTimeout(() => {
      element.style.boxShadow = originalBoxShadow;
      setTimeout(() => {
        element.style.transition = '';
      }, duration / 4);
    }, duration / 2);
  }

  /**
   * Animate number counter
   */
  animateCounter(element, from, to, duration = 1000) {
    if (!element) return Promise.resolve();

    return new Promise((resolve) => {
      const startTime = performance.now();
      const diff = to - from;

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const eased = 1 - Math.pow(1 - progress, 3);
        
        const current = Math.round(from + (diff * eased));
        element.textContent = current.toLocaleString();

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Add ripple effect to element
   */
  addRipple(element, event) {
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      pointer-events: none;
      transform: scale(0);
      animation: ripple 0.6s linear;
      z-index: 1;
    `;

    element.style.position = element.style.position || 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 600);
  }

  /**
   * Format date for display
   */
  formatDate(date, options = {}) {
    const {
      relative = false,
      includeTime = true,
      format = 'short'
    } = options;

    const d = new Date(date);
    const now = new Date();

    if (relative) {
      const diff = now.getTime() - d.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
      if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      return 'Just now';
    }

    const options_obj = {
      year: format === 'full' ? 'numeric' : '2-digit',
      month: format === 'full' ? 'long' : 'short',
      day: 'numeric'
    };

    if (includeTime) {
      options_obj.hour = '2-digit';
      options_obj.minute = '2-digit';
    }

    return d.toLocaleDateString('en-US', options_obj);
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
   * Get icon for notification type
   */
  getIconForType(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      question: '❓'
    };
    
    return `<span class="type-icon">${icons[type] || icons.info}</span>`;
  }

  /**
   * Debounce function calls
   */
  debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  }

  /**
   * Throttle function calls
   */
  throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function executedFunction(...args) {
      if (!lastRan) {
        func(...args);
        lastRan = Date.now();
      } else {
        clearTimeout(lastFunc);
        lastFunc = setTimeout(() => {
          if ((Date.now() - lastRan) >= limit) {
            func(...args);
            lastRan = Date.now();
          }
        }, limit - (Date.now() - lastRan));
      }
    };
  }

  /**
   * Add CSS animation keyframes dynamically
   */
  addAnimation(name, keyframes) {
    const style = document.createElement('style');
    style.textContent = `@keyframes ${name} { ${keyframes} }`;
    document.head.appendChild(style);
  }

  /**
   * Initialize UI animations
   */
  initializeAnimations() {
    // Add ripple animation
    this.addAnimation('ripple', `
      to {
        transform: scale(4);
        opacity: 0;
      }
    `);

    // Add slide out animation for toasts
    this.addAnimation('slideOut', `
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    `);

    console.log('🎬 UI animations initialized');
  }

  /**
   * Get UI statistics
   */
  getStats() {
    return {
      activeToasts: this.activeToasts.size,
      modalOpen: this.modalContainer?.classList.contains('active') || false,
      containersFound: {
        toast: !!this.toastContainer,
        modal: !!this.modalContainer
      }
    };
  }
}

// Initialize animations on load
document.addEventListener('DOMContentLoaded', () => {
  const ui = new UI();
  ui.initializeAnimations();
});