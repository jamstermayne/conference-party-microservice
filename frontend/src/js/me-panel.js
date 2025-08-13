/**
 * Me Panel - Account/Profile view
 */

export function renderMe(root) {
  const mount = root || document.getElementById('app');
  if (!mount) return;
  
  mount.innerHTML = `
    <section class="section-card">
      <div class="left-accent"></div>
      <header class="section-head">
        <h2 class="text-heading">Account</h2>
        <div class="subtle">Your profile and settings</div>
      </header>
      
      <div class="empty" style="padding: 24px; color: var(--muted);">
        Account management coming soon. Connect your LinkedIn or manage your profile.
      </div>
    </section>
  `;
}

export default { renderMe };