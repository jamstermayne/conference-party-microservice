import { cardGrid, contactCard } from './components/cards.js?v=b018';

export async function renderContacts(mount){
  if(!mount) return;
  
  // Create header
  const container = document.createElement('div');
  container.innerHTML = `<div class="section-card"><div class="section-head"><div>Contacts</div><span style="opacity:.6;font-size:.85rem">Your conference graph</span></div></div>`;
  mount.appendChild(container);
  
  // Create grid
  const grid = cardGrid(document.createElement('div'));
  mount.appendChild(grid);

  // Mock contacts data
  const mockContacts = [
    {
      name: 'Alice Johnson',
      role: 'Game Director',
      company: 'Epic Studios',
      linkedIn: 'https://linkedin.com/in/alicej',
      email: 'alice@epicstudios.com',
      tag: 'VIP'
    },
    {
      name: 'Bob Martinez',
      role: 'Technical Lead',
      company: 'Indie Collective',
      linkedIn: 'https://linkedin.com/in/bobm',
      email: 'bob@indiecollective.io'
    },
    {
      name: 'Carol Chen',
      role: 'Publishing Manager',
      company: 'Global Games Ltd',
      linkedIn: 'https://linkedin.com/in/carolc',
      tag: 'Publisher'
    },
    {
      name: 'David Kumar',
      role: 'Senior Developer',
      company: 'Mobile First Games',
      email: 'david@mobilefirst.dev'
    },
    {
      name: 'Emma Thompson',
      role: 'Art Director',
      company: 'Visual Dreams Studio',
      linkedIn: 'https://linkedin.com/in/emmat',
      email: 'emma@visualdreams.com',
      tag: 'Creative'
    },
    {
      name: 'Frank Wilson',
      role: 'Business Development',
      company: 'GameVentures Capital',
      linkedIn: 'https://linkedin.com/in/frankw',
      tag: 'Investor'
    },
    {
      name: 'Grace Park',
      role: 'Community Manager',
      company: 'Social Gaming Co',
      email: 'grace@socialgaming.co'
    },
    {
      name: 'Henry Liu',
      role: 'QA Lead',
      company: 'Quality First Games',
      linkedIn: 'https://linkedin.com/in/henryl'
    }
  ];

  // Render contact cards
  mockContacts.forEach(p => grid.appendChild(contactCard(p)));
}

export default { renderContacts };