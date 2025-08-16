import { getMonSatDates, renderHomePanel, wireHomePanel } from './home-panel.js';
import { mountPartiesPanel } from './panels/parties-panel-lite.js';

function byId(id){ return document.getElementById(id) || document.querySelector('#app') || document.body; }
async function mountHome() {
  const mount = byId('app');
  const dates = await getMonSatDates();
  renderHomePanel(mount, dates);
  wireHomePanel(mount);
}

async function onRoute() {
  const h = location.hash || '';
  if (!h || h === '#/' || h === '#/home') {
    await mountHome();
    return;
  }
  // For parties/map, keep your existing panels.
  // If none exists, provide minimal fallback for parties.
  const mParties = /^#\/parties\/(\d{4}-\d{2}-\d{2})$/.exec(h);
  if (mParties) {
    const date = mParties[1];
    await mountPartiesPanel(date);
    return;
  }
  // If your existing router mounts the Map panel, let it handle #/map/DATE.
  // Otherwise do nothing here (avoids conflicts). You already fixed the Maps loader.
}

window.addEventListener('DOMContentLoaded', () => {
  if (!location.hash) location.hash = '#/home';
  onRoute();
});
window.addEventListener('hashchange', onRoute);