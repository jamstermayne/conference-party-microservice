/** Lightweight panel stack + focus restoration. */
const Stack = (() => {
  let host, live;
  const historyStack = [];
  
  // Initialize after DOM ready
  function init() {
    host = document.querySelector('#stack');
    live = document.querySelector('#stack .sr-only[aria-live]');
    return host && live;
  }

  function createPanel(id, { title, content, onBack }) {
    const panel = document.createElement('section');
    panel.className = 'v-panel';
    panel.id = `panel-${id}`;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.dataset.state = 'enter';
    panel.innerHTML = `
      <header class="v-panel__header">
        <button class="v-back" aria-label="Back" data-back>&larr;</button>
        <h1 class="v-title" id="title-${id}">${title}</h1>
        <span aria-hidden="true"></span>
      </header>
      <div class="v-scroll" data-content></div>
    `;
    panel.querySelector('[data-content]').appendChild(content);
    panel.querySelector('[data-back]').addEventListener('click', () => pop(onBack));
    host.appendChild(panel);
    requestAnimationFrame(() => panel.dataset.state = 'active');
    panel.querySelector('.v-back')?.focus();
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
    top.node.dataset.state = 'exit';
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