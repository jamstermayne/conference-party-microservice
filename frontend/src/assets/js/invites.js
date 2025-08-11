import { API } from './api.js';
import { Store, Events, EVENTS } from './state.js';
import { qs, toast } from './ui.js';
import { DeepLinkHandler } from './deep-links.js';

export function InvitesView(){
  const wrap = document.createElement('section');
  wrap.innerHTML = `
    <div class="card-row">
      <div>
        <div class="h1">Exclusive Invites</div>
        <div class="sub">Quality over quantity • Share carefully</div>
      </div>
      <div class="cta">
        <div class="pill" id="invite-count">${Store.invites.left}</div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-row">
        <div>
          <div class="card-title">Share Velocity</div>
          <div class="meta">Get +5 bonus invites when someone joins via your link</div>
        </div>
        <button id="btn-share" class="btn btn-primary btn-small">Share App</button>
      </div>
      <div id="share-link-section" class="share-section" style="display: none;">
        <div class="share-link-container">
          <input type="text" id="share-link" class="input" readonly placeholder="Generating share link...">
          <button id="copy-share-link" class="btn btn-small btn-ghost">Copy</button>
        </div>
        <div class="share-methods">
          <button id="share-email" class="btn btn-small btn-ghost">📧 Email</button>
          <button id="share-linkedin" class="btn btn-small btn-ghost">💼 LinkedIn</button>
          <button id="share-twitter" class="btn btn-small btn-ghost">🐦 Twitter</button>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-row">
        <div>
          <div class="card-title">Send Personal Invite</div>
          <div class="meta">Directly invite industry professionals</div>
        </div>
      </div>
      <div class="form">
        <input type="email" id="invite-email" placeholder="colleague@company.com" class="input" required>
        <input type="text" id="invite-name" placeholder="Name (optional)" class="input">
        <button id="btn-invite" class="btn btn-primary" ${Store.invites.left <= 0 ? 'disabled' : ''}>
          Send Invite (${Store.invites.left} left)
        </button>
      </div>
    </div>
    
    <div id="invite-history" class="card">
      <div class="card-title">Recent Invites</div>
      <div id="sent-list" class="list"></div>
    </div>
    
    <div id="bonus-section" class="card">
      <div class="card-title">Bonus Opportunities</div>
      <div class="list">
        <div class="list-item">
          <div>
            <div class="list-title">Share to Social</div>
            <div class="list-sub">+5 invites when you share Velocity</div>
          </div>
          <button class="btn btn-small btn-ghost" data-bonus="share">Share</button>
        </div>
        <div class="list-item">
          <div>
            <div class="list-title">10 Connections</div>
            <div class="list-sub">+5 invites when you connect with 10 people</div>
          </div>
          <div class="cta">
            <span class="badge">${Store.connections?.length || 0}/10</span>
          </div>
        </div>
        <div class="list-item">
          <div>
            <div class="list-title">10 Redeemed</div>
            <div class="list-sub">+5 invites when 10 people join via your invites</div>
          </div>
          <div class="cta">
            <span class="badge">${Store.invites.redeemed}/10</span>
          </div>
        </div>
      </div>
    </div>
  `;
  
  setupInviteHandlers(wrap);
  loadInviteStatus(wrap);
  
  return wrap;
}

function setupInviteHandlers(root) {
  // Share app
  root.querySelector('#btn-share').addEventListener('click', async () => {
    const shareSection = root.querySelector('#share-link-section');
    const shareButton = root.querySelector('#btn-share');
    
    if (shareSection.style.display === 'none') {
      // Show sharing options
      shareSection.style.display = 'block';
      shareButton.textContent = 'Hide Sharing';
      
      // Generate share link
      const shareLink = DeepLinkHandler.generateShareLink(
        Store.profile?.id || 'anonymous',
        'invite-panel',
        'user-share'
      );
      
      root.querySelector('#share-link').value = shareLink;
      
    } else {
      // Hide sharing options  
      shareSection.style.display = 'none';
      shareButton.textContent = 'Share App';
    }
  });
  
  // Copy share link
  root.querySelector('#copy-share-link')?.addEventListener('click', async () => {
    const shareLink = root.querySelector('#share-link').value;
    try {
      await navigator.clipboard.writeText(shareLink);
      toast('🔗 Share link copied!');
      
      // Grant share bonus
      await API.claimBonus('share');
      
    } catch (error) {
      fallbackShare(shareLink);
    }
  });
  
  // Share via email
  root.querySelector('#share-email')?.addEventListener('click', () => {
    const shareLink = root.querySelector('#share-link').value;
    const subject = encodeURIComponent('Join me at Gamescom 2025 - Velocity Networking');
    const body = encodeURIComponent(`Hi!

I'm using Velocity for exclusive gaming industry networking at Gamescom 2025. 

Join me to discover 50+ professional events and connect with industry leaders:
${shareLink}

See you there!`);
    
    window.open(`mailto:?subject=${subject}&body=${body}`);
    API.claimBonus('share');
  });
  
  // Share via LinkedIn  
  root.querySelector('#share-linkedin')?.addEventListener('click', () => {
    const shareLink = root.querySelector('#share-link').value;
    const text = encodeURIComponent('Excited for exclusive gaming industry networking at Gamescom 2025 with Velocity!');
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}&text=${text}`);
    API.claimBonus('share');
  });
  
  // Share via Twitter
  root.querySelector('#share-twitter')?.addEventListener('click', () => {
    const shareLink = root.querySelector('#share-link').value;
    const text = encodeURIComponent('Join me for exclusive gaming industry networking at @gamescom 2025! 🎮');
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLink)}&text=${text}`);
    API.claimBonus('share');
  });
  
  // Native sharing fallback
  const tryNativeShare = async () => {
    if (navigator.share) {
      try {
        const shareLink = DeepLinkHandler.generateShareLink(
          Store.profile?.id || 'anonymous',
          'native-share',
          'user-share'
        );
        
        await navigator.share({
          title: 'Velocity - Professional Gaming Network',
          text: 'Join me at Gamescom 2025 for exclusive industry networking',
          url: shareLink
        });
        
        // Grant share bonus
        await API.claimBonus('share');
        toast('🎁 +5 invites unlocked! (Share bonus)');
        
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.log('Native share cancelled or failed');
        }
      }
    }
  };
  
  // Send personal invite
  root.querySelector('#btn-invite').addEventListener('click', async () => {
    const email = root.querySelector('#invite-email').value.trim();
    const name = root.querySelector('#invite-name').value.trim();
    
    if (!email) {
      toast('Email required');
      return;
    }
    
    if (Store.invites.left <= 0) {
      toast('No invites left');
      return;
    }
    
    try {
      await API.sendInvite({ email, name });
      Store.invites.left = Math.max(0, Store.invites.left - 1);
      
      root.querySelector('#invite-email').value = '';
      root.querySelector('#invite-name').value = '';
      
      toast('Invite sent!');
      updateInviteDisplay(root);
      loadInviteStatus(root);
      
    } catch (error) {
      console.error('Failed to send invite:', error);
      toast('Failed to send invite');
    }
  });
  
  // Bonus handlers
  root.addEventListener('click', async (e) => {
    const bonusType = e.target.dataset.bonus;
    if (bonusType === 'share') {
      // Trigger social share
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Velocity - Gamescom 2025',
            text: 'Professional gaming industry networking at Gamescom 2025',
            url: window.location.origin
          });
          await API.claimBonus('share');
        } catch (err) {
          if (err.name !== 'AbortError') fallbackShare();
        }
      } else {
        fallbackShare();
      }
    }
  });
}

async function loadInviteStatus(root) {
  try {
    const status = await API.inviteStatus();
    Object.assign(Store.invites, status);
    updateInviteDisplay(root);
    renderSentInvites(root);
  } catch (error) {
    console.error('Failed to load invite status:', error);
  }
}

function updateInviteDisplay(root) {
  const countEl = root.querySelector('#invite-count');
  const inviteBtn = root.querySelector('#btn-invite');
  
  if (countEl) countEl.textContent = Store.invites.left;
  
  if (inviteBtn) {
    inviteBtn.disabled = Store.invites.left <= 0;
    inviteBtn.textContent = `Send Invite (${Store.invites.left} left)`;
  }
}

function renderSentInvites(root) {
  const listEl = root.querySelector('#sent-list');
  if (!listEl) return;
  
  if (!Store.invites.sent?.length) {
    listEl.innerHTML = '<div class="meta">No invites sent yet</div>';
    return;
  }
  
  listEl.innerHTML = '';
  Store.invites.sent.slice(0, 10).forEach(invite => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div>
        <div class="list-title">${escapeHTML(invite.name || invite.email)}</div>
        <div class="list-sub">${escapeHTML(invite.email)} • ${formatDate(invite.ts)}</div>
      </div>
      <div class="cta">
        <span class="badge ${getStatusClass(invite.status)}">${invite.status}</span>
      </div>
    `;
    listEl.appendChild(item);
  });
}

function fallbackShare() {
  const url = window.location.origin + '?ref=' + (Store.profile?.id || 'anon');
  navigator.clipboard.writeText(url).then(() => {
    toast('🔗 Share link copied to clipboard');
  }).catch(() => {
    toast('Share: ' + url);
  });
}

function getStatusClass(status) {
  switch (status?.toLowerCase()) {
    case 'joined': return 'ok';
    case 'pending': return 'warn';
    case 'bounced': return 'err';
    default: return '';
  }
}

function formatDate(ts) {
  try {
    return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function escapeHTML(s) {
  return String(s ?? '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

// Listen for invite changes
Events.on(EVENTS.INVITES_CHANGED, () => {
  const activeView = document.querySelector('#route section');
  if (activeView && activeView.querySelector('#invite-count')) {
    updateInviteDisplay(activeView);
    renderSentInvites(activeView);
  }
});