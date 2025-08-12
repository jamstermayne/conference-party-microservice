// invite-panel.js
export function renderInvites(root) {
  root.innerHTML = `
    <div class="section-card">
      <div class="left-accent" aria-hidden="true"></div>
      <h2 class="text-heading">Invites</h2>
      <p class="text-secondary">Manage your invites and connections...</p>
    </div>
  `;
}
export default { renderInvites };