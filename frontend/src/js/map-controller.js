/**
 * Map controller
 */

export async function renderMap(mount) {
  if (!mount) return;
  
  mount.innerHTML = `
    <div class="v-stack">
      <h2 style="color: var(--alias-e8ecff); margin-bottom: 1rem;">Map</h2>
      <p style="color: var(--alias-8b95a7);">Interactive map coming soon.</p>
    </div>
  `;
}

export default { renderMap };