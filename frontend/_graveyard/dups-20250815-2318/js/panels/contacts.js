export async function openContactsPanel(activator) {
  const content = document.createElement('div');
  content.className = 'v-section';
  
  try {
    // Try to load existing contacts panel
    const { renderContacts } = await import('../contacts-panel.js');
    renderContacts(content);
  } catch (err) {
    // Fallback placeholder
    content.innerHTML = `
      <h2>Contacts</h2>
      <div class="v-item">
        <span>Connect with professionals</span>
        <button class="primary">Import Contacts</button>
      </div>
      <div class="v-item">
        <span>Recent connections</span>
        <span class="muted">No contacts yet</span>
      </div>
    `;
  }
  
  Stack.push('contacts', {
    title: 'Contacts',
    content,
    onBack: () => history.back()
  }, activator);
  
  history.pushState(null, '', '#contacts');
}