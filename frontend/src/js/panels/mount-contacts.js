// mount-contacts.js - Mount contacts panel
export async function mountContacts(container) {
  // Try to load existing contacts implementation
  try {
    const { renderContacts } = await import('../contacts-panel.js');
    renderContacts(container);
    return;
  } catch (err) {
    console.log('Using fallback contacts UI');
  }
  
  // Fallback UI
  container.innerHTML = `
    <div class="v-section">
      <h2>Contacts</h2>
      <button class="btn btn--primary">Import Contacts</button>
    </div>
    
    <div class="v-section">
      <h3>Recent Connections</h3>
      <div class="contact-list">
        <article class="contact-card">
          <div class="contact-card__avatar">AC</div>
          <div class="contact-card__info">
            <h4>Alex Chen</h4>
            <p class="text-secondary">Producer • IndieVerse</p>
          </div>
          <button class="btn btn--ghost">Message</button>
        </article>
        
        <article class="contact-card">
          <div class="contact-card__avatar">MR</div>
          <div class="contact-card__info">
            <h4>Marta Ruiz</h4>
            <p class="text-secondary">BizDev • PlayForge</p>
          </div>
          <button class="btn btn--ghost">Message</button>
        </article>
      </div>
    </div>
  `;
}