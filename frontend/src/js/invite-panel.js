/**
 * Invites Panel (production)
 * - Shows invites left
 * - Bonus logic: +5 after 10 redemptions, +5 after 10 connections (one-time each)
 * - Virtualized activity feed (sent/redeemed stream)
 * - No backend calls unless window.__ENV.INVITES_API === true
 *
 * Requires: Store, Events, ui-feedback (toast), tokens/util CSS
 */

import Store from './store.js';
import Events from './events.js';
import { toast } from './ui-feedback.js';

const FLAGS = Object.freeze({
  USE_API: !!(window.__ENV && window.__ENV.INVITES_API === true)
});

const SELECTORS = Object.freeze({
  ROUTE:      '[data-route="invites"]',
  MOUNT:      '[data-route="invites"] .mount, [data-route="invites"]',
  VLIST:      '#inv-vlist',
  PHANTOM:    '#inv-phantom',
  COUNT:      '#inv-left',
  BONUS:      '#inv-bonus',
  SEND_BTN:   '#inv-send',
  SHARE_BTN:  '#inv-share'
});

const BONUS_KEYS = Object.freeze({
  REDEEM10: 'invites.bonus.redeem10',     // bool
  CONN10:   'invites.bonus.conn10',       // bool
});

const STATE_KEYS = Object.freeze({
  LEFT:         'invites.left',           // number
  SENT:         'invites.sent',           // number
  REDEEMED:     'invites.redeemed',       // number
  CONNECTIONS:  'network.connections',    // number
  ACTIVITY:     'invites.activity'        // array
});

const ONE = 1; // tiny clarity helper

// ---------- DOM scaffold (idempotent)
function ensurePanel() {
  const host = document.querySelector(SELECTORS.MOUNT);
  if (!host) return null;

  if (!document.querySelector(`${SELECTORS.ROUTE} .inv-wrap`)) {
    const wrap = document.createElement('div');
    wrap.className = 'inv-wrap';
    wrap.innerHTML = `
      <section class="inv-summary">
        <div class="inv-row">
          <div>
            <div class="inv-title">Invites</div>
            <div class="inv-sub">Invite trusted professionals. Quality grows the network.</div>
          </div>
          <div class="inv-count">
            <div id="inv-left" class="inv-left">0</div>
            <span id="inv-bonus" class="inv-bonus" style="display:none">+5 bonus</span>
          </div>
        </div>
        <div class="inv-actions">
          <button id="inv-send" class="btn btn-primary">Send invite</button>
          <button id="inv-share" class="btn btn-secondary">Share link</button>
        </div>
        <div class="inv-rules" style="margin-top:12px">
          Earn bonuses: +5 after <b>10 redemptions</b> • +5 after <b>10 connections</b>. One-time each.
        </div>
      </section>

      <section class="inv-activity">
        <div class="head">
          <div class="title">Activity</div>
          <div class="sub"><span id="inv-activity-count">0</span> entries</div>
        </div>
        <div id="inv-vlist" class="vlist" role="listbox" aria-label="Invite activity">
          <div id="inv-phantom" class="vlist-phantom" aria-hidden="true"></div>
        </div>
      </section>
    `;
    host.appendChild(wrap);
  }
  return document.querySelector(`${SELECTORS.ROUTE} .inv-wrap`);
}

// ---------- Bonus logic (pure, idempotent)
function applyBonusLogic() {
  const left       = Number(Store.get(STATE_KEYS.LEFT) || 0);
  const redeemed   = Number(Store.get(STATE_KEYS.REDEEMED) || 0);
  const connections= Number(Store.get(STATE_KEYS.CONNECTIONS) || 0);

  let granted = 0;
  // Rule 1: +5 after 10 redemptions (once)
  if (redeemed >= 10 && !Store.get(BONUS_KEYS.REDEEM10)) {
    Store.patch(STATE_KEYS.LEFT, left + 5);
    Store.patch(BONUS_KEYS.REDEEM10, true);
    granted += 5;
  }
  // Rule 2: +5 after 10 connections (once)
  if (connections >= 10 && !Store.get(BONUS_KEYS.CONN10)) {
    Store.patch(STATE_KEYS.LEFT, (Number(Store.get(STATE_KEYS.LEFT)) || 0) + 5);
    Store.patch(BONUS_KEYS.CONN10, true);
    granted += 5;
  }

  if (granted > 0) {
    // Visual nudge + announce
    bumpCount();
    toast(`Bonus unlocked! +${granted} invites added.`, 'ok');
    Events.emit && Events.emit('invite.bonus.applied', { amount: granted });
  }
}

// ---------- Count animation
let bumpTimer;
function bumpCount() {
  const el = document.querySelector(SELECTORS.COUNT);
  if (!el) return;
  el.classList.add('bump');
  clearTimeout(bumpTimer);
  bumpTimer = setTimeout(() => el.classList.remove('bump'), 220);
}

// ---------- Render summary
function renderSummary() {
  const left  = Number(Store.get(STATE_KEYS.LEFT) || 0);
  const hasBonus = !!(Store.get(BONUS_KEYS.REDEEM10) || Store.get(BONUS_KEYS.CONN10));
  const countEl = document.querySelector(SELECTORS.COUNT);
  const bonusEl = document.querySelector(SELECTORS.BONUS);
  if (countEl) countEl.textContent = String(left);
  if (bonusEl) bonusEl.style.display = hasBonus ? '' : 'none';

  // Emit for badge sync
  Events.emit && Events.emit('invites:changed', { left });
}

// ---------- Activity source (local or API)
async function getActivity() {
  if (FLAGS.USE_API) {
    try {
      const res = await fetch('/api/invites/activity', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.data)) {
          Store.patch(STATE_KEYS.ACTIVITY, json.data);
          return json.data;
        }
      }
    } catch (e) { /* ignore; fall back */ }
  }
  return Store.get(STATE_KEYS.ACTIVITY) || [];
}

// ---------- Virtualized list
class VirtualList {
  constructor(container, rowHeight = 56, buffer = 6) {
    this.el = container;
    this.phantom = container.querySelector(SELECTORS.PHANTOM);
    this.rowHeight = rowHeight;
    this.buffer = buffer;
    this.items = [];
    this.pool = [];
    this.onScroll = this.onScroll.bind(this);
    this.el.addEventListener('scroll', this.onScroll, { passive: true });
  }
  set(items) {
    this.items = items || [];
    this.phantom.style.height = `${this.items.length * this.rowHeight}px`;
    this.onScroll();
  }
  onScroll() {
    const scrollTop = this.el.scrollTop;
    const height = this.el.clientHeight;
    const start = Math.max(0, Math.floor(scrollTop / this.rowHeight) - this.buffer);
    const end = Math.min(this.items.length, Math.ceil((scrollTop + height) / this.rowHeight) + this.buffer);
    this.renderWindow(start, end);
  }
  renderWindow(start, end) {
    // recycle pool
    while (this.pool.length > (end - start)) this.el.removeChild(this.pool.pop());
    // ensure enough nodes
    while (this.pool.length < (end - start)) {
      const node = document.createElement('div');
      node.className = 'vitem';
      node.innerHTML = `
        <div class="avatar"></div>
        <div class="info">
          <div class="line1"></div>
          <div class="line2"></div>
        </div>
        <div class="pill"></div>
      `;
      this.el.appendChild(node);
      this.pool.push(node);
    }
    // position + bind data
    for (let i = start; i < end; i++) {
      const item = this.items[i];
      const node = this.pool[i - start];
      node.style.transform = `translateY(${i * this.rowHeight}px)`;
      const [l1, l2, pill] = [node.querySelector('.line1'), node.querySelector('.line2'), node.querySelector('.pill')];

      // Render
      l1.textContent = item.title || item.email || 'Invite update';
      l2.textContent = item.meta || item.when || '';
      pill.textContent = item.type || 'info';

      // Avatar
      const av = node.querySelector('.avatar');
      av.style.background = '#222';
      if (item.picture) {
        av.style.backgroundImage = `url(${item.picture})`;
        av.style.backgroundSize = 'cover';
        av.style.backgroundPosition = 'center';
      }
      node.setAttribute('role', 'option');
      node.setAttribute('aria-label', `${l1.textContent} – ${pill.textContent}`);
    }
  }
  destroy() {
    this.el.removeEventListener('scroll', this.onScroll);
    this.pool.forEach(n => n.remove());
    this.pool = [];
  }
}

// ---------- Wire up buttons
function bindActions() {
  const send = document.querySelector(SELECTORS.SEND_BTN);
  const share = document.querySelector(SELECTORS.SHARE_BTN);
  if (send) {
    send.addEventListener('click', () => {
      // Defer to your existing invite flow (invite.js). We just emit a hint.
      Events.emit && Events.emit('invite:send:open');
    });
  }
  if (share) {
    share.addEventListener('click', async () => {
      try {
        const link = Store.get('invite.shareLink') || `${location.origin}/invite/GC2025-XXXXX`;
        if (navigator.share) {
          await navigator.share({ title: 'Join me at Gamescom', url: link, text: 'Exclusive access. See the best parties.' });
          toast('Shared', 'ok');
        } else {
          await navigator.clipboard.writeText(link);
          toast('Link copied to clipboard', 'ok');
        }
      } catch { toast('Share cancelled', 'wait'); }
    });
  }
}

// ---------- Mount/Render lifecycle
let vlist;
async function paint() {
  ensurePanel();
  applyBonusLogic();
  renderSummary();

  const items = await getActivity();
  document.getElementById('inv-activity-count').textContent = String(items.length);

  const host = document.querySelector(SELECTORS.VLIST);
  if (!host) return;

  if (!items.length) {
    host.innerHTML = `<div class="inv-empty">No activity yet. Send your first invite to get started.</div>`;
    return;
  }

  // Virtualize
  host.innerHTML = `<div id="inv-phantom" class="vlist-phantom" aria-hidden="true"></div>`;
  vlist = new VirtualList(host, 56, 8);
  vlist.set(items);
}

function onRouteChange(d) {
  if (!d || d.route !== 'invites') return;
  setTimeout(() => { ensurePanel(); bindActions(); paint(); }, 0);
}

function onInviteStateChange() {
  // Re-apply bonus & refresh count (activity preserved)
  applyBonusLogic();
  renderSummary();
}

// External events to keep in sync
document.addEventListener('connections:updated', onInviteStateChange);
document.addEventListener('invites:state:updated', onInviteStateChange);
Events.on('route:change', onRouteChange);

// If we land on invites directly
if (location.hash.replace('#','') === 'invites') {
  ensurePanel(); bindActions(); paint();
}

console.log('✅ Invites panel loaded');