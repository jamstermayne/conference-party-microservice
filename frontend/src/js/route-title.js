/**
 * Route title coordinator (robust)
 * Normalizes route names and updates main header/subtitle safely.
 * Always sets document.title to "Route — velocity.ai"
 */

export function setTitles(routeName) {
  const raw = (typeof routeName === 'string') ? routeName : (routeName?.name ?? '');
  const name = String(raw || '').trim() || 'parties';
  const proper = name.charAt(0).toUpperCase() + name.slice(1);
  const chip = '#' + name;
  
  // heading inside main
  let h1 = document.querySelector('h1.page-title');
  if (!h1) {
    const app = document.getElementById('app');
    if (app) {
      const wrap = document.createElement('div');
      wrap.innerHTML = `<h1 class="page-title">${proper}</h1><span class="route-chip" data-route-chip>${chip}</span>`;
      app.prepend(...wrap.childNodes);
    }
    h1 = document.querySelector('h1.page-title');
  }
  if (h1) h1.textContent = proper;
  
  const badge = document.querySelector('[data-route-chip]');
  if (badge) badge.textContent = chip;
  
  // browser tab - ALWAYS velocity.ai
  document.title = `${proper} — velocity.ai`;
}

export default { setTitles };