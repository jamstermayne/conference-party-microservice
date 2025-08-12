/**
 * Simple toast system with ARIA live region for a11y
 */
const container = document.createElement('div');
container.className = 'toast-container';
container.setAttribute('role','status');
container.setAttribute('aria-live','polite');
document.body.appendChild(container);

export function showToast(message, timeout=3000){
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(()=>toast.remove(), timeout);
}

document.addEventListener('ui:toast', e=>{
  showToast(e.detail?.message || 'Done');
});