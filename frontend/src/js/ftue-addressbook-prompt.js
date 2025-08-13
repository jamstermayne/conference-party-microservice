/**
 * FTUE nudge: When user types into any email-like input, show "Sync address book".
 * Debounced, once per session. Uses Store('ftue.addrNudged') guard.
 */
import Store from '/js/store.js?v=b022';
import { toast } from '/js/ui-feedback.js?v=b022';

let shown = false;

function looksLikeEmail(val){
  return /@.+\./.test(String(val||''));
}

function renderNudge(){
  if (shown) return; shown = true;
  if (Store.get('ftue.addrNudged')) return;
  const box = document.createElement('div');
  box.className='ftue-nudge';
  box.innerHTML = `
    <h4>Sync your address book</h4>
    <p>Connect once—stop typing emails forever.</p>
    <div class="ftue-actions">
      <button class="btn btn-primary btn-small" data-act="connect">Connect</button>
      <button class="btn btn-outline btn-small" data-act="dismiss">Not now</button>
    </div>
  `;
  document.body.appendChild(box);
  box.addEventListener('click',(e)=>{
    const b=e.target.closest('button[data-act]'); if(!b) return;
    if(b.dataset.act==='connect'){ toast('Address book connect coming soon','ok'); Store.patch('ftue.addrNudged', Date.now()); box.remove(); }
    if(b.dataset.act==='dismiss'){ Store.patch('ftue.addrNudged', Date.now()); box.remove(); }
  });
}

function attach(){
  // Monitor inputs in capture to catch dynamic forms
  document.addEventListener('input',(e)=>{
    const t = e.target;
    if(!(t instanceof HTMLInputElement)) return;
    const type = (t.getAttribute('type')||'').toLowerCase();
    const name = (t.getAttribute('name')||'').toLowerCase();
    if (type==='email' || name.includes('email') || looksLikeEmail(t.value)) {
      renderNudge();
    }
  }, true);
}

try { attach(); } catch {}
export default {};