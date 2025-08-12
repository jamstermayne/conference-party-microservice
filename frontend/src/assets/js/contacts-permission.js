// Contacts permission sheet (vanilla, accessible, Slack-dark)
// Depends on: /js/store.js, /js/events.js, your design tokens/utilities
const Store = window.Store || { get: () => null, patch: () => {} };
const Events = window.Events || { emit: () => {} };

const DISMISS_KEY = 'ui.contacts.permissionDismissed';

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function focusTrap(container, firstSel, lastSel) {
  const first = container.querySelector(firstSel);
  const last  = container.querySelector(lastSel) || first;
  function onKey(e) {
    if (e.key !== 'Tab') return;
    const f = document.activeElement;
    if (e.shiftKey && f === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && f === last) { e.preventDefault(); first.focus(); }
  }
  container.addEventListener('keydown', onKey);
  return () => container.removeEventListener('keydown', onKey);
}

function announce(msg) {
  try {
    document.dispatchEvent(new CustomEvent('ui:toast', { detail: { type:'ok', message: msg }}));
    const live = document.getElementById('aria-live'); if (live) { live.textContent = ''; setTimeout(()=>live.textContent = msg, 20); }
  } catch {}
}

function renderSheet() {
  const sheet = el(`
    <div class="cp-backdrop" role="presentation" aria-hidden="true">
      <section class="cp-sheet" role="dialog" aria-modal="true" aria-labelledby="cp-title" aria-describedby="cp-desc">
        <header class="cp-head">
          <h2 id="cp-title" class="cp-title">Sync your address book</h2>
          <button class="btn btn-ghost btn-icon" data-action="cp-close" aria-label="Close">✕</button>
        </header>

        <div id="cp-desc" class="cp-body">
          <p class="cp-lead">Auto-complete emails, invite faster, and never type addresses again.</p>

          <ul class="cp-benefits">
            <li>• Smart suggestions while inviting or messaging</li>
            <li>• De-duplicated contacts merged across sources</li>
            <li>• Private to you — not shared without consent</li>
          </ul>

          <div class="cp-scope card card-outlined">
            <div class="cp-scope-head">What we request</div>
            <ul class="cp-scope-list">
              <li><span class="badge badge-secondary">Read contacts</span> names & emails</li>
              <li><span class="badge badge-secondary">Write none</span> (no edits to your address book)</li>
              <li><span class="badge badge-secondary">Zero spam</span> you control invites</li>
            </ul>
          </div>

          <div class="cp-disclosure text-secondary">
            You can disconnect any time in <strong>Settings → Integrations</strong>.
          </div>
        </div>

        <footer class="cp-foot">
          <button class="btn btn-ghost" data-action="cp-notnow">Not now</button>
          <button class="btn btn-primary" data-action="cp-connect">Connect contacts</button>
        </footer>
      </section>
    </div>
  `);

  // Animate in
  requestAnimationFrame(()=> sheet.classList.add('is-open'));

  // Close helpers
  const close = (persistDismiss=false) => {
    if (persistDismiss) Store.patch(DISMISS_KEY, true);
    sheet.classList.remove('is-open');
    sheet.addEventListener('transitionend', () => sheet.remove(), { once:true });
    untrap && untrap();
    document.body.classList.remove('no-scroll');
  };

  // Backdrop click
  sheet.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('cp-backdrop')) close(false);
  });

  // Buttons
  sheet.addEventListener('click', async (e) => {
    const a = e.target.closest('[data-action]');
    if (!a) return;
    if (a.dataset.action === 'cp-close' || a.dataset.action === 'cp-notnow') {
      close(true);
    }
    if (a.dataset.action === 'cp-connect') {
      a.disabled = true;
      a.textContent = 'Connecting…';
      try {
        // Prefer your real contacts connector if provided
        if (window.Contacts?.sync) {
          await window.Contacts.sync(); // implement Google/Apple/CSV behind this
          announce('Contacts synced');
          Events.emit('contacts:synced');
        } else {
          // Graceful fallback if not wired yet
          announce('Contacts sync will be available shortly');
        }
        close(true);
      } catch (err) {
        a.disabled = false;
        a.textContent = 'Connect contacts';
        document.dispatchEvent(new CustomEvent('ui:toast', { detail:{ type:'error', message:'Contacts sync failed' }}));
      }
    }
  });

  // Esc key
  function onEsc(e){ if (e.key === 'Escape') close(false); }
  document.addEventListener('keydown', onEsc, { once:true });

  // Focus trap & initial focus
  const untrap = focusTrap(sheet, '[data-action="cp-notnow"]', '[data-action="cp-connect"]');
  setTimeout(()=> sheet.querySelector('[data-action="cp-connect"]').focus(), 30);

  document.body.appendChild(sheet);
  document.body.classList.add('no-scroll');
}

function open() {
  if (Store.get(DISMISS_KEY)) {
    // user dismissed earlier; still allow explicit opens
  }
  renderSheet();
}

document.addEventListener('DOMContentLoaded', () => {
  window.ContactsPermission = { open };
});

console.log('✅ Contacts permission sheet loaded');