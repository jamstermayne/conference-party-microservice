export function openCalendarPanel(activator) {
  const el = document.createElement('div');
  el.innerHTML = `
    <section class="v-section"><h2>See your parties & meetings in one place</h2></section>
    <section class="v-section">
      <div class="v-item"><span>Google Calendar</span><button class="primary" data-google>Connect</button></div>
      <div class="v-item"><span>Microsoft / Outlook</span><button class="ghost" data-outlook>Open Web</button><button class="ghost" data-ics>Download .ics</button></div>
      <div class="v-item"><span>MeetToMatch</span><button class="ghost" data-mtm>Open MeetToMatch</button></div>
    </section>
  `;
  el.querySelector('[data-google]').addEventListener('click', startGoogle);
  el.querySelector('[data-outlook]').addEventListener('click', () => window.open('https://outlook.office.com/calendar/','_blank','noopener'));
  el.querySelector('[data-ics]').addEventListener('click', () => window.location.href = '/api/calendar/export.ics');
  el.querySelector('[data-mtm]').addEventListener('click', () => window.open('https://app.meettomatch.com/cologne2025/site/signin/selector/','_blank','noopener'));

  async function startGoogle() {
    // Popup must be created directly in click handler to avoid blockers
    const w = window.open('/api/gcal/connect','gcal','width=520,height=640,noopener');
    if (!w) { alert('Please allow popups to connect Google Calendar.'); return; }
  }

  Stack.push('calendar', { title: 'My calendar', content: el }, activator);
}