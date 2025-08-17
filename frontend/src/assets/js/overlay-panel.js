// overlay-panel.js - Reusable slide-in overlay (ES module)

let overlayEl = null;
let bodyEl = null;

// Inject styles once
if (!document.getElementById('_ov_css')) {
  const style = document.createElement('style');
  style.id = '_ov_css';
  style.textContent = `
    .overlay-panel {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      max-width: 32rem;
      background: var(--bg-primary, #fff);
      transform: translateX(100%);
      transition: transform 0.3s ease;
      z-index: 1000;
      display: flex;
      flex-direction: column;
    }
    .overlay-panel--active {
      transform: translateX(0);
    }
    .overlay-scrim {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
      z-index: 999;
    }
    .overlay-scrim--active {
      opacity: 1;
      pointer-events: auto;
    }
    .overlay-header {
      display: flex;
      align-items: center;
      gap: var(--s-4);
      padding: var(--s-4);
      border-bottom: 1px solid var(--border-primary, #e0e0e0);
    }
    .overlay-back {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      padding: var(--s-2);
      color: var(--text-primary, #000);
    }
    .overlay-title {
      flex: 1;
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0;
    }
    .overlay-body {
      flex: 1;
      overflow-y: auto;
      padding: var(--s-4);
    }
  `;
  document.head.appendChild(style);
}

export function showOverlay(title = '') {
  // Create scrim if needed
  let scrim = document.querySelector('.overlay-scrim');
  if (!scrim) {
    scrim = document.createElement('div');
    scrim.className = 'overlay-scrim';
    document.body.appendChild(scrim);
  }

  // Create overlay if needed
  if (!overlayEl) {
    overlayEl = document.createElement('div');
    overlayEl.className = 'overlay-panel';
    overlayEl.innerHTML = `
      <div class="overlay-header">
        <button class="overlay-back" aria-label="Back">←</button>
        <h2 class="overlay-title"></h2>
      </div>
      <div class="overlay-body"></div>
    `;
    document.body.appendChild(overlayEl);

    // Wire back button
    overlayEl.querySelector('.overlay-back').addEventListener('click', hideOverlay);
    scrim.addEventListener('click', hideOverlay);
  }

  // Update title
  overlayEl.querySelector('.overlay-title').textContent = title;

  // Clear and get body
  bodyEl = overlayEl.querySelector('.overlay-body');
  bodyEl.innerHTML = '';

  // Activate
  requestAnimationFrame(() => {
    scrim.classList.add('overlay-scrim--active');
    overlayEl.classList.add('overlay-panel--active');
  });

  return bodyEl;
}

export function hideOverlay() {
  const scrim = document.querySelector('.overlay-scrim');
  if (scrim) scrim.classList.remove('overlay-scrim--active');
  if (overlayEl) overlayEl.classList.remove('overlay-panel--active');
}