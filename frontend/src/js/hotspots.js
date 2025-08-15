/**
 * Hotspots view
 */

export async function renderHotspots(mount) {
  if (!mount) return;
  
  mount.innerHTML = `
    <div class="v-stack">
      <h2 style="color: var(--alias-e8ecff); margin-bottom: 1rem;">Hotspots</h2>
      <p style="color: var(--alias-8b95a7);">Venue hotspots coming soon.</p>
    </div>
  `;
}

export default { renderHotspots };