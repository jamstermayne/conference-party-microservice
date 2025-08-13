export function renderContacts(rootEl){
  const root = rootEl || document.getElementById('app'); if(!root) return;
  root.innerHTML = `
    <section class="section-card">
      <div class="left-accent"></div>
      <h2 class="text-heading">Contacts</h2>
      <div class="text-secondary">Import contacts to find your crew at Gamescom.</div>
      <div class="actions">
        <button class="btn btn-primary">Import Contacts</button>
      </div>
    </section>`;
}