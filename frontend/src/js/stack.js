/** Lightweight panel stack + focus restoration. */
const Stack = (() => {
  let host, live;
  const historyStack = [];
  
  // Initialize after DOM ready
  function init() {
    host = document.getElementById('main') || document.querySelector('#stack');
    live = document.querySelector('#main .sr-only[aria-live]') || document.querySelector('#stack .sr-only[aria-live]');
    return host && live;
  }

  function createPanel(id, { title, content, onBack }) {
    // Deactivate any currently active panels
    host.querySelectorAll('.v-panel.is-active').forEach(p => {
      p.classList.remove('is-active');
    });
    
    const panel = document.createElement('section');
    panel.className = 'v-panel';
    panel.id = `panel-${id}`;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.innerHTML = `
      <div class="v-topbar">
        <button class="v-topbar__back" aria-label="Back" data-back>&larr;</button>
        <h1 class="v-topbar__title" id="title-${id}">${title}</h1>
        <span aria-hidden="true"></span>
      </div>
      <div class="v-scroll" data-content style="padding: var(--s-4);"></div>
    `;
    panel.querySelector('[data-content]').appendChild(content);
    panel.querySelector('[data-back]').addEventListener('click', () => pop(onBack));
    host.appendChild(panel);
    requestAnimationFrame(() => panel.classList.add('is-active'));
    panel.querySelector('.v-topbar__back')?.focus();
    if (live) live.textContent = `${title} opened`;
    return panel;
  }

  function push(id, opts, returnFocusEl) {
    if (!host && !init()) {
      console.error('Stack not initialized');
      return;
    }
    const p = createPanel(id, opts);
    historyStack.push({ id, node: p, returnFocusEl, onBack: opts.onBack });
    return p;
  }

  function pop(fallback) {
    const top = historyStack.pop();
    if (!top) return;
    top.node.classList.remove('is-active');
    top.node.classList.add('v-panel-leave', 'is-exiting');
    setTimeout(() => top.node.remove(), 260);
    (top.returnFocusEl || document.querySelector('[data-last-activator]'))?.focus?.();
    (top.onBack || fallback || (()=>{}))();
  }

  function clear() {
    if (!host && !init()) return;
    historyStack.splice(0);
    host.querySelectorAll('.v-panel').forEach(n => n.remove());
  }
  
  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { push, pop, clear, init };
})();
window.Stack = Stack;