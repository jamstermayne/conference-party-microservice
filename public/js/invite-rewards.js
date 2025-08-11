// js/invite-rewards.js
// Modal-based reward system for invite bonuses
// Complements the golden toast notifications with detailed modal celebrations

function checkInviteRewards(invitesRedeemed, connectionsMade) {
  if (invitesRedeemed === 10 || connectionsMade === 10) {
    showInviteReward(5);
  }
  
  // Check for higher milestone rewards
  if (invitesRedeemed === 25 || connectionsMade === 25) {
    showInviteReward(10);
  }
}

function showInviteReward(amount) {
  const modal = document.getElementById('invite-reward-modal');
  const bonusCount = document.getElementById('bonus-count');
  const bonusNumber = document.getElementById('bonus-number');

  if (!modal || !bonusCount || !bonusNumber) {
    console.warn('Reward modal elements not found, falling back to toast');
    if (window.toast) {
      window.toast(`🎉 Bonus! You earned ${amount} extra invites!`);
    }
    return;
  }

  bonusNumber.textContent = amount;
  modal.classList.remove('hidden');

  // Animate the counter from 0 to amount
  let count = 0;
  const interval = setInterval(() => {
    if (count < amount) {
      count++;
      bonusCount.textContent = `+${count}`;
    } else {
      clearInterval(interval);
    }
  }, 100);

  // Haptic feedback for mobile
  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200, 100, 400]);
  }

  // Close handler
  const closeBtn = document.getElementById('close-reward-btn');
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.classList.add('hidden');
      updateInviteTotal(amount); // backend + UI sync
    };
  }

  // Auto-close after 8 seconds
  setTimeout(() => {
    if (!modal.classList.contains('hidden')) {
      modal.classList.add('hidden');
      updateInviteTotal(amount);
    }
  }, 8000);
}

function updateInviteTotal(amount) {
  // Update multiple invite counters across the UI
  const counters = [
    document.getElementById('invite-counter'),
    document.getElementById('invite-count'),
    document.getElementById('sidebar-invite-count'),
    document.getElementById('inv-left'),
    document.querySelector('.invite-count-main')
  ].filter(Boolean);

  counters.forEach(counter => {
    let current = parseInt(counter.textContent, 10) || 0;
    const target = current + amount;
    
    const step = () => {
      if (current < target) {
        current++;
        counter.textContent = current;
        
        // Add bump animation if element supports it
        if (counter.classList) {
          counter.classList.remove('bump');
          void counter.offsetWidth; // Force reflow
          counter.classList.add('bump');
        }
        
        requestAnimationFrame(step);
      }
    };
    
    step();
  });

  // Update the invite panel progress bar if visible
  const progressBar = document.getElementById('inv-progress-fill');
  if (progressBar) {
    const totalElement = document.getElementById('inv-total');
    const leftElement = document.getElementById('inv-left');
    
    if (totalElement && leftElement) {
      const total = parseInt(totalElement.textContent, 10) || 0;
      const left = parseInt(leftElement.textContent, 10) || 0;
      const percentage = total > 0 ? (left / total) * 100 : 0;
      progressBar.style.width = `${percentage}%`;
    }
  }

  // Emit event for other parts of the app to react
  if (window.Events) {
    window.Events.emit('invite.bonus.applied', { amount });
  }

  // Force refresh of invite status to sync with server
  if (window.InviteBadge?.simple?.fetchInviteStatus) {
    setTimeout(() => {
      window.InviteBadge.simple.fetchInviteStatus();
    }, 1000);
  }
}

// Integration with existing surprise system
function handleServerSurprise(surpriseData) {
  const { bonusInvites, achievements } = surpriseData;
  
  // Show modal for significant bonuses
  if (bonusInvites >= 5) {
    showInviteReward(bonusInvites);
  }
  
  // Also trigger the golden toast notification for immediate feedback
  if (window.InviteBadge?.simple?.handleSurpriseBonus) {
    window.InviteBadge.simple.handleSurpriseBonus(surpriseData);
  }
}

// Enhanced milestone checking with detailed reasons
function checkMilestoneRewards(userData) {
  const { invitesRedeemed = 0, connections = [] } = userData;
  const connectionCount = Array.isArray(connections) ? connections.length : 0;
  
  // Check for 10-milestone rewards
  if (invitesRedeemed === 10) {
    showMilestoneReward(5, '10 Invites Redeemed', 'Your networking is paying off! Here are 5 bonus invites.');
  }
  
  if (connectionCount === 10) {
    showMilestoneReward(5, '10 Connections Made', 'You\'re building an amazing network! Here are 5 bonus invites.');
  }
  
  // Check for 25-milestone rewards
  if (invitesRedeemed === 25) {
    showMilestoneReward(10, '25 Invites Redeemed', 'Incredible networking impact! Here are 10 bonus invites.');
  }
  
  if (connectionCount === 25) {
    showMilestoneReward(10, '25 Connections Made', 'You\'re a networking superstar! Here are 10 bonus invites.');
  }
}

function showMilestoneReward(amount, title, message) {
  const modal = document.getElementById('invite-reward-modal');
  const bonusCount = document.getElementById('bonus-count');
  const bonusNumber = document.getElementById('bonus-number');
  const rewardTitle = document.getElementById('reward-title');
  const rewardMessage = document.getElementById('reward-message');

  if (!modal) {
    console.warn('Reward modal not found');
    return;
  }

  // Update modal content
  if (bonusNumber) bonusNumber.textContent = amount;
  if (rewardTitle) rewardTitle.textContent = title;
  if (rewardMessage) rewardMessage.textContent = message;

  modal.classList.remove('hidden');

  // Animate counter
  let count = 0;
  const interval = setInterval(() => {
    if (count < amount && bonusCount) {
      count++;
      bonusCount.textContent = `+${count}`;
    } else {
      clearInterval(interval);
    }
  }, 100);

  // Enhanced haptic pattern for bigger rewards
  if ('vibrate' in navigator) {
    const pattern = amount >= 10 ? [300, 100, 300, 100, 500] : [200, 100, 200, 100, 400];
    navigator.vibrate(pattern);
  }

  // Close handler
  const closeBtn = document.getElementById('close-reward-btn');
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.classList.add('hidden');
      updateInviteTotal(amount);
    };
  }
}

// Export functions for global access
window.checkInviteRewards = checkInviteRewards;
window.showInviteReward = showInviteReward;
window.updateInviteTotal = updateInviteTotal;
window.handleServerSurprise = handleServerSurprise;
window.checkMilestoneRewards = checkMilestoneRewards;