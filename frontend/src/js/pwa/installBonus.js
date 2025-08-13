// Post-install visual reward (+5 UI only)
import { Events } from '../events.js?v=b023';

let bonusAwarded = false;

Events.on('pwa.installed', handleInstallBonus);

function handleInstallBonus(){
  if (bonusAwarded) return;
  bonusAwarded = true;
  
  const current = getCurrentInvites();
  const newCount = current + 5;
  updateInviteUI(newCount);
  showBonusAnimation();
  localStorage.setItem('user_invites', newCount);
  localStorage.setItem('pwa_bonus_awarded', Date.now());
}

function getCurrentInvites(){
  const pill = document.getElementById('inv-pill');
  if (pill) {
    const match = pill.textContent.match(/(\d+)/);
    if (match) return parseInt(match[1]);
  }
  return parseInt(localStorage.getItem('user_invites')) || 10;
}

function updateInviteUI(newCount){
  const pill = document.getElementById('inv-pill');
  const left = document.getElementById('inv-left');
  const total = document.getElementById('inv-tot');
  
  if (pill) {
    pill.style.animation = 'pillPulse 0.3s var(--ease-out)';
    setTimeout(() => pill.textContent = `${newCount} Left`, 150);
  }
  if (left) left.textContent = newCount;
  if (total) total.textContent = (parseInt(total.textContent||'10') + 5);
}

function showBonusAnimation(){
  let banner = document.getElementById('bonus-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'bonus-banner';
    banner.className = 'bonus hidden';
    banner.innerHTML = `<div class="confetti"></div><p><b>+5 invites</b> unlocked — beautiful growth.</p>`;
    document.body.appendChild(banner);
  }
  
  banner.classList.remove('hidden');
  banner.style.animation = 'rise 0.5s var(--ease-out)';
  
  setTimeout(() => {
    banner.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => banner.classList.add('hidden'), 300);
  }, 4000);
}