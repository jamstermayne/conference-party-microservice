// home-bootstrap.js — renders the Home skeleton; pills & styles are provided elsewhere.
const ROUTE_HOME = '#/home';

function ensureHomeSkeleton() {
  if (!location.hash || !location.hash.startsWith('#/')) {
    location.hash = ROUTE_HOME;
  }
  let panel = document.querySelector('.home-panel');
  if (panel) return panel;

  panel = document.createElement('div');
  panel.className = 'home-panel';

  panel.innerHTML = `
    <section class="home-section parties-section" aria-labelledby="parties-title">
      <h2 id="parties-title" class="section-title">Parties</h2>
      <div class="day-pills" role="group" aria-label="Parties by day"></div>
    </section>

    <section class="home-section map-section" aria-labelledby="map-title">
      <h2 id="map-title" class="section-title">Map</h2>
      <div class="day-pills" role="group" aria-label="Map by day"></div>
    </section>

    <section class="home-section channels-section" aria-labelledby="channels-title">
      <h2 id="channels-title" class="section-title">Channels</h2>
      <div class="channels-grid" role="navigation" aria-label="Primary">
        <a class="channel-btn" href="#/map">Map</a>
        <a class="channel-btn" href="#/calendar">My calendar</a>
        <a class="channel-btn" href="#/invites">Invites</a>
        <a class="channel-btn" href="#/contacts">Contacts</a>
        <a class="channel-btn" href="#/me">Me</a>
        <a class="channel-btn" href="#/settings">Settings</a>
      </div>
    </section>
  `;

  // Mount into app shell (fall back to body)
  const host = document.getElementById('app') || document.body;
  host.innerHTML = ''; // Full-bleed single panel paradigm
  host.appendChild(panel);

  // Signal for pill scripts to (re)render into the placeholders
  window.dispatchEvent(new CustomEvent('home:skeleton-ready'));
  return panel;
}

function run() {
  if (location.hash === ROUTE_HOME || location.hash === '' || location.hash === '#/') {
    ensureHomeSkeleton();
  }
}
addEventListener('DOMContentLoaded', run, { once: true });
addEventListener('hashchange', () => {
  if (location.hash === ROUTE_HOME) ensureHomeSkeleton();
});