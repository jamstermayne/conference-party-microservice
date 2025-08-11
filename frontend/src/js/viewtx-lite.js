// viewtx-lite.js — safe view transition helper
export function swap(renderFn, { root = document.getElementById('main') || document.body } = {}) {
  if (!root) return renderFn();

  const native = document.startViewTransition;
  if (typeof native === 'function') {
    return document.startViewTransition(async () => {
      await Promise.resolve(renderFn());
    });
  }

  // Fallback CSS transition
  const exiting = root.firstElementChild;
  if (exiting) {
    exiting.classList.add('viewtx-fade-exit');
    requestAnimationFrame(() => exiting.classList.add('viewtx-fade-exit-active'));
  }
  const tmp = document.createElement('div');
  tmp.className = 'viewtx-fade-enter';
  root.appendChild(tmp);
  requestAnimationFrame(() => tmp.classList.add('viewtx-fade-enter-active'));

  try {
    renderFn();
  } finally {
    // cleanup previous
    if (exiting) exiting.remove();
    // remove helper wrapper if used
    tmp.classList.remove('viewtx-fade-enter', 'viewtx-fade-enter-active');
  }
}
export default { swap };