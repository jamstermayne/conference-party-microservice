import Events from '/assets/js/events.js';

const getInvitesLeft = () => (window.Store?.get?.('invites.left')) ?? 5;

export function renderInvites(root){
  const wrap=document.createElement('section');
  wrap.className='section-card';
  wrap.innerHTML=`
    <div class="left-accent" aria-hidden="true"></div>
    <div class="section-body">
      <div class="header-row">
        <div class="header-title">Invites</div>
        <div class="header-meta muted">Share access • Earn bonuses</div>
      </div>

      <div class="grid" style="grid-template-columns:1fr 1fr;gap:12px">
        <div class="card">
          <div class="card-header"><div class="card-title">Summary</div></div>
          <div class="card-body">
            <div class="card-row">Invites left: <strong id="inv-left">${getInvitesLeft()}</strong></div>
            <div class="card-row muted">Bonus +5 after 10 redemptions.</div>
          </div>
          <div class="card-actions">
            <button class="btn btn-primary" data-action="copy-link">Copy Invite Link</button>
            <button class="btn btn-outline" data-action="send-email">Send Email</button>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">Recent Activity</div></div>
          <div class="card-body" id="inv-activity">
            <div class="muted">No activity yet.</div>
          </div>
        </div>
      </div>
    </div>
  `;
  root.appendChild(wrap);

  const act = wrap.querySelector('#inv-activity');
  const onCopy = async ()=>{
    const link = location.origin + '/?ref=' + (crypto?.randomUUID?.() || Date.now());
    try{ await navigator.clipboard.writeText(link); }catch{}
    act.innerHTML=`<div class="card-row">🔗 Copied: <span class="muted">${link}</span></div>`;
  };
  wrap.querySelector('[data-action="copy-link"]').addEventListener('click', onCopy, {passive:true});
  wrap.querySelector('[data-action="send-email"]').addEventListener('click', ()=>{
    const link = location.origin + '/?ref=' + (crypto?.randomUUID?.() || Date.now());
    location.href='mailto:?subject=Join me at Gamescom parties&body=' + encodeURIComponent(link);
  }, {passive:true});
}