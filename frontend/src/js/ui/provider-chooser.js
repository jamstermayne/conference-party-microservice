// Provider chooser modal for calendar integration
export function showProviderChooser() {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `
      <div class="modal">
        <h3>Choose your calendar</h3>
        <p class="dim">One click for Google. Or download an .ics file for Outlook/Apple.</p>
        <div class="modal-actions">
          <button class="btn btn-primary" data-choice="google">Google Calendar</button>
          <button class="btn" data-choice="outlook">Outlook / ICS</button>
          <button class="btn btn-ghost" data-choice="cancel">Cancel</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    wrap.addEventListener('click', (e) => {
      const b = e.target.closest('[data-choice]'); 
      if (!b) return;
      const v = b.getAttribute('data-choice'); 
      wrap.remove(); 
      resolve(v);
    });
  });
}