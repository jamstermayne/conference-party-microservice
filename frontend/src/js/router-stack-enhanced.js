// router-stack-enhanced.js - Enhanced version with hash routing
const stack = document.getElementById('panel-stack') || document.getElementById('stack');
const panels = []; // [{el, route, restore, focusEl}]
const routes = new Map(); // route pattern -> handler

/**
 * Register a route handler
 * @param {RegExp|string} pattern - Route pattern or exact string
 * @param {Function} handler - Handler function (params) => { title, render }
 */
export function registerRoute(pattern, handler) {
  routes.set(pattern, handler);
}

/**
 * Push a new panel onto the stack
 * @param {string} route - The route hash
 * @param {string} title - Panel title
 * @param {Function} render - Render function (container) => void
 * @param {HTMLElement} [focusEl] - Element to restore focus to on pop
 */
export function pushPanel(route, title, render, focusEl) {
  // Store current focus if not provided
  if (!focusEl) {
    focusEl = document.activeElement;
  }
  
  const el = document.createElement('section');
  el.className = 'v-panel';
  el.setAttribute('data-route', route);
  el.innerHTML = `
    <header class="v-topbar">
      <button class="v-topbar__back" aria-label="Back">‹</button>
      <div class="v-topbar__title">${title}</div>
      <span></span>
    </header>
    <main class="v-panel__body"></main>
  `;
  
  const body = el.querySelector('.v-panel__body');
  render(body);
  
  stack.appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-active'));
  
  // Back button handler
  el.querySelector('.v-topbar__back').onclick = (e) => {
    e.preventDefault();
    popPanel();
  };
  
  // Store panel info
  panels.push({ 
    el, 
    route, 
    restore: saveScroll(el),
    focusEl 
  });
  
  // Update URL without triggering hashchange
  history.pushState({ panelDepth: panels.length }, '', route);
  
  // Focus title for screen readers
  el.querySelector('.v-topbar__title')?.focus();
}

/**
 * Pop the current panel from the stack
 */
export function popPanel() {
  const cur = panels.pop();
  if (!cur) return;
  
  // Exit animation
  cur.el.classList.remove('is-active');
  cur.el.classList.add('v-panel-leave', 'is-exiting');
  
  // Restore scroll and focus
  cur.restore();
  if (cur.focusEl && cur.focusEl.isConnected) {
    cur.focusEl.focus();
  }
  
  // Remove after transition
  cur.el.addEventListener('transitionend', () => cur.el.remove(), { once: true });
  
  // Update URL to previous panel's route
  const prev = panels[panels.length - 1];
  if (prev) {
    history.replaceState({ panelDepth: panels.length }, '', prev.route);
  } else {
    history.replaceState({ panelDepth: 0 }, '', '#/home');
  }
}

/**
 * Clear all panels except the root
 */
export function clearStack() {
  while (panels.length > 1) {
    const panel = panels.pop();
    panel.el.remove();
  }
}

/**
 * Navigate to a route
 * @param {string} route - The route hash to navigate to
 */
export function navigateTo(route) {
  // Find matching route handler
  for (const [pattern, handler] of routes) {
    let match;
    if (pattern instanceof RegExp) {
      match = route.match(pattern);
    } else if (typeof pattern === 'string') {
      match = route === pattern ? [route] : null;
    }
    
    if (match) {
      const { title, render } = handler(...match);
      pushPanel(route, title, render);
      return true;
    }
  }
  
  console.warn(`No handler for route: ${route}`);
  return false;
}

/**
 * Save scroll position for a panel
 */
function saveScroll(el) {
  const scroller = el.querySelector('.v-panel__body');
  const y = scroller?.scrollTop || 0;
  return () => { 
    if (scroller) scroller.scrollTop = y; 
  };
}

/**
 * Handle browser back button
 */
window.addEventListener('popstate', (e) => {
  const targetDepth = e.state?.panelDepth || 0;
  const currentDepth = panels.length;
  
  if (targetDepth < currentDepth) {
    // Pop panels to match browser state
    const toPop = currentDepth - targetDepth;
    for (let i = 0; i < toPop; i++) {
      popPanel();
    }
  }
});

/**
 * Handle hash changes (for initial load and external navigation)
 */
window.addEventListener('hashchange', () => {
  const route = location.hash || '#/home';
  // Only navigate if we're not already on this route
  const current = panels[panels.length - 1];
  if (!current || current.route !== route) {
    navigateTo(route);
  }
});