import { getMonSatDates, renderHomePanel, wireHomePanel } from './home-panel.js';

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
    const root = byId('app');
    try {
      const r = await fetch('/api/parties?conference=gamescom2025', { headers:{accept:'application/json'} });
      const raw = await r.json();
      const list = Array.isArray(raw?.data) ? raw.data
                 : Array.isArray(raw?.parties) ? raw.parties
                 : Array.isArray(raw) ? raw : [];
      const items = list.filter(e => (e.start || e.startsAt || e.date || '').slice(0,10) === date);
      root.innerHTML = `
        <section class="parties-panel">
          <h2 class="home-h2">Parties • ${date}</h2>
          <div class="card-grid">
            ${items.map(e => `
              <article class="vcard">
                <header class="vcard__head"><h3>${(e.title||e.name||'Party')}</h3></header>
                <div class="vcard__body">
                  <p>${(e.venue||e.location?.name||'')}</p>
                  <p>${(e.start||e.startsAt||'').replace('T',' ')}</p>
                </div>
              </article>
            `).join('')}
          </div>
        </section>
      `;
    } catch {
      await mountHome();
    }
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