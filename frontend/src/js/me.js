export function renderMe(rootEl){
  const root = rootEl || document.getElementById('app'); if(!root) return;
  root.innerHTML = `
    <section class="section-card">
      <div class="left-accent"></div>
      <h2 class="text-heading">Me</h2>
      <div class="text-secondary">Your profile and settings.</div>
    </section>`;
}