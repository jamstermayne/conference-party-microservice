import { cardGrid, meCard } from './components/cards.js?v=b018';

export async function renderMe(mount){
  if(!mount) return;
  
  // Create grid
  const grid = cardGrid(document.createElement('div'));
  mount.appendChild(grid);

  // Mock profile data - would come from localStorage or API
  const mockProfile = {
    name: 'Alex Developer',
    role: 'Senior Game Developer',
    company: 'Indie Studios',
    email: 'alex@indiestudios.com',
    badge: 'Pro'
  };
  
  // Render profile card
  grid.appendChild(meCard(mockProfile));

  // Wire up actions
  mount.addEventListener('click', (e)=>{
    const el = e.target.closest('[data-action]');
    if(!el) return;
    const act = el.dataset.action;
    if(act==='editProfile'){ 
      console.log('[UI] Edit profile');
      // Open profile editor
    }
    if(act==='manageAccount'){ 
      console.log('[UI] Manage account');
      // Open account settings
    }
  });
}

export default { renderMe };