// account.js
export function renderAccount(root) {
  root.innerHTML = `
    <div class="section-card">
      <div class="left-accent" aria-hidden="true"></div>
      <h2 class="text-heading">Account</h2>
      <div class="stack">
        <div class="row">Email <span class="text-secondary" id="acct-email">–</span></div>
        <div class="row">Invites <span class="text-secondary" id="acct-invites">–</span></div>
      </div>
    </div>
  `;
}
export default { renderAccount };