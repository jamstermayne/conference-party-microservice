import { cardGrid, inviteCard } from './components/cards.js?v=b018';

export async function renderInvites(mount){
  if(!mount) return;
  
  // Create header
  const container = document.createElement('div');
  container.innerHTML = `<div class="section-card"><div class="section-head"><div>Invites</div><span style="opacity:.6;font-size:.85rem">Hall of Fame • single-use</span></div></div>`;
  mount.appendChild(container);
  
  // Create grid
  const grid = cardGrid(document.createElement('div'));
  mount.appendChild(grid);

  // Mock invite data
  const mockInvites = [
    {
      code: 'GAME2025VIP',
      email: 'john.doe@gaming.com',
      name: 'John Doe',
      status: 'redeemed',
      sentAt: '2 days ago',
      redeemedAt: '1 day ago'
    },
    {
      code: 'CONF2025ABC',
      email: 'sarah.smith@studio.io',
      name: 'Sarah Smith',
      status: 'pending',
      sentAt: '3 days ago'
    },
    {
      code: 'DEV2025XYZ',
      email: 'mike.jones@indie.dev',
      name: 'Mike Jones',
      status: 'pending',
      sentAt: '1 week ago'
    },
    {
      code: 'VIP2025123',
      email: 'alex.chen@publisher.com',
      name: 'Alex Chen',
      status: 'redeemed',
      sentAt: '5 days ago',
      redeemedAt: '4 days ago'
    },
    {
      code: 'MEET2025QWE',
      email: 'emma.wilson@games.co',
      name: 'Emma Wilson',
      status: 'revoked',
      sentAt: '2 weeks ago'
    },
    {
      code: 'PARTY2025RTY',
      email: 'david.lee@mobile.games',
      name: 'David Lee',
      status: 'pending',
      sentAt: 'Just now'
    }
  ];
  
  // Render invite cards
  mockInvites.forEach(i => grid.appendChild(inviteCard(i)));

  // Wire up actions
  mount.addEventListener('click', (e)=>{
    const el = e.target.closest('[data-action]');
    if(!el) return;
    const act = el.dataset.action;
    if(act==='resend'){ 
      console.log('[UI] Resend invite', el.dataset.code);
      // Trigger resend API call
    }
    if(act==='copy'){ 
      const inviteUrl = window.location.origin + '/invite/' + el.dataset.code;
      navigator.clipboard?.writeText(inviteUrl).then(() => {
        console.log('[UI] Copied invite link:', inviteUrl);
        // Show toast notification
      });
    }
  });
}

export default { renderInvites };