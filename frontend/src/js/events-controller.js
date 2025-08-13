/**
 * Parties controller — stable mock to prove shell & routing. Build b018.
 * Replace with API call later; markup matches your card styles.
 */
export async function renderParties(root) {
  if (!root) return;
  root.innerHTML = `
    <section class="section-card">
      <div class="left-accent" aria-hidden="true"></div>
      <header class="section-head">
        <h2 class="text-heading">Recommended events</h2>
        <div class="muted" style="font-size:12px;">Scroll to explore</div>
      </header>

      <div class="party-grid">
        ${partyCard({
          title: "MeetToMatch The Cologne Edition 2025",
          date: "Fri Aug 22",
          time: "09:00 – 18:00",
          venue: "Kölnmesse Confex",
          badge: "From £127.04",
        })}
        ${partyCard({
          title: "Marriott Rooftop Mixer",
          date: "Fri Aug 22",
          time: "20:00 – 23:30",
          venue: "Marriott Hotel",
          badge: "Free",
        })}
      </div>
    </section>
  `;
}

function partyCard({ title, date, time, venue, badge }) {
  return `
  <article class="party-card">
    <div class="party-top">
      <div class="party-title">${escapeHtml(title)}</div>
      <span class="pill">${escapeHtml(badge)}</span>
    </div>
    <ul class="party-meta">
      <li>📅 ${escapeHtml(date)}</li>
      <li>⏰ ${escapeHtml(time)}</li>
      <li>📍 ${escapeHtml(venue)}</li>
    </ul>
    <div class="party-actions">
      <button class="btn btn-primary">Save &amp; Sync</button>
      <button class="btn btn-ghost">Details</button>
    </div>
  </article>`;
}

function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m]));}

export default { renderParties };