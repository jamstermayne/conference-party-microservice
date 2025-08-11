const ENV = window.__ENV || {};
const FEED_ENDPOINT = '/api/activity';
let ENABLED = !!ENV.ACTIVITY_API; // false in prod until API live

async function fetchActivity() {
  if (!ENABLED) {
    return [
      { user: 'Jamy', action: 'joined', item: 'Velocity' },
      { user: 'Laura', action: 'RSVP'd', item: 'Indie Night' },
      { user: 'Dylan', action: 'liked', item: 'VIP Afterparty' }
    ];
  }
  try {
    const res = await fetch(FEED_ENDPOINT);
    if (res.status === 404) {
      ENABLED = false;
      return fetchActivity();
    }
    return res.json();
  } catch {
    return [];
  }
}

async function renderActivityFeed() {
  const feed = await fetchActivity();
  const container = document.createElement('div');
  container.id = 'activity-feed';
  container.className = 'activity-feed mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200';
  container.innerHTML = `
    <h3 class="text-xs uppercase tracking-wide text-gray-500 mb-2">Live Activity</h3>
    <ul class="space-y-1">
      ${feed.map(item => `
        <li class="text-sm text-gray-700">
          <strong>${item.user}</strong> ${item.action} <em>${item.item}</em>
        </li>`).join('')}
    </ul>
  `;
  document.querySelector('#invite-panel')?.appendChild(container);
}

renderActivityFeed();