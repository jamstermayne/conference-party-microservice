// hotspots-controller.js
export function renderHotspots(root) {
  root.innerHTML = `
    <div class="section-card">
      <div class="left-accent" aria-hidden="true"></div>
      <h2 class="text-heading">Hotspots</h2>
      <p class="text-secondary">Live venue heatmap coming soon...</p>
    </div>
  `;
}
export default { renderHotspots };