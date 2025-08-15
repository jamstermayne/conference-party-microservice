import { handleAddToCalendar } from './ui/add-to-calendar.js?v=b030';

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action="add-to-calendar"]');
  if (!btn) return;
  const party = btn.__party || btn.dataset.party && JSON.parse(btn.dataset.party); // adapt to your model
  if (!party) return;

  btn.disabled = true;
  await handleAddToCalendar(party, {
    onSuccess: (provider) => console.log(`Added to ${provider === 'google' ? 'Google Calendar' : 'your calendar'}`),
    onError:   () => console.error('Sorry, failed to add. Try again.')
  });
  btn.disabled = false;
});