/**
 * Account Hub: summary + invites + connections
 * Pulls from Store where possible; API calls guarded for future endpoints.
 */
import Store from '/js/store.js?v=b023';
import { emptyState, toast } from '/js/ui-feedback.js?v=b023';

const API_BASE = (window.__ENV && window.__ENV.API_BASE) || '/api';

function el(h){ const t=document.createElement('template'); t.innerHTML=h.trim(); return t.content.firstElementChild; }
async function getJSON(url){ const r=await fetch(url); if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }

function tile(num,label){ return el(`<div class="summary-tile"><div class="num">${num}</div><div class="lab">${label}</div></div>`); }

async function loadInvites(){
  try{
    const inv = Store.get('invites') || {};
    const left = inv.left ?? 0;
    const redeemed = inv.redeemed ?? 0;
    return { left, redeemed, sent: inv.sent || 0, recent: inv.recent || [] };
  }catch{ return { left:0, redeemed:0, sent:0, recent:[] }; }
}
async function loadConnections(){
  try{
    const net = Store.get('network') || {};
    return { connections: net.connections||0, list: net.list || [] };
  }catch{ return { connections:0, list:[] }; }
}

export async function renderAccount(){
  const root = document.getElementById('route-account') || document.getElementById('main');
  if(!root) return;

  root.innerHTML = `
    <div class="account-wrap">
      <div class="account-grid">
        <section class="card-block">
          <h3>overview</h3>
          <div class="summary-grid" id="summary"></div>
        </section>

        <section class="card-block">
          <h3>profile</h3>
          <div id="profile">
            <div class="text-secondary">LinkedIn: <span id="li-link">not connected</span></div>
            <div class="text-secondary">Email: <span id="email-link">unknown</span></div>
            <div style="margin-top:10px; display:flex; gap:8px;">
              <button class="btn btn-secondary btn-small" data-act="connect-li">Connect LinkedIn</button>
              <button class="btn btn-secondary btn-small" data-act="add-email">Add backup email</button>
            </div>
          </div>
        </section>

        <section class="card-block">
          <h3>invites</h3>
          <table class="table" id="invites-table">
            <thead><tr><th>To</th><th>Status</th><th>Sent</th></tr></thead>
            <tbody></tbody>
          </table>
        </section>

        <section class="card-block">
          <h3>connections</h3>
          <table class="table" id="connections-table">
            <thead><tr><th>Name</th><th>Company</th><th>Last event</th></tr></thead>
            <tbody></tbody>
          </table>
        </section>
      </div>
    </div>
  `;

  // Summary
  const sEl = root.querySelector('#summary');
  const inv = await loadInvites();
  const net = await loadConnections();
  sEl.append(tile(inv.left,'invites left'));
  sEl.append(tile(inv.redeemed,'invites redeemed'));
  sEl.append(tile(inv.sent,'invites sent'));
  sEl.append(tile(net.connections,'connections'));

  // Profile from Store.profile
  const profile = Store.get('profile') || {};
  const li = profile.linkedin || null;
  const email = profile.email || null;
  root.querySelector('#li-link').textContent = li ? li : 'not connected';
  root.querySelector('#email-link').textContent = email ? email : 'not set';

  // Invites table
  const itb = root.querySelector('#invites-table tbody');
  const recent = inv.recent || [];
  if(!recent.length){ itb.parentElement.replaceWith(emptyState('No invites yet.')); }
  else {
    recent.forEach(r=> itb.append(el(`<tr><td>${r.to||'—'}</td><td>${r.status||'sent'}</td><td>${r.when||''}</td></tr>`)));
  }

  // Connections table
  const ctb = root.querySelector('#connections-table tbody');
  const clist = net.list || [];
  if(!clist.length){ ctb.parentElement.replaceWith(emptyState('No connections yet.')); }
  else {
    clist.forEach(c=> ctb.append(el(`<tr><td>${c.name||'—'}</td><td>${c.company||''}</td><td>${c.lastEvent||''}</td></tr>`)));
  }

  // Actions (stubbed)
  root.addEventListener('click',(e)=>{
    const b=e.target.closest('button[data-act]');
    if(!b) return;
    if(b.dataset.act==='connect-li'){ toast('LinkedIn connect coming soon','ok'); }
    if(b.dataset.act==='add-email'){ toast('Open email add modal (coming soon)','ok'); }
  });
}

try{
  document.addEventListener('route:change',(e)=>{
    if((e.detail?.name)==='account' || (e.detail?.name)==='me' || (e.detail?.name)==='settings') renderAccount();
  });
}catch{}