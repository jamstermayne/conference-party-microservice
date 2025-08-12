// calendar-view.js
export function renderCalendar(root) {
  root.innerHTML = `
    <div class="section-card">
      <div class="left-accent" aria-hidden="true"></div>
      <h2 class="text-heading">Calendar</h2>
      <p class="text-secondary">Event calendar sync coming soon...</p>
    </div>
  `;
}
export default { renderCalendar };