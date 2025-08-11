// Email Sync Prompt: Fire once per session when user starts typing any email; inline, non-blocking; resilient positioning; Events → OAuth
import { Store, Events } from './state.js';

const SESSION_FLAG = 'emailSyncPromptShown';
let activePrompt = null;
let relEl = null;

export function initEmailSyncPrompt() {
  // Don't prompt if already connected
  if (Store.get('profile.contactsConnected') === true) return;

  // Only once per session
  if (sessionStorage.getItem(SESSION_FLAG) === '1') return;

  // Listen for human typing in any email field
  document.addEventListener('input', onInput, { passive: true });
  
  console.log('📧 Email sync prompt initialized');
}

function onInput(e) {
  const t = e.target;
  if (!t || !(t instanceof HTMLInputElement)) return;

  const isEmailField =
    (t.type && t.type.toLowerCase() === 'email') ||
    /(^|[\W_])(email|e-mail)([\W_]|$)/i.test(t.name || '') ||
    /(^|[\W_])(email|e-mail)([\W_]|$)/i.test(t.id || '') ||
    /(^|[\W_])(email|e-mail)([\W_]|$)/i.test(t.placeholder || '') ||
    /(^|[\W_])(email|e-mail)([\W_]|$)/i.test(t.className || '');

  if (!isEmailField) return;

  // Guard: ignore if value came from autofill and not real typing
  if (typeof e.isTrusted !== 'boolean' || !e.isTrusted) return;

  // Must have some actual content
  if (!t.value || t.value.length < 2) return;

  // Show once per session
  sessionStorage.setItem(SESSION_FLAG, '1');
  document.removeEventListener('input', onInput);

  relEl = t;
  mountPrompt(t);
}

function mountPrompt(inputEl) {
  dismissPrompt(); // safety

  const prompt = document.createElement('div');
  prompt.className = 'sync-toast';
  prompt.setAttribute('role', 'dialog');
  prompt.setAttribute('aria-live', 'polite');
  prompt.setAttribute('aria-labelledby', 'sync-title');
  
  const bonusText = bonusCopy();
  
  prompt.innerHTML = `
    <div class="sync-row">
      <span class="sync-text" id="sync-title">
        📇 Sync your address book and never type again${bonusText}
      </span>
      <div class="sync-actions">
        <button class="btn btn-primary sync-btn" type="button">Sync now</button>
        <button class="sync-dismiss" type="button" aria-label="Dismiss">×</button>
      </div>
    </div>
  `;

  document.body.appendChild(prompt);
  activePrompt = prompt;

  // Position & animate
  positionPrompt();
  requestAnimationFrame(() => prompt.classList.add('visible'));

  // Wire actions
  const syncBtn = prompt.querySelector('.sync-btn');
  syncBtn?.addEventListener('click', onSync);
  prompt.querySelector('.sync-dismiss')?.addEventListener('click', dismissPrompt);
  
  // Add micro-pulse animation after a delay to draw attention
  setTimeout(() => {
    if (syncBtn && document.contains(syncBtn)) {
      syncBtn.classList.add('sync-pulse');
      
      // Remove class after animation to allow re-trigger
      syncBtn.addEventListener('animationend', () => {
        syncBtn.classList.remove('sync-pulse');
        
        // Add subtle continuous pulse for high-value action
        syncBtn.classList.add('sync-pulse-glow');
      }, { once: true });
    }
  }, 1500);

  // Auto-dismiss after 15 seconds
  setTimeout(() => {
    if (activePrompt === prompt) {
      dismissPrompt();
    }
  }, 15000);

  // Reposition on viewport change
  window.addEventListener('scroll', positionPrompt, { passive: true });
  window.addEventListener('resize', positionPrompt, { passive: true });
}

function bonusCopy() {
  const inv = Store.get('invites') || {};
  const hasBonus = inv.bonusAvailable === true || 
                  inv.policy === 'sync_bonus' || 
                  !Store.get('invites.syncBonusUsed'); // First-time sync bonus
  
  return hasBonus ? ` <strong>+5 bonus invites</strong>` : '';
}

function positionPrompt() {
  if (!activePrompt || !relEl) return;
  
  // Check if element is still in DOM and visible
  if (!document.contains(relEl) || !isElementVisible(relEl)) {
    dismissPrompt();
    return;
  }
  
  const rect = relEl.getBoundingClientRect();
  const pad = 8;

  // Use fixed positioning relative to viewport to avoid layout containers
  const prompt = activePrompt;
  prompt.style.position = 'fixed';

  let top = rect.top - prompt.offsetHeight - pad;
  let left = rect.left;

  // If above the viewport, place below the input
  if (top < 8) {
    top = rect.bottom + pad;
  }

  // If still off-screen below, position in viewport center
  if (top + prompt.offsetHeight > window.innerHeight - 8) {
    top = Math.max(8, (window.innerHeight - prompt.offsetHeight) / 2);
  }

  // Clamp horizontally into viewport
  const maxLeft = Math.max(8, window.innerWidth - prompt.offsetWidth - 8);
  left = Math.min(Math.max(8, left), maxLeft);

  prompt.style.top = `${Math.round(top)}px`;
  prompt.style.left = `${Math.round(left)}px`;
}

function isElementVisible(el) {
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && 
         rect.height > 0 && 
         rect.top >= 0 && 
         rect.left >= 0 && 
         rect.bottom <= window.innerHeight && 
         rect.right <= window.innerWidth;
}

function onSync() {
  // Emit a unified request; contacts.js will present provider choices & perform OAuth
  Events.emit('addressBook:syncRequest', { source: 'emailPrompt', inputEl: relEl });
  
  // Track for analytics
  Events.emit('analytics:track', { 
    event: 'email_sync_requested', 
    source: 'email_prompt',
    session: true
  });
  
  dismissPrompt();
}

function dismissPrompt() {
  if (!activePrompt) return;
  
  const p = activePrompt;
  activePrompt = null;
  relEl = null;
  
  // Remove event listeners
  window.removeEventListener('scroll', positionPrompt);
  window.removeEventListener('resize', positionPrompt);
  
  // Animate out
  p.classList.remove('visible');
  setTimeout(() => {
    if (document.contains(p)) {
      p.remove();
    }
  }, 220);
}

// Handle focus loss - dismiss if user clicks elsewhere
document.addEventListener('click', (e) => {
  if (!activePrompt) return;
  
  // Don't dismiss if clicking the prompt itself
  if (activePrompt.contains(e.target)) return;
  
  // Don't dismiss if clicking the related input
  if (relEl && (e.target === relEl || relEl.contains(e.target))) return;
  
  // Dismiss after a brief delay to allow for intentional interactions
  setTimeout(() => {
    if (activePrompt && !relEl?.matches(':focus')) {
      dismissPrompt();
    }
  }, 100);
}, true);

// Keyboard handling
document.addEventListener('keydown', (e) => {
  if (!activePrompt) return;
  
  if (e.key === 'Escape') {
    dismissPrompt();
    e.preventDefault();
    e.stopPropagation();
  }
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  dismissPrompt();
});

export default {
  initEmailSyncPrompt,
  dismissPrompt
};