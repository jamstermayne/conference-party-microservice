/**
 * Shell utilities for sidebar management
 */

export async function ensureShell() {
  // Shell is already built inline in index.html
  return Promise.resolve();
}

export function setActive(route) {
  // Update active state for modern sidebar with is-active class
  document.querySelectorAll('.v-nav__link[data-route]')
    .forEach(a => {
      const isActive = a.dataset.route === route;
      a.classList.toggle('active', isActive); // Keep for backward compat
      a.classList.toggle('is-active', isActive); // Modern sidebar class
      a.classList.toggle('v-nav__link--active', isActive); // Legacy class
    });
}

export default { ensureShell, setActive };