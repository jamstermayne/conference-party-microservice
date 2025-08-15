// router-stack.js
const stack = document.getElementById('panel-stack') || document.getElementById('stack');
const panels = []; // [{el, route, restore}]

export function pushPanel(route, title, render) {
  const el = document.createElement('section');
  el.className = 'v-panel';
  el.innerHTML = `
    <header class="v-topbar">
      <button class="v-topbar__back" aria-label="Back">‹</button>
      <div class="v-topbar__title">${title}</div>
      <span></span>
    </header>
    <main class="v-panel__body"></main>
  `;
  render(el.querySelector('.v-panel__body'));
  stack.appendChild(el);
  requestAnimationFrame(()=> el.classList.add('is-active'));
  el.querySelector('.v-topbar__back').onclick = () => popPanel();
  panels.push({ el, route, restore: saveScroll(el) });
  el.querySelector('.v-topbar__title').focus?.();
}

export function popPanel() {
  const cur = panels.pop();
  if (!cur) return;
  cur.el.classList.add('v-panel-leave','is-exiting');
  cur.restore();
  cur.el.addEventListener('transitionend', () => cur.el.remove(), { once:true });
}

function saveScroll(el){
  const scroller = el.querySelector('.v-panel__body');
  const y = scroller.scrollTop;
  return () => { scroller.scrollTop = y; };
}