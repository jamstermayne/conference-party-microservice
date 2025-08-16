// mount-settings.js - Mount settings panel
export async function mountSettings(container) {
  // Try to load existing settings panel
  try {
    const { renderSettings } = await import('../settings-panel.js');
    renderSettings(container);
    return;
  } catch (err) {
    console.log('Using fallback settings UI');
  }
  
  container.innerHTML = `
    <div class="v-section">
      <h2>Preferences</h2>
      <button class="v-row">
        <span class="v-row__icon">🔔</span>
        <span class="v-row__label">Notifications</span>
        <span class="v-row__chev">›</span>
      </button>
      <button class="v-row">
        <span class="v-row__icon">🎨</span>
        <span class="v-row__label">Theme</span>
        <span class="v-row__status">Dark</span>
      </button>
      <button class="v-row">
        <span class="v-row__icon">🌐</span>
        <span class="v-row__label">Language</span>
        <span class="v-row__status">English</span>
      </button>
    </div>
    
    <div class="v-section">
      <h2>Account</h2>
      <button class="v-row">
        <span class="v-row__icon">🔒</span>
        <span class="v-row__label">Privacy</span>
        <span class="v-row__chev">›</span>
      </button>
      <button class="v-row">
        <span class="v-row__icon">💾</span>
        <span class="v-row__label">Data Export</span>
        <span class="v-row__chev">›</span>
      </button>
      <button class="v-row">
        <span class="v-row__icon">🗑️</span>
        <span class="v-row__label">Delete Account</span>
        <span class="v-row__chev">›</span>
      </button>
    </div>
    
    <div class="v-section">
      <h2>About</h2>
      <div class="about-info">
        <p>Version 2.0.0</p>
        <p class="text-secondary">© 2025 Conference Party App</p>
      </div>
    </div>
  `;
}