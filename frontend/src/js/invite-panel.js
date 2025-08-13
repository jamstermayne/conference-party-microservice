/**
 * invite-panel.js - Invites & Hall of Fame
 * Build: b012
 */

export function renderInvites(mount) {
  if (!mount) return;
  
  const section = document.createElement('section');
  section.className = 'section-card';
  
  // Add accent
  const accent = document.createElement('div');
  accent.className = 'left-accent';
  section.appendChild(accent);
  
  // Header
  const header = document.createElement('div');
  header.style.cssText = 'padding:0 22px;margin-bottom:24px';
  header.innerHTML = `
    <h2 style="margin:0;font-size:18px;font-weight:600">Invite System</h2>
    <p style="color:var(--muted);font-size:13px;margin:8px 0 0">Share your code to grow the network</p>
  `;
  section.appendChild(header);
  
  // Content wrapper
  const content = document.createElement('div');
  content.style.cssText = 'padding:0 22px 22px';
  
  // Your invite code card
  const codeCard = document.createElement('div');
  codeCard.className = 'card invite-card';
  codeCard.innerHTML = `
    <h3 style="font-size:14px;font-weight:600;margin-bottom:8px;text-align:center">Your Invite Code</h3>
    <div class="invite-card__code">VELOC-${generateCode()}</div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn btn-primary" onclick="navigator.clipboard.writeText(this.parentElement.previousElementSibling.textContent).then(()=>{this.textContent='✓ Copied';setTimeout(()=>this.textContent='Copy Code',2000)})">
        Copy Code
      </button>
      <button class="btn btn-secondary" onclick="navigator.share&&navigator.share({title:'velocity.ai invite',text:'Join velocity.ai with my invite code: '+this.parentElement.previousElementSibling.textContent})">
        Share
      </button>
    </div>
    <div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.05)">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span style="color:var(--muted);font-size:13px">Invites remaining</span>
        <span style="color:var(--brand-2);font-weight:600">11</span>
      </div>
      <div style="display:flex;justify-content:space-between">
        <span style="color:var(--muted);font-size:13px">People you invited</span>
        <span style="color:var(--text);font-weight:600">0</span>
      </div>
    </div>
  `;
  content.appendChild(codeCard);
  
  // Hall of Fame
  const hallTitle = document.createElement('h3');
  hallTitle.style.cssText = 'font-size:16px;font-weight:600;margin:32px 0 16px';
  hallTitle.textContent = 'Hall of Fame';
  content.appendChild(hallTitle);
  
  // Hall of Fame grid
  const hallGrid = document.createElement('div');
  hallGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px';
  
  const topInviters = [
    { name: 'Alex Chen', count: 47, avatar: 'AC' },
    { name: 'Sarah Miller', count: 35, avatar: 'SM' },
    { name: 'Mike Johnson', count: 28, avatar: 'MJ' },
    { name: 'Emma Wilson', count: 24, avatar: 'EW' },
    { name: 'David Kim', count: 19, avatar: 'DK' },
    { name: 'Lisa Brown', count: 15, avatar: 'LB' }
  ];
  
  topInviters.forEach((inviter, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'padding:16px;text-align:center;position:relative';
    
    // Rank badge
    if (index < 3) {
      const badge = document.createElement('div');
      badge.style.cssText = `position:absolute;top:8px;right:8px;width:24px;height:24px;border-radius:50%;background:${index===0?'#FFD700':index===1?'#C0C0C0':'#CD7F32'};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#000`;
      badge.textContent = index + 1;
      card.appendChild(badge);
    }
    
    card.innerHTML += `
      <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,var(--brand-2),var(--brand-1));display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-weight:600;color:white">
        ${inviter.avatar}
      </div>
      <div style="font-weight:600;margin-bottom:4px">${inviter.name}</div>
      <div style="color:var(--brand-2);font-size:20px;font-weight:700">${inviter.count}</div>
      <div style="color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:0.5px">invites</div>
    `;
    
    hallGrid.appendChild(card);
  });
  
  content.appendChild(hallGrid);
  
  // Add redeem section
  const redeemSection = document.createElement('div');
  redeemSection.style.cssText = 'margin-top:32px;padding:20px;background:rgba(119,87,255,0.05);border:1px solid rgba(119,87,255,0.15);border-radius:12px';
  redeemSection.innerHTML = `
    <h3 style="font-size:14px;font-weight:600;margin-bottom:12px">Have an invite code?</h3>
    <div style="display:flex;gap:8px">
      <input type="text" placeholder="Enter code (e.g., VELOC-ABC123)" style="flex:1;padding:10px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--text);font-family:monospace">
      <button class="btn btn-primary">Redeem</button>
    </div>
  `;
  content.appendChild(redeemSection);
  
  section.appendChild(content);
  mount.replaceChildren(section);
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default { renderInvites };