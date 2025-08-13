/**
 * Map Controller - Interactive venue map
 */

export async function renderMap(mount) {
  if (!mount) mount = document.getElementById('map-root') || document.getElementById('app');
  if (!mount) return;
  
  mount.innerHTML = `
    <div class="section-card">
      <div class="left-accent" aria-hidden="true"></div>
      <h2 class="text-heading">Venue Map</h2>
      <p class="text-secondary">Interactive venue map coming soon...</p>
    </div>
  `;
}

export default { renderMap };