// Equalize widths for: Invites, My calendar, Contacts, Account
// CSP-safe, idempotent, runs on home, re-applies on resize & DOM changes.
const LABELS = ['Invites', 'My calendar', 'Contacts', 'Account'];

const norm = s => s.replace(/\s+/g,' ').trim().toLowerCase();
const findAllButtons = () =>
  [...document.querySelectorAll('.channel-btn, .channels-grid a, .channels-grid button')];

const pickByLabel = label =>
  findAllButtons().find(el => norm(el.textContent) === norm(label));

const ensureStyle = el => {
  el.style.display = 'inline-flex';
  el.style.justifyContent = 'center';
  el.style.alignItems = 'center';
  el.style.boxSizing = 'border-box';
  el.style.flex = '0 0 auto';
};

const measure = els => Math.ceil(Math.max(...els.map(el => el.getBoundingClientRect().width)));

let ro;
function applyEqualWidth() {
  // Only apply on home
  if (location.hash && !/^#\/home/.test(location.hash)) return;

  const els = LABELS.map(pickByLabel).filter(Boolean);
  if (!els.length) return;

  els.forEach(ensureStyle);
  const maxW = measure(els);
  els.forEach(el => el.style.setProperty('min-width', maxW + 'px', 'important'));
}

function setupObservers() {
  if (ro) ro.disconnect();
  ro = new ResizeObserver(() => applyEqualWidth());

  LABELS.map(pickByLabel).filter(Boolean).forEach(el => ro.observe(el));

  // Re-apply if DOM changes under channels grid
  const grid = document.querySelector('.channels-grid');
  if (grid) {
    const mo = new MutationObserver(() => {
      applyEqualWidth();
      LABELS.map(pickByLabel).filter(Boolean).forEach(el => ro.observe(el));
    });
    mo.observe(grid, {childList: true, subtree: true});
  }
}

function ready(fn){ document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn, {once:true}); }

ready(() => {
  applyEqualWidth();
  setupObservers();
});

window.addEventListener('hashchange', () => {
  if (/^#\/home/.test(location.hash)) {
    // Wait a tick for home UI to render then apply
    setTimeout(() => { applyEqualWidth(); setupObservers(); }, 50);
  }
}, {passive:true});