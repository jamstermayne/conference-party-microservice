/**
 * Shell utilities for sidebar management
 */

export async function ensureShell() {
  // Shell is already built inline in index.html
  return Promise.resolve();
}

export function setActive(route) {
  // Update active state for new v-nav__link structure
  document.querySelectorAll('.v-nav__link[data-route]')
    .forEach(a => {
      const isActive = a.dataset.route === route;
      a.classList.toggle('active', isActive);
      a.classList.toggle('v-nav__link--active', isActive);
    });
}

export default { ensureShell, setActive };