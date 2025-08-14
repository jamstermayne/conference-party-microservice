#!/usr/bin/env bash
# patch-razor.sh — surgical UI changes only
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SRC="$ROOT/frontend/src"

echo "▶️  1) No-op the global Google Calendar banner (no CSS hacks)"
if [ -f "$SRC/js/gcal-hooks.js" ]; then
  cp "$SRC/js/gcal-hooks.js" "$SRC/js/gcal-hooks.js.bak"
  awk '
    BEGIN{infunc=0}
    /export[[:space:]]+function[[:space:]]+maybeRenderGcalCta\(/ {print; print "{ /* design: banner removed */ return; }"; infunc=1; next}
    { if(infunc){ if($0 ~ /^\}/){ infunc=0; next } else { next } }
      print
    }
  ' "$SRC/js/gcal-hooks.js.bak" > "$SRC/js/gcal-hooks.js" || true
else
  echo "ℹ️  $SRC/js/gcal-hooks.js not found (skipping)"
fi

echo "▶️  2) Remove purple brand dot in the left rail"
ZOV="$SRC/assets/css/z-overrides.css"
mkdir -p "$(dirname "$ZOV")"
touch "$ZOV"
if ! grep -q "/* kill-brand-dot */" "$ZOV"; then
  cat >> "$ZOV" <<'CSS'

/* kill-brand-dot */
aside .brand .dot,
aside .brand .badge,
aside .brand::before {
  display: none !important;
  content: none !important;
}
CSS
fi

echo "▶️  3) Add Calendar provider chooser (new view, zero rewrites)"
VIEWS_DIR="$SRC/js/views"
mkdir -p "$VIEWS_DIR"
PROVIDERS_JS="$VIEWS_DIR/calendar-providers.js"
cat > "$PROVIDERS_JS" <<'JS'
// views/calendar-providers.js
import { isConnected as gIsConnected, startOAuth as gStart, disconnect as gDisconnect } from '../services/gcal.js';
import { createIcsFileForNextEvent } from '../services/ics.js';

export async function renderCalendar(mount){
  mount.innerHTML = `
    <h1>Your calendar</h1>
    <p>Connect a provider so you can see your schedule here and one-click add parties.</p>
    <div class="provider-grid" id="providerGrid">
      ${cardGoogle({ connected:false })}
      ${cardMicrosoft()}
      ${cardMeetToMatch()}
    </div>
  `;
  try {
    const { connected } = await gIsConnected();
    const n = mount.querySelector('#card-google');
    n.outerHTML = cardGoogle({ connected });
    wireGoogle(mount);
  } catch(e){ wireGoogle(mount); }
  wireMicrosoft(mount);
  wireM2M(mount);
}

/* --- Cards --- */
function cardGoogle({connected}) {
  return `
  <div class="provider-card ${connected ? 'connected':''}" id="card-google">
    <div class="title">🟣 Google Calendar</div>
    <div class="subtitle">${connected ? 'Connected' : 'Not connected'}</div>
    <div class="actions">
      ${connected
        ? `<button class="btn btn-secondary" id="g-disconnect">Disconnect</button>`
        : `<button class="btn btn-primary" id="g-connect">Connect Google</button>`
      }
    </div>
  </div>`;
}
function cardMicrosoft(){
  return `
  <div class="provider-card" id="card-ms">
    <div class="title">🟦 Microsoft / Outlook</div>
    <div class="subtitle">Two quick options</div>
    <div class="actions">
      <button class="btn btn-secondary" id="ms-open-web">Open Outlook Web</button>
      <button class="btn" id="ms-download-ics">Download .ics</button>
    </div>
  </div>`;
}
function cardMeetToMatch(){
  return `
  <div class="provider-card" id="card-m2m">
    <div class="title">🟣 MeetToMatch</div>
    <div class="subtitle">Keep your M2M schedule in sync with saved parties</div>
    <div class="actions">
      <button class="btn btn-secondary" id="m2m-open">Open MeetToMatch</button>
      <button class="btn" id="m2m-help">How it works</button>
    </div>
  </div>`;
}

/* --- Wiring --- */
function wireGoogle(root){
  const connect = root.querySelector('#g-connect');
  const disconnect = root.querySelector('#g-disconnect');
  if (connect)    connect.addEventListener('click', () => gStart({ usePopup:true }));
  if (disconnect) disconnect.addEventListener('click', async () => {
    try { await gDisconnect(); location.reload(); } catch(e){ console.warn(e); }
  });
}
function wireMicrosoft(root){
  const toWeb = root.querySelector('#ms-open-web');
  const dlIcs = root.querySelector('#ms-download-ics');
  if (toWeb) toWeb.addEventListener('click', () =>
    window.open('https://outlook.live.com/calendar/0/view/month', '_blank', 'noopener')
  );
  if (dlIcs) dlIcs.addEventListener('click', async () => {
    try {
      const url = await createIcsFileForNextEvent(); // implement in services/ics.js
      window.location.href = url;
    } catch(e){ alert('Could not generate .ics yet.'); }
  });
}
function wireM2M(root){
  const open = root.querySelector('#m2m-open');
  const help = root.querySelector('#m2m-help');
  if (open) open.addEventListener('click', () => window.open('https://www.meettomatch.com/', '_blank', 'noopener'));
  if (help) help.addEventListener('click', () =>
    alert('When a party card has a MeetToMatch link, click it to add that slot in M2M. We remember your preference.')
  );
}
JS

echo "▶️  4) Provider grid styles (tiny, appended once)"
CALCSS="$SRC/assets/css/calendar-uniform.css"
mkdir -p "$(dirname "$CALCSS")"; touch "$CALCSS"
if ! grep -q "/* provider-grid */" "$CALCSS"; then
  cat >> "$CALCSS" <<'CSS'

/* provider-grid */
.provider-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px,1fr));
  gap: 16px;
  margin-top: 16px;
}
.provider-card {
  background: var(--panel, rgba(255,255,255,.02));
  border: 1px solid var(--panel-border, rgba(255,255,255,.06));
  border-radius: 16px;
  padding: 16px;
}
.provider-card .title { display:flex; align-items:center; gap:12px; font-weight:600; }
.provider-card .subtitle { opacity:.7; margin:6px 0 12px; }
.provider-card .actions { display:flex; flex-wrap:wrap; gap:8px; }
.provider-card.connected { outline:1px solid var(--accent, #7c6cff); }
CSS
fi

echo "▶️  5) Route calendar -> new view (preserve ?v= if present)"
ROUT="$SRC/js/router.js"
if [ -f "$ROUT" ]; then
  cp "$ROUT" "$ROUT.bak"
  # try to replace any dynamic import of calendar with the new path
  sed -E -i '' \
    "s@import\\((\\'|\\\")[./A-Za-z0-9_-]*calendar[^\"']*\\.js\\?v=\\$\\{V\\}(\\'|\\\")\\)@import('./views/calendar-providers.js?v=\${V}')@g" \
    "$ROUT" || true
  sed -E -i '' \
    "s@import\\((\\'|\\\")[./A-Za-z0-9_-]*calendar[^\"']*\\.js(\\'|\\\")\\)@import('./views/calendar-providers.js?v=\${V}')@g" \
    "$ROUT" || true
else
  echo "⚠️  router.js not found; wire the route manually to: ./js/views/calendar-providers.js?v=\${V}"
fi

echo "✅ Razor patch applied."