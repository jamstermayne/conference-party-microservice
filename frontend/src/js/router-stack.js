// router-stack.js - Fixed stack management
(function(window) {
  const getStack = () => document.getElementById('main') || document.getElementById('panel-stack') || document.getElementById('stack');
  const panels = []; // Track active panels

  function pushPanel(route, title, render) {
    const stack = getStack();
    if (!stack) {
      console.error('Stack container not found');
      return;
    }

    // Deactivate previous panel
    const prevPanel = panels[panels.length - 1];
    if (prevPanel) {
      prevPanel.el.classList.remove('is-active');
    }

    // Create new panel
    const el = document.createElement('section');
    el.className = 'v-panel';
    el.innerHTML = `
      <header class="v-topbar">
        <button class="v-topbar__back" aria-label="Back">‹</button>
        <div class="v-topbar__title">${title}</div>
        <span></span>
      </header>
      <main class="v-panel__body"></main>
    `;
    
    // Render content
    const body = el.querySelector('.v-panel__body');
    render(body);
    
    // Add to DOM
    stack.appendChild(el);
    
    // Activate after adding to DOM
    requestAnimationFrame(() => {
      el.classList.add('is-active');
    });
    
    // Wire up back button
    el.querySelector('.v-topbar__back').onclick = () => popPanel();
    
    // Track panel
    panels.push({ el, route, scrollY: 0 });
    
    // Focus for accessibility
    el.querySelector('.v-topbar__title')?.focus?.();
  }

  function popPanel() {
    if (panels.length <= 1) return; // Don't pop the home panel
    
    const cur = panels.pop();
    if (!cur) return;
    
    // Deactivate and remove current panel
    cur.el.classList.remove('is-active');
    cur.el.classList.add('v-panel-leave', 'is-exiting');
    
    // Remove after transition
    cur.el.addEventListener('transitionend', () => {
      cur.el.remove();
    }, { once: true });
    
    // Reactivate previous panel
    const prev = panels[panels.length - 1];
    if (prev) {
      requestAnimationFrame(() => {
        prev.el.classList.add('is-active');
        // Restore scroll position
        const body = prev.el.querySelector('.v-panel__body');
        if (body && prev.scrollY) {
          body.scrollTop = prev.scrollY;
        }
      });
    }
  }

  function clearStack() {
    // Remove all panels except home
    while (panels.length > 1) {
      const panel = panels.pop();
      panel.el.remove();
    }
    // Ensure home is active
    if (panels[0]) {
      panels[0].el.classList.add('is-active');
    }
  }

  // Export to window
  window.pushPanel = pushPanel;
  window.popPanel = popPanel;
  window.clearPanelStack = clearStack;
})(window);