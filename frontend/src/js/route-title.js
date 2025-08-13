export function init(){
  const el = document.getElementById('routeTitle');
  const set = () => {
    const h = location.hash.replace(/^#\/?/, '').split('?')[0] || 'parties';
    const tag = '#'+h;
    if (el) el.textContent = tag;
    document.title = `velocity.ai — ${tag}`;
  };
  window.addEventListener('hashchange', set);
  set();
}