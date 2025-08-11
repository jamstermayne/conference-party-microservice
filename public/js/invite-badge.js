// public/js/invite-badge.js
const INV = (() => {
  const ENV = window.__ENV || {};
  const el = document.querySelector('[data-invites-left]') || document.getElementById('invite-pill');
  if (!el) return {};

  async function refresh() {
    if (!ENV.INVITES_API || !ENV.BACKEND_BASE) {
      el.textContent = '10'; // default until API available
      return;
    }
    try {
      const r = await fetch(`${ENV.BACKEND_BASE}/invites/status`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      el.textContent = String(j?.left ?? 10);
    } catch {
      el.textContent = '10';
    }
  }

  refresh();
  return { refresh };
})();
export default INV;