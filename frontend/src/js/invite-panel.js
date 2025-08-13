// invite-panel.js
export function renderInvites(root) {
  const mount = root || document.getElementById('app') || document.getElementById('main');
  if (!mount) return;
  
  mount.innerHTML = `
    <div class="section-card">
      <div class="left-accent" aria-hidden="true"></div>
      <h2 class="text-heading">Invites</h2>
      <p class="text-secondary">Manage your invites and connections...</p>
    </div>
  `;
}
export default { renderInvites };