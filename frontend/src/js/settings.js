export function renderSettings(rootEl){
  const root = rootEl || document.getElementById('app'); if(!root) return;
  root.innerHTML = `
    <section class="section-card">
      <div class="left-accent"></div>
      <h2 class="text-heading">Settings</h2>
      <div class="text-secondary">Configure your preferences.</div>
    </section>`;
}