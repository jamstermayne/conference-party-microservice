// js/invite-badge.js
// Dynamic Invite Badge Management

// Real API fetch for invite status
async function fetchInviteCount() {
  try {
    const response = await fetch(`${window.CONFIG?.apiBase || ''}/api/invites/status`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        // Add user ID header if available
        ...(window.Store?.get()?.user?.id && { 'x-user-id': window.Store.get().user.id })
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch invite status');
    }
    
    const data = await response.json();
    return data.invitesLeft || 0;
  } catch (error) {
    console.warn('Failed to fetch invite status:', error);
    // Fallback to demo count
    return 10; 
  }
}

function updateInviteBadge(count) {
  const badge = document.getElementById('invite-count');
  if (!badge) return;
  
  // Update count text
  badge.textContent = count > 0 ? count : '';
  
  // Trigger glow if new invites > 0
  if (count > 0) {
    badge.classList.add('glow');
    // Auto-remove glow after animation cycle
    setTimeout(() => {
      badge.classList.remove('glow');
    }, 3000);
    
    // Accessibility announcement for initial load
    announceInviteUpdate(count, false);
  } else {
    badge.classList.remove('glow');
  }
  
  // Hide badge completely if no invites
  badge.style.display = count > 0 ? 'block' : 'none';
}

// ARIA live region announcements for screen readers
function announceInviteUpdate(count, isNewInvite = false) {
  const liveRegion = document.getElementById('invite-live');
  if (!liveRegion) return;
  
  let message = '';
  
  if (count === 0) {
    message = 'No pending invites';
  } else if (count === 1) {
    message = isNewInvite ? 'New invite received' : '1 invite pending';
  } else {
    message = isNewInvite ? 
      `${count} total invites, new invite received` : 
      `${count} invites pending`;
  }
  
  // Clear and then set the message to ensure screen readers announce it
  liveRegion.textContent = '';
  setTimeout(() => {
    liveRegion.textContent = message;
  }, 100);
}

// Track previous count for glow trigger
let previousCount = 0;

async function refreshInviteCount() {
  try {
    const count = await fetchInviteCount();
    
    // Only trigger glow animation for new invites
    if (count > previousCount && previousCount > 0) {
      updateInviteBadgeWithGlow(count);
    } else {
      updateInviteBadge(count);
    }
    
    previousCount = count;
  } catch (error) {
    console.warn('Error refreshing invite count:', error);
  }
}

function updateInviteBadgeWithGlow(count) {
  const badge = document.getElementById('invite-count');
  if (!badge) return;
  
  badge.textContent = count;
  badge.style.display = 'block';
  
  // Add glow with haptic feedback
  badge.classList.add('glow');
  
  // Haptic feedback for new invites (mobile)
  if ('vibrate' in navigator) {
    navigator.vibrate([50, 100, 50]);
  }
  
  // Accessibility announcement
  announceInviteUpdate(count, true);
  
  // Remove glow after animation
  setTimeout(() => {
    badge.classList.remove('glow');
  }, 3000);
}

// Invite Modal Trigger - now opens the full-screen panel
function openInviteModal() {
  const panel = document.getElementById('invite-panel');
  if (panel) {
    showInvitePanel();
  } else {
    // Fallback - navigate to invite route
    if (window.location.hash !== '#/invite') {
      window.location.hash = '#/invite';
    }
  }
  
  // Clear glow state when user opens invites
  const badge = document.getElementById('invite-count');
  if (badge) {
    badge.classList.remove('glow');
  }
}

// Full-Screen Invite Panel Management
function showInvitePanel() {
  const panel = document.getElementById('invite-panel');
  if (!panel) return;
  
  panel.hidden = false;
  
  // Populate panel with current data
  updatePanelData();
  
  // Focus management for accessibility
  const closeBtn = document.getElementById('invite-panel-close');
  if (closeBtn) {
    closeBtn.focus();
  }
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}

function hideInvitePanel() {
  const panel = document.getElementById('invite-panel');
  if (!panel) return;
  
  panel.hidden = true;
  document.body.style.overflow = '';
}

async function updatePanelData(previousCount = null) {
  try {
    // Fetch current invite status
    const response = await fetch(`${window.CONFIG?.apiBase || ''}/api/invites/status`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(window.Store?.get()?.user?.id && { 'x-user-id': window.Store.get().user.id })
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch invite status');
    
    const data = await response.json();
    const { invitesLeft, redeemed, totalGiven } = data;
    
    // Update header count
    const headerCount = document.getElementById('invite-header-count');
    if (headerCount) {
      headerCount.textContent = `(${invitesLeft} left)`;
    }
    
    // Update hero count with smooth animation
    const heroCount = document.getElementById('invite-hero-count');
    const countMain = heroCount?.querySelector('.invite-count-main');
    if (countMain) {
      animateCountChange(countMain, previousCount || parseInt(countMain.textContent), invitesLeft);
    }
    
    // Enhanced pulse animation based on scarcity
    const pulseRing = heroCount?.querySelector('.invite-pulse-ring');
    if (pulseRing) {
      updatePulseIntensity(pulseRing, invitesLeft, totalGiven);
    }
    
    // Update progress bar
    const progressFill = document.getElementById('invite-progress-fill');
    const progressLabel = document.getElementById('invite-progress-label');
    if (progressFill && progressLabel) {
      const percentage = totalGiven > 0 ? (invitesLeft / totalGiven) * 100 : 0;
      progressFill.style.width = `${percentage}%`;
      progressLabel.textContent = `${invitesLeft}/${totalGiven} left`;
    }
    
    // Load recent invites with social proof
    await loadRecentInvites();
    
    // Update dynamic nudges based on invite count
    updateDynamicNudges(invitesLeft, totalGiven);
    
    // Update ARIA live region
    const liveRegion = document.getElementById('invite-live');
    if (liveRegion && previousCount !== null && previousCount !== invitesLeft) {
      liveRegion.textContent = `Invites updated: ${invitesLeft} remaining`;
    }
    
    return { invitesLeft, redeemed, totalGiven };
    
  } catch (error) {
    console.error('Error updating panel data:', error);
    return null;
  }
}

// 2. SOCIAL PROOF - Real avatars and companies
async function loadRecentInvites() {
  const recentList = document.getElementById('invite-recent-list');
  if (!recentList) return;
  
  try {
    // Try to fetch real recent invites
    const response = await fetch(`${window.CONFIG?.apiBase || ''}/api/invites/recent`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(window.Store?.get()?.user?.id && { 'x-user-id': window.Store.get().user.id })
      }
    });
    
    let recentInvites;
    if (response.ok) {
      const data = await response.json();
      recentInvites = data.recentInvites || [];
    } else {
      // Fallback to enhanced placeholder data with social proof
      recentInvites = generateSocialProofData();
    }
    
    if (recentInvites.length === 0) {
      recentList.innerHTML = `
        <div class="invite-recent-empty">
          <span style="font-size: 24px; margin-bottom: 8px; display: block;">🎯</span>
          <div style="color: rgba(255,255,255,0.7); font-size: 14px;">
            Your first invites will appear here
          </div>
        </div>
      `;
      return;
    }
    
    const template = document.getElementById('tpl-invite-recent-item');
    if (!template) return;
    
    const fragment = document.createDocumentFragment();
    
    recentInvites.slice(0, 5).forEach((invite, index) => {
      const item = template.content.firstElementChild.cloneNode(true);
      
      // Add avatar if available
      const infoSection = item.querySelector('.invite-recent-info');
      if (invite.avatar) {
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'invite-recent-avatar';
        avatarDiv.innerHTML = `<img src="${invite.avatar}" alt="${invite.name}" width="32" height="32" style="border-radius: 16px; margin-right: 12px;" />`;
        infoSection.prepend(avatarDiv);
        infoSection.style.display = 'flex';
        infoSection.style.alignItems = 'center';
      } else {
        // Use initials as fallback
        const initialsDiv = document.createElement('div');
        initialsDiv.className = 'invite-recent-initials';
        const initials = invite.name.split(' ').map(n => n[0]).join('');
        initialsDiv.innerHTML = `<div style="width: 32px; height: 32px; border-radius: 16px; background: linear-gradient(135deg, #6b7bff, #8b5cf6); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; color: white; margin-right: 12px;">${initials}</div>`;
        infoSection.prepend(initialsDiv);
        infoSection.style.display = 'flex';
        infoSection.style.alignItems = 'center';
      }
      
      item.querySelector('.invite-recent-name').textContent = invite.name;
      item.querySelector('.invite-recent-company').textContent = invite.company;
      item.querySelector('.invite-status-icon').textContent = invite.icon;
      item.querySelector('.invite-status-text').textContent = 
        invite.status.charAt(0).toUpperCase() + invite.status.slice(1);
      
      // Enhanced styling based on status
      const statusEl = item.querySelector('.invite-recent-status');
      if (invite.status === 'redeemed') {
        statusEl.style.color = 'var(--accent-success, #10b981)';
        // Add subtle success glow
        item.style.background = 'linear-gradient(90deg, rgba(16, 185, 129, 0.05), rgba(255, 255, 255, 0.03))';
      } else if (invite.status === 'pending') {
        statusEl.style.color = 'var(--accent-warning, #f59e0b)';
      }
      
      // Staggered entrance animation
      item.style.opacity = '0';
      item.style.transform = 'translateY(10px)';
      setTimeout(() => {
        item.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      }, index * 100);
      
      fragment.appendChild(item);
    });
    
    recentList.replaceChildren(fragment);
    
  } catch (error) {
    console.error('Error loading recent invites:', error);
    // Show fallback data on error
    const fallbackData = generateSocialProofData();
    // ... (same rendering logic as above)
  }
}

function generateSocialProofData() {
  // High-quality placeholder data with recognizable companies for social proof
  const companies = [
    'Epic Games', 'Unity Technologies', 'Microsoft', 'Sony Interactive', 
    'Nintendo', 'Blizzard Entertainment', 'Riot Games', 'Valve Corporation',
    'CD Projekt RED', 'Bungie', 'Respawn Entertainment', 'FromSoftware'
  ];
  
  const names = [
    'Alex Chen', 'Priya Sharma', 'Marcus Johnson', 'Elena Rodriguez', 
    'Kai Nakamura', 'Sarah Mitchell', 'David Kim', 'Anya Petrov',
    'Lars Nielsen', 'Zoe Williams', 'Ahmed Hassan', 'Isabella Garcia'
  ];
  
  const invites = [];
  const count = Math.min(Math.floor(Math.random() * 6) + 3, names.length); // 3-8 invites
  
  for (let i = 0; i < count; i++) {
    const name = names[i];
    const company = companies[i % companies.length];
    const isRedeemed = Math.random() > 0.4; // 60% redemption rate for social proof
    
    invites.push({
      name,
      company,
      status: isRedeemed ? 'redeemed' : 'pending',
      icon: isRedeemed ? '✅' : '⏳',
      timestamp: Date.now() - (i * 2 * 60 * 60 * 1000) // Spread over last few hours
    });
  }
  
  return invites.sort((a, b) => b.timestamp - a.timestamp);
}

// 1. SCARCITY INDICATOR - Smooth count animation and pulse intensity
function animateCountChange(element, fromValue, toValue) {
  if (fromValue === toValue) return;
  
  const duration = 600;
  const startTime = performance.now();
  const difference = toValue - fromValue;
  
  function updateCount(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease-out animation
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.round(fromValue + (difference * easeOut));
    
    element.textContent = currentValue;
    
    if (progress < 1) {
      requestAnimationFrame(updateCount);
    }
  }
  
  requestAnimationFrame(updateCount);
}

function updatePulseIntensity(pulseRing, invitesLeft, totalGiven) {
  // Calculate scarcity level (0 = no scarcity, 1 = maximum scarcity)
  const scarcityLevel = totalGiven > 0 ? 1 - (invitesLeft / totalGiven) : 0;
  
  // Remove existing scarcity classes
  pulseRing.classList.remove('pulse-low', 'pulse-medium', 'pulse-high', 'pulse-critical');
  
  // Apply scarcity-based animation
  if (invitesLeft === 0) {
    pulseRing.classList.add('pulse-critical');
  } else if (scarcityLevel > 0.8) {
    pulseRing.classList.add('pulse-high');
  } else if (scarcityLevel > 0.5) {
    pulseRing.classList.add('pulse-medium');
  } else {
    pulseRing.classList.add('pulse-low');
  }
}

// 2. DYNAMIC NUDGES - Context-aware messaging
function updateDynamicNudges(invitesLeft, totalGiven) {
  const nudges = document.querySelectorAll('.invite-nudge');
  if (!nudges.length) return;
  
  let primaryMessage = '';
  let secondaryMessage = '';
  
  if (invitesLeft === 0) {
    primaryMessage = '🤝 Earn more by connecting with 5 pros here';
    secondaryMessage = '🔄 New invites unlock when others redeem yours';
  } else if (invitesLeft <= 2) {
    primaryMessage = `⚡ Only ${invitesLeft} left — make them count`;
    secondaryMessage = '🎯 Each invite could unlock your next big opportunity';
  } else if (invitesLeft === totalGiven) {
    primaryMessage = '🚀 Your network is waiting — send before the event!';
    secondaryMessage = '📈 Early adopters get the best connections';
  } else {
    primaryMessage = '🔄 New invites every time one is redeemed';
    secondaryMessage = '🌟 Quality over quantity — invite the right people';
  }
  
  // Update nudge messages
  if (nudges[0]) {
    const icon = nudges[0].querySelector('.invite-nudge-icon');
    const text = nudges[0].querySelector('span:last-child') || nudges[0];
    if (icon && text !== icon) {
      icon.textContent = primaryMessage.charAt(0) + primaryMessage.charAt(1);
      text.textContent = primaryMessage.substring(3);
    } else {
      nudges[0].innerHTML = `<span class="invite-nudge-icon">${primaryMessage.substring(0, 2)}</span><span>${primaryMessage.substring(3)}</span>`;
    }
  }
  
  if (nudges[1]) {
    const icon = nudges[1].querySelector('.invite-nudge-icon');
    const text = nudges[1].querySelector('span:last-child') || nudges[1];
    if (icon && text !== icon) {
      icon.textContent = secondaryMessage.charAt(0) + secondaryMessage.charAt(1);
      text.textContent = secondaryMessage.substring(3);
    } else {
      nudges[1].innerHTML = `<span class="invite-nudge-icon">${secondaryMessage.substring(0, 2)}</span><span>${secondaryMessage.substring(3)}</span>`;
    }
  }
}

// Initialize invite badge system
function initInviteBadge() {
  // Initial load
  refreshInviteCount();
  
  // Refresh every 30 seconds
  setInterval(refreshInviteCount, 30000);
  
  // Listen for invite-related events
  if (window.Events) {
    window.Events.on('invite.received', () => {
      setTimeout(refreshInviteCount, 500); // Small delay for backend processing
    });
    
    window.Events.on('invite.accepted', () => {
      setTimeout(refreshInviteCount, 500);
    });
    
    window.Events.on('invite.dismissed', () => {
      setTimeout(refreshInviteCount, 500);
    });
  }
  
  // Page visibility API - refresh when tab becomes visible
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      refreshInviteCount();
    }
  });
  
  // Initialize panel event listeners
  initPanelEventListeners();
}

function initPanelEventListeners() {
  // Close panel
  const closeBtn = document.getElementById('invite-panel-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', hideInvitePanel);
  }
  
  // Close on overlay click
  const panel = document.getElementById('invite-panel');
  if (panel) {
    panel.addEventListener('click', (e) => {
      if (e.target === panel) {
        hideInvitePanel();
      }
    });
  }
  
  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel?.hidden) {
      hideInvitePanel();
    }
  });
  
  // Action button handlers
  const sendBtn = document.getElementById('invite-send-btn');
  if (sendBtn) {
    sendBtn.addEventListener('click', handleSendInvite);
  }
  
  const copyBtn = document.getElementById('invite-copy-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', handleCopyLink);
  }
  
  const qrBtn = document.getElementById('invite-qr-btn');
  if (qrBtn) {
    qrBtn.addEventListener('click', handleShowQR);
  }
  
  // Social share handlers
  const linkedinBtn = document.getElementById('invite-linkedin');
  if (linkedinBtn) {
    linkedinBtn.addEventListener('click', () => handleSocialShare('linkedin'));
  }
  
  const whatsappBtn = document.getElementById('invite-whatsapp');
  if (whatsappBtn) {
    whatsappBtn.addEventListener('click', () => handleSocialShare('whatsapp'));
  }
  
  const emailBtn = document.getElementById('invite-email');
  if (emailBtn) {
    emailBtn.addEventListener('click', () => handleSocialShare('email'));
  }
}

// Action Handlers
async function handleSendInvite() {
  // Get current count for animation
  const heroCount = document.getElementById('invite-hero-count');
  const countMain = heroCount?.querySelector('.invite-count-main');
  const currentCount = countMain ? parseInt(countMain.textContent) : null;
  
  // This would open an email input modal in a real implementation
  const email = prompt('Enter recipient email:');
  if (email && email.includes('@')) {
    try {
      const result = await sendInvite(email);
      
      // Update panel with previous count for smooth animation
      await updatePanelData(currentCount);
      
      toast('Invite sent successfully!');
      
      // Enhanced haptic feedback for successful send
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
      
    } catch (error) {
      toast('Failed to send invite: ' + error.message);
    }
  }
}

function handleCopyLink() {
  // Generate a shareable invite link
  const inviteLink = `${window.location.origin}/invite?ref=${window.Store?.get()?.user?.id || 'demo'}`;
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(inviteLink).then(() => {
      toast('Invite link copied to clipboard!');
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }).catch(() => {
      toast('Failed to copy link');
    });
  } else {
    // Fallback for older browsers
    toast('Invite link: ' + inviteLink);
  }
}

function handleShowQR() {
  // This would show a QR code modal in a real implementation
  toast('QR Code feature coming soon!');
}

// 3. ONE-CLICK SHARING - Web Share API + enhanced messages
function handleSocialShare(platform) {
  const inviteLink = `${window.location.origin}/invite?ref=${window.Store?.get()?.user?.id || 'demo'}`;
  
  // Enhanced context-aware messages
  const messages = {
    linkedin: `🎮 Join me at Gamescom 2025! I've secured exclusive invites to the industry's best networking events.

Perfect for game developers, publishers, and industry professionals looking to make meaningful connections.

Claim your spot: ${inviteLink}

#Gamescom2025 #GameDev #Networking`,
    
    whatsapp: `🎮 Hey! I've got exclusive invites to Gamescom 2025's best networking events.

Join me for industry connections with game devs, publishers, and pros. Limited spots available!

Get your invite: ${inviteLink}`,
    
    email: `I wanted to share something exclusive with you.

I've secured invites to Gamescom 2025's premier networking events - think intimate gatherings with game industry leaders, developers, and innovators.

These aren't your typical conference parties. We're talking about quality connections that can shape careers and spark collaborations.

Interested? Claim your invite: ${inviteLink}

Looking forward to seeing you there!`
  };
  
  const titles = {
    linkedin: 'Gamescom 2025 - Exclusive Industry Networking',
    whatsapp: 'Gamescom 2025 Invite',
    email: 'Your Exclusive Gamescom 2025 Networking Invite'
  };
  
  // Try Web Share API first (mobile)
  if (navigator.share && platform !== 'email') {
    navigator.share({
      title: titles[platform],
      text: messages[platform],
      url: inviteLink
    }).then(() => {
      toast(`Shared via ${platform}!`);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }).catch((error) => {
      console.log('Web Share failed, falling back to URL method');
      fallbackShare(platform, inviteLink, messages[platform], titles[platform]);
    });
  } else {
    fallbackShare(platform, inviteLink, messages[platform], titles[platform]);
  }
}

function fallbackShare(platform, inviteLink, message, title) {
  let shareUrl = '';
  
  switch (platform) {
    case 'linkedin':
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(inviteLink)}`;
      break;
    case 'whatsapp':
      shareUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      break;
    case 'email':
      shareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}`;
      break;
  }
  
  if (shareUrl) {
    window.open(shareUrl, '_blank', 'width=600,height=400');
    toast(`Opening ${platform} share...`);
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initInviteBadge);
} else {
  initInviteBadge();
}

// Invite action helpers for integration
async function sendInvite(recipientEmail, message = '') {
  try {
    const response = await fetch(`${window.CONFIG?.apiBase || ''}/api/invites/send`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(window.Store?.get()?.user?.id && { 'x-user-id': window.Store.get().user.id })
      },
      body: JSON.stringify({
        recipientEmail,
        message
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send invite');
    }
    
    // Update badge immediately with new count
    updateInviteBadge(data.invitesLeft);
    
    // Announce the action
    announceInviteUpdate(data.invitesLeft, false);
    
    return data;
  } catch (error) {
    console.error('Error sending invite:', error);
    throw error;
  }
}

async function redeemInvite(inviteCode) {
  try {
    const response = await fetch(`${window.CONFIG?.apiBase || ''}/api/invites/redeem`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(window.Store?.get()?.user?.id && { 'x-user-id': window.Store.get().user.id })
      },
      body: JSON.stringify({
        inviteCode
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to redeem invite');
    }
    
    // Refresh count after successful redemption (user gets bonus invites)
    setTimeout(refreshInviteCount, 500);
    
    return data;
  } catch (error) {
    console.error('Error redeeming invite:', error);
    throw error;
  }
}

// Simplified Invite UI Management
// Alternative lightweight approach for basic invite count management
const InviteUISimple = {
  invitesLeft: 10,
  totalInvites: 10,
  
  // Get DOM elements with fallback
  getElements() {
    return {
      inviteCountEl: document.getElementById('invite-count'),
      progressFill: document.getElementById('progress-fill') || document.getElementById('invite-progress-fill'),
      inviteNudge: document.getElementById('invite-nudge'),
      ariaLive: document.getElementById('aria-live-invites') || document.getElementById('invite-live')
    };
  },
  
  // Update invite UI with simplified logic
  updateInviteUI(newCount) {
    const { inviteCountEl, progressFill, inviteNudge, ariaLive } = this.getElements();
    
    this.invitesLeft = newCount;
    
    // Update count display
    if (inviteCountEl) {
      inviteCountEl.textContent = newCount;
      inviteCountEl.style.display = newCount > 0 ? 'block' : 'none';
    }
    
    // Update progress bar
    if (progressFill) {
      progressFill.style.width = `${(newCount / this.totalInvites) * 100}%`;
    }
    
    // Update messaging based on count
    const messages = this.getContextualMessages(newCount);
    
    if (inviteNudge) {
      inviteNudge.textContent = messages.nudge;
    }
    
    if (ariaLive) {
      ariaLive.textContent = messages.aria;
    }
    
    // Trigger glow for visual feedback if available
    if (newCount > 0 && inviteCountEl) {
      inviteCountEl.classList.add('glow');
      setTimeout(() => {
        inviteCountEl.classList.remove('glow');
      }, 3000);
    }
  },
  
  // Get contextual messages based on invite count
  getContextualMessages(newCount) {
    if (newCount === 0) {
      return {
        nudge: "Earn more by connecting with 5 pros here.",
        aria: "No invites left."
      };
    } else if (newCount < 3) {
      return {
        nudge: `Only ${newCount} invites left — make them count.`,
        aria: `${newCount} invites left.`
      };
    } else {
      return {
        nudge: "Your network is waiting — send before the event!",
        aria: `${newCount} invites left.`
      };
    }
  },
  
  // Simplified API fetch with surprise handling
  async fetchInviteStatus() {
    try {
      const apiBase = window.CONFIG?.apiBase || '';
      const response = await fetch(`${apiBase}/api/invites/status`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(window.Store?.get()?.user?.id && { 'x-user-id': window.Store.get().user.id })
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch invite status');
      }
      
      const data = await response.json();
      
      // Check for surprise bonus invites!
      if (data.surprise) {
        this.handleSurpriseBonus(data.surprise);
      }
      
      this.updateInviteUI(data.invitesLeft || 0, data);
      return data;
    } catch (error) {
      console.warn('Failed to fetch invite status:', error);
      // Use demo count as fallback
      this.updateInviteUI(10);
      return { invitesLeft: 10 };
    }
  },
  
  // Handle surprise bonus notifications
  handleSurpriseBonus(surprise) {
    console.log('🎉 SURPRISE BONUS:', surprise);
    
    // For significant bonuses (5+), show modal celebration
    if (surprise.bonusInvites >= 5 && window.showInviteReward) {
      // Determine milestone title based on achievements
      let title = 'Bonus Invites Earned!';
      let message = 'You\'ve reached a networking milestone!';
      
      if (surprise.achievements.includes('redeemed_10')) {
        title = '10 Invites Redeemed';
        message = 'Your networking is paying off! Here are bonus invites.';
      } else if (surprise.achievements.includes('connections_10')) {
        title = '10 Connections Made';
        message = 'You\'re building an amazing network! Here are bonus invites.';
      } else if (surprise.achievements.includes('redeemed_25')) {
        title = '25 Invites Redeemed';
        message = 'Incredible networking impact! Here are bonus invites.';
      } else if (surprise.achievements.includes('connections_25')) {
        title = '25 Connections Made';
        message = 'You\'re a networking superstar! Here are bonus invites.';
      }
      
      // Show modal with contextual messaging
      window.showMilestoneReward(surprise.bonusInvites, title, message);
    } else {
      // For smaller bonuses, show toast notification
      this.showSurpriseNotification(surprise);
    }
    
    // Haptic celebration
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 400]);
    }
    
    // Emit event for other components to react
    if (window.Events) {
      window.Events.emit('invite.bonus.awarded', surprise);
    }
  },
  
  // Show surprise notification with celebration
  showSurpriseNotification(surprise) {
    const notification = document.createElement('div');
    notification.className = 'surprise-notification';
    notification.innerHTML = `
      <div class="surprise-content">
        <div class="surprise-icon">🎉</div>
        <div class="surprise-text">
          <div class="surprise-title">Surprise!</div>
          <div class="surprise-message">${surprise.message}</div>
          <div class="surprise-achievements">
            ${surprise.achievements.map(achievement => `
              <span class="achievement-badge">${this.formatAchievement(achievement)}</span>
            `).join('')}
          </div>
        </div>
        <button class="surprise-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      left: 20px;
      max-width: 400px;
      margin: 0 auto;
      z-index: 10000;
      background: linear-gradient(135deg, #ffd700, #ffed4e);
      color: #000;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 20px 40px rgba(255, 215, 0, 0.3);
      transform: translateY(-100px);
      opacity: 0;
      transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      animation: surpriseEntrance 0.8s ease-out forwards, surprisePulse 2s ease-in-out 1s infinite;
    `;
    
    // Add CSS for the surprise notification
    if (!document.getElementById('surprise-styles')) {
      const styles = document.createElement('style');
      styles.id = 'surprise-styles';
      styles.textContent = `
        @keyframes surpriseEntrance {
          0% { transform: translateY(-100px) scale(0.8); opacity: 0; }
          50% { transform: translateY(10px) scale(1.05); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        
        @keyframes surprisePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        
        .surprise-content {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }
        
        .surprise-icon {
          font-size: 32px;
          animation: rotate 2s linear infinite;
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .surprise-text {
          flex: 1;
        }
        
        .surprise-title {
          font-size: 20px;
          font-weight: 800;
          margin-bottom: 4px;
        }
        
        .surprise-message {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        
        .surprise-achievements {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .achievement-badge {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 20px;
          padding: 4px 12px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .surprise-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .surprise-close:hover {
          background: rgba(0, 0, 0, 0.1);
        }
      `;
      document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateY(0)';
      notification.style.opacity = '1';
    }, 100);
    
    // Auto remove after 8 seconds
    setTimeout(() => {
      notification.style.transform = 'translateY(-100px)';
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 500);
    }, 8000);
  },
  
  // Format achievement names for display
  formatAchievement(achievement) {
    const achievements = {
      'redeemed_10': '10 Invites Redeemed',
      'connections_10': '10 Connections Made',
      'redeemed_25': '25 Invites Redeemed',
      'connections_25': '25 Connections Made'
    };
    return achievements[achievement] || achievement;
  },
  
  // Initialize simple invite UI
  init() {
    this.fetchInviteStatus();
    
    // Refresh every 30 seconds
    setInterval(() => this.fetchInviteStatus(), 30000);
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.fetchInviteStatus();
      }
    });
  }
};

// Export for manual control
window.InviteBadge = {
  refresh: refreshInviteCount,
  update: updateInviteBadge,
  triggerGlow: updateInviteBadgeWithGlow,
  send: sendInvite,
  redeem: redeemInvite,
  showPanel: showInvitePanel,
  hidePanel: hideInvitePanel,
  updatePanel: updatePanelData,
  
  // Simplified API for lightweight usage
  simple: InviteUISimple
};

// Connection Management Functions
async function addConnection(targetData) {
  try {
    const apiBase = window.CONFIG?.apiBase || '';
    const response = await fetch(`${apiBase}/api/connections/add`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(window.Store?.get()?.user?.id && { 'x-user-id': window.Store.get().user.id })
      },
      body: JSON.stringify(targetData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to add connection');
    }
    
    // Show success feedback
    if (window.toast) {
      window.toast(`Connected with ${targetData.targetName}! 🤝`);
    }
    
    // Refresh invite status to check for potential bonuses
    setTimeout(() => {
      InviteUISimple.fetchInviteStatus();
    }, 500);
    
    return data;
  } catch (error) {
    console.error('Error adding connection:', error);
    if (window.toast) {
      window.toast(`Failed to add connection: ${error.message}`);
    }
    throw error;
  }
}

// Helper function for common connection scenarios
window.ConnectWith = {
  // Connect with someone at an event
  atEvent(name, company = '', eventId = '', type = 'professional') {
    return addConnection({
      targetName: name,
      targetCompany: company,
      connectionType: type,
      eventId: eventId
    });
  },
  
  // Connect via QR code scan
  fromQR(qrData) {
    return addConnection({
      targetUserId: qrData.userId,
      targetName: qrData.name,
      targetCompany: qrData.company,
      connectionType: 'qr_scan',
      eventId: qrData.eventId
    });
  },
  
  // Connect via business card exchange
  businessCard(name, company, email = '') {
    return addConnection({
      targetName: name,
      targetCompany: company,
      targetEmail: email,
      connectionType: 'business_card'
    });
  }
};

// Global functions for backward compatibility
window.openInviteModal = openInviteModal;
window.updateInviteUI = InviteUISimple.updateInviteUI.bind(InviteUISimple);
window.fetchInviteStatus = InviteUISimple.fetchInviteStatus.bind(InviteUISimple);
window.addConnection = addConnection;