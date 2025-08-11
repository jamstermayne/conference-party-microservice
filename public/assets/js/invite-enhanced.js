// Enhanced Production Invite System
import { Store, Events } from './state.js';

// API helper using existing backend endpoint
async function api(path, method = 'GET', body) {
  const fullUrl = '/api' + path;
  
  try {
    console.log('🔄 [INVITE API DEBUG] Making request:', {
      url: fullUrl,
      fullUrl: window.location.origin + fullUrl,
      method,
      body: body ? JSON.stringify(body) : undefined
    });
    
    const response = await fetch(fullUrl, {
      method, 
      cache: 'no-cache', // Bypass service worker for debugging
      headers: {'Content-Type': 'application/json'},
      body: body ? JSON.stringify(body) : undefined
    });
    
    console.log('📥 [INVITE API DEBUG] Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (!response.ok) {
      let errorData;
      try {
        const responseText = await response.text();
        console.log('📄 [INVITE API DEBUG] Error response body:', responseText);
        errorData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ [INVITE API DEBUG] Could not parse error response:', parseError);
        errorData = { error: 'Network error' };
      }
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const responseText = await response.text();
    console.log('📄 [INVITE API DEBUG] Success response body:', responseText.substring(0, 300) + '...');
    
    try {
      const jsonData = JSON.parse(responseText);
      console.log('✅ [INVITE API DEBUG] Successfully parsed response JSON:', jsonData);
      return jsonData;
    } catch (parseError) {
      console.error('❌ [INVITE API DEBUG] JSON parse error:', parseError);
      console.log('📄 [INVITE API DEBUG] Full response that failed to parse:', responseText);
      throw parseError;
    }
  } catch (error) {
    console.error('❌ [INVITE API DEBUG] API Error:', error);
    throw error;
  }
}

// Validate invite using existing backend endpoint
export async function validate(code) {
  try {
    const result = await api(`/invites/status?code=${encodeURIComponent(code)}`);
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

// Redeem invite (simulated since backend doesn't have endpoint yet)
export async function redeem(code) {
  try {
    const validation = await validate(code);
    if (!validation.valid) {
      throw new Error(validation.reason || 'Invalid invite code');
    }
    
    // Store locally
    const redeemedInvites = Store.get('redeemedInvites') || [];
    if (!redeemedInvites.includes(code)) {
      redeemedInvites.push(code);
      Store.set('redeemedInvites', redeemedInvites);
    }
    
    // Update user
    Store.patch('user.hasInvite', true);
    Store.patch('user.inviteCode', code);
    Store.patch('user.invitedBy', validation.inviterName);
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

// Refresh invite stats
export async function refreshInviteStats() {
  try {
    const sentInvites = Store.get('sentInvites') || [];
    const redeemedCount = sentInvites.filter(i => i.redeemed).length;
    const remaining = Store.get('invites.left') || 10;
    
    const stats = {
      remaining,
      sentCount: sentInvites.length,
      redeemedCount,
      bonusUnlocked: Store.get('invites.bonusUnlocked') || false
    };
    
    Store.set('invites', stats);
    Events.emit('invites:stats', stats);
    updateInviteBadge(remaining);
    
    return stats;
  } catch (error) {
    console.error('Failed to refresh invite stats:', error);
  }
}

// Update UI badges
function updateInviteBadge(count) {
  const badges = document.querySelectorAll('[data-role="invite-badge"], #invite-counter');
  badges.forEach(badge => {
    badge.textContent = count > 0 ? count : '';
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  });
}

// Generate invite link
export function generateInviteLink(code) {
  return `${window.location.origin}/#/invite/${code}`;
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

// Send invite with sharing options
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
    Store.patch('invites.left', invitesLeft - 1);
    
    // Handle sharing
    if (method === 'copy') {
      await navigator.clipboard.writeText(link);
      Events.emit('ui:toast', { type: 'success', message: 'Invite link copied!' });
    } else if (method === 'whatsapp') {
      const text = `Join me at Gamescom 2025 parties! ${link}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } else if (method === 'twitter') {
      const text = `Got exclusive access to Gamescom 2025 parties! Join me: ${link}`;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    }
    
    await refreshInviteStats();
    return { success: true, code, link };
  } catch (error) {
    Events.emit('ui:toast', { type: 'error', message: error.message });
    throw error;
  }
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
    
    const bonusAmount = 5;
    const currentRemaining = stats.remaining || 0;
    
    Store.patch('invites.remaining', currentRemaining + bonusAmount);
    Store.patch('invites.left', currentRemaining + bonusAmount);
    Store.patch('invites.bonusUnlocked', true);
    
    // Mark bonus as just added for reward strip
    Store.patch('invites.justAddedBonus', bonusAmount);
    
    // NEW: broadcast a high-signal event for proactive UI nudges
    Events.emit('invites:bonus', { added: bonusAmount, remaining: currentRemaining + bonusAmount });
    
    Events.emit('ui:toast', {
      type: 'success',
      message: `🎊 Bonus unlocked! +${bonusAmount} invites added!`
    });
    
    // Clear the flag after reward strip shows it
    setTimeout(() => {
      const current = Store.get('invites') || {};
      delete current.justAddedBonus;
      Store.set('invites', current);
    }, 2500);
    
    // Animate badge with micro-pulse
    const badge = document.querySelector('[data-role="invite-badge"]');
    if (badge) {
      badge.classList.add('invite-counter-update');
      setTimeout(() => {
        badge.classList.remove('invite-counter-update');
        // Add continuous pulse for high-value state
        badge.classList.add('badge-pulse');
        setTimeout(() => badge.classList.remove('badge-pulse'), 3000);
      }, 500);
    }
    
    await refreshInviteStats();
  } catch (error) {
    console.error('Failed to unlock bonus:', error);
  }
}

// Mount invite accept UI
function mountInviteAccept({ code, inviterName }) {
  const mainContent = document.querySelector('#main-content');
  if (!mainContent) return;
  
  mainContent.innerHTML = `
    <div class="invite-panel">
      <div class="invite-card">
        <div class="invite-icon">🎉</div>
        <h2>You've been invited${inviterName ? ` by ${inviterName}` : ''}!</h2>
        <p>Accept this exclusive invitation to unlock access to Gamescom 2025 parties and professional networking.</p>
        <div class="invite-code">Code: ${code}</div>
        <div class="row gap">
          <button class="btn btn-primary" id="btn-accept">Accept Invite</button>
          <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        </div>
      </div>
    </div>`;
  
  document.getElementById('btn-accept').onclick = async () => {
    try {
      Events.emit('ui:toast', { type: 'info', message: 'Accepting invite...' });
      await redeem(code);
      Events.emit('ui:toast', { type: 'success', message: 'Welcome to the party! 🎉' });
      await refreshInviteStats();
      Events.emit('navigate', '/onboarding');
    } catch (error) {
      Events.emit('ui:toast', { type: 'error', message: error.message });
    }
  };
  
  document.getElementById('btn-cancel').onclick = () => {
    Events.emit('navigate', '/');
  };
}

// Mount invalid invite UI
function mountInviteInvalid(reason) {
  const mainContent = document.querySelector('#main-content');
  if (!mainContent) return;
  
  mainContent.innerHTML = `
    <div class="invite-panel">
      <div class="invite-card error">
        <div class="invite-icon">❌</div>
        <h2>Invalid Invite</h2>
        <p>${reason || 'This invite code is invalid or has expired.'}</p>
        <div class="row gap">
          <button class="btn btn-primary" id="btn-home">Go Home</button>
        </div>
      </div>
    </div>`;
  
  document.getElementById('btn-home').onclick = () => {
    Events.emit('navigate', '/');
  };
}

// Handle route changes for invite links
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

// Listen for stat changes
Events.on('invites:stats', maybeUnlockBonus);
Events.on('connections:updated', maybeUnlockBonus);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  refreshInviteStats();
});

export default {
  validate,
  redeem,
  refreshInviteStats,
  sendInvite,
  generateInviteCode,
  generateInviteLink,
  maybeUnlockBonus
};