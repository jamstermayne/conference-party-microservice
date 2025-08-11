// Party Discovery Module
import { API } from './api.js';
import { showToast } from './ui.js';

export async function initParties() {
  const partyList = document.getElementById('partyList');
  const saveBtn = document.getElementById('saveParties');
  
  // Load party data
  const parties = await loadParties();
  renderParties(parties);
  
  // Save button handler
  saveBtn?.addEventListener('click', saveSelectedParties);
}

async function loadParties() {
  try {
    // Try to load from API
    const data = await API.getParties();
    return data.parties || [];
  } catch (error) {
    console.error('Failed to load parties:', error);
    // Fallback to local data
    return loadLocalParties();
  }
}

async function loadLocalParties() {
  try {
    const response = await fetch('/data/parties.json');
    return await response.json();
  } catch (error) {
    // Return demo data as last resort
    return [
      { name: "WN Connect", time: "Tue, Aug 19, 4:00 PM", id: 1 },
      { name: "European Game Night", time: "Tue, Aug 19, 5:00 PM", id: 2 },
      { name: "XRAI Hack Cologne Award Ceremony", time: "Tue, Aug 19, 5:00 PM", id: 3 }
    ];
  }
}

function renderParties(parties) {
  const partyList = document.getElementById('partyList');
  if (!partyList) return;
  
  partyList.innerHTML = '';
  
  parties.forEach(party => {
    const card = createPartyCard(party);
    partyList.appendChild(card);
  });
}

function createPartyCard(party) {
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.partyId = party.id || party.name;
  
  card.innerHTML = `
    <h3>${party.name}</h3>
    <p>${party.time}</p>
    ${party.venue ? `<p class="venue">${party.venue}</p>` : ''}
  `;
  
  card.addEventListener('click', () => {
    card.classList.toggle('selected');
    updateSelectionCount();
  });
  
  return card;
}

function updateSelectionCount() {
  const selected = document.querySelectorAll('.card.selected').length;
  const saveBtn = document.getElementById('saveParties');
  if (saveBtn) {
    saveBtn.textContent = selected > 0 
      ? `Save ${selected} ${selected === 1 ? 'Party' : 'Parties'} & Sync`
      : 'Save & Sync Calendar';
  }
}

async function saveSelectedParties() {
  const selectedCards = document.querySelectorAll('.card.selected');
  const selectedParties = Array.from(selectedCards).map(card => ({
    id: card.dataset.partyId,
    name: card.querySelector('h3').textContent,
    time: card.querySelector('p').textContent
  }));
  
  if (selectedParties.length === 0) {
    showToast('Please select at least one party', 'warning');
    return;
  }
  
  try {
    // Save to local storage
    localStorage.setItem('selected_parties', JSON.stringify(selectedParties));
    
    // Try to sync with API
    await API.saveParties(selectedParties);
    
    showToast(`${selectedParties.length} parties saved & syncing to calendar!`, 'success');
    
    // Trigger calendar sync if available
    if (window.calendarSync) {
      window.calendarSync.syncParties(selectedParties);
    }
  } catch (error) {
    console.error('Failed to save parties:', error);
    showToast('Parties saved locally. Will sync when online.', 'info');
  }
}

export { loadParties, saveSelectedParties };