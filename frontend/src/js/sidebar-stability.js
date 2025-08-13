/**
 * Sidebar Stability + Account transform
 * - Ensures sidebar never "blinks off"
 * - Converts `#settings` channel to a gear "Account" item
 * - Highlights active with gradient bar
 */
import Events from '/assets/js/events.js?v=b023';

export function hardenSidebar() {
  const aside = document.getElementById('sidenav') || document.querySelector('aside.sidenav');
  if (!aside) return;

  // 1) ensure nav markup exists before router binds
  const nav = aside.querySelector('.side-nav') || aside.querySelector('nav');
  if (!nav) return;

  // 2) convert #settings → account item with gear icon
  const settingsBtn = nav.querySelector('[data-route="settings"]');
  if (settingsBtn) {
    settingsBtn.setAttribute('data-route','account');
    settingsBtn.setAttribute('aria-label','Account');
    settingsBtn.classList.add('is-gear');
    settingsBtn.innerHTML = `
      <span class="side-gear" aria-hidden="true">⚙️</span>
      <span class="side-name">account</span>
    `;
  }

  // 3) #channelname exact once
  nav.querySelectorAll('[data-route]').forEach(btn=>{
    const r = btn.getAttribute('data-route') || '';
    if (btn.classList.contains('is-gear')) return; // account already styled
    btn.innerHTML = `<span class="side-tag">#</span><span class="side-name">${r}</span>`;
  });

  // 4) add accent bar element if missing
  nav.querySelectorAll('[data-route]').forEach(btn=>{
    if (!btn.querySelector('.side-accent')) {
      const acc = document.createElement('span');
      acc.className = 'side-accent';
      btn.prepend(acc);
    }
  });

  // 5) active state from current hash
  const current = (location.hash || '#/parties').replace(/^#\/?/, '');
  nav.querySelectorAll('[data-route]').forEach(btn=>{
    btn.classList.toggle('active', btn.getAttribute('data-route') === current);
  });
}

// Re-apply on route change
try {
  document.addEventListener('route:change', ()=> hardenSidebar());
} catch {}

export default { hardenSidebar };