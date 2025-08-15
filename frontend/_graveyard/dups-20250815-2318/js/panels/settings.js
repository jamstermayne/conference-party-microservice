export async function openSettingsPanel(activator) {
  const content = document.createElement('div');
  
  try {
    // Try to load existing settings panel
    const { renderSettings } = await import('../settings-panel.js');
    renderSettings(content);
  } catch (err) {
    // Fallback placeholder with common settings
    content.innerHTML = `
      <section class="v-section">
        <h2>Preferences</h2>
        <div class="v-item">
          <span>Notifications</span>
          <button class="ghost">Configure</button>
        </div>
        <div class="v-item">
          <span>Theme</span>
          <button class="ghost">Dark</button>
        </div>
      </section>
      
      <section class="v-section">
        <h2>Account</h2>
        <div class="v-item">
          <span>Privacy</span>
          <button class="ghost">Manage</button>
        </div>
        <div class="v-item">
          <span>Data Export</span>
          <button class="ghost">Download</button>
        </div>
      </section>
      
      <section class="v-section">
        <div class="v-item">
          <span>Version 2.0.0</span>
          <button class="ghost">About</button>
        </div>
      </section>
    `;
  }
  
  Stack.push('settings', {
    title: 'Settings',
    content,
    onBack: () => history.back()
  }, activator);
  
  history.pushState(null, '', '#settings');
}