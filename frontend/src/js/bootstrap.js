/**
 * Single boot entry – deterministic import order.
 * We only load this + env.js from index.html.
 */
const ENV = window.__ENV || {};
const V = ENV.BUILD ? `?v=${ENV.BUILD}` : '';

/** Helper to import with version param (prevents SW/CDN mismatches) */
const imp = (p) => import(p + V);

/** 1) Core (order matters) */
await imp('/js/events.js').catch(()=>import('/assets/js/events.js' + V)); // try both paths
const Events = window.Events; // global export from events.js

/** 2) Utilities and shared */
await imp('/js/store.js');
await imp('/js/ui-feedback.js').catch(()=>({}));
await imp('/js/http.js').catch(()=>({}));

/** 3) Features / views / router */
await imp('/js/route-title.js');
await imp('/js/router.js');
await imp('/js/hotspots.js');     // registers its route listener
await imp('/js/events-controller.js').catch(()=>({})); // parties view
await imp('/js/invite.js').catch(()=>({}));
await imp('/js/calendar-integration.js').catch(()=>({}));
await imp('/js/install.js').catch(()=>({}));
await imp('/js/account.js').catch(()=>({})); // ok if not present yet

/** 4) Sanity check: exports we rely on must exist */
const checks = [
  ['/js/router.js', 'route', 'route()'],
  ['/js/router.js', 'bindSidebar', 'bindSidebar()'],
  ['/js/route-title.js','setTitles','setTitles()'],
];
for (const [m, key, label] of checks) {
  try {
    const mod = await import(m + V);
    const ok = key === 'default' ? !!mod.default : (key in mod);
    if (!ok) throw new Error(`${m} missing export ${key}`);
  } catch (e) {
    console.error('[BOOT] Missing export:', e?.message || e);
    const live = document.getElementById('main') || document.body;
    const warn = document.createElement('div');
    warn.style.cssText='position:fixed;bottom:16px;left:16px;background:#2a2438;color:#fff;padding:12px 16px;border-radius:8px;box-shadow:0 6px 24px rgba(0,0,0,.4);z-index:9999';
    warn.textContent = `Unable to start: ${label} not found. Check module exports.`;
    live.appendChild(warn);
    throw e;
  }
}

/** 5) Mount stable shell: sidebar + content */
import('/js/router.js' + V).then(({ bindSidebar, route })=>{
  bindSidebar(document);
  route(location.hash);
});

/** 6) Update titles on route change */
if (Events && Events.on) {
  Events.on('route:change', (e)=>import('/js/route-title.js'+V).then(m=>m.setTitles(e.name)));
}

console.log('[BOOT] Complete with BUILD:', ENV.BUILD);