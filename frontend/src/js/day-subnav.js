// day-subnav.js - Minimal day filter that appears only on matching routes
(function DaysSubnav() {
  const sidebar = document.querySelector('.v-sidebar, aside,[data-role=sidebar],#sidebar');
  if (!sidebar) return;

  const findAnchor = (routePrefix) =>
    sidebar.querySelector(`a[href^="${routePrefix}"], a[data-route^="${routePrefix}"]`);

  const dayISO = (x) => {
    if (!x) return null;
    const d = new Date(x);
    if (isNaN(d)) return null;
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  };

  const fmtDay = (iso) => {
    const D = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const d = new Date(iso + 'T00:00:00');
    return `${D[d.getDay()]}, ${String(d.getDate()).padStart(2,'0')} ${M[d.getMonth()]}`;
  };

  async function getConferenceDays() {
    const conf = (window.APP && APP.conference) || 'gamescom2025';
    try {
      const r = await fetch(`/api/parties?conference=${encodeURIComponent(conf)}`);
      if (!r.ok) throw 0;
      const json = await r.json();
      const rows = json.data || json.parties || json || [];
      const set = new Set();
      for (const e of rows) {
        const iso = e.date || dayISO(e.start || e.startsAt || e.startTime || e.when);
        if (iso) set.add(iso);
      }
      const days = Array.from(set).sort();
      // Business rule: Mon..Sat only
      return days.filter((iso) => {
        const g = new Date(iso + 'T00:00:00').getDay();
        return g >= 1 && g <= 6;
      });
    } catch {
      return [];
    }
  }

  let daysCache = null;

  function ensureHost(afterEl, forName) {
    // Use the placeholder if present, otherwise create it right after the item
    let host = sidebar.querySelector(`.v-day-subnav[data-for="${forName}"]`);
    if (!host) {
      host = document.createElement('div');
      host.className = 'v-day-subnav';
      host.dataset.for = forName;
      const anchorContainer = afterEl.closest('li, .nav-item, a, div') || afterEl;
      anchorContainer.insertAdjacentElement('afterend', host);
    }
    return host;
  }

  function setActive(host, base) {
    const links = host.querySelectorAll('a');
    const h = location.hash;
    links.forEach((a) => a.classList.toggle('is-active', h.startsWith(a.getAttribute('href'))));
    // show/hide only on matching base
    host.style.display = h.startsWith(base) ? 'grid' : 'none';
  }

  async function render(forName, baseRoute) {
    const anchor = findAnchor(baseRoute);
    if (!anchor) return;
    const host = ensureHost(anchor, forName);

    // Only show on this route
    if (!location.hash.startsWith(baseRoute)) {
      host.style.display = 'none';
      return;
    }

    if (!daysCache) daysCache = await getConferenceDays();
    // If no data, keep it hidden (don't spam UI)
    if (!daysCache.length) {
      host.style.display = 'none';
      return;
    }

    // Re-render only when needed
    const wanted = daysCache.map((iso) => `${baseRoute}/${iso}`).join('|');
    if (host.dataset.sig !== wanted) {
      host.innerHTML = '';
      for (const iso of daysCache) {
        const a = document.createElement('a');
        a.href = `${baseRoute}/${iso}`;
        a.textContent = fmtDay(iso);
        host.appendChild(a);
      }
      host.dataset.sig = wanted;
    }
    setActive(host, baseRoute);
  }

  function sync() {
    render('map', '#/map');
    render('parties', '#/parties');
  }

  window.addEventListener('hashchange', sync);
  document.addEventListener('DOMContentLoaded', sync);
  
  // Initial sync
  sync();
})();