/**
 * Settings panel
 */

export async function renderSettings(mount) {
  if (!mount) return;
  
  mount.innerHTML = `
    <div class="v-stack">
      <h2 style="color: #e8ecff; margin-bottom: 1rem;">Settings</h2>
      <p style="color: #8b95a7;">Settings panel coming soon.</p>
    </div>
  `;
}

export default { renderSettings };