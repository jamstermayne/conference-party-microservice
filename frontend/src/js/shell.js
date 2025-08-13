/**
 * Shell utilities for sidebar management
 */

export async function ensureShell() {
  // Shell is already built inline in index.html
  return Promise.resolve();
}

export function setActive(route) {
  document.querySelectorAll('[data-route]').forEach(a => {
    a.classList.toggle('active', a.dataset.route === route);
  });
}

export default { ensureShell, setActive };