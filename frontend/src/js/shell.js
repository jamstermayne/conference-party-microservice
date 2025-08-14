/**
 * Shell utilities for sidebar management
 */

export async function ensureShell() {
  // Shell is already built inline in index.html
  return Promise.resolve();
}

export function setActive(route) {
  document.querySelectorAll('.sidebar [data-route]')
    .forEach(a => a.classList.toggle('is-active', a.dataset.route === route));
}

export default { ensureShell, setActive };