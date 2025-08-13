// js/controllers/InvitePanelController.js
import { Events } from '../events.js';
import { Store }  from '../store.js';

const API = {
  status: '/api/invites/status',        // GET -> { invitesLeft, redeemed, totalGiven, personalLink, recent: [...] }
  sent:   '/api/invites/sent',          // GET -> [{ id,status,recipient:{...}|email, redeemedAt? }]
  create: '/api/invites/create',        // POST { recipientEmail? } -> { token, url, invitesLeft }
  meLink: '/api/invites/me'             // GET -> { url }  (optional convenience)
};

export function InvitePanelController(section){
  // Nodes
  const pill   = section.querySelector('#inv-left-pill');
  const nLeft  = section.querySelector('#inv-left');
  const nRed   = section.querySelector('#inv-redeemed');
  const nTot   = section.querySelector('#inv-total');
  const prog   = section.querySelector('#inv-progress-fill');
  const list   = section.querySelector('#inv-list');
  const empty  = section.querySelector('#inv-empty');
  const btnSend= section.querySelector('#inv-send-btn');
  const btnCopy= section.querySelector('#inv-copy-link');
  const btnQR  = section.querySelector('#inv-show-qr');
  const btnRef = section.querySelector('#inv-refresh');
  const btnEmpty = section.querySelector('#inv-empty-cta');
  const live   = document.getElementById('invite-live');

  // State
  let left=0, redeemed=0, total=0, personalLink='';
  let pollId=null, backoffMs=0;
  let aborter=null;

  // Lifecycle
  section.addEventListener('route:enter', onEnter);
  section.addEventListener('route:leave', onLeave);

  // Events from elsewhere
  Events.on('invite.sent',   onExternalChange);
  Events.on('invite.redeemed', onExternalChange);
  Events.on('invites.granted', onExternalChange);

  btnSend?.addEventListener('click', onSendInvite);
  btnEmpty?.addEventListener('click', onSendInvite);
  btnCopy?.addEventListener('click', copyPersonalLink);
  btnQR?.addEventListener('click', showQR);
  btnRef?.addEventListener('click', hardRefresh);

  function onEnter(){
    aborter = new AbortController();
    paintBusy(true);
    initialLoad().finally(()=> paintBusy(false));
    startPolling();
    document.addEventListener('visibilitychange', onVis, { signal: aborter.signal });
  }

  function onLeave(){
    stopPolling();
    aborter?.abort(); aborter=null;
  }

  async function initialLoad(){
    try{
      const st = await fetchJSON(API.status);
      applyStatus(st, { animate:false });

      const sent = st.recent || await fetchJSON(API.sent);
      renderList(sent);
    }catch(e){
      console.warn('invites load failed', e);
      renderList([]);
    }
  }

  function onExternalChange(data){
    // Handle external events from other parts of the app
    if (data && typeof data === 'object') {
      applyStatus(data, { animate: true });
      // Refresh the list if we got external updates
      hardRefresh();
    }
  }

  /* ---------- Refresh logic ---------- */

  function startPolling(){
    stopPolling();
    const tick = async () => {
      if (document.hidden) return; // skip when not visible
      try{
        const st = await fetchJSON(API.status);
        backoffMs = 0;
        applyStatus(st, { animate:false });
        // only re-render list if changed (cheap check by lengths / ids)
        if (st.recent) renderList(st.recent);
      }catch(e){
        backoffMs = Math.min((backoffMs||2000) * 2, 60_000); // expo backoff to 60s
      }finally{
        const next = backoffMs || 15_000; // normal 15s cadence
        pollId = setTimeout(tick, next);
      }
    };
    tick();
  }

  function stopPolling(){
    if (pollId){ clearTimeout(pollId); pollId=null; }
  }

  function onVis(){
    if (!document.hidden) hardRefresh();
  }

  async function hardRefresh(){
    paintBusy(true);
    await initialLoad();
    paintBusy(false);
  }

  function paintBusy(busy){
    const listEl = section.querySelector('#inv-list');
    if (listEl) {
      listEl.setAttribute('aria-busy', String(busy));
    }
    
    // Add visual loading indicator
    if (busy) {
      section.classList.add('loading');
    } else {
      section.classList.remove('loading');
    }
  }

  /* ---------- UI apply ---------- */

  function applyStatus(st, { animate=true } = {}){
    if (!st) return;
    left = st.invitesLeft ?? left;
    redeemed = st.redeemed ?? redeemed;
    total = st.totalGiven ?? total;
    personalLink = st.personalLink || personalLink;

    // Store for other modules (e.g., sidebar badge)
    Store.patch && Store.patch('invites.status', { left, redeemed, total });

    bumpText(nLeft, left, animate);
    bumpText(nRed, redeemed, animate);
    bumpText(nTot, total, animate);

    if (pill) {
      pill.textContent = `${left} Left`;
      if (animate) bumpOnce(pill);
    }

    const pct = total>0 ? (left/total)*100 : 0;
    if (prog) prog.style.width = `${pct}%`;

    // a11y live messages
    if (live){
      if (left === 0) live.textContent = 'No invites left.';
      else if (left < 3) live.textContent = `Only ${left} invites left.`;
      else live.textContent = `${left} invites available.`;
    }

    // Update both bottom nav badge and sidebar badge (if present)
    const badges = [
      document.getElementById('invite-count'),
      document.getElementById('sidebar-invite-count')
    ].filter(Boolean);
    
    badges.forEach(badge => {
      const unlimited = Store.get('invites.unlimited') === true || !Number.isFinite(left);
      const displayValue = unlimited ? '∞' : String(left);
      badge.textContent = displayValue;
      badge.classList.toggle('glow', unlimited || left > 0);
      badge.style.display = (unlimited || left > 0) ? 'block' : 'none';
    });

    // Check for surprise bonuses from the backend
    if (st.surprise) {
      handleSurpriseBonus(st.surprise);
    }
  }

  function renderList(items){
    const rows = Array.isArray(items) ? items : [];
    if (!rows.length){
      if (list) list.replaceChildren(); 
      if (empty) empty.hidden = false;
      const listEl = section.querySelector('#inv-list');
      if (listEl) listEl.setAttribute('aria-busy','false');
      return;
    }
    if (empty) empty.hidden = true;
    const tpl = document.getElementById('tpl-invite-row');
    if (!tpl || !list) return;
    
    const frag = document.createDocumentFragment();
    rows.forEach(row=>{
      const li = tpl.content.firstElementChild.cloneNode(true);
      const isRedeemed = row.status === 'redeemed';
      const r = row.recipient || {};
      const name  = isRedeemed ? (r.name || 'New Member') : (row.email || 'Invite Link');
      const meta  = isRedeemed ? [r.company, r.role].filter(Boolean).join(' • ')
                               : 'Pending';
      const photo = isRedeemed ? (r.photoUrl || '/img/avatar-default.png')
                               : '/img/avatar-pending.png';

      const avatar = li.querySelector('.avatar');
      const nameEl = li.querySelector('.name');
      const metaEl = li.querySelector('.meta');
      const statusEl = li.querySelector('.status');

      if (avatar) {
        avatar.src = photo;
        avatar.alt = isRedeemed ? `${name} avatar` : 'Pending invite';
      }
      if (nameEl) nameEl.textContent = name;
      if (metaEl) metaEl.textContent = meta;

      if (statusEl) {
        statusEl.textContent = isRedeemed ? 'Redeemed' : 'Pending';
        statusEl.classList.toggle('redeemed', isRedeemed);
        statusEl.classList.toggle('pending', !isRedeemed);
      }

      frag.appendChild(li);
    });
    list.replaceChildren(frag);
    const listEl = section.querySelector('#inv-list');
    if (listEl) listEl.setAttribute('aria-busy','false');
  }

  /* ---------- Actions ---------- */

  async function onSendInvite(){
    if (left <= 0){ toast('No invites left'); return; }
    // Use your modal if you have one; here's a simple direct create
    try{
      // optional: ask for email; if omitted, backend returns a personal URL/token
      const email = await promptEmail();
      // optimistic decrement
      applyStatus({ invitesLeft: Math.max(0,left-1) }, { animate:true });

      const apiBase = window.CONFIG?.apiBase || '';
      const r = await fetch(`${apiBase}${API.create}`, {
        method:'POST', credentials:'include',
        headers:{ 
          'Content-Type':'application/json',
          ...(window.Store?.get()?.user?.id && { 'x-user-id': window.Store.get().user.id })
        },
        body: JSON.stringify({ recipientEmail: email || undefined })
      });
      
      if (!r.ok) throw new Error('create failed');
      const data = await r.json();

      // reconcile with server response
      applyStatus({ invitesLeft: data.invitesLeft }, { animate:false });
      Events.emit('invite.sent', { email, token: data.token });

      // share
      const url = data.url || personalLink;
      shareLink(url, email);
      toast('Invite sent');
      
      // Refresh list to show new invite
      setTimeout(() => hardRefresh(), 500);
    }catch(e){
      // rollback optimistic update
      applyStatus({ invitesLeft: left+1 }, { animate:false });
      toast('Failed to send invite'); 
      console.warn(e);
    }
  }

  async function copyPersonalLink(){
    try{
      if (!personalLink){
        const apiBase = window.CONFIG?.apiBase || '';
        const r = await fetch(`${apiBase}${API.meLink}`, { 
          credentials:'include',
          headers: {
            ...(window.Store?.get()?.user?.id && { 'x-user-id': window.Store.get().user.id })
          }
        });
        if (r.ok) {
          const d = await r.json(); 
          personalLink = d.url;
        } else {
          // Fallback to generating a simple invite link
          personalLink = `${window.location.origin}/invite?ref=${window.Store?.get()?.user?.id || 'demo'}`;
        }
      }
      await navigator.clipboard.writeText(personalLink);
      toast('Invite link copied');
    }catch(e){ 
      toast('Copy failed');
      console.warn(e);
    }
  }

  function showQR(){
    // hook into your existing modal system
    Events.emit('invites.qr.show', { url: personalLink });
    // Fallback if no modal system
    if (!personalLink) {
      personalLink = `${window.location.origin}/invite?ref=${window.Store?.get()?.user?.id || 'demo'}`;
    }
    toast('QR Code feature coming soon!');
  }

  function handleSurpriseBonus(surprise) {
    // Trigger celebration UI for surprise bonuses
    if (window.InviteBadge?.simple?.handleSurpriseBonus) {
      window.InviteBadge.simple.handleSurpriseBonus(surprise);
    }
    
    // Additional panel-specific celebration
    if (pill) {
      pill.style.animation = 'none';
      setTimeout(() => {
        pill.style.animation = 'invBump 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)';
      }, 50);
    }
  }

  /* ---------- Helpers ---------- */

  async function fetchJSON(url){
    const apiBase = window.CONFIG?.apiBase || '';
    const fullUrl = url.startsWith('http') ? url : `${apiBase}${url}`;
    const r = await fetch(fullUrl, { 
      credentials:'include', 
      signal: aborter?.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(window.Store?.get()?.user?.id && { 'x-user-id': window.Store.get().user.id })
      }
    });
    if (!r.ok) throw new Error(`${url} failed with ${r.status}`);
    return r.json();
  }

  function bumpText(node, val, animate){
    if (!node) return;
    node.textContent = String(val);
    if (animate) bumpOnce(node);
  }
  
  function bumpOnce(el){
    if (!el) return;
    el.classList.remove('bump'); 
    void el.offsetWidth; 
    el.classList.add('bump');
  }
  
  function toast(msg){
    // Try to use existing toast system
    if (window.toast) {
      window.toast(msg);
      return;
    }
    
    const t = document.getElementById('tpl-toast');
    if (!t) {
      // Fallback to console if no toast template
      console.log('Toast:', msg);
      return;
    }
    const n = t.content.firstElementChild.cloneNode(true);
    const msgEl = n.querySelector('.msg');
    if (msgEl) msgEl.textContent = msg;
    document.body.appendChild(n); 
    setTimeout(()=> n.remove(), 1800);
  }
  
  function promptEmail(){
    // replace with your own modal; simple prompt fallback
    return new Promise(res=>{
      const x = window.prompt('Recipient email (optional). Leave blank to generate a link.');
      res((x||'').trim() || null);
    });
  }
  
  async function shareLink(url, email){
    const text = email
      ? `You've been invited to the Gamescom professional network: ${url}`
      : `Use my invite to join the Gamescom professional network: ${url}`;
    if (navigator.share){
      try{ 
        await navigator.share({ title:'Invite', text, url }); 
        return; 
      }catch(e){
        console.log('Native share failed, falling back to clipboard');
      }
    }
    try{ 
      await navigator.clipboard.writeText(url); 
      toast('Link copied'); 
    }catch(e){
      console.warn('Clipboard failed', e);
      toast('Share failed');
    }
  }

  // Initialize method for the controller
  return {
    init: async () => {
      console.log('✅ InvitePanelController initialized');
    },
    destroy: () => {
      onLeave();
    }
  };
}

/* ===== Optional: SSE/WebSocket for instant updates =====
   Server can push: { type:'invites', left, redeemed, total, recent? }
   Hook this once in app bootstrap; emit Events to update panel + badge.
*/
export function mountInvitesSSE(){
  const es = new EventSource('/api/stream');
  es.addEventListener('invites', (e)=>{
    try{
      const st = JSON.parse(e.data);
      Events.emit('invites.granted', st);
      // Also patch store for sidebar badge if no panel open
      Store.patch && Store.patch('invites.status', st);
      const badge = document.getElementById('invite-count');
      if (badge && typeof st.left==='number'){ 
        badge.textContent = st.left; 
        badge.style.display = st.left > 0 ? 'block' : 'none';
      }
    }catch(e){
      console.warn('SSE invites event parse failed:', e);
    }
  });
  
  es.onerror = (e) => {
    console.warn('SSE connection error:', e);
  };
  
  return es;
}