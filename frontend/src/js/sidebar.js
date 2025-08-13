// Export setActiveNav to window for router access
export function setActiveNav(routeName) {
  const sideNav = document.querySelector('.side-nav');
  if (!sideNav) return;
  sideNav.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-route') === routeName);
  });
}

// Make available globally for router
window.setActiveNav = setActiveNav;

function slackify(text) {
  return `#${String(text || '').replace(/\s+/g, '').toLowerCase()}`;
}

export function initSidebar() {
  const sideNav = document.querySelector('.side-nav');
  if (!sideNav) return;

  // Normalize labels to Slack style (#channel)
  sideNav.querySelectorAll('.nav-item').forEach(el => {
    const raw = el.getAttribute('data-label') || el.textContent || '';
    el.textContent = slackify(raw);
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const r = el.getAttribute('data-route');
      if (r) {
        // Use location.hash directly to avoid circular dependency
        location.hash = `#/${r}`;
      }
    }, { passive: false });
  });
}