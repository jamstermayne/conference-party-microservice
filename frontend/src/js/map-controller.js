// map-controller.js
export function renderMap(root) {
  const mount = root || document.getElementById('app') || document.getElementById('main');
  if (!mount) return;
  
  mount.innerHTML = `
    <div class="section-card">
      <div class="left-accent" aria-hidden="true"></div>
      <h2 class="text-heading">Map</h2>
      <p class="text-secondary">Interactive venue map coming soon...</p>
    </div>
  `;
}
export default { renderMap };