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

// Redeem invite using real backend API
export async function redeem(code) {
  try {
    const userId = Store.get('user.id') || 'anonymous_' + Date.now();
    const userName = Store.get('user.name') || 'Anonymous User';
    
    // Redeem through backend API
    const result = await api('/invites/redeem', 'POST', {
      code,
      userId,
      userName
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to redeem invite');
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
    Store.patch('user.invitedBy', result.inviterName);
    Store.remove('pendingInvite');
    
    return {
      success: true,
      code,
      inviterName: result.inviterName
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

// Send invite with enhanced sharing capabilities
export async function sendInvite(target, method = 'link') {
  try {
    const userId = Store.get('user.id') || 'anonymous_' + Date.now();
    const userName = Store.get('user.name') || 'Gamescom Attendee';
    
    // Generate invite through backend API
    const response = await api('/invites/generate', 'POST', {
      inviterId: userId,
      inviterName: userName
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to generate invite');
    }
    
    const { code, link } = response;
    
    // Store sent invite locally
    const sentInvites = Store.get('sentInvites') || [];
    sentInvites.push({
      code,
      target,
      method,
      sentAt: Date.now(),
      redeemed: false,
      link
    });
    Store.set('sentInvites', sentInvites);
    
    // Enhanced sharing options
    await handleInviteSharing(link, method, userName);
    
    await refreshInviteStats();
    return { success: true, code, link };
  } catch (error) {
    Events.emit('ui:toast', { type: 'error', message: error.message });
    throw error;
  }
}

// Enhanced sharing handler with more platforms
async function handleInviteSharing(link, method, userName) {
  const inviteText = `🎮 ${userName} invited you to exclusive Gamescom 2025 parties! Join the most epic gaming events in Cologne.`;
  const shareData = {
    title: 'Gamescom 2025 Party Invite',
    text: inviteText,
    url: link
  };
  
  try {
    switch (method) {
      case 'copy':
        await navigator.clipboard.writeText(link);
        Events.emit('ui:toast', { type: 'success', message: '🔗 Invite link copied!' });
        break;
        
      case 'native':
        if (navigator.share) {
          await navigator.share(shareData);
          Events.emit('ui:toast', { type: 'success', message: '📤 Invite shared!' });
        } else {
          // Fallback to copy
          await navigator.clipboard.writeText(link);
          Events.emit('ui:toast', { type: 'success', message: '🔗 Link copied (native share not available)' });
        }
        break;
        
      case 'whatsapp':
        const whatsappText = `${inviteText}\\n\\n🎯 Get your exclusive access: ${link}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, '_blank');
        Events.emit('ui:toast', { type: 'info', message: '💬 Opening WhatsApp...' });
        break;
        
      case 'twitter':
        const twitterText = `${inviteText}\\n\\n${link}\\n\\n#Gamescom2025 #Gaming #Cologne`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`, '_blank');
        Events.emit('ui:toast', { type: 'info', message: '🐦 Opening Twitter...' });
        break;
        
      case 'telegram':
        const telegramText = `${inviteText}\\n\\n🎯 Join here: ${link}`;
        window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(telegramText)}`, '_blank');
        Events.emit('ui:toast', { type: 'info', message: '✈️ Opening Telegram...' });
        break;
        
      case 'discord':
        await navigator.clipboard.writeText(`${inviteText}\\n\\n🎯 **Get your access:** ${link}`);
        Events.emit('ui:toast', { type: 'success', message: '🎮 Discord message copied - paste in your server!' });
        break;
        
      case 'email':
        const subject = encodeURIComponent('Exclusive Gamescom 2025 Party Invite 🎮');
        const body = encodeURIComponent(`Hi there!\\n\\n${inviteText}\\n\\nClick here to get your exclusive access:\\n${link}\\n\\nSee you at the parties!\\n\\n- ${userName}`);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
        Events.emit('ui:toast', { type: 'info', message: '📧 Opening email client...' });
        break;
        
      case 'sms':
        const smsText = encodeURIComponent(`${inviteText} ${link}`);
        window.open(`sms:?body=${smsText}`, '_blank');
        Events.emit('ui:toast', { type: 'info', message: '📱 Opening SMS...' });
        break;
        
      default:
        await navigator.clipboard.writeText(link);
        Events.emit('ui:toast', { type: 'success', message: '🔗 Link copied!' });
    }
  } catch (error) {
    console.warn('Share method failed, falling back to copy:', error);
    await navigator.clipboard.writeText(link);
    Events.emit('ui:toast', { type: 'warning', message: '⚠️ Share failed, link copied instead' });
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

// Mount invite accept UI - Security: Safe DOM creation
function mountInviteAccept({ code, inviterName }) {
  const mainContent = document.querySelector('#main-content');
  if (!mainContent) return;
  
  // Create elements safely without innerHTML
  mainContent.replaceChildren();
  
  const invitePanel = document.createElement('div');
  invitePanel.className = 'invite-panel';
  
  const inviteCard = document.createElement('div');
  inviteCard.className = 'invite-card';
  
  const inviteIcon = document.createElement('div');
  inviteIcon.className = 'invite-icon';
  inviteIcon.textContent = '🎉';
  
  const heading = document.createElement('h2');
  heading.textContent = `You've been invited${inviterName ? ` by ${inviterName}` : ''}!`;
  
  const description = document.createElement('p');
  description.textContent = 'Accept this exclusive invitation to unlock access to Gamescom 2025 parties and professional networking.';
  
  const codeDisplay = document.createElement('div');
  codeDisplay.className = 'invite-code';
  codeDisplay.textContent = `Code: ${code}`;
  
  const buttonRow = document.createElement('div');
  buttonRow.className = 'row gap';
  
  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn btn-primary';
  acceptBtn.textContent = 'Accept Invite';
  acceptBtn.onclick = async () => {
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
  
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = () => {
    Events.emit('navigate', '/');
  };
  
  buttonRow.appendChild(acceptBtn);
  buttonRow.appendChild(cancelBtn);
  
  inviteCard.appendChild(inviteIcon);
  inviteCard.appendChild(heading);
  inviteCard.appendChild(description);
  inviteCard.appendChild(codeDisplay);
  inviteCard.appendChild(buttonRow);
  
  invitePanel.appendChild(inviteCard);
  mainContent.appendChild(invitePanel);
}

// Mount invalid invite UI - Security: Safe DOM creation
function mountInviteInvalid(reason) {
  const mainContent = document.querySelector('#main-content');
  if (!mainContent) return;
  
  // Create elements safely without innerHTML
  mainContent.replaceChildren();
  
  const invitePanel = document.createElement('div');
  invitePanel.className = 'invite-panel';
  
  const inviteCard = document.createElement('div');
  inviteCard.className = 'invite-card error';
  
  const inviteIcon = document.createElement('div');
  inviteIcon.className = 'invite-icon';
  inviteIcon.textContent = '❌';
  
  const heading = document.createElement('h2');
  heading.textContent = 'Invalid Invite';
  
  const description = document.createElement('p');
  description.textContent = reason || 'This invite code is invalid or has expired.';
  
  const buttonRow = document.createElement('div');
  buttonRow.className = 'row gap';
  
  const homeBtn = document.createElement('button');
  homeBtn.className = 'btn btn-primary';
  homeBtn.textContent = 'Go Home';
  homeBtn.onclick = () => {
    Events.emit('navigate', '/');
  };
  
  buttonRow.appendChild(homeBtn);
  
  inviteCard.appendChild(inviteIcon);
  inviteCard.appendChild(heading);
  inviteCard.appendChild(description);
  inviteCard.appendChild(buttonRow);
  
  invitePanel.appendChild(inviteCard);
  mainContent.appendChild(invitePanel);
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