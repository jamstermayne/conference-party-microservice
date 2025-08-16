function gateDaySubnav() {
  const el = document.querySelector('.v-day-subnav');
  if (!el) return;
  const isMap = location.hash.startsWith('#/map');
  el.classList.toggle('is-visible', isMap);
}
window.addEventListener('hashchange', gateDaySubnav);
document.addEventListener('DOMContentLoaded', gateDaySubnav);
