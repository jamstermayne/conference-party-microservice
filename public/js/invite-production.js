// Production Invite System: validate, redeem, bonus invites
import Store from './store.js';
import Events from './events.js';

// API base URL - uses existing Firebase function
const API_BASE = '/api';

async function api(path, method = 'GET', body) {
  try {
    const response = await fetch(API_BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Validate invite code using existing backend endpoint
export async function validate(code) {
  try {
    // Use the existing /invite/validate endpoint
    const result = await api(`/invite/validate?code=${encodeURIComponent(code)}`);
    
    // Transform response to expected format
    return {
      valid: result.valid !== false,
      inviterId: result.inviterId || 'unknown',
      inviterName: result.inviterName || 'A friend',
      reason: result.reason || null,
      error: result.error || null
    };
  } catch (error) {
    return {
      valid: false,
      reason: 'Network error',
      error: error.message
    };
  }
}

// Redeem invite code (simulated for now since backend doesn't have this yet)
export async function redeem(code) {
  try {
    // For now, simulate redemption locally
    const validation = await validate(code);
    
    if (!validation.valid) {
      throw new Error(validation.reason || 'Invalid invite code');
    }
    
    // Store redeemed invite
    const redeemedInvites = Store.get('redeemedInvites') || [];
    if (!redeemedInvites.includes(code)) {
      redeemedInvites.push(code);
      Store.set('redeemedInvites', redeemedInvites);
    }
    
    // Update user status
    Store.patch('user.hasInvite', true);
    Store.patch('user.inviteCode', code);
    Store.patch('user.invitedBy', validation.inviterName);
    
    // Clear pending invite
    Store.remove('pendingInvite');
    
    return {
      success: true,
      code,
      inviterName: validation.inviterName
    };
  } catch (error) {
    throw error;
  }
}

// Fetch invite stats (simulated for now)
export async function fetchStats() {
  try {
    // Simulate stats based on local storage
    const sentInvites = Store.get('sentInvites') || [];
    const redeemedCount = sentInvites.filter(i => i.redeemed).length;
    const remaining = Store.get('invites.left') || 10;
    
    return {
      remaining,
      sentCount: sentInvites.length,
      redeemedCount,
      bonusUnlocked: Store.get('invites.bonusUnlocked') || false
    };
  } catch (error) {
    console.error('Failed to fetch invite stats:', error);
    return {
      remaining: 10,
      sentCount: 0,
      redeemedCount: 0,
      bonusUnlocked: false
    };
  }
}

// Generate invite link
export function generateInviteLink(code) {
  const baseUrl = window.location.origin;
  return `${baseUrl}/#/invite/${code}`;
}

// Generate unique invite code
export function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Send invite (simulated)
export async function sendInvite(target, method = 'link') {
  try {
    const invitesLeft = Store.get('invites.left') || 10;
    
    if (invitesLeft <= 0) {
      throw new Error('No invites remaining');
    }
    
    const code = generateInviteCode();
    const link = generateInviteLink(code);
    
    // Store sent invite
    const sentInvites = Store.get('sentInvites') || [];
    sentInvites.push({
      code,
      target,
      method,
      sentAt: Date.now(),
      redeemed: false
    });
    Store.set('sentInvites', sentInvites);
    
    // Decrease remaining invites
    Store.patch('invites.left', invitesLeft - 1);
    
    // Handle different send methods
    if (method === 'copy') {
      await navigator.clipboard.writeText(link);
      Events.emit('ui:toast', { type: 'success', message: 'Invite link copied!' });
    } else if (method === 'whatsapp') {
      const text = `Join me at Gamescom 2025 parties! ${link}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } else if (method === 'twitter') {
      const text = `Got exclusive access to Gamescom 2025 parties! Join me: ${link}`;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    } else if (method === 'email') {
      const subject = 'Invitation to Gamescom 2025 Parties';
      const body = `You've been invited to exclusive Gamescom 2025 parties!\n\nJoin here: ${link}`;
      window.location.href = `mailto:${target}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
    
    return { success: true, code, link };
  } catch (error) {
    Events.emit('ui:toast', { type: 'error', message: error.message });
    throw error;
  }
}

// Mount invite accept UI
function mountInviteAccept({ code, inviterName }) {
  const el = document.querySelector('#main-content');
  if (!el) return;
  
  el.innerHTML = `
    <section class="invite-panel">
      <div class="invite-card">
        <div class="invite-icon">🎉</div>
        <h2>You've been invited${inviterName ? ` by ${inviterName}` : ''}!</h2>
        <p>Accept this exclusive invitation to unlock access to Gamescom 2025 parties and professional networking.</p>
        <div class="invite-code">Code: ${code}</div>
        <div class="button-row">
          <button class="btn btn-primary" id="btn-accept">Accept Invite</button>
          <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        </div>
      </div>
    </section>`;
  
  document.getElementById('btn-accept').onclick = async () => {
    try {
      Events.emit('ui:toast', { type: 'info', message: 'Accepting invite...' });
      await redeem(code);
      Events.emit('ui:toast', { type: 'success', message: 'Welcome to the party! 🎉' });
      await refreshInviteStats();
      Events.emit('navigate', '/onboarding');
    } catch (error) {
      Events.emit('ui:toast', { type: 'error', message: error.message || 'Failed to redeem invite' });
    }
  };
  
  document.getElementById('btn-cancel').onclick = () => {
    Events.emit('navigate', '/');
  };
}

// Mount invite invalid UI
function mountInviteInvalid(reason) {
  const el = document.querySelector('#main-content');
  if (!el) return;
  
  el.innerHTML = `
    <section class="invite-panel">
      <div class="invite-card error">
        <div class="invite-icon">❌</div>
        <h2>Invalid Invite</h2>
        <p>${reason || 'This invite code is invalid or has expired.'}</p>
        <div class="button-row">
          <button class="btn btn-primary" id="btn-home">Go Home</button>
        </div>
      </div>
    </section>`;
  
  document.getElementById('btn-home').onclick = () => {
    Events.emit('navigate', '/');
  };
}

// Refresh invite stats
export async function refreshInviteStats() {
  try {
    const stats = await fetchStats();
    Store.set('invites', stats);
    Events.emit('invites:stats', stats);
    
    // Update invite badge
    updateInviteBadge(stats.remaining);
    
    return stats;
  } catch (error) {
    console.error('Failed to refresh invite stats:', error);
  }
}

// Update invite badge UI
function updateInviteBadge(count) {
  const badges = document.querySelectorAll('[data-role="invite-badge"], #invite-counter');
  badges.forEach(badge => {
    badge.textContent = count > 0 ? count : '';
    badge.style.display = count > 0 ? 'flex' : 'none';
  });
}

// Bonus invite logic
export async function maybeUnlockBonus() {
  try {
    const stats = Store.get('invites') || {};
    const connections = Store.get('connections.count') || 0;
    const bonusUnlocked = Store.get('invites.bonusUnlocked') || false;
    
    if (bonusUnlocked) return;
    
    const unlockRedemptions = stats.redeemedCount >= 10;
    const unlockConnections = connections >= 10;
    
    if (!unlockRedemptions && !unlockConnections) return;
    
    // Grant bonus invites
    const bonusAmount = 5;
    const currentRemaining = stats.remaining || 0;
    
    Store.patch('invites.remaining', currentRemaining + bonusAmount);
    Store.patch('invites.left', currentRemaining + bonusAmount);
    Store.patch('invites.bonusUnlocked', true);
    
    Events.emit('ui:toast', {
      type: 'success',
      message: `🎊 Bonus unlocked! +${bonusAmount} invites added!`
    });
    
    // Animate badge
    const badge = document.querySelector('[data-role="invite-badge"]');
    if (badge) {
      badge.classList.add('pulse');
      setTimeout(() => badge.classList.remove('pulse'), 800);
    }
    
    await refreshInviteStats();
  } catch (error) {
    console.error('Failed to unlock bonus:', error);
  }
}

// Wire up route handling
Events.on('route:change', async (routeInfo) => {
  if (routeInfo.name !== 'invite') return;
  
  const code = routeInfo.code;
  if (!code) {
    mountInviteInvalid('No invite code provided');
    return;
  }
  
  Events.emit('ui:toast', { type: 'info', message: 'Validating invite...' });
  
  try {
    const validation = await validate(code);
    
    if (!validation.valid) {
      mountInviteInvalid(validation.reason);
      return;
    }
    
    Store.set('pendingInvite', {
      code,
      inviterId: validation.inviterId,
      inviterName: validation.inviterName,
      timestamp: Date.now(),
      validated: true
    });
    
    mountInviteAccept({
      code,
      inviterName: validation.inviterName
    });
  } catch (error) {
    console.error('Invite validation error:', error);
    Events.emit('ui:toast', { type: 'error', message: 'Failed to validate invite' });
    mountInviteInvalid('Network error. Please try again.');
  }
});

// Listen for stat changes to unlock bonus
Events.on('invites:stats', maybeUnlockBonus);
Events.on('connections:updated', maybeUnlockBonus);

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  refreshInviteStats();
  
  // Wire up invite UI elements
  document.getElementById('btn-send-invite')?.addEventListener('click', () => {
    Events.emit('invite:send:ui');
  });
});

// Export API
export default {
  validate,
  redeem,
  fetchStats,
  sendInvite,
  generateInviteCode,
  generateInviteLink,
  refreshInviteStats,
  maybeUnlockBonus
};