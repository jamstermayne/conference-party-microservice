// mount-calendar.js - Mount calendar providers panel
export function mountCalendar(container) {
  container.innerHTML = `
    <div class="v-section">
      <h2>Connect your calendar</h2>
      <p class="text-secondary">See your parties & meetings in one place</p>
    </div>
    
    <div class="v-section">
      <button class="v-row" data-provider="google">
        <span class="v-row__icon">📅</span>
        <span class="v-row__label">Google Calendar</span>
        <span class="v-row__status" id="google-status">Connect</span>
      </button>
      
      <button class="v-row" data-provider="outlook">
        <span class="v-row__icon">📆</span>
        <span class="v-row__label">Microsoft / Outlook</span>
        <span class="v-row__status">Open Web</span>
      </button>
      
      <button class="v-row" data-provider="ics">
        <span class="v-row__icon">📥</span>
        <span class="v-row__label">Download .ics file</span>
        <span class="v-row__status">Export</span>
      </button>
      
      <button class="v-row" data-provider="mtm">
        <span class="v-row__icon">🤝</span>
        <span class="v-row__label">MeetToMatch</span>
        <span class="v-row__status">Open</span>
      </button>
    </div>
    
    <div class="v-section" id="timeline-section" style="display: none;">
      <h3>View timeline</h3>
      <div id="calendar-timeline"></div>
    </div>
  `;
  
  // Wire up providers
  container.querySelector('[data-provider="google"]').onclick = async () => {
    const w = window.open('/api/gcal/connect', 'gcal', 'width=520,height=640,noopener');
    if (!w) {
      alert('Please allow popups to connect Google Calendar.');
      return;
    }
    // Check for success
    const checkInterval = setInterval(() => {
      if (w.closed) {
        clearInterval(checkInterval);
        document.getElementById('google-status').textContent = 'Connected';
        document.getElementById('timeline-section').style.display = 'block';
      }
    }, 1000);
  };
  
  container.querySelector('[data-provider="outlook"]').onclick = () => {
    window.open('https://outlook.office.com/calendar/', '_blank', 'noopener');
  };
  
  container.querySelector('[data-provider="ics"]').onclick = () => {
    window.location.href = '/api/calendar/export.ics';
  };
  
  container.querySelector('[data-provider="mtm"]').onclick = () => {
    window.open('https://app.meettomatch.com/cologne2025/site/signin/selector/', '_blank', 'noopener');
  };
}