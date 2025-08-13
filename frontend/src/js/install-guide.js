let deferredPrompt = null;

// Basic device sniffing (kept minimal & robust)
const ua = navigator.userAgent || '';
const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = /Android/.test(ua);
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

function dom(html){ const t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstElementChild; }

function androidCard(){
  return `
    <h3>Android (Chrome/Edge)</h3>
    ${deferredPrompt ? `
      <p class="muted">You can install velocity.ai as an app.</p>
      <button id="installBtn" class="btn primary">Install app</button>
      <p class="small muted">If nothing happens, use the browser menu ▸ "Install app".</p>
    ` : `
      <div class="step"><span class="num">1</span>Open the ⋮ menu</div>
      <div class="step"><span class="num">2</span>Tap <b>Install app</b></div>
      <div class="step"><span class="num">3</span>Open from your home screen</div>
    `}
  `;
}

function iosCard(){
  return `
    <h3>iPhone & iPad (Safari)</h3>
    <div class="step"><span class="num">1</span>Tap the <b>Share</b> icon (▵), then <b>Add to Home Screen</b></div>
    <div class="step"><span class="num">2</span>Tap <b>Add</b></div>
    <div class="step"><span class="num">3</span>Open <b>velocity.ai</b> from your home screen</div>
    <p class="small muted">iOS does not show automatic install prompts—this is the official way.</p>
  `;
}

function desktopCard(){
  return `
    <h3>Desktop (Chrome/Edge)</h3>
    ${deferredPrompt ? `
      <p class="muted">You can install velocity.ai as an app window.</p>
      <button id="installBtn" class="btn primary">Install app</button>
    ` : `
      <div class="step"><span class="num">1</span>Click the <b>Install</b> icon in the address bar</div>
      <div class="step"><span class="num">2</span>Confirm install</div>
    `}
  `;
}

function drawQR(){
  const canvas = document.getElementById('qr'); if(!canvas) return;
  const ctx = canvas.getContext('2d'); const url = location.origin + '/?utm_source=qr';
  // Simple QR approximation (placeholder): draw URL as text in dark block (keeps page valid even if no QR lib)
  ctx.fillStyle='#1a1a1f'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#fff'; ctx.font='12px monospace'; wrapText(ctx, url, 8, 20, canvas.width-16, 14);
}
function wrapText(ctx, text, x, y, maxW, lh){
  const words = text.split(' '); let line=''; for (let n=0;n<words.length;n++){ const test = line+words[n]+' '; if(ctx.measureText(test).width>maxW && n>0){ ctx.fillText(line, x, y); line=words[n]+' '; y+=lh; } else { line=test; } } ctx.fillText(line, x, y);
}

function wireShareLinks(){
  const url = encodeURIComponent(location.origin + '/?utm_source=share');
  const sms = document.getElementById('smsLink');
  const email = document.getElementById('emailLink');
  const copy = document.getElementById('copyLink');
  if(sms) sms.href = `sms:&body=${url}`;
  if(email) email.href = `mailto:?subject=velocity.ai&body=${url}`;
  if(copy) copy.addEventListener('click', async ()=>{ try{ await navigator.clipboard.writeText(decodeURIComponent(url)); }catch{} });
}

function renderPlatformCard(){
  const el = document.getElementById('platform-card');
  if(!el) return;
  el.innerHTML = (isStandalone ? `
    <h3>Already installed</h3>
    <p class="muted">You're already running velocity.ai as an app.</p>
  ` : isIOS ? iosCard() : isAndroid ? androidCard() : desktopCard());

  const btn = document.getElementById('installBtn');
  if(btn && deferredPrompt){
    btn.addEventListener('click', async ()=>{
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice.catch(()=>({outcome:'dismissed'}));
      deferredPrompt = null;
      btn.disabled = true;
    });
  }
}

window.addEventListener('beforeinstallprompt', (e)=>{
  // Android/desktop
  e.preventDefault();
  deferredPrompt = e;
  renderPlatformCard();
}, { once: true });

window.addEventListener('DOMContentLoaded', ()=>{
  renderPlatformCard();
  drawQR();
  wireShareLinks();
});