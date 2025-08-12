// globalEmailSync.js - Enhanced with proactive bonus-triggered prompts
import { Store, Events } from './state.js';

(function () {
  const SESSION_FLAG = 'emailSyncPromptShown';
  let shownThisSession = sessionStorage.getItem(SESSION_FLAG) === 'true';
  let popupEl = null;
  let messageOverride = null;

  // Build once
  function ensurePopup() {
    if (popupEl) return popupEl;
    const el = document.createElement('div');
    el.className = 'email-sync-popup hidden';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = `
      <div class="popup-content">
        <p class="popup-text"></p>
        <div class="popup-actions">
          <button class="btn btn-primary btn-sync" type="button">Sync Now</button>
          <button class="popup-close" type="button" aria-label="Close">×</button>
        </div>
      </div>
    `;
    document.body.appendChild(el);
    popupEl = el;

    // Wire actions (use direct listeners; this module is global)
    el.querySelector('.btn-sync')?.addEventListener('click', () => {
      hide();
      sessionStorage.setItem(SESSION_FLAG, 'true');
      shownThisSession = true;
      
      // Use the new ContactsPermission sheet if available
      if (window.ContactsPermission?.open) {
        window.ContactsPermission.open();
      } else {
        // Fallback to existing flow
        Events.emit('addressBook:syncRequest', { source: 'emailPrompt' });
      }
      
      // Track for analytics
      Events.emit('analytics:track', { 
        event: 'email_sync_requested', 
        source: 'global_popup',
        trigger: messageOverride ? 'bonus' : 'typing'
      });
    });
    
    el.querySelector('.popup-close')?.addEventListener('click', () => {
      hide();
      sessionStorage.setItem(SESSION_FLAG, 'true');
      shownThisSession = true;
      
      // Track dismissal
      Events.emit('analytics:track', { 
        event: 'email_sync_dismissed', 
        source: 'global_popup',
        trigger: messageOverride ? 'bonus' : 'typing'
      });
    });

    return popupEl;
  }

  function setText(copy) {
    const p = popupEl?.querySelector('.popup-text');
    if (!p) return;
    p.textContent = copy;
  }

  function show({ copy } = {}) {
    if (Store.get('profile.contactsConnected') === true) return;
    if (shownThisSession) return;

    ensurePopup();
    // Copy priority: override from proactive event → default baseline
    const base = '💡 Sync your address book and never type again';
    setText(copy || messageOverride || base);

    popupEl.classList.remove('hidden');
    // animate in on next frame
    requestAnimationFrame(() => popupEl.classList.add('visible'));

    // Auto-dismiss after 15 seconds
    setTimeout(() => {
      if (popupEl && popupEl.classList.contains('visible')) {
        hide();
      }
    }, 15000);

    // Subtle micro-pulse on the primary CTA (once)
    const btn = popupEl.querySelector('.btn-sync');
    if (btn) {
      btn.classList.remove('sync-pulse'); // reset just in case
      setTimeout(() => {
        // if user already dismissed or clicked, skip
        if (!popupEl.classList.contains('visible')) return;
        btn.classList.add('sync-pulse');
        btn.addEventListener('animationend', () => btn.classList.remove('sync-pulse'), { once: true });
      }, 1200);
    }
  }

  function hide() {
    if (!popupEl) return;
    popupEl.classList.remove('visible');
    setTimeout(() => {
      if (popupEl) {
        popupEl.classList.add('hidden');
        popupEl.style.display = 'none';
      }
    }, 220);
  }

  /** Trigger 1: reactive — when user starts typing an email anywhere */
  document.addEventListener('input', (e) => {
    if (shownThisSession) return;
    if (sessionStorage.getItem(SESSION_FLAG) === 'true') return;
    const el = e.target;
    if (!(el instanceof HTMLInputElement)) return;

    const isEmail =
      (el.type && el.type.toLowerCase() === 'email') ||
      /(^|[\W_])(email|e-mail)([\W_]|$)/i.test(el.name || '') ||
      /(^|[\W_])(email|e-mail)([\W_]|$)/i.test(el.id || '') ||
      /(^|[\W_])(email|e-mail)([\W_]|$)/i.test(el.placeholder || '') ||
      /(^|[\W_])(email|e-mail)([\W_]|$)/i.test(el.className || '');

    if (!isEmail) return;
    if (!e.isTrusted) return; // ignore autofill / programmatic
    if (!el.value || el.value.length < 1) return; // must have content

    // show baseline copy
    messageOverride = null;
    show();
  }, { passive: true });

  /** Trigger 2: proactive — right after bonus invites are granted */
  Events.on('invites:bonus', ({ added, remaining }) => {
    if (shownThisSession) return;
    if (sessionStorage.getItem(SESSION_FLAG) === 'true') return;
    if (Store.get('profile.contactsConnected') === true) return;

    // Set a more compelling copy for this occasion
    messageOverride = `✨ +${added} bonus invites unlocked — sync contacts to send faster`;
    // Delay slightly so the reward moment can land first
    setTimeout(() => show({ copy: messageOverride }), 900);
  });

  // Listen for contacts connected to hide popup
  Events.on('contacts:connected', () => {
    if (popupEl && popupEl.classList.contains('visible')) {
      hide();
    }
  });

  // Keyboard handling for popup
  document.addEventListener('keydown', (e) => {
    if (!popupEl || !popupEl.classList.contains('visible')) return;
    
    if (e.key === 'Escape') {
      hide();
      sessionStorage.setItem(SESSION_FLAG, 'true');
      shownThisSession = true;
      e.preventDefault();
    }
  });

  // Click outside to dismiss
  document.addEventListener('click', (e) => {
    if (!popupEl || !popupEl.classList.contains('visible')) return;
    if (popupEl.contains(e.target)) return;
    
    // Delay slightly to allow for intentional clicks
    setTimeout(() => {
      if (popupEl && popupEl.classList.contains('visible')) {
        hide();
        sessionStorage.setItem(SESSION_FLAG, 'true');
        shownThisSession = true;
      }
    }, 100);
  }, true);

  console.log('🌐 Enhanced global email sync listener initialized (reactive + proactive)');
})();