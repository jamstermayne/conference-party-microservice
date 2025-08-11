// FTUE: Pick-3 Parties Progress (production)
import Store from '/js/store.js';
import Events from '/js/events.js';

const GOAL = 3;
const KEY = 'ftue.pick3';

function isDone() {
  const s = Store.get(KEY) || { picked: 0, done: false };
  return !!s.done || (s.picked || 0) >= GOAL;
}

function state() {
  const s = Store.get(KEY) || { picked: 0, done: false };
  return { picked: Math.min(s.picked || 0, GOAL), done: isDone() };
}

function save(picked, done = false) {
  Store.patch(KEY, { picked, done });
}

function tpl(picked) {
  const pct = Math.round((picked / GOAL) * 100);
  return `
    <section id="ftue-pick3" class="ftue ftue--bar card card-outlined" aria-live="polite" role="status">
      <div class="ftue-head">
        <span class="ftue-title text-primary">Pick ${GOAL} parties to personalize tonight</span>
        <span class="ftue-count text-secondary">${picked}/${GOAL}</span>
      </div>
      <div class="ftue-progress" aria-label="Selection progress" aria-valuemin="0" aria-valuemax="${GOAL}" aria-valuenow="${picked}" role="progressbar">
        <div class="ftue-progress__bar" style="width:${pct}%"></div>
      </div>
      <p class="ftue-copy text-secondary">Tap ★ Save on parties you're likely to attend. We'll tailor your map and reminders.</p>
    </section>
  `;
}

function mount(parent) {
  // already mounted?
  if (document.getElementById('ftue-pick3')) return;
  const { picked, done } = state();
  if (done) return;

  const host = document.createElement('div');
  host.innerHTML = tpl(picked);
  const node = host.firstElementChild;
  parent.prepend(node); // top of events route

  // ARIA progress attachment (add after const bar = ...)
  const wrap = node;
  const aria = document.createElement('div');
  aria.setAttribute('role', 'progressbar');
  aria.setAttribute('aria-valuemin', '0');
  aria.setAttribute('aria-valuemax', String(GOAL));
  aria.setAttribute('aria-label', 'Party selection progress');
  aria.className = 'sr-only';
  wrap.querySelector('.ftue-progress').appendChild(aria);

  function render(selected) {
    const pct = Math.min((selected.length / GOAL) * 100, 100);
    const bar = wrap.querySelector('.ftue-progress__bar');
    if (bar) bar.style.width = `${pct}%`;
    
    const btn = wrap.querySelector('button');
    if (btn) {
      btn.disabled = selected.length < GOAL;
      btn.textContent = selected.length < GOAL ? `Pick ${GOAL - selected.length} more` : 'Save & Install';
    }
    aria.setAttribute('aria-valuenow', String(selected.length));
  }

  // Accessibility focus on first show
  setTimeout(() => node?.focus?.(), 0);
}

function update() {
  const el = document.getElementById('ftue-pick3');
  if (!el) return;
  const { picked, done } = state();
  if (done) {
    el.classList.add('ftue--hide');
    setTimeout(() => el.remove(), 200);
    return;
  }
  el.outerHTML = tpl(picked);
}

function nudgePick() {
  const { picked, done } = state();
  if (done) return;
  const next = Math.min(picked + 1, GOAL);
  const completed = next >= GOAL;
  save(next, completed);
  update();
  if (completed) {
    // small celebratory toast
    document.dispatchEvent(new CustomEvent('ui:toast', { detail: { type: 'ok', message: 'Nice! Feed personalized.' } }));
    Events.emit('ftue.pick3.completed');
  } else {
    Events.emit('ftue.pick3.progress', { picked: next, goal: GOAL });
  }
}

// Public API
export default {
  init(containerEl) {
    if (isDone()) return;
    mount(containerEl);
  },
  nudgePick,
  reset() {
    save(0, false);
    update();
  }
};