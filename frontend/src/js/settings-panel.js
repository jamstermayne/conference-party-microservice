/**
 * Settings Panel - App settings and preferences
 */

export function renderSettings(root) {
  const mount = root || document.getElementById('app');
  if (!mount) return;
  
  mount.innerHTML = `
    <section class="section-card">
      <div class="left-accent"></div>
      <header class="section-head">
        <h2 class="text-heading">Settings</h2>
        <div class="subtle">App preferences and configuration</div>
      </header>
      
      <div class="empty" style="padding: 24px; color: var(--muted);">
        Settings panel coming soon. Configure notifications, privacy, and display preferences.
      </div>
    </section>
  `;
}

export default { renderSettings };