import { handleAddToCalendar } from './ui/add-to-calendar.js';

// Simple toast (optional - remove if you have your own)
function toast(msg) {
  console.log(msg); // Replace with your toast implementation
}

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action="add-to-calendar"]');
  if (!btn) return;
  const party = btn.__party || (btn.dataset.party && JSON.parse(btn.dataset.party)); // adapt to your model
  if (!party) return;

  btn.disabled = true;
  await handleAddToCalendar(party, {
    onSuccess: (provider) => toast(`Added to ${provider === 'google' ? 'Google Calendar' : 'your calendar'}`),
    onError:   () => toast('Sorry, failed to add. Try again.')
  });
  btn.disabled = false;
});