import { showToast } from './toast.js?v=b011';

const q = (s,r=document)=>r.querySelector(s);

function handleRSVPClick(){
  showToast('RSVP confirmed! 🎉');
  // Simulate social unlock — could be replaced with real API
  setTimeout(()=>{
    document.dispatchEvent(new CustomEvent('invite:unlockShare'));
  }, 600);
}

function handleShareClick(){
  const shareBtn = q('[data-invite-share]');
  if (shareBtn?.classList.contains('disabled')) return;
  
  navigator.clipboard.writeText(window.location.href + '?invite=1')
    .then(()=>{
      showToast('Invite link copied! 📋');
      document.dispatchEvent(new CustomEvent('invite:joinLoop'));
    })
    .catch(()=>{
      // Fallback for browsers without clipboard API
      showToast('Share link: ' + window.location.href + '?invite=1');
    });
}

function handleJoinClick(){
  showToast('Welcome aboard! 🚀');
  // Update badge count
  const badge = q('[data-invite-count]');
  if (badge) {
    const current = parseInt(badge.textContent, 10) || 0;
    badge.textContent = current + 1;
  }
}

function unlockShareUI(){
  const shareBtn = q('[data-invite-share]');
  if (shareBtn) {
    shareBtn.classList.remove('disabled');
    shareBtn.textContent = 'Share Invite Link';
    // Add a subtle glow animation when unlocked
    shareBtn.style.animation = 'glow 0.5s ease-out';
  }
}

// Add glow animation via style injection
const style = document.createElement('style');
style.textContent = `
  @keyframes glow {
    0% { box-shadow: 0 0 0 0 var(--accent-primary); }
    50% { box-shadow: 0 0 10px 2px var(--accent-primary); }
    100% { box-shadow: 0 0 0 0 var(--accent-primary); }
  }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', ()=>{
  const rsvpBtn = q('[data-invite-rsvp]');
  const shareBtn = q('[data-invite-share]');
  const joinBtn = q('[data-invite-join]');

  rsvpBtn?.addEventListener('click', handleRSVPClick);
  shareBtn?.addEventListener('click', handleShareClick);
  joinBtn?.addEventListener('click', handleJoinClick);

  document.addEventListener('invite:unlockShare', unlockShareUI);
  
  // Check URL for invite parameter
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('invite')) {
    setTimeout(() => {
      showToast('You were invited! Click Join to accept.');
    }, 1000);
  }
});