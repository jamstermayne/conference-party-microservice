/**
 * Shell utilities for sidebar management
 */

export async function ensureShell() {
  // Shell is already built inline in index.html
  return Promise.resolve();
}

export function setActive(route) {
  // Update active state with single consistent class
  document.querySelectorAll('.v-nav__link[data-route]')
    .forEach(a => {
      const isActive = a.dataset.route === route;
      a.classList.toggle('active', isActive);
      // Set aria-current for accessibility
      if (isActive) {
        a.setAttribute('aria-current', 'page');
      } else {
        a.removeAttribute('aria-current');
      }
    });
}

export default { ensureShell, setActive };