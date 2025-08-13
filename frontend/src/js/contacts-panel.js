/**
 * Contacts Panel
 * Shows connections and network
 */

export function renderContacts(root) {
  const mount = root || document.getElementById('app');
  if (!mount) return;
  
  mount.innerHTML = `
    <section class="section-card">
      <div class="left-accent"></div>
      <header class="section-head">
        <h2 class="text-heading">Contacts</h2>
        <div class="subtle">Your network " Connections</div>
      </header>
      
      <div class="empty" style="padding: 24px; color: var(--muted);">
        Contact sync coming soon. Connect your LinkedIn or Google contacts to see who's attending.
      </div>
    </section>
  `;
}

export default { renderContacts };