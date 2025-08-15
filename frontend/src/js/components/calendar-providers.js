// calendar-providers.js — provider modal (minimal)
export function showProviderModal({ onGoogle, onOutlook, onM2M }) {
  const html = `
    <div class="modal-backdrop">
      <div class="modal">
        <div class="modal__header">
          <h3>Add to Calendar</h3>
          <button class="modal__close" data-close aria-label="Close">&times;</button>
        </div>
        <div class="modal__body">
          <p style="margin-bottom: 1rem; color: #666;">Choose your calendar provider:</p>
          <div class="modal__actions">
            <button class="btn btn-primary" data-google>
              <span style="margin-right: 8px;">📅</span>
              Google Calendar
            </button>
            <button class="btn btn-secondary" data-outlook>
              <span style="margin-right: 8px;">📧</span>
              Outlook (.ics)
            </button>
            <button class="btn btn-secondary" data-m2m>
              <span style="margin-right: 8px;">🤝</span>
              Meet to Match
            </button>
          </div>
        </div>
      </div>
    </div>`;
  
  const el = document.createElement('div');
  el.className = 'calendar-provider-modal';
  el.innerHTML = html;
  document.body.appendChild(el);
  
  // Add fade-in animation
  requestAnimationFrame(() => {
    el.classList.add('active');
  });

  const close = () => {
    el.classList.remove('active');
    setTimeout(() => el.remove(), 300);
  };

  // Wire up buttons
  el.querySelector('[data-google]').onclick = () => {
    onGoogle?.();
    close();
  };
  
  el.querySelector('[data-outlook]').onclick = () => {
    onOutlook?.();
    close();
  };
  
  el.querySelector('[data-m2m]').onclick = () => {
    onM2M?.();
    close();
  };
  
  el.querySelector('[data-close]').onclick = close;
  
  // Close on backdrop click
  el.querySelector('.modal-backdrop').onclick = (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      close();
    }
  };
  
  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
  
  return { close };
}

// Simple toast notification
export function toast(message, type = 'success') {
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}