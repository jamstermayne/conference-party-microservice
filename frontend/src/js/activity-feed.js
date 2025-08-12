/**
 * Activity Feed (safe, no-op if API absent)
 * Renders a minimal list or a friendly empty state.
 */

import { emptyState, toast } from './ui-feedback.js';

const FEED_SEL = '#activity-feed';
const API = '/api/activity'; // optional; will gracefully handle 404

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function itemRow(item) {
  const when = new Date(item.ts || Date.now()).toLocaleString();
  const msg = item.message || 'Activity';
  return el(`
    <div class="card card-compact card-outlined">
      <div class="card-body">
        <div class="text-body">${msg}</div>
        <div class="text-caption text-muted">${when}</div>
      </div>
    </div>
  `);
}

async function loadFeed() {
  const mount = document.querySelector(FEED_SEL);
  if (!mount) return;

  try {
    const res = await fetch(API, { headers: { 'accept': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const list = Array.isArray(data?.data) ? data.data : [];
    if (!list.length) {
      mount.replaceChildren(emptyState('No recent activity yet.'));
      return;
    }
    const nodes = list.slice(0, 10).map(itemRow);
    mount.replaceChildren(...nodes);
  } catch {
    // Graceful fallback for 404 or network error
    mount.replaceChildren(emptyState('Activity will appear here.'));
    // Optional user hint without being noisy
    try { toast('Activity feed will populate as your network grows.'); } catch {}
  }
}

document.addEventListener('DOMContentLoaded', loadFeed);

export default { loadFeed };